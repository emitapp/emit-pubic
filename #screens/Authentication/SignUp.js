//Pretty self explanatory what this thing does

import React from 'react'
import auth from '@react-native-firebase/auth';
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import { timedPromise, MEDIUM_TIMEOUT } from '../../#constants/helpers';
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

    handleSignUp = () => {
      var signUpPromise = auth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then(() => {
            this.props.navigation.navigate('AccountSetUp')
          })

      timedPromise(signUpPromise, MEDIUM_TIMEOUT).catch(error => {
           this.setState({ errorMessage: error.message })
        })
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