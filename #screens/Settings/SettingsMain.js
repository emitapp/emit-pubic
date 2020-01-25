import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'
import QRCode from 'react-native-qrcode-svg';
import auth from '@react-native-firebase/auth';

import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError } from '../../#constants/helpers';

export default class SettingsMain extends React.Component {

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
            onPress={this.signOut}/>

          <Button
            title="Change Profile Picture"
            onPress={() => this.props.navigation.navigate("ProfilePicScreen")}/>

          <Text>
            Your email is {currentUser.emailVerified ? "" : "not"} verified
          </Text>

          <Button
            title="Send Verification Email"
            onPress={() => {
                auth().currentUser.sendEmailVerification()
                  .catch(error => logError(error))}
                //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
            }/>
        </View>
      )
    }

    signOut = async () => {
      try{
        await auth().signOut()
      }catch(err){
        logError(err, true, "Sign out error!")
      }
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