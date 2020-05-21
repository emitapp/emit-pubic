import React from 'react';
import { Platform, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView from 'react-native-maps';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import { logError } from 'utils/helpers';
import S from 'styling';
import {Text} from 'react-native-elements'

export default class ActiveBroadcasts extends React.Component {

  state = { 
    region: null, 
  }

  componentDidMount() {
    this.getCurrentLocation()
  }

  render() {
    return (
    <View style={S.styles.containerFlexStart}>
        <Text style = {{fontWeight: "bold", marginBottom: 8}}>Pin the place you'll be eating at</Text>
        <MapView
        style = {{width: "100%", flex: 1}}
        showsUserLocation = {true}
        loadingEnabled = {true}
        onRegionChangeComplete={ region => this.setState({region})}
        region = {this.state.region} 
        />
    </View>
    )
  }
  
  getCurrentLocation = async () => {
    try{
      if (await this.checkLocationPermission()){
        Geolocation.getCurrentPosition(
          (position) => {
            this.setState({
                region: {
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    longitudeDelta: 0.01,
                    latitudeDelta: 0.01
                }
            })
          },
          this.handleGeolocationError,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }else{
        Snackbar.show({
          text: 'Not enough permissions to get location', 
          duration: Snackbar.LENGTH_SHORT
        });
      }
    }catch(err){
      Snackbar.show({
        text: 'An error occurred when trying to get your location', 
        duration: Snackbar.LENGTH_SHORT
      });
    }
  }

  handleGeolocationError = (error) => {
    const code = error.code
    let message = ""
    switch(code){
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

  //This promise rejects if location permissions were not granted
  checkLocationPermission = async () => {
    try{
        if (Platform.OS == "android"){
          const permissionName = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          let locationPermissionResult = await check(permissionName)
          locationPermissionResult = await this.requestIfNeeded(permissionName, locationPermissionResult)
          return locationPermissionResult == RESULTS.GRANTED
        }
    }catch (err){
      logError(err)
      return false
    }
  }

requestIfNeeded = async (permission, checkResult) => {
    try{
      if (checkResult == RESULTS.GRANTED){
          return checkResult;
      }else if (checkResult == RESULTS.UNAVAILABLE || checkResult == RESULTS.BLOCKED){
          return checkResult;
      }else{
          let newStatus = await request(permission);
          return newStatus;
      }
    }catch(err){
      logError(err)
    }
  } 
}