// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import S from "styling";
import { ASYNC_SETUP_KEY, isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';

export default class AccountSetUp extends React.Component {

    state = { name: '', errorMessage: null }  

    render() {
      return (
        <View style={S.styles.container}>
          <Text>Finish setting up your Biteup Account</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}

          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Display Name"
            onChangeText={name => this.setState({ name })}
            value={this.state.name}
          />

          <Button title="Finish" onPress={this.finishUserSetUp} />

        </View>
      )
    }
    
    finishUserSetUp = async () => {
      try{
        if (isOnlyWhitespace(this.state.name)){
          this.setState({ errorMessage: "Invalid name!" })
          return;
        }

        const uid = auth().currentUser.uid; 
        const ref = database().ref(`/userSnippets/${uid}`);
        const setSnippet = ref.set({name: this.state.name})

        await timedPromise(setSnippet, LONG_TIMEOUT)
        await AsyncStorage.setItem(ASYNC_SETUP_KEY, "yes")
        this.props.navigation.navigate('MainTabNav')

      }catch(error){
        this.setState({ errorMessage: error.message })
        if (error.message != "timeout") logError(error)
      }
    }
}