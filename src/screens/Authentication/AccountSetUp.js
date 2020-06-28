// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Image, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import { MinorActionButton } from 'reusables/ReusableButtons';
import S from "styling";
import { ASYNC_SETUP_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { validUsername, validDisplayName, MAX_USERNAME_LENGTH, MAX_DISPLAY_NAME_LENGTH } from 'utils/serverValues';
import ErrorMessageText from 'reusables/ErrorMessageText';


export default class AccountSetUp extends React.Component {

    state = { 
      displayName: '', 
      displayNameError: null,
      username: "", 
      usernameError: null,
      errorMessage: null, 
      isModalVisible: false 
    }  

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
          <View style={{...S.styles.container, backgroundColor: theme.colors.primary}}>
  
          <Image
          source={require('media/unDrawPizzaEating.png')}
          style = {{position: 'absolute', bottom: 0, height: "50%", opacity: 0.3}}
          resizeMode = 'contain'/>

          <DefaultLoadingModal isVisible={this.state.isModalVisible} />

          <View style = {{
            justifyContent: 'center',
            alignItems: 'center', 
            borderRadius: 30, 
            backgroundColor: "white", 
            height: "auto",
            padding: 20,
            marginHorizontal: 30}}>

            <Text h4
              style = {{color: theme.colors.primary, marginVertical: 8, fontWeight: 'bold'}}>
                Finish setting up your Biteup Account
            </Text>

            <ErrorMessageText message = {this.state.errorMessage} />

            <Text style = {{marginBottom: 8}}>
              The name that people will see associated with your account. 
              It can be whatever you want, and you can always change it later
            </Text>
            <Input
              label = "Display Name"
              autoCapitalize="none"
              placeholder="John Doe"
              onChangeText={displayName => {
                let displayNameError = null
                if (displayName.length > MAX_DISPLAY_NAME_LENGTH) displayNameError = "Your display name is too long"
                this.setState({ displayName, displayNameError })
              }}
              value={this.state.displayName}
              errorMessage = {this.state.displayNameError}
            />

            <Text style = {{marginBottom: 8}}>
              You’re username must be unique, and you can’t change it. 
              It must contain only A-Z, a-z, 0-9, underscores or hyphens.
            </Text>
            <Input
              label = "Username"
              autoCapitalize="none"
              placeholder="the_real_john"
              onChangeText={username => {
                let usernameError = null
                if (username && !validUsername(username, false)) usernameError = "Your username can only have A-Z, a-z, 0-9, underscores or hyphens"
                else if (username.length > MAX_USERNAME_LENGTH) usernameError = "Your username is too long"
                this.setState({ username, usernameError })
              }}
              value={this.state.username}
              errorMessage = {this.state.usernameError}
            />

            <Button 
              title="Finish" 
              onPress={this.finishUserSetUp} 
              type = "outline"
              buttonStyle = {{borderWidth: 2, width: 180, height: 50, marginTop: 22}}
              titleStyle = {{fontSize: 22}}/>

            <MinorActionButton
              title="Log Out and Go Back"
              onPress={this.signOut}/>

          </View>
        </View>
      )}
      </ThemeConsumer>
      )
    }
    
    signOut = async () => {
      try{
        await auth().signOut()
      }catch(err){
        logError(err, true, "Sign out error!")
      }
     }

    finishUserSetUp = async () => {
      try{
        if (!validDisplayName(this.state.displayName)){
          this.setState({ errorMessage: "Invalid display name! Either too short or too long" })
          return;
        }
        if (!validUsername(this.state.username)){
          this.setState({ errorMessage: "Invalid username! It's either too long, too short or contains invalid characters" })
          return;
        }

        this.setState({isModalVisible: true})
        const usernameRef = database().ref(`/usernames/${this.state.username.normalize("NFKC").toLowerCase()}`);
        const currentUsernameOwnerSnap = await timedPromise(usernameRef.once('value'), LONG_TIMEOUT)

        if (currentUsernameOwnerSnap.exists() && 
            currentUsernameOwnerSnap.val() !== auth().currentUser.uid){
          this.setState({ errorMessage: "Username already in use" })
          this.setState({isModalVisible: false})
          return;
        }

        const cloudFunc = functions().httpsCallable('createSnippet');
        await timedPromise(cloudFunc({
          displayName: this.state.displayName,
          username: this.state.username
        }), LONG_TIMEOUT)

        await AsyncStorage.setItem(ASYNC_SETUP_KEY, "yes")
        this.props.navigation.navigate('MainTabNav')

      }catch(error){
        this.setState({ errorMessage: error.message })
        this.setState({isModalVisible: false})
        if (error.message != "timeout") logError(error)
      }
    }
}