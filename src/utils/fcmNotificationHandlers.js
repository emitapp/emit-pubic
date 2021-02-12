//This file has the methods that decide what to do upon receiving a FCM message
import auth from '@react-native-firebase/auth';
import { checkNotifications, RESULTS } from 'react-native-permissions';
import PushNotification from "react-native-push-notification";
import MainTheme from 'styling/mainTheme';
import { NotificationTypes } from 'utils/serverValues'

//https://stackoverflow.com/a/7616484
function genHash(str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export const handleFCMMessage = async (remoteMessage) => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;

    let notificationID = undefined;
    if (remoteMessage.data.reason == NotificationTypes.CHAT){
        notificationID = genHash(remoteMessage.data.associatedFlareId)
    }else{
        // added in "test notification" in in case we test local notifications
        // w/o firebase and hence miight not want to add out own ids
        notificationID = genHash(remoteMessage.messageId || "test notification") 
    }

    PushNotification.localNotification({
        /* Android Only Properties */
        channelId: remoteMessage.data.reason == NotificationTypes.CHAT ? "chatChannel" : "mainChannel",
        color: MainTheme.colors.primary,
        tag: remoteMessage.data.reason == NotificationTypes.CHAT ? "chatChannel" : "mainChannel",
        // Not sure what tag is used for yet, but I set it anyways
        //"when" property may be useful in the future
        //doesn't look like grouping is working, we should check back later on that

        /* iOS only properties */
        //"category" property will me immensely useful in the future

        /* iOS and Android properties */
        id: notificationID,
        title: remoteMessage.data.title,
        message: remoteMessage.data.body || "",
    });
}


export const handleFCMDeletion = async () => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;
    //Meh just do nothing for now
}