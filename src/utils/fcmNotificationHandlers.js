//This file has the methods that decide what to do upon receiving a FCM message
//These handers just do nothing for now; we initially used them to make notifications
//using react-native-push-notifications and data-only fcm messgaes,
//but that ws throttled to much by FCM. 
//This method allowed for channels, messgae ids (to prevent chat notifications from piling up)
//and other thigns. Look at git history/blame for more info
import auth from '@react-native-firebase/auth';
import { checkNotifications, RESULTS } from 'react-native-permissions';

export const handleFCMMessage = async (remoteMessage) => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;
    //Meh just do nothing for now
}


export const handleFCMDeletion = async () => {
    if (!auth().currentUser) return
    const response = await checkNotifications();
    if (response.status != RESULTS.GRANTED) return;
    //Meh just do nothing for now
}