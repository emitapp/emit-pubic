//This is a realtively important file for setting a few configirations that 
//Are useful to play around with during development.
//Maybe this should be placed somewere else eventually, but for now its here

/**
 * You can make this false if you're testing something on a device and 
 * don't want codepush to interfere.
 * Returns false for emulators
 */
export const _codepushEnabled = () => {
    return (!__DEV__) && true //Codepush is disabled for emulators by defualt
}


//https://firebase.google.com/docs/functions/local-emulator#run_the_emulator_suite

/**
 * For local Cloud function dev
 */
export const _shouldUseCloudFunctionEmulators = () => {
    return (__DEV__) && false
}

//If you are running on a physical device, replace http://localhost 
//with the local ip of your PC. (http://192.168.x.x)
export const _EMULATOR_IP = "http://localhost:5000"



import { LogBox } from 'react-native'
LogBox.ignoreLogs([
  'Require cycle:', //TODO: investigate these warnings eventually
  'Remote debugger is in a background tab' //Not needed if you use "Maintain Priority in debugger, but here anyway"
])