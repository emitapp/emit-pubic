// This is the page a new user is directed to to setup their account

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { ImageBackground, StatusBar, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { KeyboardAvoidingAndDismissingView } from 'reusables/KeyboardComponents';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import { MinorActionButton } from 'reusables/ReusableButtons';
import S from "styling";
import { ASYNC_SETUP_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, MAX_DISPLAY_NAME_LENGTH, MAX_USERNAME_LENGTH, validDisplayName, validUsername } from 'utils/serverValues';
export default class AccountSetUp extends React.Component {

  state = {
    displayName: '',
    displayNameError: null,
    username: "",
    usernameError: null,
    errorMessage: null,
    isModalVisible: false
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
                marginHorizontal: 30
              }}>

                <Text h4
                  style={{ marginVertical: 8, fontWeight: 'bold' }}>
                  Finish setting up your Emit Account
                  </Text>

                <ErrorMessageText message={this.state.errorMessage} />

                <Text style={{ marginBottom: 8 }}>
                  What do you want your friends to call you?
                  </Text>
                <Input
                  label="Display Name"
                  autoCapitalize="none"
                  placeholder="John Doe"
                  onChangeText={displayName => {
                    let displayNameError = null
                    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) displayNameError = "Your display name is too long"
                    this.setState({ displayName, displayNameError })
                  }}
                  value={this.state.displayName}
                  errorMessage={this.state.displayNameError}
                />

                <Text style={{ marginBottom: 8 }}>
                  Your username is how your friends add you on Emit
                  </Text>
                <Input
                  label="Username"
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
                />

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
    } catch (err) {
      logError(err, true, "Sign out error!")
    }
  }

  finishUserSetUp = async () => {
    try {
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

      const cloudFunc = functions().httpsCallable('createSnippet');
      const response = await timedPromise(cloudFunc({
        displayName: this.state.displayName,
        username: this.state.username
      }), LONG_TIMEOUT)

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