
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import parsePhoneNumber from 'libphonenumber-js';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Divider, Input, Text } from 'react-native-elements';
import PhoneInput from "react-native-phone-number-input";
import Snackbar from 'react-native-snackbar';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { SmallLoadingComponent, TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import MoreInformationTooltip from 'reusables/MoreInformationTooltip';
import ProfilePicChanger from 'reusables/ProfilePicChanger';
import { logError, MEDIUM_TIMEOUT, timedPromise, LONG_TIMEOUT } from 'utils/helpers';
import {
  cloudFunctionStatuses,
  validDisplayName
} from 'utils/serverValues';
import { emitEvent, events } from 'utils/subcriptionEvents';



export default class EditProfileScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Edit Profile",
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      displayName: "",
      hasInitialData: false,
      hasTimedOut: false,
      displayNameError: "",
      changingDisplayName: false,

      changingPhoneNumber: false,
      phonenumberInput: "",
      fullPhoneNumberInput: "",
      phoneInputError: "",
      initialPhoneCountry: "US"
    }
    this.phoneInput = null
    this._isMounted = false; //Using this is an antipattern, but simple enough for now
  }

  componentDidMount() {
    this._isMounted = true
    this.getInitialData()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  render() {
    if (!this.state.hasInitialData) {
      return (
        <TimeoutLoadingComponent
          hasTimedOut={this.state.hasTimedOut}
          retryFunction={this.state.getSnippet} />
      )
    }
    return (
      <ScrollView
        style={{ flex: 1, marginTop: 8 }}
        contentContainerStyle={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <Text h4>Edit Profile Picture</Text>

        <ProfilePicChanger
          onSuccessfulUpload={() => setTimeout(() => emitEvent(events.PROFILE_PIC_CHNAGE), 8000)}
        />

        <Divider style={{ marginVertical: 16 }} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text h4>Edit Display Name</Text>
          <MoreInformationTooltip
            message={"Note that even though you can change your display name as many times as you want ," +
              "certain parts of the app will still show your old display name to you and other users. " +
              "This is why Emit also associates a unique unchangeable hander (eg @john_doe)" +
              "to make sure everyone is still easily identifiable."}
            height={300}
            width={250} />
        </View>

        <Input
          autoCapitalize="none"
          label="Display Name"
          placeholder="What's your new display name?"
          onChangeText={displayName => this.setState({ displayName })}
          value={this.state.displayName}
          errorMessage={
            validDisplayName(this.state.displayName) ? this.state.displayNameError :
              `Your display name is too long or is only whitespace`
          }
        />

        {!this.state.changingDisplayName ? (
          <Button title="Update" onPress={this.updateDisplayName} />
        ) : (
          <SmallLoadingComponent />
        )}

        <Divider style={{ marginVertical: 16 }} />

        <View style={{ marginHorizontal: 8 }}>

          <Text style={{ marginBottom: 4 }}>
            <Text style={{ fontWeight: "bold" }}>Phone number (optional). </Text>
              Never public, but provides better friend recommendations from contacts.
            </Text>

          <ErrorMessageText message={this.state.phoneInputError} />

          <PhoneInput
            ref={ref => this.phoneInput = ref}
            layout="first"
            defaultCode={this.state.initialPhoneCountry}
            placeholder="5550122345"
            value={this.state.phonenumberInput}
            onChangeText={text => this.setState({ phonenumberInput: text })}
            onChangeFormattedText={text => this.setState({ fullPhoneNumberInput: text })}
            containerStyle={{ height: 40, borderRadius: 8, width: "100%" }}
            textContainerStyle={{ backgroundColor: "#E6E6E6", borderRadius: 8, width: "100%", margin: 0, paddingVertical: 0 }}
            //So when the initial data is retrieved, initialPhoneCountry will change and 
            //component be remounted, allowiing new defualt code to kick in
            key={this.state.initialPhoneCountry}
          />

          {!this.state.changingDisplayName ? (
            <Button
              title="Update"
              onPress={this.updatePhoneNumber}
              buttonStyle={{ alignSelf: "center" }}
              containerStyle={{ marginVertical: 16 }} />
          ) : (
            <SmallLoadingComponent />
          )}
        </View>

      </ScrollView>
    )
  }

  getInitialData = async () => {
    try {
      this.setState({ hasTimedOut: false })
      const uid = auth().currentUser.uid;
      const snippetRef = database().ref(`/userSnippets/${uid}`);
      const extraInfoRef = database().ref(`/userSnippetExtras/${uid}`);
      const userMetadataRef = firestore().collection('userMetadata').doc(auth().currentUser.uid)
      let snippetSnap = null;
      let extrasSnap = null;
      let metadataSnap = null;

      await Promise.all([
        timedPromise(userMetadataRef.get(), MEDIUM_TIMEOUT).then(snap => metadataSnap = snap),
        timedPromise(snippetRef.once('value'), MEDIUM_TIMEOUT).then(snap => snippetSnap = snap),
        timedPromise(extraInfoRef.once('value'), MEDIUM_TIMEOUT).then(snap => extrasSnap = snap)
      ])

      if (!snippetSnap.exists() || !this._isMounted) return;

      let newStateVars = { displayName: snippetSnap.val().displayName }
      if (extrasSnap.exists()) newStateVars = { ...extrasSnap.val(), ...newStateVars }

      if (metadataSnap.exists && metadataSnap.data().phoneNumberInfo) {
        const parsedPhoneNumber = parsePhoneNumber(metadataSnap.data().phoneNumberInfo.phoneNumberInternational, "US")
        newStateVars = {
          ...newStateVars,
          initialPhoneCountry: parsedPhoneNumber.country,
          phonenumberInput: parsedPhoneNumber.nationalNumber,
          fullPhoneNumberInput: parsedPhoneNumber.formatInternational()
        }
      }

      this.setState({
        ...newStateVars,
        hasInitialData: true
      })

    } catch (err) {
      if (err.name != "timeout") logError(err)
      else this.setState({ hasTimedOut: true })
    }
  }

  updateDisplayName = async () => {
    if (!validDisplayName(this.state.displayName)) {
      return
    } else {
      this.setState({ displayNameError: "" })
    }
    this.setState({ changingDisplayName: true })
    try {
      const changeFunction = functions().httpsCallable('updateDisplayName');
      const response = await timedPromise(changeFunction(this.state.displayName), MEDIUM_TIMEOUT);

      if (response.data.status === cloudFunctionStatuses.OK) {
        Snackbar.show({ text: 'Display name change successful', duration: Snackbar.LENGTH_SHORT });
      } else {
        logError(new Error("Problematic updateDisplayName fucntion response: " + response.data.message))
        this.setState({ displayNameError: response.data.message })
      }
    } catch (err) {
      if (err.name == "timeout") {
        this.setState({ displayNameError: "Timeout! Try again" })
      } else {
        this.setState({ displayNameError: "Something went wrong." })
        logError(err)
      }
    }
    this.setState({ changingDisplayName: false })
  }

  updatePhoneNumber = async () => {
    if (!this.phoneInput.isValidNumber(this.state.fullPhoneNumberInput)) {
      this.setState({ phoneInputError: "Invalid phone number!" })
      return;
    }

    try {
      this.setState({ changingPhoneNumber: true, phoneInputError: "" })
      const cloudFunc = functions().httpsCallable('updatePhoneNumber')
      const response = await timedPromise(cloudFunc(this.state.fullPhoneNumberInput), LONG_TIMEOUT);
      if (response.data.status != cloudFunctionStatuses.OK) {
        this.setState({ errorMessage: response.data.message })
      } else {
        Snackbar.show({ text: 'Phone number change successful', duration: Snackbar.LENGTH_SHORT });
      }
    } catch (err) {
      if (err.name != 'timeout') logError(err)
      this.setState({ phoneInputError: err.message })
    } finally {
      this.setState({ changingPhoneNumber: false })
    }

  }
}
