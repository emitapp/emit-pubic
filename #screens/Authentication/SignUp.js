import auth from '@react-native-firebase/auth';
import React from 'react';
import { Image, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import S from "styling";
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import MinorActionButton from 'reusables/MinorActionButton'

export default class SignUp extends React.Component {

  state = { email: '', password: '', passwordConfrim: "", errorMessage: null }
  
  render() {
    return (
      <ThemeConsumer>
      {({ theme }) => (
        <View style={{...S.styles.container, backgroundColor: theme.colors.primary}}>

        <Image
          source={require('media/unDrawPizzaEating.png')}
          style = {{position: 'absolute', bottom: 0, height: "50%", opacity: 0.3}}
          resizeMode = 'contain'/>

          <View style = {{
            justifyContent: 'center',
            alignItems: 'center', 
            borderRadius: 30, 
            backgroundColor: "white", 
            height: "auto",
            padding: 20,
            marginHorizontal: 30}}>

            <Text h3 
              style = {{color: theme.colors.primary, marginVertical: 8}}>
                Sign Up
            </Text>

            {this.state.errorMessage &&
              <Text style={{ color: 'red' }}>
                {this.state.errorMessage}
              </Text>}

            <Input
              autoCapitalize="none"
              placeholder="johnDoe@gmail.com"
              label = "Email"
              keyboardType = "email-address"
              onChangeText={email => this.setState({ email })}
              value={this.state.email}
            />

            <Input
              secureTextEntry
              autoCapitalize="none"
              label = "Password"
              placeholder="Password"
              onChangeText={password => this.setState({ password })}
              value={this.state.password}
            />

            <Input
              secureTextEntry
              autoCapitalize="none"
              label = "Confirm Password"
              placeholder="Password"
              onChangeText={passwordConfrim => this.setState({ passwordConfrim })}
              value={this.state.passwordConfrim}
            />

            <Text style={{fontWeight: "bold", textAlign: 'center'}}>
            By creating an account you agree to our Terms of Service and Privacy Policy
            </Text>

            <Button 
              title="Sign Up" 
              onPress={this.handleSignUp} 
              type = "outline"
              buttonStyle = {{borderWidth: 2, width: 180, height: 50, marginTop: 22}}
              titleStyle = {{fontSize: 22}}/>

            <MinorActionButton
              title="Go Back"
              onPress={() => this.props.navigation.navigate('LandingPage')}/>

          </View>
        </View>
      )}
      </ThemeConsumer>
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