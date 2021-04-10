import functions from '@react-native-firebase/functions';
import React from 'react';
import {
  FlatList,
  View
} from "react-native";
import Contacts from 'react-native-contacts';
import { Button, Text } from 'react-native-elements';
import { PERMISSIONS } from 'react-native-permissions';
import { UserSnippetListElementVertical } from 'reusables/ListElements';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError, LONG_TIMEOUT, timedPromise, ASKED_CONTACTS_PERMISSIONS } from 'utils/helpers';
import { cloudFunctionStatuses } from 'utils/serverValues';
import FriendReqModal from '../screens/SocialSection/FriendReqModal';
import SectionHeaderText from './SectionHeaderText';
import AsyncStorage from '@react-native-community/async-storage';

export default class ContactsRecommendations extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      suggestedContactFriends: [],
      errorMessage: "",
      hasPermissions: false,
    }

    this.contacts = []
    this.allContactEmails = []
    this.allContactPhoneNumbers = []
  }

  componentDidMount() {
    //To prevent the user from getting a permission dialogue without interacting with UI...
    AsyncStorage.getItem(ASKED_CONTACTS_PERMISSIONS)
      .then(wasAskedBefore => {
        if (wasAskedBefore) this.getPermissionsAndContacts()
      })
  }

  loadContacts() {
    Contacts.getAllWithoutPhotos()
      .then(contacts => {
        this.contacts = contacts
        this.getRecommendedFriends();
      })
      .catch(e => {
        this.setState({ loading: false });
        logError(e)
      });
  }

  getRecommendedFriends = async () => {
    this.contacts.forEach(c => {
      //Getting email addresses
      if (c.emailAddresses) {
        c.emailAddresses.forEach(emailObject => {
          this.allContactEmails.push(emailObject.email)
        })
      }

      //Getting phone numbers
      if (c.phoneNumbers) {
        c.phoneNumbers.forEach(phoneNumberObject => {
          this.allContactPhoneNumbers.push(phoneNumberObject.number)
        })
      }
    })

    try {
      const response = await timedPromise(
        functions().httpsCallable('getUsersFromContacts')({ emails: this.allContactEmails, phoneNumbers: this.allContactPhoneNumbers }),
        LONG_TIMEOUT);

      if (response.data.status === cloudFunctionStatuses.OK) {
        this.setState({ suggestedContactFriends: Object.values(response.data.message) })
      } else {
        this.setState({ errorMessage: "Couldn't get recommended contacts" })
        logError(new Error(`Problematic getUsersFromContacts function response: ${response.data.message}`))
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
      this.setState({ errorMessage: "Couldn't get recommended contacts" })
    }
  }




  render() {
    return (
      <View style={{ ...S.styles.containerFlexStart, alignItems: "flex-start" }}>

        <SectionHeaderText>CONTACTS ALREADY ON EMIT</SectionHeaderText>

        {!this.state.hasPermissions && <Button title="Check contacts" onPress={this.getPermissionsAndContacts} />}

        <FriendReqModal
          ref={modal => this.modal = modal} />

        {(this.state.suggestedContactFriends.length == 0) ? (
          this.state.hasPermissions && <Text>None yet!</Text>
        ) : (
          <FlatList
            horizontal={true}
            data={this.state.suggestedContactFriends}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => {
              return (
                <UserSnippetListElementVertical
                  snippet={item}
                  onPress={() => this.modal.open(item)}
                  imageDiameter={40} />
              )
            }} />
        )}

      </View>
    )
  }

  getPermissionsAndContacts = async () => {
    try {
      const enoughPermissions = await checkAndGetPermissions(
        { required: [PERMISSIONS.ANDROID.READ_CONTACTS] }, { required: [PERMISSIONS.IOS.CONTACTS] }
      )
      if (enoughPermissions) this.setState({ hasPermissions: enoughPermissions }, this.loadContacts)
      else this.setState({ errorMessage: "Not enough permissions for contacts" })
      await AsyncStorage.setItem(ASKED_CONTACTS_PERMISSIONS, "true")
    } catch (err) {
      logError(err)
      this.setState({ errorMessage: "Couldn't get contacts" })
    }
  }
}