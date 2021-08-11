// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { ImageBackground, StatusBar, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { KeyboardAvoidingAndDismissingView } from 'reusables/containers/KeyboardComponents';
import { DefaultLoadingModal } from 'reusables/ui/LoadingComponents';
import { MinorActionButton } from 'reusables/ui/ReusableButtons';
import S from "styling";
import { analyticsLoggingOut } from 'utils/analyticsFunctions';
import { ASYNC_SETUP_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, MAX_DISPLAY_NAME_LENGTH, MAX_USERNAME_LENGTH, validDisplayName, validUsername } from 'utils/serverValues';
import PhoneInput from "react-native-phone-number-input";

export default class AccountSetUp extends React.Component {

  constructor() {
    super()
    this.phoneInput = null
    this.state = {
      displayName: '',
      displayNameError: null,
      username: "",
      usernameError: null,
      errorMessage: null,
      isModalVisible: false,

      phonenumberInput: "",
      fullPhoneNumberInput: ""
    }
  }

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

              <DefaultLoadingModal isVisible={this.state.isModalVisible} />

              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 30,
                backgroundColor: "white",
                height: "auto",
                padding: 20,
                marginHorizontal: 20
              }}>

                <Text h4
                  style={{ marginVertical: 8, fontWeight: 'bold' }}>
                  Account Setup
                  </Text>

                <ErrorMessageText message={this.state.errorMessage} />

                <Input
                  label={
                    <Text style={{ marginBottom: 8 }}>
                      <Text style={{ fontWeight: "bold" }}>Display Name {"\n"}</Text>
                      What do you want your friends to call you?
                      </Text>
                  }
                  autoCapitalize="none"
                  placeholder="John Doe"
                  onChangeText={displayName => {
                    let displayNameError = null
                    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) displayNameError = "Your display name is too long"
                    this.setState({ displayName, displayNameError })
                  }}
                  value={this.state.displayName}
                  errorMessage={this.state.displayNameError}
                  inputStyle={{ height: 20 }}
                />


                <Input
                  label={
                    <Text style={{ marginBottom: 8 }}>
                      <Text style={{ fontWeight: "bold" }}>Username {"\n"}</Text>
                        Your username is how your friends add you on Emit.
                      </Text>
                  }
                  autoCapitalize="none"
                  placeholder="the_real_john"
                  onChangeText={username => {
                    let usernameError = null
                    if (username && !validUsername(username, false)) usernameError = "Your username can only have A-Z, a-z, 0-9, underscores or hyphens"
                    else if (username.length > MAX_USERNAME_LENGTH) usernameError = "Your username is too long"
                    this.setState({ username, usernameError })
                  }}
                  value={this.state.username}
                  errorMessage={this.state.usernameError}
                  inputStyle={{ height: 20 }}
                />

                <View style={{ marginHorizontal: 8 }}>
                  <Text style={{ marginBottom: 4 }}>
                    <Text style={{ fontWeight: "bold" }}>Phone number (optional). </Text>
                    Never public, but provides better friend recommendations from contacts.
                  </Text>
                  <PhoneInput
                    ref={ref => this.phoneInput = ref}
                    layout="first"
                    defaultCode="US"
                    placeholder="5550122345"
                    value={this.state.phonenumberInput}
                    onChangeText={text => this.setState({ phonenumberInput: text })}
                    onChangeFormattedText={text => this.setState({ fullPhoneNumberInput: text })}
                    containerStyle={{ height: 40, borderRadius: 8, width: "100%" }}
                    textContainerStyle={{ backgroundColor: "#E6E6E6", borderRadius: 8, width: "100%", margin: 0, paddingVertical: 0 }}
                  />
                </View>


                <Button
                  title="Finish"
                  onPress={this.finishUserSetUp}
                  buttonStyle={{ borderWidth: 2, width: 180, height: 50, marginTop: 22 }}
                  titleStyle={{ fontSize: 22 }} />

                <MinorActionButton
                  title="Log Out and Go Back"
                  onPress={this.signOut} />

              </View>
            </ImageBackground>
          </KeyboardAvoidingAndDismissingView>
        )}
      </ThemeConsumer>
    )
  }

  signOut = async () => {
    try {
      await auth().signOut()
      analyticsLoggingOut()
    } catch (err) {
      logError(err, true, "Sign out error!")
    }
  }

  finishUserSetUp = async () => {
    try {
      this.setState({ errorMessage: "" })
      if (this.state.phonenumberInput && !this.phoneInput.isValidNumber(this.state.fullPhoneNumberInput)) {
        this.setState({ errorMessage: "Invalid phone number!" })
        return;
      }
      if (!validDisplayName(this.state.displayName)) {
        this.setState({ errorMessage: "Invalid display name! Either too short or too long" })
        return;
      }
      if (!validUsername(this.state.username)) {
        this.setState({ errorMessage: "Invalid username! It's either too long, too short or contains invalid characters" })
        return;
      }



      this.setState({ isModalVisible: true })
      const usernameRef = database().ref(`/usernames/${this.state.username.normalize("NFKC").toLowerCase()}`);
      const currentUsernameOwnerSnap = await timedPromise(usernameRef.once('value'), LONG_TIMEOUT)

      if (currentUsernameOwnerSnap.exists() &&
        currentUsernameOwnerSnap.val() !== auth().currentUser.uid) {
        this.setState({ errorMessage: "Username already in use" })
        this.setState({ isModalVisible: false })
        return;
      }

      const args = {
        displayName: this.state.displayName,
        username: this.state.username
      }
      if (this.state.phonenumberInput) {
        args.telephone = this.state.fullPhoneNumberInput
      }

      const cloudFunc = functions().httpsCallable('createSnippet');
      const response = await timedPromise(cloudFunc(args), LONG_TIMEOUT)

      if (response.data.status == cloudFunctionStatuses.OK) {
        await AsyncStorage.setItem(ASYNC_SETUP_KEY, "yes");
        this.props.navigation.navigate('SwiperOnboarding');
      } else {
        this.setState({ errorMessage: response.data.message })
      }
    } catch (error) {
      this.setState({ errorMessage: error.message })
      this.setState({ isModalVisible: false })
      if (error.name != "timeout") logError(error)
    }
  }
}