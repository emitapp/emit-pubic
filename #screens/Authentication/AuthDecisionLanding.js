//This is the first page the user "Visits" - it decides
//whether or not the user goes to the main app interface or a sign in/up interface
//or an account setup interface

import React from 'react'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import {timedPromise} from '../../#constants/helpers' 

export default class Loading extends React.Component {

  componentDidMount() {
    //Is the user already signed in or not?
    let unsubscribe = auth().onAuthStateChanged(user => {
      unsubscribe();
      this.makeDecision(userExists);
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Loading</Text>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  //Decides which page to navigate to next
  makeDecision = async (userLoggedIn) => {
    try{
      if (userLoggedIn){
        //Check if he's set up the account first
        // (like with a username and dp) and whatnot
        const uid = auth().currentUser.uid; 
        const ref = database().ref(`/userSnippets/${uid}`);
        const snapshot = await timedPromise(ref.once('value'), 5000);
        if (snapshot.exists()) this.props.navigation.navigate('Main');
        else this.props.navigation.navigate('AccountSetup');
      }else{
        this.props.navigation.navigate('SignUp');
      }
    }catch(err){
      console.log(err);
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