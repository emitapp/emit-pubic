import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View, Image } from 'react-native';
import { Text, ThemeConsumer } from 'react-native-elements';
import AwesomeIcon from 'react-native-vector-icons/dist/FontAwesome';
import DynamicInfiniteScroll from 'reusables/lists/DynamicInfiniteScroll';
import EmptyState from 'reusables/ui/EmptyState';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { ClearHeader } from 'reusables/Header';
import { LocationListElement } from "reusables/ListElements";
import MainLinearGradient from 'reusables/containers/MainLinearGradient';
import { logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import * as recentLocFuncs from 'utils/RecentLocationsFunctions';

export default class SavedLocations extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      errorMessage: null
    }
  }

  static navigationOptions = ClearHeader("New Flare")

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
              <Text h4 h4Style={{ marginVertical: 8, fontWeight: "bold" }}>
                Saved Locations
              </Text>
              <ErrorMessageText message={this.state.errorMessage} />
              <DynamicInfiniteScroll
                renderItem={({ item }) => this.itemRenderer(item)}
                generation={0}
                dbref={database().ref(`/savedLocations/${auth().currentUser.uid}`)}
                emptyStateComponent={
                  <EmptyState
                    image =  {
                      <Image source={require('media/NoSavedLocations.png')} 
                      style = {{height: 100, marginBottom: 8}} 
                      resizeMode = 'contain' />
                    }
                    title="No saved locations."
                    message="You haven't saved any locations yet."
                  />
                }
              />
            </View>
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  confirmLocation = (location) => {
    this.props.navigation.state.params.location = location.name
    if (location.geolocation) {
      this.props.navigation.state.params.geolocation = location.geolocation
    }
    this.props.navigation.navigate("NewBroadcastForm")
  }

  deleteSavedLocation = async (locationUid) => {
    this.setState({ errorMessage: null })
    try {
      await timedPromise(
        database().ref(`/savedLocations/${auth().currentUser.uid}/${locationUid}`).remove(),
        MEDIUM_TIMEOUT
      )
    } catch (err) {
      if (err.name == "timeout") {
        this.setState({ errorMessage: "Timeout" })
      } else {
        this.setState({ errorMessage: "Something went wrong." })
        logError(err)
      }
    }
  }

  itemRenderer = (item) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <LocationListElement
          style={{ flex: 1 }}
          locationInfo={item}
          onPress={() => {
            recentLocFuncs.bubbleOrAddSavedLocation(item);
            this.confirmLocation(item)
          }}
        />
        <AwesomeIcon
          name="trash-o" color="red"
          size={20} style={{ marginHorizontal: 8 }}
          onPress={() => this.deleteSavedLocation(item.uid)}
        />
      </View>

    )
  }
}