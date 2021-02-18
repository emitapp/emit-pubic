import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import crashlytics from '@react-native-firebase/crashlytics';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import { StatusBar, Keyboard, Pressable } from 'react-native';
import RNBootSplash from "react-native-bootsplash";
import { ThemeProvider } from 'react-native-elements';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import ConnectionBanner from 'reusables/ConnectionStatusBanner';
import DevBuildBanner from 'reusables/DevBuildBanner';
import AccountSetUp from 'screens/Authentication/AccountSetUp';
import AuthDecisionPage from 'screens/Authentication/AuthDecisionPage';
import LandingPage from 'screens/Authentication/LandingPage';
import Login from 'screens/Authentication/Login';
import PasswordReset from 'screens/Authentication/PasswordReset';
import SignUp from 'screens/Authentication/SignUp';
import MainTabNav from 'screens/MainTabNav';
import CovidWarningPage from 'screens/Onboarding/CovidWarningPage';
import SwiperOnboarding from 'screens/Onboarding/SwiperOnboarding';
import MainTheme from 'styling/mainTheme';
import { ASYNC_SETUP_KEY, ASYNC_TOKEN_KEY, logError, timedPromise, LONG_TIMEOUT } from 'utils/helpers';
import NavigationService from 'utils/NavigationService';

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.topLevelNavigator = null
  }

  componentDidMount = () => {
    //Don't unsubscribe, so that if the user is signed out (manually or automatically by Firebase),
    // he is still rerouted
    auth().onAuthStateChanged(this.handleAuthChange)
    RNBootSplash.hide({ fade: true }).catch(() => console.log("cannot be hidden"));
  }

  render() {
    return (
    <Pressable onPress={Keyboard.dismiss} accessible={false} style = {{height: "100%"}}>
      <ThemeProvider theme={MainTheme}>
        <StatusBar backgroundColor={MainTheme.colors.statusBar} barStyle="light-content" />
        <Navigator ref={ref => NavigationService.setTopLevelNavigator(ref)} />
        <ConnectionBanner />
        <DevBuildBanner />
      </ThemeProvider>
    </Pressable>
    )
  }

  //if there's no internet there's a chance this will fail, so we won't
  //include there errors in crashlytics
  //TODO: ^improve this 
  disassociateToken = async () => {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) return;
      //See MainTabNav.js for reeasons being getToken()'s signature
      const fcmToken = await messaging().getToken(undefined, '*')
      const syncFunction = functions().httpsCallable('disassociateToken')
      await timedPromise(syncFunction(fcmToken), LONG_TIMEOUT)
      //meh we don't really care for error checking here
    } catch (err) {
      if (err.name != "timeout") logError(err, false)
    }
  }


  handleAuthChange = async (user) => {
    try {
      if (!user) {
        await AsyncStorage.removeItem(ASYNC_TOKEN_KEY)
        await AsyncStorage.removeItem(ASYNC_SETUP_KEY)
        this.disassociateToken()
      } else {
        crashlytics().setUserId(user.uid).catch(err => logError(err))
      }
      NavigationService.navigate("AuthDecisionPage")
    } catch (err) {
      logError(err)
    }
  }
}

//Using a switch navigator 
const Navigator = createAppContainer(
  createSwitchNavigator(
    {
      AuthDecisionPage,
      SignUp,
      AccountSetUp,
      Login,
      MainTabNav,
      LandingPage,
      PasswordReset,
      CovidWarningPage,
      SwiperOnboarding
    },
    {
      initialRouteName: 'AuthDecisionPage'
    }
  )
)