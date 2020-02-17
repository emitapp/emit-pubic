
import React from 'react'
import {StyleSheet, View} from 'react-native'
import ProfilePicChanger from 'reusables/ProfilePicChanger'

export default class ProfilePicChangingScreen extends React.Component {

    render() {
      return (
        <View style={styles.container}>
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