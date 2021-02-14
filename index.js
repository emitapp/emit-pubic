import { AppRegistry } from 'react-native';
import App from './App';
import React from 'react'
import { name as appName } from './app.json';
import 'react-native-gesture-handler' //For react-navigation
import messaging from '@react-native-firebase/messaging';
import { handleFCMMessage } from 'utils/fcmNotificationHandlers';
import codePush from "react-native-code-push";
import 'react-native-get-random-values' //https://github.com/uuidjs/uuid#getrandomvalues-not-supported
import PushNotification from "react-native-push-notification";

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

// Must be outside of any component LifeCycle (such as `componentDidMount`).
// Might not be needed since we're no longer using it in our fcm handlers
// but we'll keep it in anyways
PushNotification.configure({}); 

AppRegistry.registerComponent(appName, () => HeadlessCheckedApp);

