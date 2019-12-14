//This is the first page the user "Visits" - it decides
//whether or not the user goes to the main app interface or a sign in/up interface

import React from 'react'
import auth from '@react-native-firebase/auth';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
export default class Loading extends React.Component {

  componentDidMount() {
    //Is the user already signed in or not?
    let unsubscribe = auth().onAuthStateChanged(user => {
      unsubscribe();
      this.props.navigation.navigate(user ? 'Main' : 'SignUp')
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})