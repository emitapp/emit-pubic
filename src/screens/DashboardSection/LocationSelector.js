import React from 'react';
import { Platform, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, {Marker} from 'react-native-maps';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import { logError } from 'utils/helpers';
import S from 'styling';
import Header from 'reusables/Header'
import {Text} from 'react-native-elements'
import {BannerButton} from 'reusables/ReusableButtons'

export default class LocationSelector extends React.Component {

  constructor(props){
    super(props)
    //Will be {latitude: null, longitude: null} if the pin wasn't set previously
    let params = props.navigation.state.params
    this.state = { 
      region: null, 
      //If this is true, dont give the marker a defualt location of 0,0
      markerPrevSet: params.latitude ? true : false, 
      markerLocation: params.latitude ? {...params} : {latitude: 0, longitude: 0}
    }
  }


  static navigationOptions = Header("Location Selector")

  componentDidMount() {
    if (!this.state.markerPrevSet)
     this.getCurrentLocation()
    else{
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
        <Text style = {{fontWeight: "bold", marginBottom: 8}}>Pin the place you'll be eating at</Text>
        <MapView
          style = {{width: "100%", flex: 1}}
          showsUserLocation = {true}
          loadingEnabled = {true}
          onRegionChangeComplete={ region => this.setState({region})}
          region = {this.state.region}>
            <Marker draggable
              coordinate={this.state.markerLocation}
              onDragEnd={(e) => this.setState({ markerLocation: e.nativeEvent.coordinate })}
              pinColor="green"
              title = "Where you'll be"
              description = "Receivers of this broadcast will be able to see this pin"
            />
        </MapView>
        <BannerButton
          color = {S.colors.buttonGreen}
          onPress={this.saveLocation}
          iconName = {S.strings.confirm}
          title = "CONFIRM"
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
    try{
      if (await this.checkLocationPermission()){
        Geolocation.getCurrentPosition(
          this.updateMapRegion,
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

  updateMapRegion = (position) => {
    this.setState({
      region: {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          longitudeDelta: 0.01,
          latitudeDelta: 0.01
      }
    })
    if (!this.state.markerPrevSet){
      this.setState({
        markerLocation:{
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        }
      })
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