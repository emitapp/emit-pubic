import React from 'react'
import auth from '@react-native-firebase/auth';
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import { timedPromise, LONG_TIMEOUT } from '../../#constants/helpers';

export default class SignUp extends React.Component {

  state = { email: '', password: '', errorMessage: null }
  
  render() {
      return (
        <View style={styles.container}>
          <Text>Sign Up</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            style={styles.textInput}
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
            style={styles.textInput}
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