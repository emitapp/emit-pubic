// The overall partent tab navigator screen for the main interface
// This is also the screen that enables FCM because it can only be accessed
// if the user is signed in
import AsyncStorage from '@react-native-community/async-storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import {View, Platform} from 'react-native'
import { requestNotifications, RESULTS } from 'react-native-permissions';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import S from 'styling';
import { handleFCMDeletion, handleFCMMessage } from 'utils/fcmNotificationHandlers';
import { ASYNC_TOKEN_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import DashboardStackNav from "./DashboardSection/DashboardStackNav";
import FeedStackNav from './FeedSection/FeedStackNav';
import SocialStackNav from './SocialSection/SocialSectionStackNav'
import SettingsStackNav from "./Settings/SettingsStackNav";
import MainTheme from 'styling/mainTheme'
import {cloudFunctionStatuses} from 'utils/serverValues'


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
        tabBarIcon: ({tintColor, focused }) => {
          const { routeName } = navigation.state;
          let iconName;
          if (routeName === 'DashboardStackNav') {
            iconName = S.strings.home;
          } else if (routeName === 'FeedStackNav') {
            iconName = S.strings.feed;
          }else if (routeName === 'SocialStackNav') {
            iconName = S.strings.users;
          }else{
            iconName = S.strings.settings;
          }

          return (
            <View style = {{height: "100%", justifyContent: "center", alignItems: "center"}}>
              <View style = {{flex: 1, alignItems: "center", justifyContent: "center"}}>
                <AwesomeIcon name={iconName} size={25} color={tintColor}/>
              </View>
              {focused && <View style = {{
                position: "relative", 
                height: 5, width: 40, 
                backgroundColor: tintColor, 
                borderTopEndRadius: 8, 
                borderTopStartRadius: 8}}/>}
            </View>
          )
        }
      }),
    tabBarOptions: {
      style:{
        borderTopWidth:2,
        borderTopColor: MainTheme.colors.primary,
      },
      showLabel: false,
      activeTintColor: MainTheme.colors.primary,
      inactiveTintColor: MainTheme.colors.grey0,
    },
  }
);

export default class Main extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Tab.router;

  constructor(props){
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
    try{
      const response = await requestNotifications(['alert', 'sound'])
      if (response.status != RESULTS.GRANTED){
        logError(new Error("Denied notification permission"), false)
        return;
      }
  
      //This doesn't look terribly necessary,
      //But according to Mike Hardy on Discord, requestPermission has a side 
      //effect of setting some listeners, so we're doing it this way
      //This is needed just for iOS, btw
      let permissionGranted = true
      if (Platform.OS == 'ios'){
        const permissionStatus = await messaging().requestPermission()
        permissionGranted =
          permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          permissionStatus === messaging.AuthorizationStatus.PROVISIONAL;  
      }
  
      if (!permissionGranted){
        logError(new Error("permissionGranted still false after requestNotifications success"))
        return
      }

      //Not actually needed becuase this is done by defualt (unless disabled)
      //But meh
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }      
      this.syncToken() //Asyncronous
      this.setFCMListeners()
    }catch(err){
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
    try{
      if (!messaging().isDeviceRegisteredForRemoteMessages) return;
      const fcmToken = await messaging().getToken()
      const cachedToken = await AsyncStorage.getItem(ASYNC_TOKEN_KEY)
      if (fcmToken != cachedToken){
        const syncFunction = functions().httpsCallable('updateFCMTokenData')
        const response = await timedPromise(syncFunction(fcmToken), LONG_TIMEOUT)
        if (response.data.status != cloudFunctionStatuses.OK) return; //Don't cache the token (so we can retry later)
        await AsyncStorage.setItem(ASYNC_TOKEN_KEY, fcmToken)
      }    
    }catch(err){
      if (err.name != "timeout") logError(err)
    }
  }
}