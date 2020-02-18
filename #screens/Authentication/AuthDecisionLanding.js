//This is a rerouting page. It uses firebase.auth, AsyncStorage, and the realtime database
//to decide which page to send the user based on their auth status.

import React from 'react'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import AsyncStorage from '@react-native-community/async-storage';
import { View, Text } from 'react-native'
import {logError, LONG_TIMEOUT, ASYNC_SETUP_KEY, timedPromise} from 'utils/helpers' 
import TimeoutLoadingComponent from 'reusables/TimeoutLoadingComponent';
import S from "styling"

export default class Loading extends React.Component {

  constructor(props){
    super(props);
    this.state = {timedout: false}
  }

  componentDidMount() {
    this.makeDecision() 
  }

  render() {
    return (
      <View style={S.styles.container}>
        <Text>Loading</Text>
        <TimeoutLoadingComponent 
          hasTimedOut = {this.state.timedout}
          retryFunction = {() => {
            this.setState({timedout: false})
            this.makeDecision()
          }}
        />
      </View>
    )
  }

  //Decides which page to navigate to next
  makeDecision = async () => {
    try{
      const user = auth().currentUser
      if (!user){ 
        this.props.navigation.navigate('Login');
      }else{
        const isSetUp = await AsyncStorage.getItem(ASYNC_SETUP_KEY)
        if (isSetUp){
          this.props.navigation.navigate('MainTabNav');
        }else{ 
          //Looks like he might not be set up, let's make sure first
          const uid = auth().currentUser.uid; 
          const ref = database().ref(`/userSnippets/${uid}`);
          const snapshot = await timedPromise(ref.once('value'), LONG_TIMEOUT);
          if (snapshot.exists()){
            await AsyncStorage.setItem(ASYNC_SETUP_KEY, "yes")
            this.props.navigation.navigate('MainTabNav');
          } 
          else this.props.navigation.navigate('AccountSetUp');
        } 
      }
    }catch(err){
      if (err.code == "timeout"){
        logError(err, false)
        this.setState({timedout: true})
      }else{
        logError(err)
      }
    }
  }
}