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


PushNotification.configure({}); // Must be outside of any component LifeCycle (such as `componentDidMount`).
PushNotification.channelExists("mainChannel", function (exists) {
  if (!exists) {
    PushNotification.createChannel(
      {
        channelId: "mainChannel", 
        channelName: "Main Channel", 
        channelDescription: "Main notification channel for Emit", // (optional) default: undefined.
      });
  }
});

PushNotification.channelExists("chatChannel", function (exists) {
  if (!exists) {
    PushNotification.createChannel(
      {
        channelId: "chatChannel", 
        channelName: "Chats", 
        channelDescription: "Chat notifications from Emit",
      });
  }
});

AppRegistry.registerComponent(appName, () => HeadlessCheckedApp);

