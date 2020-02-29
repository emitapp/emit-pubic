// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import database from '@react-native-firebase/database';
import React from 'react';
import { Button, Text, TextInput, View, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import S from "styling";
import { ASYNC_SETUP_KEY, isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { validUsername } from 'utils/serverValues';


export default class AccountSetUp extends React.Component {

    state = { displayName: '', username: "", errorMessage: null, isModalVisible: false }  

    render() {
      return (
        <View style={S.styles.container}>
          <Modal 
            isVisible={this.state.isModalVisible}
            style = {{justifyContent: "center", alignItems: "center"}}
            animationIn = "fadeInUp"
            animationOut = 'fadeOutUp'
            animationOutTiming = {0}>
            <ActivityIndicator />
          </Modal>
          
          <Text>Finish setting up your Biteup Account</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}

          <Text>You can change your Display Name as many times as you want</Text>
          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Display Name"
            onChangeText={displayName => this.setState({ displayName })}
            value={this.state.displayName}
          />

          <Text>This is your unique account identifier that people can also refer to you with. It Cannot be changed</Text>
          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Username"
            onChangeText={username => this.setState({ username })}
            value={this.state.username}
          />

          <Button title="Finish" onPress={this.finishUserSetUp} />

        </View>
      )
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