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


import NavigationService from 'utils/NavigationService';
import database from '@react-native-firebase/database';
/**
 * Sends the user to the appropriate screen when opening up a notification
 * @param {The remoteMessage object} message 
 */
export const handleNotificationOpened = (message) => {
  const reason = message.data.reason;
  switch (reason) {
    case "newBroadcast":
      var ref = database().ref(`/feeds/${auth().currentUser.uid}/${message.data.associatedFlareId}`)
      ref.once('value', function (snapshot) {
        if (!snapshot.exists()) return
        let broadcast = snapshot.val();
        broadcast.uid = message.data.associatedFlareId;
        NavigationService.reset("FeedStackNav", 1,
          [{ routeName: 'Feed' },
          { routeName: 'FlareViewer', params: { broadcast: broadcast } },
          ])
      }, function (e) {
        console.log("Read failed: " + e.code);
      })
      break;

    case "broadcastResponse":
      var ref = database().ref(`/activeBroadcasts/${message.data.broadcasterUid}/public/${message.data.associatedFlareId}`)
      ref.once('value', function (snapshot) {
        if (!snapshot.exists()) return
        let broadcast = snapshot.val();
        broadcast.uid = message.data.associatedFlareId;
        NavigationService.reset("FeedStackNav", 1,
          [{ routeName: 'Feed' },
          { routeName: 'FlareViewer', params: { broadcast: broadcast, isOwner: true } }
          ])
      }, function (e) {
        console.log("Read failed: " + e.code);
      })
      break;

    case "newFriend":
      NavigationService.reset("ExploreStackNav", 0, [{ routeName: 'ExploreStackNav' }])
      break;

    case "friendRequest":
      NavigationService.reset("ProfileAndSettingsStackNav", 0,
        [{ routeName: 'FriendRequests' }])
      break;

    case "newGroup":
      NavigationService.reset("ExploreStackNav", 0, [{ routeName: 'ExploreStackNav' }])
      break;

    case "chatMessage":
      var ref = database().ref(`/activeBroadcasts/${message.data.broadcasterUid}/public/${message.data.associatedFlareId}`)
      ref.once('value', function (snapshot) {
        if (!snapshot.exists()) return
        let broadcast = snapshot.val();
        broadcast.uid = message.data.associatedFlareId;
        NavigationService.reset("FeedStackNav", 2,
          [{ routeName: 'Feed' },
          { routeName: 'FlareViewer', params: { broadcast: broadcast, isOwner: true } },
          { routeName: 'ChatScreen', params: { broadcast: broadcast } }
          ])
      }, function (e) {
        console.log("Read failed: " + e.code);
      })
      break;
    default:
      break;
  }
}
