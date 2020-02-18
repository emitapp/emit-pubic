import auth from '@react-native-firebase/auth';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import S from "styling";
import { logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';


export default class Login extends React.Component {

    state = { email: '', password: '', errorMessage: null }  

    render() {
      return (
        <View style={S.styles.container}>
          <Text>Login</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Email"
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <TextInput
            secureTextEntry
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Password"
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
          <Button title="Login" onPress={this.handleLogin} />
          <Button
            title="Don't have an account? Sign Up"
            onPress={() => this.props.navigation.navigate('SignUp')}
          />
        </View>
      )
    }
    
    handleLogin = async () => {
      try{
        var signInPromise = auth().signInWithEmailAndPassword(this.state.email, this.state.password)
        await timedPromise(signInPromise, MEDIUM_TIMEOUT)
        //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      }catch(err){
        this.setState({ errorMessage: error.message })
        if (error.message != "timeout") logError(error)
      }    
    }
  }