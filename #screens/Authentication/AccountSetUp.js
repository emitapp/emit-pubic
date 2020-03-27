// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import database from '@react-native-firebase/database';
import React from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import Modal from 'react-native-modal';
import S from "styling";
import { ASYNC_SETUP_KEY, isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { validUsername } from 'utils/serverValues';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import {MinorActionButton} from 'reusables/reusableButtons'


export default class AccountSetUp extends React.Component {

    state = { displayName: '', username: "", errorMessage: null, isModalVisible: false }  

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
          <View style={{...S.styles.container, backgroundColor: theme.colors.primary}}>
  
          <Image
          source={require('media/unDrawPizzaEating.png')}
          style = {{position: 'absolute', bottom: 0, height: "50%", opacity: 0.3}}
          resizeMode = 'contain'/>

          <Modal 
            isVisible={this.state.isModalVisible}
            style = {{justifyContent: "center", alignItems: "center"}}
            animationIn = "fadeInUp"
            animationOut = 'fadeOutUp'
            animationOutTiming = {0}>
            <ActivityIndicator />
          </Modal>

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

            {this.state.errorMessage &&
              <Text style={{ color: 'red' }}>
                {this.state.errorMessage}
              </Text>}

            <Text style = {{marginBottom: 8}}>
              The name that people will see associated with your account. It can be whatever you want, and you can always change it later
            </Text>
            <Input
              label = "Display Name"
              autoCapitalize="none"
              placeholder="John Doe"
              onChangeText={displayName => this.setState({ displayName })}
              value={this.state.displayName}
            />

            <Text style = {{marginBottom: 8}}>
              You’re username must be unique, and you can’t change it. It must contain only A-Z, a-z, 0-9, underscores or hyphens.
            </Text>
            <Input
              label = "Username"
              autoCapitalize="none"
              placeholder="the_real_john"
              onChangeText={username => this.setState({ username })}
              value={this.state.username}
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
        this.setState({isModalVisible: true})
        if (isOnlyWhitespace(this.state.displayName)){
          this.setState({ errorMessage: "Empty Display Name!" })
          this.setState({isModalVisible: false})
          return;
        }
        if (isOnlyWhitespace(this.state.username) || !validUsername(this.state.username)){
          this.setState({ errorMessage: "Usernames can only have A-Z, a-z, 0-9 or _ or -" })
          this.setState({isModalVisible: false})
          return;
        }

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