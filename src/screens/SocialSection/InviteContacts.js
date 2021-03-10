import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import {
  Alert,
  FlatList,
  Linking, Platform,
  StyleSheet, View
} from "react-native";
import Contacts from 'react-native-contacts';
import { Button, Divider, SearchBar, Text } from 'react-native-elements';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyState from 'reusables/EmptyState';
import { UserSnippetListElementVertical } from 'reusables/ListElements';
import { SmallLoadingComponent } from 'reusables/LoadingComponents';
import { analyticsUserInvitedSMS } from 'utils/analyticsFunctions';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses } from 'utils/serverValues';
import ContactAvatar from './ContactAvatar';
import ContactElement from './ContactElement';
import FriendReqModal from './FriendReqModal';


export default class InviteContacts extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      contacts: [],
      searchValue: '',
      loading: true,
      invited: {},
      username: "",
      suggestedContactFriends: []
    };

    this.allContactEmails = []
  }

  componentDidMount() {
    this.getSnippet(); //Since most of this module works without internet, there are failsafes in case this fails
    checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.READ_CONTACTS] }, { required: [PERMISSIONS.IOS.CONTACTS] })
      .then(permissionsGranted => {
        if (permissionsGranted) {
          this.loadContacts();
          this.extractEmailsFromContacts()
        } else {
          Alert.alert("Couldn't get contacts", "Emit probably hasn't been granted the permissions")
        }
      })
      .catch(err => {
        logError(err)
        Alert.alert("Couldn't get contacts", "Something went wrong!")
      })
  }

  loadContacts() {
    Contacts.getAllWithoutPhotos()
      .then(contacts => {
        this.setState({ contacts, loading: false });
      })
      .catch(e => {
        this.setState({ loading: false });
        logError(e)
      });
  }

  getSnippet = async () => {
    try {
      const uid = auth().currentUser.uid;
      const ref = database().ref(`/userSnippets/${uid}`);
      const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
      if (snapshot.exists()) this.setState({ username: snapshot.val().username })
    } catch (err) {
      this.setState({ username: "" })
      if (err.name != "timeout") logError(err)
    }
  }

  extractEmailsFromContacts = async () => {
    this.state.contacts.forEach(c => {
      if (!c.emailAddresses || c.emailAddresses.length == 0) return;
      c.emailAddresses.forEach(emailObject => {
        this.allContactEmails.push(emailObject.email)
      })
    })

    try {
      const response = await timedPromise(functions().httpsCallable('getUsersFromContacts')(this.allContactEmails), LONG_TIMEOUT);
      if (response.data.status === cloudFunctionStatuses.OK) {
        this.setState({ suggestedContactFriends: response.data.message })
      } else {
        Snackbar.show({
          text: "Failed to get recommended friends from contacts",
          duration: Snackbar.LENGTH_SHORT
        });
        logError(new Error(`Problematic getUsersFromContacts function response: ${response.data.message}`))
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
      Snackbar.show({
        text: "Failed to get recommended friends from contacts",
        duration: Snackbar.LENGTH_SHORT
      });
    }
  }

  onPressContact = (contact) => {
    const currInvited = this.state.invited
    currInvited[contact.recordID] = true
    this.setState({ invited: currInvited });
    const phoneNumber = contact.phoneNumbers[0].number
    let body = "Hey, join me on Emit so we can hang! \n Download the app on https://getemit.com/"
    if (this.state.username) body += `\n My username is ${this.state.username}`
    const separator = Platform.OS === 'ios' ? '&' : '?'
    if (Platform.OS == 'android') body = encodeURIComponent(body)
    //Keep in mind this might not work on ios emulator
    Linking.openURL(`sms:${phoneNumber}${separator}body=${body}`)
    analyticsUserInvitedSMS()
  }

  search = (text) => {
    const phoneNumberRegex = /\b[\+]?[(]?[0-9]{2,6}[)]?[-\s\.]?[-\s\/\.0-9]{3,15}\b/m;
    const emailAddressRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
    if (!text) {
      this.loadContacts();
    } else if (phoneNumberRegex.test(text)) {
      Contacts.getContactsByPhoneNumber(text).then(contacts => {
        this.setState({ contacts });
      });
    } else if (emailAddressRegex.test(text)) {
      Contacts.getContactsByEmailAddress(text).then(contacts => {
        this.setState({ contacts });
      });
    } else {
      Contacts.getContactsMatchingString(text).then(contacts => {
        this.setState({ contacts });
      });
    }
    this.setState({ searchValue: text })
  }

  getAvatarInitials = (textString) => {
    if (!textString) return "";
    const text = textString.trim();
    const textSplit = text.split(" ");
    if (textSplit.length <= 1) return text.charAt(0);
    const initials =
      textSplit[0].charAt(0) + textSplit[textSplit.length - 1].charAt(0);
    return initials;
  };

  render() {
    return (
      <View style={styles.container}>
        <FriendReqModal
          ref={modal => this.modal = modal} />

        <SearchBar
          placeholder="Search contacts"
          value={this.state.searchValue}
          onChangeText={this.search}
        />

        {
          this.state.loading ?
            (
              <SmallLoadingComponent isVisible={this.state.loading} />
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={this.state.contacts}
                keyExtractor={(item) => item.recordID}
                renderItem={({ item }) => this.contactRenderer(item)}
                ListEmptyComponent={this.renderEmptyState}
                ListHeaderComponent={this.renderSuggestionHeader} />
            )
        }
      </View>
    );
  }

  contactRenderer = (item) => {
    if (item.phoneNumbers.length == 0) return null;
    return (
      <ContactElement
        leftElement={
          <ContactAvatar
            img={item.hasThumbnail ? { uri: item.thumbnailPath } : undefined}
            placeholder={this.getAvatarInitials(`${item.givenName} ${item.familyName}`)}
            width={40}
            height={40}
          />
        }
        rightElement={
          !this.state.invited[item.recordID] ?
            <Button
              title="Invite"
              onPress={() => this.onPressContact(item)}
              color="#007FFF"
              accessibilityLabel="Learn more about this button" /> :
            <Text>Invited</Text>
        }
        key={item.recordID}
        title={`${item.givenName} ${item.familyName}`}
        description={`${item.phoneNumbers[0].number}`}>
      </ContactElement>
    )
  }

  renderEmptyState = () => {
    return (
      <EmptyState
        style={{ flex: 1 }}
        image={
          <Icon name={"cactus"} size={50} color={"grey"} />
        }
        title="No Contacts"
        message="Emit coulnd't find any contacts with phone numbers to invite."
      />
    )
  }

  renderSuggestionHeader = () => {
    if (this.state.suggestedContactFriends.length == 0) return null;
    return (
      <>
        <Text style={{ fontWeight: "bold", margin: 10 }}>
          Contacts already on Emit
          </Text>
        <FlatList
          horizontal={true}
          data={this.state.suggestedContactFriends}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => {
            return (
              <UserSnippetListElementVertical
                snippet={item}
                onPress={() => this.modal.open(item)} />
            )
          }} />
        <Divider />
      </>

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
  },
  spinner: {
    flex: 1,
    flexDirection: 'column',
    alignContent: "center",
    justifyContent: "center"
  },
  inputStyle: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    textAlign: "center"
  }
});
