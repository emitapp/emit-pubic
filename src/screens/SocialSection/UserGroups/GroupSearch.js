import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Overlay, Text, Button, SearchBar } from 'react-native-elements';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserGroupListElement } from 'reusables/ListElements';
import { BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers'
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import { cloudFunctionStatuses } from 'utils/serverValues'
import functions from '@react-native-firebase/functions';
import Snackbar from 'react-native-snackbar';

export default class GroupSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Group Search",
      headerBackTitle: null, //Because the Group management screens use ScrollableHeaders
    };
  };

  state = {
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <Overlay isVisible={this.state.isModalVisible}>
          <View>

          <InviteCodeDialogue joinSuccessFunction={() => {
            this.showDelayedSnackbar("Join Successful!")
            this.setState({isModalVisible: false})
          }} />

          <MinorActionButton
            title="Close"
            onPress={() => this.setState({ isModalVisible: false })} />
            </View>
        </Overlay>

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "nameQuery"}]}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userGroupMemberships/${userUid}`)}
        />

        <Button title="Join Group via invite code" onPress={() => this.setState({ isModalVisible: true })} />

        <BannerButton
          onPress={() => this.props.navigation.navigate('GroupMemberAdder')}
          title="CREATE NEW GROUP"
          iconName={S.strings.add}
        />

      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserGroupListElement
        groupInfo={item}
        onPress={() => this.props.navigation.navigate('GroupViewer', { group: item })}
      />
    );
  }

  //There are modals being opened and closed on this screen, and if I close a modal
  //and then show the snackbar, the snackbar might be attached to the modal that was jsut in 
  //the process of being removed, meaning the snackbar will never be displayed. 
  //So, I use a small timeout to give the snackbar a bit of a delay
  //https://github.com/cooperka/react-native-snackbar/issues/67
  showDelayedSnackbar = (message) => {
    setTimeout(
      () => {
        Snackbar.show({
          text: message,
          duration: Snackbar.LENGTH_SHORT
        });
      },
      150
    )
  }
}

class InviteCodeDialogue extends React.PureComponent {

  state = {
    message: null,
    inviteCode: "",
    groupUid: null,
    groupName: null,
    groupMemberCount: null
  }

  render() {
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <ErrorMessageText message={this.state.message} />
        <Text>Invite codes are not case sensitive</Text>
        <SearchBar
          placeholder="Enter Code"
          onChangeText={inviteCode => this.setState({ inviteCode })}
          value={this.state.inviteCode}
          containerStyle={{ width: 300 }}
          onSubmitEditing={this.findGroup}
        />
        {this.state.groupUid &&
          <>
            <Text>About to join...</Text>

            <ProfilePicDisplayer
              diameter={80}
              uid={this.state.groupUid}
              style={{ marginVertical: 16 }}
              groupPic={true}
            />

            <Text h4>{this.state.groupName}</Text>

            <Button title="Join" onPress={this.joinGroupViaCode} />
          </>
        }
      </View>
    )
  }

  findGroup = async () => {
    try {
      this.setState({ message: null })
      const groupIdSnap = await database().ref("userGroupCodes").orderByValue().
        equalTo(this.state.inviteCode.toLowerCase()).once("value");

      if (!groupIdSnap.exists()) {
        this.setState({ message: "Group doesn't exist!" })
        return
      }

      const groupSnippet = await database()
        .ref(`userGroups/${Object.keys(groupIdSnap.val())[0]}/snippet`).once("value");

      this.setState({
        groupUid: Object.keys(groupIdSnap.val())[0],
        groupName: groupSnippet.val().name,
        groupMemberCount: groupSnippet.val().memberCount
      })
    } catch (error) {
      this.setState({ message: error.message })
      logError(error)
    }
  }


  //TODO: this currently doens't check if you're already part of the group, since that 
  //doesn't break anything
  joinGroupViaCode = async () => {
    try {
      const joinFunc = functions().httpsCallable('joinGroupViaCode');
      const response = await timedPromise(joinFunc(this.state.inviteCode), LONG_TIMEOUT);
      if (response.data.status === cloudFunctionStatuses.OK) {
        this.props.joinSuccessFunction()
      } else {
        this.setState({ message: response.data.message })
        logError(new Error("Problematic joinGroupViaCode function response: " + response.data.message))
      }
    } catch (error) {
      this.setState({ message: error.message })
      logError(error)
    }
  }
}