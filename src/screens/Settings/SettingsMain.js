import auth from '@react-native-firebase/auth';
import React from 'react';
import { View } from 'react-native';
import {Button, Text, ThemeConsumer} from 'react-native-elements'
import S from 'styling';
import { logError } from 'utils/helpers';
import UserProfileSummary from 'reusables/UserProfileSummary'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'


export default class SettingsMain extends React.Component {

    render() {
      const { currentUser } = auth()
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <View style={S.styles.containerFlexStart}>

          <UserProfileSummary style={{marginTop: 16}}/>
          
          <Text>
            Your email is {currentUser.emailVerified ? "" : "not"} verified
          </Text>
          <Button
          title="Send Verification Email"
          onPress={() => {
              auth().currentUser.sendEmailVerification()
                .catch(error => logError(error))}
          }/>
        

          <SettingSectionButton 
            title = "Edit Profile"
            icon = {<FontAwesomeIcon name="edit" />}
            color = {theme.colors.grey0} 
            onPress={() => this.props.navigation.navigate("ProfilePicScreen")}
          />
          <SettingSectionButton 
            title = "Notifications"
            icon = {<FontAwesomeIcon name="bell" />}
            color = {theme.colors.grey0}  
          />
          <SettingSectionButton 
            title = "Data and Privacy"
            icon = {<FeatherIcon name="lock" />}
            color = {theme.colors.grey0}  
          />
          <SettingSectionButton 
            title = "Help or Feedback"
            icon = {<FeatherIcon name="help-circle" />}
            color = {theme.colors.grey0}  
          />   
          <SettingSectionButton 
            title = "Logout"
            icon = {<MaterialIcon name="logout" />}
            color = "red" 
            onPress={this.signOut}
          />
        </View>
        )}
        </ThemeConsumer>
      )
    }

    signOut = async () => {
      try{
        await auth().signOut()
        //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      }catch(err){
        logError(err, true, "Sign out error!")
      }
     }
  }


class SettingSectionButton extends React.Component {
  render() {
    const {icon, title, color, onPress} = this.props
      return (
        <Button
          title={title}
          type="clear"
          icon={
            <icon.type {...icon.props} color={color} size={20} />
          }
          titleStyle={{marginLeft: 8, color: color}}
          containerStyle = {{width: "90%", borderBottomColor: color, borderBottomWidth: 0.5, paddingBottom: 4}}
          buttonStyle = {{ justifyContent: "flex-start"}}
          onPress = {onPress}
        />
      )
  }
}