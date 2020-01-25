import { SafeAreaView } from 'react-native'
import React from 'react'
import { createSwitchNavigator, createAppContainer, NavigationActions} from 'react-navigation'
import auth from '@react-native-firebase/auth';

import AsyncStorage from '@react-native-community/async-storage';
import AuthDecisionLander from './#screens/Authentication/AuthDecisionLanding'
import SignUp from './#screens/Authentication/SignUp'
import Login from './#screens/Authentication/Login'
import AccountSetUp from './#screens/Authentication/AccountSetUp'
import MainTabNav from './#screens/MainTabNav'
import { logError, ASYNC_SETUP_KEY, ASYNC_TOKEN_KEY } from './#constants/helpers';

//This file also contains the global functions needed by the app
//Hopefully there's not a lot

export default class App extends React.Component {

  constructor(props){
    super(props)
    this.topLevelNavigator = null
  }

  componentDidMount = () => {
    //Don't ubsbbscribe, so that if the user is signed out unexpectedly, he is still rerouted
    auth().onAuthStateChanged(this.handleAuthChange)
  }

  render() {
      return (
        <SafeAreaView style = {{flex: 1}}>
          <Navigator ref = {ref => this.topLevelNavigator = ref}/>
        </SafeAreaView>
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
      this.navigate("AuthDecisionLander")
    }catch(err){
      logError(err)
    }
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