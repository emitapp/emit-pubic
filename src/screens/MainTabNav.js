// The overall partent tab navigator screen for the main interface
// This is also the screen that enables FCM because it can only be accessed
// if the user is signed in
import AsyncStorage from '@react-native-community/async-storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import {View} from 'react-native'
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
    this.unsunscribeFromTokenRefresh = null;
  }

  componentDidMount = () => {
    this.setUpFCM();
  }

  componentWillUnmount = () => {
    if (this.unsunscribeFromTokenRefresh) this.unsunscribeFromTokenRefresh()
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
      const permissionGranted = await messaging().requestPermission()
  
      if (permissionGranted) { 
        if (!messaging().isRegisteredForRemoteNotifications) {
          await messaging().registerForRemoteNotifications();
        }      
        this.syncToken() //Asyncronous
        this.setFCMListeners()
      } else {
        logError(new Error("permissionGranted still false after requestNotifications success"))
      }
    }catch(err){
      logError(err)
    }
  }

  /**
   * Sets the listeners needed for FCM functionality 
   * (Note that one of these listeners is actually already set in index.js as well)
   */
  setFCMListeners = () => {
    messaging().onDeletedMessages(async () => {
      await handleFCMDeletion()
    });

    messaging().onMessage(async (remoteMessage) => {
      await handleFCMMessage(remoteMessage)
    });

    this.unsunscribeFromTokenRefresh = messaging().onTokenRefresh(token => {
      this.syncToken() //Asyncronous
    });
  }

  /**
   * Gets the app instance's current FCM token and syncs it with the server
   * (relative to the currently signed in user)
   */
  syncToken = async () => {
    try{
      if (!messaging().isRegisteredForRemoteNotifications) return;
      const fcmToken = await messaging().getToken()
      const cachedToken = await AsyncStorage.getItem(ASYNC_TOKEN_KEY)
      const syncFunction = functions().httpsCallable('updateFCMTokenData')
      if (fcmToken != cachedToken){
        await timedPromise(syncFunction(fcmToken), LONG_TIMEOUT)
        await AsyncStorage.setItem(ASYNC_TOKEN_KEY, fcmToken)
      }    
    }catch(err){
      if (err.code != "timeout") logError(err)
    }

  }
}