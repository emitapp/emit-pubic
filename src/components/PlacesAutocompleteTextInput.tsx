import { isDevBuild, isQABuild } from 'dev/index';
import React from 'react';
import { Image, Keyboard, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { Divider, SearchBar, Text } from 'react-native-elements';
//Importing from react-native-gesture-handler since we might be rendering this component
//in screens that use things like utils/DummyVirtualizedView, and in cases like that
//there will be nested FlatLists, which this import version handles better
import { FlatList } from 'react-native-gesture-handler';
import config from "react-native-ultimate-config";
import { Coordinates, GetGeolocation, metersToMiles } from 'utils/geo/GeolocationFunctions';
import {
  GoogleAutocompleteApiResponse,
  GoogleAutocompletePrediction,
  requestAutocompleteFromGoogle,
  requestCompletePlaceDataFromGoogle,
} from 'utils/geo/GooglePlacesApi';
import { OSMResult, reverseGeocodeToOSM } from 'utils/geo/OpenStreetMapsApi';
import { isTimedPromiseTimeoutError, logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import ErrorMessageText from './ui/ErrorMessageText';

interface PlacesAutocompleteTextInputProps {
  onLocationChosen: (s: OSMResult) => void
  onTextChange: (s: string) => void
  searchBarPlaceholder?: string
  errorMessage?: string,
  clearOnChoice: boolean,
  initialTextValue: string
}

interface PlacesAutocompleteTextInputState {
  textInput: string,
  coordinates: Coordinates | null
  autocompleteData: GoogleAutocompleteApiResponse["predictions"],
  nothingFound: boolean,
  errorMessage: string
}

const googlePlacesApiKey = (isDevBuild() || isQABuild()) ? config.GOOGLE_PLACES_DEV_AND_QA_KEY : config.GOOGLE_PLACES_PROD_KEY

export default class PlacesAutocompleteText extends React.PureComponent<PlacesAutocompleteTextInputProps, PlacesAutocompleteTextInputState>{

  sessionId = ""
  googleResponsesCache: Record<string, GoogleAutocompleteApiResponse["predictions"]> = {}
  currentAutocompleteInvocationId: ReturnType<typeof setTimeout> | null = null

  state: PlacesAutocompleteTextInputState = {
    textInput: this.props.initialTextValue || "",
    coordinates: null,
    autocompleteData: [],
    nothingFound: false,
    errorMessage: "",
  }

  componentDidMount(): void {
    this.refreshSessionToken()
    this.getInitialCoordinates()
  }

  render(): React.ReactNode {
    return (
      <View>
        <SearchBar
          onClear={() => {
            this.onSearchBarValueChange("")
            this.setState({ autocompleteData: [] })
          }}
          selectTextOnFocus
          autoCapitalize="none"
          placeholder={this.props.searchBarPlaceholder}
          onChangeText={this.onSearchBarValueChange}
          value={this.state.textInput}
          containerStyle={{ width: "100%", alignSelf: "center" }}
          errorMessage={this.props.errorMessage}
        />
        <ErrorMessageText message={this.state.errorMessage} />
        <FlatList
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          keyExtractor={(item) => item.place_id}
          contentContainerStyle={{ width: "100%" }}
          style={{ marginHorizontal: 16 }}
          data={this.state.autocompleteData}
          renderItem={this.renderAutocompleteSuggestion}
          ListEmptyComponent={this.renderEmptyComponent}
          listKey="placesAutocompleteText"
        />
        {this.renderPoweredByGoogle()}

      </View>
    )
  }


  renderAutocompleteSuggestion: ListRenderItem<GoogleAutocompletePrediction> =
    ({ item }: { item: GoogleAutocompletePrediction }) => {
      return (
        <AutosuggestListElement
          item={item}
          onPress={this.autosuggestListElementOnClick}
        />
      )
    }

  autosuggestListElementOnClick = (place_id: string) : void => {
    Keyboard.dismiss()
    this.convertGooglePlaceToOSM(place_id)
  }

  renderEmptyComponent = (): React.ReactElement | null => {
    if (this.state.autocompleteData.length === 0) { return null }
    return (<Text>We couldn't find any results for this query!</Text>)
  }

  renderPoweredByGoogle = (): React.ReactElement | null => {
    if (this.state.autocompleteData.length === 0) { return null }
    return (
      <Image source={require('media/PoweredByGoogle.png')}
        style={{ width: 100, marginBottom: 8, alignSelf: "flex-end" }}
        resizeMode="contain" />
    )
  }

  onSearchBarValueChange = (newValue: string): void => {
    this.setSearchBarValue(newValue)
    //This is essentially a no-op when the user's coordinates haven't been gotten
    if (newValue.trim().length >= 3) { this.getAutoCompleteThrottled() }
  }

  //Cancels a previously queued version of itself, and fetches a Google Places 
  //Autocomplete suggestion after DELAY seconds (to prevent excessive fetches when the user
  //is typing fast)
  getAutoCompleteThrottled = (): void => {
    if (this.currentAutocompleteInvocationId) {
      clearTimeout(this.currentAutocompleteInvocationId)
    }

    const DELAY_IN_MS = 300
    this.currentAutocompleteInvocationId = setTimeout(
      () => {
        this.clearErrorFeedback()
        timedPromise(this.fetchGoogleAutocompleteResults(), MEDIUM_TIMEOUT)
          .then(pred => {
            if (pred) { this.setState({ autocompleteData: pred, nothingFound: pred.length === 0 }) }
          })
          .catch(e => {
            logError(e)
            this.provideErrorFeedback(e)
          })
          .finally(() => {
            this.currentAutocompleteInvocationId = null
          })
      }, DELAY_IN_MS
    )
  }

  getInitialCoordinates = (): void => {
    GetGeolocation(
      (pos) => this.setState({
        coordinates: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      }),
      () => this.provideErrorFeedback("We couldn't get your location info to suggest nearby places!")
    )
  }

  fetchGoogleAutocompleteResults = async (): Promise<GoogleAutocompletePrediction[] | null> => {
    if (!this.state.coordinates) { return null }
    const predictions = await requestAutocompleteFromGoogle(
      this.state.textInput,
      googlePlacesApiKey,
      this.sessionId,
      this.state.coordinates,
      this.googleResponsesCache
    )
    return predictions
  }


  convertGooglePlaceToOSM = async (placeId: string): Promise<void> => {
    try {
      //Getting the place's coordinates from Google
      if (!this.state.coordinates) { return }
      const placeDetails = await requestCompletePlaceDataFromGoogle(placeId, googlePlacesApiKey, this.sessionId)
      const geo = placeDetails?.result?.geometry?.location
      if (!geo) { throw new Error("We couldn't get the coordinates of this place. Sorry!") }

      //Due to Google's restrictive TOS (we can't store their stuff on our servers), 
      //its better to reverse geocode those coordinates using more free OSM solutions
      const googleCoordinates: Coordinates = { latitude: geo.lat, longitude: geo.lng }
      const OSMLocation = await reverseGeocodeToOSM(googleCoordinates)
      this.setState({ autocompleteData: [], nothingFound: false })
      this.setSearchBarValue(this.props.clearOnChoice ? "" : OSMLocation.name)
      this.clearErrorFeedback()
      this.props.onLocationChosen(OSMLocation)
    } catch (e) {
      this.provideErrorFeedback(e)
      logError(e)
    } finally {
      this.refreshSessionToken()
    }
  }

  refreshSessionToken = (): void => {
    this.sessionId = uuidv4()
  }

  clearErrorFeedback = (): void => {
    this.setState({ errorMessage: "" })
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  provideErrorFeedback = (e: any): void => {
    let message = ""
    if (typeof e === "string") { message = e }
    if (isTimedPromiseTimeoutError(e)) { message = "Timeout!" }
    if (e.message) { message = e.message }
    this.setState({ errorMessage: message })
  }

  setSearchBarValue = (val: string): void => {
    this.setState({ textInput: val })
    this.props.onTextChange && this.props.onTextChange(val)
  }

  //Right now its just a copy of setSearchBarValue but if setSearchBarValue ever changes
  //we don't want those side effects to reflect on this func, which is for external calls
  setSearchBarValueExternal = (val: string): void => {
    this.setState({ textInput: val })
    this.props.onTextChange && this.props.onTextChange(val)
  }
}



interface AutosuggestListElementProps {
  item: GoogleAutocompletePrediction,
  onPress: (s: string) => void
}
class AutosuggestListElement extends React.PureComponent<AutosuggestListElementProps> {

  state = {
    pressedDown: false,
  }

  render() {
    const { item } = this.props
    return (
      <Pressable
        onPress={() => this.props.onPress(item.place_id)}
        onPressIn={() => this.setState({ pressedDown: true })}
        onPressOut={() => this.setState({ pressedDown: false })}
        style={{ width: "100%", backgroundColor: this.state.pressedDown ? "lightgrey" : "white", marginBottom: 4 }}
      >
        <Text style={styles.autosuggestTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.autosuggestDistance} numberOfLines={1} ellipsizeMode="tail">
          {item.distance_meters && `(${metersToMiles(item.distance_meters).toFixed(2)}mi) - `}
          <Text style={styles.autosuggestSubtitle} numberOfLines={1}>
            {item.structured_formatting.secondary_text}
          </Text>
        </Text>
        <Divider />
      </Pressable>
    )
  }
}



const styles = StyleSheet.create({
  autosuggestTitle: {
    fontWeight: "bold",
  },
  autosuggestSubtitle: {
    color: "grey",
    fontStyle: "normal",
  },
  autosuggestDistance: {
    color: "grey",
    fontStyle: "italic",
  },
});
