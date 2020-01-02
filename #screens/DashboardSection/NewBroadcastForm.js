// Self explanatory what this does

import React from 'react'
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import { timedPromise, MEDIUM_TIMEOUT } from '../../#constants/helpers';

export default class NewBroadcastForm extends React.Component {

    state = { place: '', time: null, errorMessage: null }  

    render() {
      return (
        <View style={styles.container}>
          <Text>Create a New Broadcast</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
          <TextInput
            style={styles.textInput}
            autoCapitalize="words"
            placeholder="Place"
            onChangeText={place => this.setState({ place })}
            value={this.state.place}
          />
          
          <Button title="Create" onPress={this.createBroadcast} />

        </View>
      )
    }
    
    createBroadcast = () => {
      console.log("Hah! I bet you thought this did something, eh?")
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