//This component is really only used once,
//But it's used in a screen that has other plugins that depend
//on react-native-svg. It causes some problems, so I decided to isolate it

import auth from '@react-native-firebase/auth';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';

export default class UserBitecode extends React.Component {
    render() {
        let uid = auth().currentUser.uid
        return (
                <View style = {{...styles.QRHolder, ...this.props.style, borderColor: this.props.color}}>
                    <QRCode
                        value = {uid}
                        logoBackgroundColor = 'transparent'
                        backgroundColor = "white"
                        color = {this.props.color}
                        size = {180}
                        logo = {require('media/WhiteCircle.png')}
                        logoSize = {80}
                        ecl = "H"
                    />
                    <ProfilePicDisplayer 
                        diameter = {70} 
                        uid = {uid} 
                        style = {styles.profilePic} 
                    />
                </View>
        )
    }
}

const styles = StyleSheet.create({
    QRHolder:{
      borderRadius: 20, 
      padding: 10, 
      justifyContent: "center", 
      alignContent: "center",  
      borderWidth: 8,
      backgroundColor: "white"
    },
    profilePic:{
      position: "absolute",
      top: 65, // = QRHolder + (QRCOde size prop / 2) - radius of profile pic displayer
      left: 65,
    }
  })