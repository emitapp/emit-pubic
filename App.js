import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from 'react-native-elements';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import ConnectionBanner from 'reusables/ConnectionStatusBanner';
import AccountSetUp from 'screens/Authentication/AccountSetUp';
import AuthDecisionPage from 'screens/Authentication/AuthDecisionPage';
import LandingPage from 'screens/Authentication/LandingPage';
import Login from 'screens/Authentication/Login';
import PasswordReset from 'screens/Authentication/PasswordReset'
import SignUp from 'screens/Authentication/SignUp';
import MainTabNav from 'screens/MainTabNav';
import CovidWarningPage from 'screens/Onboarding/CovidWarningPage';
import MainTheme from 'styling/mainTheme';
import { ASYNC_SETUP_KEY, ASYNC_TOKEN_KEY, logError } from 'utils/helpers';
import NavigationService from 'utils/NavigationService';
import crashlytics from '@react-native-firebase/crashlytics';
import DevBuildBanner from 'reusables/DevBuildBanner'
import RNBootSplash from "react-native-bootsplash";

export default class App extends React.Component {

  constructor(props){
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
        <ThemeProvider theme={MainTheme}>
          <StatusBar backgroundColor={MainTheme.colors.statusBar} barStyle="light-content"/>
          <Navigator ref = {ref => NavigationService.setTopLevelNavigator(ref)}/>
          <ConnectionBanner/>
          <DevBuildBanner/>
        </ThemeProvider>
      )
  }

  handleAuthChange = async (user) => {
    try{
      if (!user){
        await AsyncStorage.removeItem(ASYNC_TOKEN_KEY)
        await AsyncStorage.removeItem(ASYNC_SETUP_KEY)
      }else{
        crashlytics().setUserId(user.uid).catch(err => logError(err))
      }
      NavigationService.navigate("AuthDecisionPage")
    }catch(err){
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
  },
  {
    initialRouteName: 'AuthDecisionPage'
  }
)
)