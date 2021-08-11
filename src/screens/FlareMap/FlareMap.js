import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { geohashQueryBounds } from 'geofire-common';
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { Button, Text } from 'react-native-elements';
import MapView from 'react-native-maps';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import Header from 'reusables/Header';
import EmailVerificationBanner from 'reusables/schoolEmail/EmailVerificationBanner';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { GetGeolocation, isFalsePositiveNearbyFlare, PUBLIC_FLARE_RADIUS_IN_M } from 'utils/geo/GeolocationFunctions';
import { logError } from 'utils/helpers';
import FlareMarker from './FlareMapMarker';

//TODO: Consider getting styles (Google maps only) from:
//https://mapstyle.withgoogle.com/
//https://snazzymaps.com/
export default class FlareMaps extends React.Component {

  constructor(props) {
    super(props)

    this.metersToMiles = 0.000621371;
    this.defaultLatitudeDelta = 0.13
    this.defaultLongitudeDelta = 0.13

    this.state = {
      region: {
        latitude: 0, longitude: 0,
        longitudeDelta: this.defaultLongitudeDelta, latitudeDelta: this.defaultLatitudeDelta
      },
      userPosition: { latitude: 0, longitude: 0 },
      nearbyFlares: [],
      regionGeneration: 0,
      altitude: 0,
      zoom: 0
    }

    this.rtdbRefs = []
    this.firestoreUnsubscribeFuncs = []
    this.flareData = {}
    this.mapRef = null
  }

  static navigationOptions = Header("Flare Map")

  componentDidMount() {
    this.getCurrentLocation()
  }

  componentWillUnmount() {
    this.rtdbRefs.forEach(ref => ref.off())
    this.firestoreUnsubscribeFuncs.forEach(func => func())
  }

  render() {
    return (
      <SafeAreaView style={{ backgroundColor: "skyblue", flex: 1 }}>
        <View style={S.styles.containerFlexStart}>
          <Text style={{ fontWeight: "bold" }}>Flare Map</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Button title="Center on me" onPress={this.centerOnUser} buttonStyle={{ padding: 4, marginLeft: 8 }} />
          </View>
          <Text style={{ textAlign: "center", marginHorizontal: 8, marginBottom: 4 }}>
            Flares on your feed with location information will show up on this map!
            {" "}Radius: {Math.round(PUBLIC_FLARE_RADIUS_IN_M * this.metersToMiles)} miles
          </Text>
          <EmailVerificationBanner />
          <MapView
            ref={r => this.mapRef = r}
            style={{ width: "100%", flex: 1 }}
            showsUserLocation={true}
            loadingEnabled={true}
            onRegionChangeComplete={this.onRegionChange}
            region={this.state.region}
            customMapStyle={this.mapStyle}
            showsPointsOfInterest={false}
            // For somre reason the two props below aren't taking effect until a marker's callback is pressed
            showsMyLocationButton={true}
            toolbarEnabled={true}>

            {this.state.nearbyFlares.map(flare => (
              <FlareMarker
                generation={this.state.regionGeneration}
                flare={flare}
                key={flare.uid}
                altitude={this.state.altitude}
                zoom={this.state.zoom}
              />
            ))}

          </MapView>
        </View>
      </SafeAreaView>
    )
  }

  onRegionChange = async (region) => {
    try {
      const { altitude, zoom } = await this.mapRef.getCamera()
      this.setState(prevState => ({ regionGeneration: prevState.regionGeneration + 1, region, altitude, zoom }))
    } catch (err) {
      logError(err)
    }
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

      GetGeolocation(this.updateMapRegion);

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
        longitudeDelta: this.defaultLongitudeDelta,
        latitudeDelta: this.defaultLatitudeDelta
      },
      userPosition: {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      }
    }, this.setFlareListeners)
  }

  centerOnUser = () => {
    this.setState({
      region: {
        longitude: this.state.userPosition.longitude,
        latitude: this.state.userPosition.latitude,
        longitudeDelta: 0.01,
        latitudeDelta: 0.01
      }
    })
  }

  setFlareListeners = () => {
    const { userPosition } = this.state
    const center = [userPosition.latitude, userPosition.longitude];
    // Each item in 'bounds' represents a startAt/endAt pair. We have to issue
    // a separate query for each pair. There can be up to 9 pairs of bounds
    // depending on overlap, but in most cases there are 4.
    const bounds = geohashQueryBounds(center, PUBLIC_FLARE_RADIUS_IN_M);
    const feedRef = database().ref(`/feeds/${auth().currentUser.uid}`).orderByChild("geoHash")
    const publicRef = firestore().collection("shortenedPublicFlares").orderBy("geoHash")

    for (const b of bounds) {
      const newFeedRef = feedRef.startAt(b[0]).endAt(b[1]).limitToFirst(10);
      this.rtdbRefs.push(newFeedRef)
      newFeedRef.on("value", snap => this.onRTDBUpdate(snap, b, center))

      const newFirestoreRef = publicRef.startAt(b[0]).endAt(b[1]).limit(10)
      this.firestoreUnsubscribeFuncs.push(newFirestoreRef.onSnapshot({
        error: logError,
        next: snap => this.onFirestoreUpdate(snap, b, center)
      }))
    }
  }

  onFirestoreUpdate = (snap, b, center) => {
    //the [] tag is actually important for updateMapWithNewData()
    const key = "[fb]" + b.toString()
    let docs = snap.docs.map(x => { return { ...x.data(), uid: x.id } })
    docs = this.removeFalsePositives(docs, center)
    this.flareData[key] = docs
    this.updateMapWithNewData()
  }

  onRTDBUpdate = (snap, b, center) => {
    //the [] tag is actually important for updateMapWithNewData()
    const key = "[rtdb]" + b.toString()
    let children = []
    snap.forEach(child => children.push({ ...child.val(), uid: child.key }))
    children = this.removeFalsePositives(children, center)
    this.flareData[key] = children
    this.updateMapWithNewData()
  }

  //dataList should be an array of objects...
    // We have to filter out a few false positives due to GeoHash
  // accuracy, but most will match
  removeFalsePositives = (dataList, center) => {
    const goodDatapoints = []
    for (const datapoint of dataList) {
      if (!isFalsePositiveNearbyFlare(datapoint, center)) goodDatapoints.push(datapoint)
    }
    return goodDatapoints
  }

  updateMapWithNewData = () => {
    let data = []
    for (const key in this.flareData) {
      let currentArray = this.flareData[key]
      if (key.startsWith("[fb]")) currentArray = currentArray.map(x => { return { ...x, isPublicFlare: true } })
      data = data.concat(currentArray)
    }
    this.setState({ nearbyFlares: data })
  }
}