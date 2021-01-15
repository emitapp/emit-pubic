// The overall partent tab navigator screen for the main interface
// This is also the screen that enables FCM because it can only be accessed
// if the user is signed in
import AsyncStorage from '@react-native-community/async-storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native'
import { requestNotifications, RESULTS } from 'react-native-permissions';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { handleFCMDeletion, handleFCMMessage } from 'utils/fcmNotificationHandlers';
import { ASYNC_TOKEN_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import DashboardStackNav from "./DashboardSection/DashboardStackNav";
import FeedStackNav from './FeedSection/FeedStackNav';
import SocialStackNav from './SocialSection/SocialSectionStackNav'
import SettingsStackNav from "./Settings/SettingsStackNav";
import MainTheme from 'styling/mainTheme'
import { cloudFunctionStatuses } from 'utils/serverValues'
import CircularView from 'reusables/CircularView'

const renderTab = (props, targetRouteName, iconName) => {
  const focused = props.navigation.state.routes[props.navigation.state.index].routeName == targetRouteName
  const tintColor = focused ? props.activeTintColor : props.inactiveTintColor
  return (
    <TouchableOpacity
      style={{
        height: "100%", width: "100%",
        justifyContent: "center", alignItems: "center", flex: 1
      }}
      onPress={() => props.navigation.navigate(targetRouteName)}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <AwesomeIcon name={iconName} size={30} color={tintColor} />
      </View>
      {focused && <View style={{
        position: "absolute", bottom: 0,
        height: 5, width: 40,
        backgroundColor: props.activeTintColor,
        borderTopEndRadius: 8,
        borderTopStartRadius: 8
      }} />}
    </TouchableOpacity>

  )
}

const Tab = createBottomTabNavigator(
  {
    FeedStackNav,
    DashboardStackNav,
    SocialStackNav,
    SettingsStackNav,
  },
  {
    defaultNavigationOptions: ({ navigation }) =>
    ({
      tabBarComponent: (props) => {
        return (
          //Height gotten from 
          //https://github.com/react-navigation/react-navigation/blob/5c7f892d77298f5c89534fa78a1a6a59c7f35a60/packages/tabs/src/views/BottomTabBar.tsx#L36
          <View {...props} style={{ ...props.style, height: 49, flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
            {renderTab(props, "FeedStackNav", "fire")}

            <TouchableOpacity
              style={{ alignSelf: "flex-end" }}
              onPress={() => props.navigation.navigate('NewBroadcastForm', { needUserConfirmation: true })}
            >
              <CircularView style={{ backgroundColor: MainTheme.colors.primary }} diameter={60} >
                {/** 
               * // TODO: Link back to MainTheme
               **/}
                <CircularView style={{ backgroundColor: "lightgrey" }} diameter={55} >
                  <CircularView style={{ backgroundColor: 'white' }} diameter={45} >
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <AwesomeIcon name="plus" size={30} color={MainTheme.colors.primary} />
                    </View>
                  </CircularView>
                </CircularView>
              </CircularView>
            </TouchableOpacity>

            {renderTab(props, "DashboardStackNav", "home")}
          </View>
        )
      }
    }),
    tabBarOptions: {
      style: {
        borderTopWidth: 1,
        borderTopColor: "lightgrey", //TODO:Link back to MainTheme
      },
      showLabel: false,
      activeTintColor: MainTheme.colors.primary,
      inactiveTintColor: "grey", //TODO:Link back to MainTheme
    },
  }
);

export default class Main extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Tab.router;

  constructor(props) {
    super(props);
    this.unsubscribeFromTokenRefresh = null;
    this.unsubscribeFromOnMessage = null;
    this.unsubscribeFromOnMessageDelete = null;
  }

  componentDidMount = () => {
    this.setUpFCM();
  }

  componentWillUnmount = () => {
    if (this.unsubscribeFromTokenRefresh) this.unsubscribeFromTokenRefresh()
    if (this.unsubscribeFromOnMessage) this.unsubscribeFromOnMessage()
    if (this.unsubscribeFromOnMessageDelete) this.unsubscribeFromOnMessageDelete()
  }

  render() {
    return (
      <Tab navigation={this.props.navigation} />
    )
  }

  //Designed based on...
  //https://github.com/invertase/react-native-firebase/issues/2657#issuecomment-572906900
  /**
   * Asks for notification permissions, registers for remote messages (for iOS),
   * then syncs FCM token with server and sets FCM listeners
   */
  setUpFCM = async () => {
    try {
      const response = await requestNotifications(['alert', 'sound'])
      if (response.status != RESULTS.GRANTED) {
        logError(new Error("Denied notification permission"), false)
        return;
      }

      //This doesn't look terribly necessary,
      //But according to Mike Hardy on Discord, requestPermission has a side 
      //effect of setting some listeners, so we're doing it this way
      //This is needed just for iOS, btw
      let permissionGranted = true
      if (Platform.OS == 'ios') {
        const permissionStatus = await messaging().requestPermission()
        permissionGranted =
          permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          permissionStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }

      if (!permissionGranted) {
        logError(new Error("permissionGranted still false after requestNotifications success"))
        return
      }

      //Not actually needed becuase this is done by defualt (unless disabled)
      //But meh
      //also -> https://github.com/invertase/react-native-firebase/issues/3367#issuecomment-605907816
      await messaging().registerDeviceForRemoteMessages();
      this.syncToken() //Asyncronous
      this.setFCMListeners()
    } catch (err) {
      logError(err)
    }
  }


  setFCMListeners = () => {
    this.unsubscribeFromOnMessageDelete = messaging().onDeletedMessages(async () => {
      await handleFCMDeletion()
    });

    //This is only for forground messages
    //Background message handler has been set in index.js
    this.unsubscribeFromOnMessage = messaging().onMessage(async (remoteMessage) => {
      await handleFCMMessage(remoteMessage)
    });

    this.unsubscribeFromTokenRefresh = messaging().onTokenRefresh(token => {
      this.syncToken() //Asyncronous
    });
  }

  /**
   * Gets the app instance's current FCM token and syncs it with the server
   * (relative to the currently signed in user)
   */
  syncToken = async () => {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) return;
      const fcmToken = await messaging().getToken()
      const cachedToken = await AsyncStorage.getItem(ASYNC_TOKEN_KEY)
      if (fcmToken != cachedToken) {
        const syncFunction = functions().httpsCallable('updateFCMTokenData')
        const response = await timedPromise(syncFunction(fcmToken), LONG_TIMEOUT)
        if (response.data.status != cloudFunctionStatuses.OK) return; //Don't cache the token (so we can retry later)
        await AsyncStorage.setItem(ASYNC_TOKEN_KEY, fcmToken)
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
    }
  }
}