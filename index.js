import {AppRegistry} from 'react-native';
import App from './App';
import React from 'react'
import {name as appName} from './app.json';
import 'react-native-gesture-handler' //For react-navigation
import messaging from '@react-native-firebase/messaging';
import { handleFCMMessage } from 'utils/fcmNotificationHandlers';
import codePush from "react-native-code-push";

const CodePushApp = codePush(App)

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await handleFCMMessage(remoteMessage)
});

//https://rnfirebase.io/messaging/usage#background-application-state
function HeadlessCheckedApp({ isHeadless }) {
    // If app has been "launched" in the background by iOS due to FCM, ignore
    if (isHeadless) return null;
    return <CodePushApp />;
}


AppRegistry.registerComponent(appName, () => HeadlessCheckedApp);

