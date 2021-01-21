/**
 * Wraps a promise in a timeout using promise.race
 * If the promise is timed out, it rejects and returns 'Timed out'
 * @param {Promise} promise The promise to time
 * @param {Number} ms The timeout in ms
 */
//https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const timedPromise = (promise, ms) => {

  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject({
      name: "timeout",
      message: `Your Promise timed out after ${ms} milliseconds`
    }),
      ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promise,
    timeout
  ])
}

export const SHORT_TIMEOUT = 7000
export const MEDIUM_TIMEOUT = 10000
export const LONG_TIMEOUT = 15000



/**
 * Determines is a string is only whitespace
 * @param {string} str The stirng
 */
//https://stackoverflow.com/questions/10261986/how-to-detect-string-which-contains-only-spaces/50971250
export const isOnlyWhitespace = (str) => {
  return str.replace(/\s/g, '').length == 0
}



/**
 * Converts epoch timestamps to date strings
 * @param {Number} epochMillis The epoch timestamp
 */
export const epochToDateString = (epochMillis) =>
{
  let options = {hour: "2-digit", minute: "2-digit", timeZoneName: "short", 
    day: "2-digit", month: "short", year: "numeric"}
  return new Date(epochMillis).toLocaleString(undefined, options)
}


import crashlytics from '@react-native-firebase/crashlytics';
/**
 * This method should be the main way errors are tracked in the app 
 * It logs the error in the device logs and (optionally) in Crashlytics
 * @param {Error} error The error object to log 
 * @param {boolean} includeCrashlytics Whether or not to perform Crashlytics logging too. DEFAULT: true
 * @param {string} extraLoggingInfo Extra info that will be logged with the Crashlytics report(if enabled) and with console.log
 */
export const logError = (error, includeCrashlytics = true, extraLoggingInfo) => {
  if (extraLoggingInfo) console.log(extraLoggingInfo)
  console.log(error)
  if (includeCrashlytics){
    if (extraLoggingInfo) crashlytics().log(extraLoggingInfo)
    crashlytics().recordError(error)
  }
}

//This is the Async Storage key for the last cached FCM token of the app instance
export const ASYNC_TOKEN_KEY = "stored_FCM_token";

//This is the key that's used to cache whether or not the user has properly set up their account
export const ASYNC_SETUP_KEY = "accountSetUp";


import DeviceInfo from 'react-native-device-info';
import {Platform} from 'react-native'
import codePush from 'react-native-code-push'
/**
 * Gets the full versioning info of the app
 */
export const getFullVersionInfo = async() => {
  try{
    let versionInfo = DeviceInfo.getApplicationName()
    versionInfo += ` ${DeviceInfo.getSystemName()} v${DeviceInfo.getVersion()} (Build No.${DeviceInfo.getBuildNumber()})`
    const codePushPackageInfo = await codePush.getUpdateMetadata()
    if (codePushPackageInfo) versionInfo += ` Codepush Package ${codePushPackageInfo.label}`
    else versionInfo += ` Using Base Binary`
    return versionInfo
  }catch(err){
    logError(err)
    return "<Error Getting Versioning Info>"
  }
}

/**
 * Gets the full hardware info of the device
 */
export const getFullHardwareInfo = async() => {
  try{
    let hardwareInfo = ""
    hardwareInfo += `Manufacturer: ${await DeviceInfo.getManufacturer()}\n`
    hardwareInfo += `Model: ${DeviceInfo.getModel() || "unknown"}\n`
    hardwareInfo += `Device: ${DeviceInfo.getBrand()} ${DeviceInfo.getDeviceId()} (${DeviceInfo.getDeviceType()})\n`
    if (Platform.OS === "android"){
      hardwareInfo += `Name: ${await DeviceInfo.getDevice()}\n`
      hardwareInfo += `Product: ${await DeviceInfo.getProduct()}\n`
      hardwareInfo += `Android API: ${await DeviceInfo.getApiLevel()}\n`
      hardwareInfo += `Hardware name (from kernel): ${await DeviceInfo.getHardware()}\n`
    }else{
      hardwareInfo += `iOS: ${Platform.Version}\n`
    }
    hardwareInfo += `Airplane mode: ${await DeviceInfo.isAirplaneMode() ? "on" : "off"}\n`
    hardwareInfo += `System-wide location services enabled: ${await DeviceInfo.isLocationEnabled() ? "yes" : "no"}`
    return hardwareInfo;
  }catch(err){
    logError(err)
    return "<Error Getting Hardware Info>"
  }
}

import {Alert} from 'react-native';
/**
 * Standard alert to show when something's not ready for use yet (or is broken due ot new developments)
 */
export const ShowNotSupportedAlert = (customMessage = null) => {
  Alert.alert(
    "Not yet, young whippersnapper 👴🏾", 
    customMessage || "Either this feature is broken, or might break something, or hasn't been tested enough. Maybe try again when its ready.")
}