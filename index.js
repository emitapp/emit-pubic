/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler' //For react-navigation
import messaging from '@react-native-firebase/messaging';
import { handleFCMMessage } from 'utils/fcmNotificationHandlers';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await handleFCMMessage(remoteMessage)
});

AppRegistry.registerComponent(appName, () => App);

