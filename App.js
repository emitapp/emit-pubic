import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from 'react-native-elements';
import { createAppContainer, createSwitchNavigator, NavigationActions } from 'react-navigation';
import ConnectionBanner from 'reusables/ConnectionStatusBanner';
import AccountSetUp from 'screens/Authentication/AccountSetUp';
import AuthDecisionPage from 'screens/Authentication/AuthDecisionPage';
import LandingPage from 'screens/Authentication/LandingPage';
import Login from 'screens/Authentication/Login';
import SignUp from 'screens/Authentication/SignUp';
import MainTabNav from 'screens/MainTabNav';
import MainTheme from 'styling/mainTheme';
import { ASYNC_SETUP_KEY, ASYNC_TOKEN_KEY, logError } from 'utils/helpers';

export default class App extends React.Component {

  constructor(props){
    super(props)
    this.topLevelNavigator = null
  }

  componentDidMount = () => {
    //Don't unsubscribe, so that if the user is signed out (manually or automatically by Firebase),
    // he is still rerouted
    auth().onAuthStateChanged(this.handleAuthChange)
  }

  render() {
      return (
        <ThemeProvider theme={MainTheme}>
          <StatusBar backgroundColor={MainTheme.colors.statusBar} barStyle="light-content"/>
          <Navigator ref = {ref => this.topLevelNavigator = ref}/>
          <ConnectionBanner/>
        </ThemeProvider>
      )
  }

  navigate = (routeName, params) => {
    this.topLevelNavigator.dispatch(
      NavigationActions.navigate({routeName, params})
    );
  }

  handleAuthChange = async (user) => {
    try{
      if (!user){
        await AsyncStorage.removeItem(ASYNC_TOKEN_KEY)
        await AsyncStorage.removeItem(ASYNC_SETUP_KEY)
      }
      this.navigate("AuthDecisionPage")
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
    LandingPage
  },
  {
    initialRouteName: 'AuthDecisionPage'
  }
)
)