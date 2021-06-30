import { distanceBetween } from 'geofire-common';
import Geolocation from 'react-native-geolocation-service';
import Snackbar from 'react-native-snackbar';
import { geohashForLocation } from 'geofire-common'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { logError } from './helpers';


/**
 * Its recommended that you call this along with recordLocationToBackend
 * Uses Snackbar for error reporting by default
 * @param {*} onSuccess 
 * @param {*} onError 
 */
export const GetGeolocation = (onSuccess, onError = handleGeolocationError) => {
  Geolocation.getCurrentPosition(
    onSuccess,
    onError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

export const handleGeolocationError = (error) => {
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

export const PUBLIC_FLARE_RADIUS_IN_M = 9656 //6 miles

export const isFalsePositiveNearbyFlare = (flare, center) => {
  const lat = flare.geolocation.latitude;
  const lng = flare.geolocation.longitude;
  const distanceInKm = distanceBetween([lat, lng], center);
  const distanceInM = distanceInKm * 1000;
  return (distanceInM > PUBLIC_FLARE_RADIUS_IN_M)
}


const DEFAULT_LOCATION_UPLOADING_PREFERENCE = true

/**
 * Updates the backend with the user's location, if they haven't disabled that
 * @param {*} geolocation Should come from GetGeolocation function
 */
export const RecordLocationToBackend = async (geolocation) => {
  try {
    const { latitude, longitude } = geolocation
    const geoHash = geohashForLocation([latitude, longitude])
    const preferenceSnap = await database().ref(`userLocationUploadPreference/${auth().currentUser.uid}`).once("value")
    const shouldUpload = DEFAULT_LOCATION_UPLOADING_PREFERENCE;
    if (preferenceSnap.exists()) shouldUpload = preferenceSnap.val()
    if (shouldUpload)
      await database().ref(`userLocationGeoHashes/${auth().currentUser.uid}`).set(
        { geoHash, geolocation: {latitude, longitude} }
      )
  } catch (err) {
    logError(err, false)
  }
}