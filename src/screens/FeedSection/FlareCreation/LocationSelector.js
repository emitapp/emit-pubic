import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-elements';
import MapView, { Marker } from 'react-native-maps';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import Header from 'reusables/Header';
import { BannerButton } from 'reusables/ReusableButtons';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError } from 'utils/helpers';
import {GetGeolocation} from 'utils/geo/GeolocationFunctions'

export default class LocationSelector extends React.Component {

  constructor(props) {
    super(props)
    //Will be {latitude: null, longitude: null} if the pin wasn't set previously
    let params = props.navigation.state.params
    
    this.state = {
      region: null,
      //Give the marker a defualt location of 0,0 if there isnt a provided value
      markerLocation: params.pin ? { ...params.pin } : { latitude: 0, longitude: 0 },
      usingDefaultLocation: params.pin ? false : true
    }
  }


  static navigationOptions = Header("Location Selector")

  componentDidMount() {
    if (this.state.usingDefaultLocation)
      this.getCurrentLocation()
    else {
      this.setState({
        region: {
          longitude: this.state.markerLocation.longitude,
          latitude: this.state.markerLocation.latitude,
          longitudeDelta: 0.01,
          latitudeDelta: 0.01
        }
      })
    }
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Hold and drag the pin to the location of the flare</Text>
        <MapView
          style={{ width: "100%", flex: 1 }}
          showsUserLocation={true}
          loadingEnabled={true}
          onRegionChangeComplete={region => this.setState({ region })}
          region={this.state.region}>
          <Marker draggable
            coordinate={this.state.markerLocation}
            onDragEnd={(e) => this.setState({ markerLocation: e.nativeEvent.coordinate })}
            pinColor="green"
            title="Where you'll be"
            description="Receivers of this broadcast will be able to see this pin"
          />
        </MapView>
        <BannerButton
          onPress={this.saveLocation}
          iconName={S.strings.confirm}
          title="CONFIRM"
        />
      </View>
    )
  }

  saveLocation = () => {
    this.props.navigation.state.params.callback(this.state.markerLocation)
    this.props.navigation.goBack()
  }

  getCurrentLocation = async () => {
    try {
      const permissionsGranted = await checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] })
      if (!permissionsGranted) {
        Snackbar.show({
          text: 'Not enough permissions to get location',
          duration: Snackbar.LENGTH_SHORT
        });
        return
      }
      GetGeolocation(this.updateMapRegion)
    } catch (err) {
      Snackbar.show({
        text: 'An error occurred when trying to get your location',
        duration: Snackbar.LENGTH_SHORT
      });
      logError(err)
    }
  }

  updateMapRegion = (position) => {
    this.setState({
      region: {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
        longitudeDelta: 0.01,
        latitudeDelta: 0.01
      },
      markerLocation: {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      usingDefaultLocation: false
    })
  }
}