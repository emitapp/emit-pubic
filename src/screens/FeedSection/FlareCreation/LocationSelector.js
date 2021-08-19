import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-elements';
import MapView, { Marker } from 'react-native-maps';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import Header from 'reusables/Header';
import { BannerButton } from 'reusables/ui/ReusableButtons';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError } from 'utils/helpers';
import {GetGeolocation} from 'utils/geo/GeolocationFunctions'
import { reverseGeocodeToOSM } from 'utils/geo/OpenStreetMapsApi';

export default class LocationSelector extends React.Component {

  constructor(props) {
    super(props)
    //Will be {latitude: null, longitude: null} if the pin wasn't set previously
    let params = props.navigation.state.params
    
    this.state = {
      region: null,
      //Give the marker a defualt location of 0,0 if there isnt a provided value
      markerLocation: params.pin ? { ...params.pin } : { latitude: 0, longitude: 0 },
      usingDefaultLocation: params.pin ? false : true,
      address: params.locationName
    }
  }


  static navigationOptions = Header("Location Selector")

  async componentDidMount() {
    if (this.state.usingDefaultLocation)
      this.getInitialLocation()
    else {
      const lng = this.state.markerLocation.longitude
      const lat = this.state.markerLocation.latitude

      let address = this.state.address
      if (!address) {
        const geoObject = await reverseGeocodeToOSM({latitude: lat, longitude: lng})
        address = geoObject.name
      }

      this.setState({
        region: {
          longitude: lng,
          latitude: lat,
          longitudeDelta: 0.01,
          latitudeDelta: 0.01
        },
        address: address
      })
    }
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>{this.state.address}</Text>
        <MapView
          style={{ width: "100%", flex: 1 }}
          showsUserLocation={true}
          loadingEnabled={true}
          onRegionChangeComplete={region => this.setState({ region })}
          region={this.state.region}
          onPress={e => this.moveMarker(e.nativeEvent)}
          >
          <Marker
            coordinate={this.state.markerLocation}
            pinColor="red"
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

  moveMarker = async (tapEvent) => {
    this.setState({
      markerLocation: tapEvent.coordinate,
      address: (await reverseGeocodeToOSM(tapEvent.coordinate)).name 
    })
  }

  saveLocation = () => {
    this.props.navigation.state.params.callback(this.state.markerLocation, this.state.address)
    this.props.navigation.goBack()
  }

  getInitialLocation = async () => {
    try {
      const permissionsGranted = await checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] })
      if (!permissionsGranted) {
        Snackbar.show({
          text: 'Not enough permissions to get location',
          duration: Snackbar.LENGTH_SHORT
        });
        return
      }
      GetGeolocation(this.initialLocationCallback)
    } catch (err) {
      Snackbar.show({
        text: 'An error occurred when trying to get your location',
        duration: Snackbar.LENGTH_SHORT
      });
      logError(err)
    }
  }

  initialLocationCallback = async (position) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    let address = this.state.address
    if (!address) {
      const geoObject = await reverseGeocodeToOSM({latitude: lat, longitude: lng})
      address = geoObject.name
    }
    this.setState({
      region: {
        longitude: lng,
        latitude: lat,
        longitudeDelta: 0.01,
        latitudeDelta: 0.01
      },
      markerLocation: {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      usingDefaultLocation: false,
      address: address
    })
  }
}