//This is the first page the user "Visits" - it decides
//whether or not the user goes to the main app interface or a sign in/up interface
//or an account setup interface

import React from 'react'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import { View, Text, StyleSheet } from 'react-native'
import {timedPromise, MEDIUM_TIMEOUT, logError} from '../../#constants/helpers' 
import TimeoutLoadingComponent from '../../#reusableComponents/TimeoutLoadingComponent';

export default class Loading extends React.Component {

  constructor(props){
    super(props);
    this.state = {timedout: false}
    this.loggedIn = false
  }


  componentDidMount() {
    //Is the user already signed in or not?
    var unsubscribe = auth().onAuthStateChanged(user => {
      unsubscribe();
      this.loggedIn = user
      this.makeDecision();
    })
  }

  render() {
    return (
      <View style={styles.container}>
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
      if (this.loggedIn){
        //Check if he's set up the account first
        // (like with a username and dp) and whatnot
        const uid = auth().currentUser.uid; 
        const ref = database().ref(`/userSnippets/${uid}`);
        const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
        if (snapshot.exists()) this.props.navigation.navigate('MainTabNav');
        else this.props.navigation.navigate('AccountSetUp');
      }else{
        this.props.navigation.navigate('Login');
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})