import auth from '@react-native-firebase/auth';
import React from 'react';
import { View, ImageBackground, StatusBar } from 'react-native';
import S from "styling";
import { logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { ThemeConsumer } from 'react-native-elements';
import { Text, Button, Input } from 'react-native-elements'
import { MinorActionButton } from 'reusables/ReusableButtons'
import { DefaultLoadingModal } from 'reusables/LoadingComponents'
import ErrorMessageText from 'reusables/ErrorMessageText';
import { KeyboardAvoidingAndDismissingView } from 'reusables/KeyboardComponents';

export default class Login extends React.Component {

  state = { email: '', password: '', errorMessage: null, modalVisible: false }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <KeyboardAvoidingAndDismissingView>
            <ImageBackground
              source={require('media/AuthFlowBackground.jpg')}
              style={{ ...S.styles.container, backgroundColor: "black" }}
              resizeMode='cover'>
              <StatusBar backgroundColor={'black'} barStyle="light-content" />

              <DefaultLoadingModal isVisible={this.state.modalVisible} />

              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 30,
                backgroundColor: "white",
                height: "auto",
                padding: 20,
                marginHorizontal: 30
              }}>

                <Text h3
                  style={{ marginVertical: 8 }}>
                  Log In
              </Text>

                <ErrorMessageText message={this.state.errorMessage} />

                <Input
                  autoCapitalize="none"
                  placeholder="johnDoe@gmail.com"
                  label="Email"
                  keyboardType="email-address"
                  onChangeText={email => this.setState({ email })}
                  value={this.state.email}
                />

                <Input
                  secureTextEntry
                  autoCapitalize="none"
                  label="Password"
                  placeholder="Password"
                  onChangeText={password => this.setState({ password })}
                  value={this.state.password}
                />

                <Text
                  style={{ textDecorationLine: "underline" }}
                  onPress={() => this.props.navigation.navigate('PasswordReset')}>
                  Forgot password?
              </Text>

                <Button
                  title="Log In"
                  onPress={this.handleLogin}
                  buttonStyle={{ borderWidth: 2, width: 180, height: 50, marginTop: 22 }}
                  titleStyle={{ fontSize: 22 }} />


                <MinorActionButton
                  title="Go Back"
                  onPress={() => this.props.navigation.navigate('LandingPage')} />

              </View>
            </ImageBackground>
          </KeyboardAvoidingAndDismissingView>
        )}
      </ThemeConsumer>
    )
  }

  handleLogin = async () => {
    try {
      this.setState({ modalVisible: true })
      //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      var signInPromise = auth().signInWithEmailAndPassword(this.state.email, this.state.password)
      await timedPromise(signInPromise, MEDIUM_TIMEOUT)
    } catch (err) {
      this.setState({ errorMessage: err.message, modalVisible: false })
      if (err.name != "timeout") logError(error)
    }
  }
}