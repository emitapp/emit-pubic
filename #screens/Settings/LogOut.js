// The overall partent navigator screen for the main interface

import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'
import QRCode from 'react-native-qrcode-svg';
import auth from '@react-native-firebase/auth';

import ProfilePicChanger from '../../#reusableComponents/ProfilePicChanger'
import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';

export default class LogOut extends React.Component {

    render() {
      const { currentUser } = auth()
      return (
        <View style={styles.container}>
          <View style = {styles.QRHolder}>
            <QRCode
              value = {currentUser.uid}
              logoBackgroundColor = 'transparent'
              backgroundColor = "white"
              color = "orange"
              size = {180}
              logo = {require('../../_media/WhiteCircle.png')}
              logoSize = {80}
              ecl = "H"/>
            <ProfilePicDisplayer diameter = {70} uid = {currentUser.uid} style = {styles.profilePic} />
          </View>
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
    },
    QRHolder:{
      borderRadius: 20, 
      padding: 10, 
      justifyContent: "center", 
      alignContent: "center", 
      borderColor: "orange", 
      borderWidth: 8,
      backgroundColor: "white"
    },
    profilePic:{
      position: "absolute",
      top: 65, // = QRHolder + (QRCOde size prop / 2) - radius of profile pic displayer
      left: 65,
    }
  })