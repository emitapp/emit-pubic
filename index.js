/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler' //For react-navigation
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler((remoteMessage) => {
    console.log("Background FCM Message: " + remoteMessage.data)
});

AppRegistry.registerComponent(appName, () => App);
