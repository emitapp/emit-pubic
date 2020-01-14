// The overall partent navigator screen for the main interface

import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';
import ProfilePicChanger from '../../#reusableComponents/ProfilePicChanger'

export default class LogOut extends React.Component {

  state = {currentUser: null}

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