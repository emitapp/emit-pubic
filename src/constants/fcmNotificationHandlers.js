//This file has the methods that decide what to do upon receiving a FCM message
import auth from '@react-native-firebase/auth';
import { Notifications } from 'react-native-notifications';
import { checkNotifications, RESULTS } from 'react-native-permissions';

export const handleFCMMessage = async (remoteMessage) => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;

    Notifications.postLocalNotification({
        title: remoteMessage.data.title,
        body: remoteMessage.data.body ? remoteMessage.data.body : "",
    });
}


export const handleFCMDeletion = async () => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;
    Notifications.postLocalNotification({
        title: "Nice to see you again!",
        body: "It looks a lot might have happened since you last signed in!",
      });
}