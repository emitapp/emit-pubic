import auth from '@react-native-firebase/auth';
import React from 'react';
import { Button, Text, View } from 'react-native';
import S from 'styling';
import { logError } from 'utils/helpers';


export default class SettingsMain extends React.Component {

    render() {
      const { currentUser } = auth()
      return (
        <View style={S.styles.container}>
          
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