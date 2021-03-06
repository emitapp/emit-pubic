import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import crashlytics from '@react-native-firebase/crashlytics';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import { StatusBar } from 'react-native';
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
import { ASYNC_SETUP_KEY, ASYNC_TOKEN_KEY, logError, LONG_TIMEOUT, timedPromise, colorLog } from 'utils/helpers';
import NavigationService from 'utils/NavigationService';
import codePush from "react-native-code-push";
import { AppState } from "react-native";

//You can make this false if you're testing something on a device and 
//don't want codepush to interfere
const CODEPUSH_ENABLED = true;

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.topLevelNavigator = null

    this.appState = AppState.currentState //will be "active"
    this.lastBackgroundedTime = Date.now();
    this.backgroundTimeThreshold = 30 * 60 * 1000; //30 minutes of backgorund time = codepush sync
  }

  componentDidMount = () => {
    //Don't unsubscribe, so that if the user is signed out 
    //(manually or automatically by Firebase), he is still rerouted
    auth().onAuthStateChanged(this.handleAuthChange)

    //Fresh launch, look for and install codepush updates before removing launch screen.
    codePush.sync({ installMode: codePush.InstallMode.IMMEDIATE })
      .catch(err => logError(err))
      .finally(() => this.removeSplashScreen())

    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  render() {
    return (
      <ThemeProvider theme={MainTheme}>
        <StatusBar backgroundColor={MainTheme.colors.statusBar} barStyle="light-content" />
        <Navigator ref={ref => NavigationService.setTopLevelNavigator(ref)} />
        <ConnectionBanner />
        <DevBuildBanner />
      </ThemeProvider>
    )
  }

  //if there's no internet there's a chance this will fail, so we won't
  //include the errors in crashlytics
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

  removeSplashScreen = () => {
    RNBootSplash.hide({ fade: true }).catch(err => logError(err));
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

  //Sync with codepush if you've been in the background long enough.
  handleAppStateChange = (nextAppState) => {
    if (!CODEPUSH_ENABLED) return;
    if (this.appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      Date.now() - this.lastBackgroundedTime > this.backgroundTimeThreshold) {

      RNBootSplash.show({ fade: false })
        .then(_ => codePush.sync({ installMode: codePush.InstallMode.IMMEDIATE }))
        .catch(err => logError(err))
        .finally(() => this.removeSplashScreen())
    }

    if (nextAppState.match(/inactive|background/)) this.lastBackgroundedTime = Date.now()
    this.appState = nextAppState;
  };
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