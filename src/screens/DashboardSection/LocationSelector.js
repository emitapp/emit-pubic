import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-elements';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker } from 'react-native-maps';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import Header from 'reusables/Header';
import { BannerButton } from 'reusables/ReusableButtons';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError } from 'utils/helpers';

export default class LocationSelector extends React.Component {

  constructor(props) {
    super(props)
    //Will be {latitude: null, longitude: null} if the pin wasn't set previously
    let params = props.navigation.state.params
    this.state = {
      region: null,
      //If this is true, dont give the marker a defualt location of 0,0
      markerPrevSet: params.latitude ? true : false,
      markerLocation: params.latitude ? { ...params } : { latitude: 0, longitude: 0 }
    }
  }


  static navigationOptions = Header("Location Selector")

  componentDidMount() {
    if (!this.state.markerPrevSet)
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
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Pin the place you'll be eating at</Text>
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
    this.props.navigation.state.params.latitude = this.state.markerLocation.latitude
    this.props.navigation.state.params.longitude = this.state.markerLocation.longitude
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
      Geolocation.getCurrentPosition(
        this.updateMapRegion,
        this.handleGeolocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
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
      }
    })
    if (!this.state.markerPrevSet) {
      this.setState({
        markerLocation: {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        }
      })
    }
  }
  handleGeolocationError = (error) => {
    const code = error.code
    let message = ""
    switch (code) {
      case 1:
        message = "Location permission is not granted"
        break
      case 2:
        message = "Location provider not available"
        break
      case 3:
        message = "Location request timed out"
        break
      case 4:
        message = "Google play service is not installed/too old"
        break
      case 5:
        message = "Location service is not enabled or location mode is not appropriate. Check phone settings"
        break
      default:
        message = "An error occurred when trying to get your location"
    }
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT
    });
  }
}