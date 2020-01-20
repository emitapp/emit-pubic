import { SafeAreaView } from 'react-native'
import React from 'react'
import { createSwitchNavigator, createAppContainer} from 'react-navigation'
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {requestNotifications, RESULTS} from 'react-native-permissions';

import AuthDecisionLander from './#screens/Authentication/AuthDecisionLanding'
import SignUp from './#screens/Authentication/SignUp'
import Login from './#screens/Authentication/Login'
import AccountSetUp from './#screens/Authentication/AccountSetUp'
import MainTabNav from './#screens/MainTabNav'

//This file also contains the global functions needed by the app
//Hopefully there's not a lot

export default class App extends React.Component {

  constructor(props){
    super(props)
    global.AppRoot = this;
    this.setUpFCM()
  }

  render() {
      return (
        <SafeAreaView style = {{flex: 1}}>
          <Navigator/>
        </SafeAreaView>
      )
  }

  //Designed based on...
  //https://github.com/invertase/react-native-firebase/issues/2657#issuecomment-572906900
  setUpFCM = async () => {
    try{
      const response = await requestNotifications(['alert', 'sound'])
      if (response.status != RESULTS.GRANTED){
        console.log("Welp, then you're not gonna get notifications, my friend")
        return;
      }
  
      //This doesn't look terribly necessary,
      //But according to Mike Hardy on Discord, requestPermission has a side 
      //effect of setting some listeners, so we're doing it this way
      //This is needed just for iOS, btw
      const permissionGranted = await messaging().requestPermission()
  
      if (permissionGranted) { 
        //For iOS also
        if (!messaging().isRegisteredForRemoteNotifications) {
          await messaging().registerForRemoteNotifications();
        }      
        console.log('REGISTERED')
        const fcmToken = await messaging().getToken()
        console.log(fcmToken)
        this.setFCMListeners()
      } else {
        console.log('FAILED TO REGISTER')
      }
    }catch(err){
      console.log(err)
    }
  }

  setFCMListeners = async () => {
    const unsubscribeFromDeletes = messaging().onDeletedMessages(() => {
      console.log("Welp, that happened! Messages got deleted")
    });

    const unsubscribeFromOM = messaging().onMessage((remoteMessage) => {
      console.log('FCM Message Data:', remoteMessage.data);
    });
  }
}

//Using a switch navigator 
const Navigator = createAppContainer(
  createSwitchNavigator(
  {
    AuthDecisionLander,
    SignUp,
    AccountSetUp,
    Login,
    MainTabNav
  },
  {
    initialRouteName: 'AuthDecisionLander'
  }
)
)