//This is a relatively important file for setting a few configurations that 
//Are useful to play around with during development.
//Maybe this should be placed somewhere else eventually, but for now its here

//It also has some pretty helpful helper functions

//******************************  DEV / QA BUILDS  ************************************
import DeviceInfo from 'react-native-device-info';

export const isDevBuild = () : boolean => {
  return DeviceInfo.getBundleId().endsWith(".dev")
}

export const isQABuild = () : boolean => {
  return DeviceInfo.getBundleId().endsWith(".qa")
}


//******************************  CODEPUSH  ************************************

/**
 * You can make this false if you're testing something on a device and 
 * don't want codepush to interfere.
 * Returns false for emulators
 */
export const _codepushEnabled = (): boolean => {
  //The variable below is altered via a script via awk for a yarn script
  //This "AWK" comment below is the trigger
  //AWK_LINE_BELOW:1
  const masterSwitch = true;
  //Codepush is disabled for emulators by default
  return (!__DEV__) && masterSwitch;
}



//******************************  CLOUD FUNCTIONS  ******************************
//https://firebase.google.com/docs/functions/local-emulator#run_the_emulator_suite
import functions from '@react-native-firebase/functions'
import { prettyLog } from 'utils/helpers'
//If you are running on a physical device, replace http://localhost 
//with the local ip of your PC. (http://192.168.x.x)
export const _EMULATOR_IP = "http://localhost:5000"

let _usingFunctionsEmulator = false;

export const usingFunctionsEmulator = (): boolean => {
  return _usingFunctionsEmulator
}

export const switchToEmulatedFunctions = (ip: string): void => {
  prettyLog(
    'Using Firebase Cloud Functions Emulator 👷🏾‍♂️',
    { textColor: "black", backgroundColor: "orange", fontSize: 18 })
  functions().useFunctionsEmulator(ip as string);
  _usingFunctionsEmulator = true;

}

export const switchToLiveFunctions = (): void => {
  prettyLog(
    'Using Live Cloud Functions 🌏',
    { textColor: "black", backgroundColor: "green", fontSize: 18 })
  //That's a hack because i know the underlying implementation of this function will result in null turning off local functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functions().useFunctionsEmulator(null as any);
  _usingFunctionsEmulator = false

}

//******************************  RN SERVER  ***********************************

import { DevSettings } from 'react-native'
export const restartJSApp = () : void => {
  DevSettings.reload()
}

//******************************  LOGGING  ***********************************



import { LogBox } from 'react-native'
LogBox.ignoreLogs([
  'Require cycle:', //TODO: investigate these warnings eventually
  'Remote debugger is in a background tab', //Not needed if you use "Maintain Priority in debugger, but here anyway",
  'Usage of "messaging().registerDeviceForRemoteMessages()" is not required', //Am afraid of iOS so better safe than sorry to use the extra call haha
  'Setting a timer for a long period of time', //https://stackoverflow.com/a/49886834 and https://github.com/facebook/react-native/issues/12981#issuecomment-652745831
])


//******************************  ASYNC STORAGE  ***********************************

import AsyncStorage from '@react-native-community/async-storage';
import { LAST_UPDATE_TIMESTAMP_SEEN } from 'utils/helpers'

export const clearUpdateModalHistory = () : void => {
  AsyncStorage.removeItem(LAST_UPDATE_TIMESTAMP_SEEN)
}


