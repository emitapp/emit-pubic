import analytics from '@react-native-firebase/analytics';
import auth from "@react-native-firebase/auth";
import database from '@react-native-firebase/database';
import { friendActionOptions } from 'screens/SocialSection/FriendReqModal';
import { logError } from './helpers';

//These are the reserved event names by firebase, don't use these
// app_clear_data	app_uninstall	app_update
// error	first_open	first_visit
// first_open_time	first_visit_time	in_app_purchase
// notification_dismiss	notification_foreground	notification_open
// notification_receive	os_update	session_start
// screen_view	user_engagement	ad_impression
// ad_click	ad_query	ad_exposure
// adunit_exposure	ad_activeiew

//Additionally, from the firebase docs:
// Event names can be up to 40 characters long, may only contain alphanumeric characters 
// and underscores ("_"), and must start with an alphabetic character. 
// The "firebase_", "google_", and "ga_" prefixes are reserved and should not be used

//For info on getting events to show in debug mode:
//https://firebase.google.com/docs/analytics/debugview

export const analyticsSigningUp = (method) => {
    analytics().logSignUp({ method }).catch(err => logError(err))
}

export const analyticsLoggingIn = (method) => {
    analytics().logLogin({ method }).catch(err => logError(err))
}

export const analyticsLoggingOut = () => {
    analytics().logEvent("log_out").catch(err => logError(err))
}

export const analyticsLogSearch = (search_term) => {
    analytics().logSearch({ search_term }).catch(err => logError(err))
}

export const setAnalyticsID = () => {
    analytics().setUserId(auth().currentUser.uid).catch(err => logError(err))
}

export const analyticsScreenVisit = (screenName) => {
    analytics().logScreenView({ screen_class: screenName, screen_name: screenName })
        .catch(err => logError(err))
}

//Action should be from friendActionOptions
export const analyticsFriendAction = (action, args) => {
    if (typeof action != 'string' || !Object.values(friendActionOptions).includes(action)) {
        logError("invalid friend action for analytics: " + action, false)
    }
    const formattedAction = action.trim().toLowerCase().replace(/\s+/g, '_')
    analytics().logEvent(formattedAction, args).catch(err => logError(err))
}

export const analyticsUserInvitedSMS = () => {
    analytics().logShare({ content_type: "app_invite", method: "sms", item_id: "sms" })
        .catch(err => logError(err))
}

export const analyticsUserJoinedGroup = (groupUid) => {
    analytics().logJoinGroup({ group_id: groupUid }).catch(err => logError(err))
}

export const analyticsAppOpen = () => {
    analytics().logAppOpen().catch(err => logError(err))
}


export const analyticsUserSharedFlare = (flareUid) => {
    analytics().logShare({ content_type: "flare_share", method: "link", item_id: flareUid })
        .catch(err => logError(err))
}

export const analyticsLogFlareCreation = async (flareUid, flareOwnerUid) => {
    try {
        const snap = await getFlareAnalyticsData(flareUid, flareOwnerUid)
        if (!snap.exists()) {
            logError(new Error("Couldn't get flare analytics data"))
        } else {
            analytics().logEvent("flare_created", snap.val())
        }
    } catch (err) {
        logError(err)
    }
}

export const analyticsVideoChatUsed = async (flareUid, flareOwnerUid) => {
    try {
        const snap = await getFlareAnalyticsData(flareUid, flareOwnerUid)
        if (!snap.exists()) {
            logError("Couldn't get flare analytics data")
        } else {
            analytics().logEvent("flare_video_chat_used", snap.val())
        }
    } catch (err) {
        logError(err)
    }
}

const getFlareAnalyticsData = async (flareUid, flareOwnerUid) => {
    const snap = await database().ref(`/activeBroadcasts/${flareOwnerUid}/private/${flareUid}/ga_analytics`).once("value")
    console.log(snap.val())
    return snap
}