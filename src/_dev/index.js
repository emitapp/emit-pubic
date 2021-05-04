//This is a realtively important file for setting a few configirations that 
//Are useful to play around with during development.
//Maybe this should be placed somewere else eventually, but for now its here

//******************************  CODEPUSH  ************************************

/**
 * You can make this false if you're testing something on a device and 
 * don't want codepush to interfere.
 * Returns false for emulators
 */
export const _codepushEnabled = () => {
  return (!__DEV__) && true //Codepush is disabled for emulators by defualt
}



//******************************  CLOUD FUNCTIONS  ******************************
//https://firebase.google.com/docs/functions/local-emulator#run_the_emulator_suite
import functions from '@react-native-firebase/functions'
import { prettyLog } from 'utils/helpers'
//If you are running on a physical device, replace http://localhost 
//with the local ip of your PC. (http://192.168.x.x)
export const _EMULATOR_IP = "http://localhost:5000"

let _usingEmulator = false;

export const usingEmulator = () => {
  return _usingEmulator
}

export const switchToEmulatedFunctions = (ip) => {
  prettyLog(
    'Using Firebase Cloud Functions Emulator 👷🏾‍♂️',
    { textColor: "black", backgroundColor: "orange", fontSize: 18 })
  functions().useFunctionsEmulator(ip);
  _usingEmulator = true;

}

export const switchToLiveFuntions = (ip) => {
  prettyLog(
    'Using Live Cloud Functions 🌏',
    { textColor: "black", backgroundColor: "green", fontSize: 18 })
  functions().useFunctionsEmulator(null);
  _usingEmulator = false

}

//******************************  RN SERVER  ***********************************

import { DevSettings } from 'react-native'
export const restartJSApp = () => {
  DevSettings.reload()
}

//******************************  LOGGING  ***********************************



import { LogBox } from 'react-native'
LogBox.ignoreLogs([
  'Require cycle:', //TODO: investigate these warnings eventually
  'Remote debugger is in a background tab' //Not needed if you use "Maintain Priority in debugger, but here anyway"
])