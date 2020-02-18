import auth from '@react-native-firebase/auth';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import S from "styling";
import { LONG_TIMEOUT, timedPromise } from 'utils/helpers';

export default class SignUp extends React.Component {

  state = { email: '', password: '', errorMessage: null }
  
  render() {
      return (
        <View style={S.styles.container}>
          <Text>Sign Up</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            style={S.styles.textInput}
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
            style={S.styles.textInput}
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
          <Button title="Sign Up" onPress={this.handleSignUp} />
          <Button
            title="Already have an account? Login"
            onPress={() => this.props.navigation.navigate('Login')}
          />
        </View>
      )
    }

    handleSignUp = async () => {
      try{
        var signUpPromise = auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
        await timedPromise(signUpPromise, LONG_TIMEOUT)
        //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      }catch(error){
        this.setState({ errorMessage: error.message })
        if (error.message != "timeout") logError(error)
      }
    }

  }