import auth from '@react-native-firebase/auth';
import React from 'react';
import { ImageBackground, Linking, StatusBar, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { KeyboardAvoidingAndDismissingView } from 'reusables/KeyboardComponents';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import { MinorActionButton } from 'reusables/ReusableButtons';
import S from "styling";
import { analyticsSigningUp } from 'utils/analyticsFunctions';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import * as links from "utils/LinksAndUris";



export default class SignUp extends React.Component {

  state = { email: '', password: '', passwordConfrim: "", errorMessage: null, modalVisible: false }

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
                  Sign Up
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

                <Input
                  secureTextEntry
                  autoCapitalize="none"
                  label="Confirm Password"
                  placeholder="Password"
                  onChangeText={passwordConfrim => this.setState({ passwordConfrim })}
                  value={this.state.passwordConfrim}
                />

                <Text style={{ fontWeight: "bold", textAlign: 'center' }}>
                  By creating an account you agree to our
            <Text style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(links.TERM_OF_SERVICE)}>
                    {" Terms of Service "}
                  </Text>
            and
            <Text style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(links.PRIVACY_POLICY)}>
                    {" Privacy Policy"}
                  </Text>
            .
            </Text>

                <Button
                  title="Sign Up"
                  onPress={this.handleSignUp}
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

  handleSignUp = async () => {
    try {
      this.setState({ modalVisible: true })
      //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      var signUpPromise = auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
      analyticsSigningUp("email")
      await timedPromise(signUpPromise, LONG_TIMEOUT)
    } catch (error) {
      this.setState({ errorMessage: error.message, modalVisible: false })
      if (error.name != "timeout") logError(error)
    }
  }

}