import { StyleSheet, Platform, Image, Text, View } from 'react-native'
import React from 'react'
import { createSwitchNavigator, createAppContainer} from 'react-navigation'
import AuthDecisionLander from './#screens/Authentication/AuthDecisionLanding'
import auth from '@react-native-firebase/auth';
import SignUp from './#screens/Authentication/SignUp'
import Login from './#screens/Authentication/Login'
import Main from './#screens/Main'

//This file also contains the global functions needed by the app
//Hopefully there's not a lot

export default class App extends React.Component {

  constructor(props){
    super(props)
    global.AppRoot = this;
  }

  render() {
      return (<Navigator/>)
  }

  sendVerificationEmail = () => {
    auth().currentUser.sendEmailVerification()
      .catch(error => console.error(error.message))
  }
}

const Navigator = createAppContainer(
  createSwitchNavigator(
  {
    AuthDecisionLander,
    SignUp,
    Login,
    Main
  },
  {
    initialRouteName: 'AuthDecisionLander'
  }
)
)