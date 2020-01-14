// The overall partent navigator screen for the main interface

import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import ProfilePicChanger from '../../#reusableComponents/ProfilePicChanger'
import {timedPromise, MEDIUM_TIMEOUT} from '../../#constants/helpers' 


export default class LogOut extends React.Component {

  state = {currentUser: null, picPath: ""}

  componentDidMount() {
    const { currentUser } = auth()
    this.setState({ currentUser })
  }

    render() {
      const { currentUser } = this.state
      return (
        <View style={styles.container}>
          <Text>
            Hi {currentUser && currentUser.email}!
          </Text>
          <Button
            title="Signout"
            onPress={() => global.MainTabRoot.signOut()}/>

          <ProfilePicChanger/>
        </View>
      )
    }
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })