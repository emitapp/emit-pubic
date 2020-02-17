// This is the page a new user is directed to to setup their account

import React from 'react'
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { isOnlyWhitespace, timedPromise, logError, LONG_TIMEOUT, ASYNC_SETUP_KEY } from 'utils/helpers';
import AsyncStorage from '@react-native-community/async-storage';

export default class AccountSetUp extends React.Component {

    state = { name: '', errorMessage: null }  

    render() {
      return (
        <View style={styles.container}>
          <Text>Finish setting up your Biteup Account</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}

          <TextInput
            style={styles.textInput}
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
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    textInput: {
      height: 40,
      width: '90%',
      borderColor: 'gray',
      borderWidth: 1,
      marginTop: 8
    }
  })