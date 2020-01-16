import { SafeAreaView } from 'react-native'
import React from 'react'
import { createSwitchNavigator, createAppContainer} from 'react-navigation'
import AuthDecisionLander from './#screens/Authentication/AuthDecisionLanding'
import auth from '@react-native-firebase/auth';

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
  }

  render() {
      return (
        <SafeAreaView style = {{flex: 1}}>
          <Navigator/>
        </SafeAreaView>
      )
  }

  sendVerificationEmail = () => {
    auth().currentUser.sendEmailVerification()
      .catch(error => console.error(error.message))
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