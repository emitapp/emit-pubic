import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler'; //This version handles nested flatlists better
import { Button, Divider, Input, Text, ThemeConsumer } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/Entypo';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import MapView, { Marker } from 'react-native-maps';
import { ClearHeader } from 'reusables/Header';
import { LocationListElement } from "reusables/ListElements";
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents';
import MainLinearGradient from 'reusables/containers/MainLinearGradient';
import { BannerButton, LoadableButton, MinorActionButton } from 'reusables/ui/ReusableButtons';
import S from 'styling';
import { isOnlyWhitespace, logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import * as recentLocFuncs from 'utils/RecentLocationsFunctions';
import { MAX_LOCATION_NAME_LENGTH } from 'utils/serverValues'
import { v4 as uuidv4 } from 'uuid';
import BulgingButton from 'reusables/ui/BulgingButton'
import MatIcon from "react-native-vector-icons/MaterialIcons"
import PlacesAutocompleteTextInput from 'reusables/PlacesAutocompleteTextInput'
import { ScrollView } from 'react-native-gesture-handler';
import DummyVirtualizedView from 'reusables/containers/DummyVirtualizedView';
import { PERMISSIONS } from 'react-native-permissions';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { GetGeolocation } from 'utils/geo/GeolocationFunctions'
import { reverseGeocodeToOSM } from 'utils/geo/OpenStreetMapsApi';
export default class NewBroadcastFormLocation extends React.Component {

  constructor(props) {
    super(props)
    this.navigationParams = props.navigation.state.params.bundle
    this.isPublicFlare = props.navigation.state.params.isPublicFlare
    this.state = {
      locationName: this.navigationParams.location || "",
      locationPin: null,
      recentLocations: [],
      errorMessage: null,
      savingLocation: false,
    }

    if (this.navigationParams.geolocation) this.state.locationPin = this.navigationParams.geolocation
  }

  static navigationOptions = ClearHeader("New Flare")

  async componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.setState({}) //Just call for a rerender (this is used when we come back from the location picker map)
    });

    if (!this.state.locationPin) {
      try {
        const permissionsGranted = await checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] })
        if (!permissionsGranted) return
        GetGeolocation(this.givePinInitialLocation)
      } catch (err) {
        logError(err)
      }
    } else {
      try {
        this.getInitialAddressName(this.state.locationPin.latitude, this.state.locationPin.longitude)
      } catch (err) {
        logError(err)
      }
    }

    recentLocFuncs.getRecentLocations()
      .then(recentLocations => this.setState({ recentLocations }))
      .catch(err => {
        logError(err)
        this.setState({ errorMessage: "Couldn't retrieve recent locations" })
      })
  }

  componentWillUnmount() {
    this.focusListener.remove();
  }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>

            <DummyVirtualizedView
              style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >

              <Text h4 h4Style={{ marginVertical: 8, fontWeight: "bold" }}>
                Where will you be?
              </Text>

              <Button title="Choose a saved location"
                onPress={() => this.props.navigation.navigate("SavedLocations", this.props.navigation.state.params.bundle)}
                titleStyle={{ fontSize: 14 }}
                type="outline" />

              <ErrorMessageText message={this.state.errorMessage} />

              <PlacesAutocompleteTextInput
                onLocationChosen={(p) => this.setState({ locationPin: p.coords })}
                searchBarPlaceholder={this.state.locationName || "That Super Awesome Place"}
                onTextChange={locationName => this.setState({ locationName })}
                errorMessage={this.state.locationName.length > MAX_LOCATION_NAME_LENGTH ? "Too long" : undefined}
                clearOnChoice={false}
                initialTextValue={this.state.locationName}
              />

              <View style={{ width: "80%", height: 250, alignSelf: "center" }}>
                <MapView
                  region={this.state.locationPin != null ? {
                    latitude: this.state.locationPin.latitude,
                    longitude: this.state.locationPin.longitude,
                    longitudeDelta: 0.005,
                    latitudeDelta: 0.005
                  } : null}
                  onPress={() => this.props.navigation.navigate("LocationSelector",
                    {
                      callback: (geo, addr) => this.setState({ locationPin: geo, locationName: addr }),
                      pin: this.state.locationPin,
                      address: this.locationName
                    })}
                  zoomEnabled={false}
                  scrollEnabled={false}
                  rotateEnabled={false}
                  showsMyLocationButton={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                  style={{ width: "100%", flex: 1 }}
                  showsUserLocation={true}
                  loadingEnabled={true}>
                  {this.state.locationPin != null &&
                    <Marker
                      coordinate={this.state.locationPin}
                      pinColor="red"
                    />
                  }
                </MapView>

                <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                  <Text style={{ flex: 1 }}>
                    {this.state.locationPin != null ? "Map Pin Added" : "No Map Pin Added"}
                  </Text>
                  {this.state.locationPin != null &&
                    <Button
                      titleStyle={{ color: "red" }}
                      type="clear"
                      title="Clear"
                      onPress={() => this.setState({ locationPin: null })}
                    />
                  }
                </View>

                <LoadableButton title="Save current location"
                  onPress={this.saveLocation}
                  titleStyle={{ fontSize: 14 }}
                  type="outline"
                  isLoading={this.state.isLoading} />

              </View>


              <FlatList
                data={this.state.recentLocations}
                renderItem={({ item, index }) => this.renderRecentLocation(item, index)}
                ListHeaderComponent={() => this.renderHeader(this.state.recentLocations, theme)}
                style={{ marginHorizontal: 8, maxHeight: 400 }}
                keyExtractor={item => item.uid}
                listKey="newBroadcastFormLocation"
              />

            </DummyVirtualizedView>
            <BannerButton
              iconName={S.strings.confirm}
              onPress={this.confirmLocation}
              title="CONFIRM"
            />
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  confirmLocation = (addToRecents = true) => {
    if (!this.isValidLocation()) {
      Snackbar.show({ text: 'Enter location name or map pin, or both', duration: Snackbar.LENGTH_SHORT });
      return
    }

    let { locationName } = this.state
    if (isOnlyWhitespace(locationName)) locationName = "Unnamed location"

    if (locationName.length > MAX_LOCATION_NAME_LENGTH) {
      Snackbar.show({ text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT });
      return
    }

    if (this.state.locationPin == null && this.isPublicFlare) {
      Snackbar.show({ text: 'Public flares need map pins!', duration: Snackbar.LENGTH_SHORT });
      return
    }

    this.navigationParams.location = locationName.trim()
    const locationToSaveToRecents = { name: locationName, uid: uuidv4() }

    if (this.state.locationPin != null) {
      this.navigationParams.geolocation = this.state.locationPin
      locationToSaveToRecents.geolocation = this.state.locationPin
    } else {
      this.navigationParams.geolocation = null
    }

    if (addToRecents) recentLocFuncs.addNewLocation(locationToSaveToRecents)
    this.props.navigation.goBack()
  }

  saveLocation = async () => {
    if (!this.isValidLocation()) {
      Snackbar.show({ text: 'Enter location name or map pin, or both', duration: Snackbar.LENGTH_SHORT });
      return
    }

    let { locationName } = this.state
    if (isOnlyWhitespace(locationName)) locationName = "Unnamed location"

    if (locationName.length > MAX_LOCATION_NAME_LENGTH) {
      Snackbar.show({ text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT });
      return
    }
    this.setState({ savingLocation: true, errorMessage: null })
    let location = { name: locationName.trim() }
    if (this.state.locationPin !== null) location.geolocation = this.state.locationPin

    try {
      await timedPromise(
        database().ref(`/savedLocations/${auth().currentUser.uid}`).push(location),
        MEDIUM_TIMEOUT
      )
      Snackbar.show({ text: 'Saved location', duration: Snackbar.LENGTH_SHORT });
    } catch (err) {
      if (err.name == "timeout") {
        Snackbar.show({ text: 'Timeout', duration: Snackbar.LENGTH_SHORT });
      } else {
        this.setState({ errorMessage: "Something went wrong." })
        logError(err)
      }
    }
    this.setState({ savingLocation: false })
  }

  renderHeader = (recentLocations, theme) => {
    if (recentLocations.length == 0) return null
    return (
      <>
        <Divider style={{ marginTop: 16 }} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 18, textAlign: "center", flex: 1 }}> Recent Locations </Text>
          <Button
            icon={<MatIcon name="cancel" size={20} color={theme.colors.grey3} />}
            onPress={this.clearRecentLocations}
            type="clear" />
        </View>
      </>
    )
  }

  renderRecentLocation = (item, index) => {
    return (
      <LocationListElement
        locationInfo={item}
        onPress={() => {
          const newState = { locationName: item.name }
          if (item.geolocation) newState.locationPin = item.geolocation
          recentLocFuncs.bubbleToTop(index)
          this.setState(newState, () => this.confirmLocation(false))
        }}
      />
    )
  }

  clearRecentLocations = () => {
    recentLocFuncs.clearRecentLocations()
      .then(() => this.setState({ recentLocations: [] }))
      .catch(err => {
        logError(err)
        this.setState({ errorMessage: "Couldn't clear recent locations" })
      })
  }

  isValidLocation = () => {
    let { locationName, locationPin } = this.state
    if (isOnlyWhitespace(locationName) && !locationPin) return false
    return true
  }

  givePinInitialLocation = (position) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    const locationPin = { latitude: lat, longitude: lng }
    this.setState({ locationPin })
    this.getInitialAddressName(lat, lng)
  }

  getInitialAddressName = async (lat, lng) => {
    const geoObject = await reverseGeocodeToOSM({ latitude: lat, longitude: lng })
    const locationName = geoObject.name
    this.setState({ locationName })
  }
}