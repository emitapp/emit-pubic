import analytics from '@react-native-firebase/analytics';
import auth from "@react-native-firebase/auth"

//These are the reserved event names by firebase, don't use these
// app_clear_data	app_uninstall	app_update
// error	first_open	first_visit
// first_open_time	first_visit_time	in_app_purchase
// notification_dismiss	notification_foreground	notification_open
// notification_receive	os_update	session_start
// screen_view	user_engagement	ad_impression
// ad_click	ad_query	ad_exposure
// adunit_exposure	ad_activeiew

export const analyticsSigningUp = (method) => {
    analytics().logSignUp({method})
}

export const analyticsLoggingIn = (method) => {
    analytics().logLogin({method})
}

export const analyticsLoggingOut = () => {
    analytics().logEvent("logOut")
}

export const analyticsLogSearch = (search_term) => {
    analytics().logSearch({search_term})
}

export const analyticsLogFlareCreation = (flare) => {
    //things we want to keep track of...
    //ofc everything in the flare
    //We also need to keep track of the size of the direct receprients and groups
}

export const setAnalyticsID = () => {
    if (auth().currentUser.uid) analytics().setUserId(auth().currentUser.uid)
}

export const analyticsScreenVisit = (screenName) => {
    analytics().logScreenView({screen_class: screenName, screen_name: screenName})
}

export const analyticsFriendRequestSent = (receiver) => {
    analytics().logEvent("friendRequestSent", {sender: auth().currentUser.uid, receiver})
}

export const analyticsFriendRequestAccepted = (sender) => {
    analytics().logEvent("friendRequestAccepted", {accepter: auth().currentUser.uid, sender})
}

export const analyticsUserInvitedSMS = () => {
    analytics().logShare({content_type: "appInvite", method: "sms", item_id: "sms"})
}

export const analyticsUserSharedFlare = (flareUid) => {
    analytics().logShare({content_type: "flareShare", method: "link", item_id: flareUid})
}

export const analyticsUserJoinedGroup = (groupUid) => {
    analytics().logJoinGroup({group_id: groupUid})
}

export const analyticsAppOpen = () => {
    analytics().logAppOpen()
}