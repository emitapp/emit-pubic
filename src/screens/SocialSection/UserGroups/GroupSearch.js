import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Overlay, Text, Button, SearchBar } from 'react-native-elements';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserGroupListElement } from 'reusables/ListElements';
import { BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import DymanicInfiniteScroll from 'reusables/DynamicInfiniteScroll'
import S from 'styling';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers'
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import { cloudFunctionStatuses } from 'utils/serverValues'
import functions from '@react-native-firebase/functions';
import Snackbar from 'react-native-snackbar';
import { analyticsLogSearch, analyticsUserJoinedGroup } from 'utils/analyticsFunctions';

export default class GroupSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Group Search",
      headerBackTitle: null, //Because the Group management screens use ScrollableHeaders
    };
  };

  state = {
    isModalVisible: false,
    selectedPublicGroup: null
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <Overlay isVisible={this.state.isModalVisible}>
          <View>
            <GroupJoinDialogue
              groupSnippet={this.state.selectedPublicGroup}
              joinSuccessFunction={() => {
                this.showDelayedSnackbar("Join Successful!")
                this.setState({ isModalVisible: false })
              }} />

            <MinorActionButton
              title="Close"
              onPress={() => this.setState({ isModalVisible: false })} />
          </View>
        </Overlay>

        <SearchableInfiniteScroll
          type="static"
          queryValidator={(query) => query.length > 1}
          parentEmptyStateComponent={
            <DymanicInfiniteScroll
              renderItem={this.itemRenderer}
              dbref={database().ref(`/userGroupMemberships/${userUid}`).orderByChild("queryName")}
              ListHeaderComponent={
                <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18, flex: 1 }}>
                  Your Groups
                </Text>
              }
            />
          }
          searchbarPlaceholder="Search Your Groups or Public Groups"
          queryTypes={[{ name: "Name", value: "nameQuery" }]}
          renderItem={this.publicGroupRenderer}
          dbref={database().ref("/publicGroupSnippets")}
        />

        <Button
          title="Join Group via invite code"
          onPress={() => this.setState({ isModalVisible: true, selectedPublicGroup: null })} />

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

  publicGroupRenderer = ({ item }) => {
    return (
      <UserGroupListElement
        groupInfo={item}
        onPress={() => this.setState({ isModalVisible: true, selectedPublicGroup: item })}
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

//Give it a  groupSnippet and it will not show the invite code UX
export class GroupJoinDialogue extends React.PureComponent {

  constructor(props){
    super (props)
    this.state = {
      groupsUserIsIn: [],
      message: null,
      inviteCode: "",
      groupUid: props.groupSnippet ? props.groupSnippet.uid : null,
      groupName: props.groupSnippet ? props.groupSnippet.name : null,
      groupMemberCount: props.groupSnippet ? props.groupSnippet.memberCount : null
    }
    if (props.groupSnippet) this.checkIfMember(props.groupSnippet.uid)
  }


  render() {
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <ErrorMessageText message={this.state.message} />

        {!this.props.groupSnippet &&
          <>
            <Text>Invite codes are not case sensitive</Text>
            <SearchBar
              placeholder="Enter Code"
              onChangeText={inviteCode => this.setState({ inviteCode })}
              value={this.state.inviteCode}
              containerStyle={{ width: 300 }}
              onSubmitEditing={this.findGroup}
            />
          </>
        }

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

            {this.state.groupsUserIsIn.includes(this.state.groupUid) ? (
              <Text>You're already a member.</Text>
            ) : (
              <Button title="Join" onPress={this.props.groupSnippet ? this.joinPublicGroup : this.joinGroupViaCode} />
            )}
          </>
        }
      </View>
    )
  }

  findGroup = async () => {
    if (!this.state.inviteCode.trim()) return;
    try {
      analyticsLogSearch(this.state.inviteCode.trim())
      this.setState({ message: null })
      const groupIdSnap = await database().ref("userGroupCodes").orderByValue().
        equalTo(this.state.inviteCode.toLowerCase()).once("value");

      if (!groupIdSnap.exists()) {
        this.setState({ message: "Group doesn't exist!" })
        return
      }

      const groupUid = Object.keys(groupIdSnap.val())[0]

      const groupSnippet = await database()
        .ref(`userGroups/${groupUid}/snippet`).once("value");

      this.checkIfMember(groupUid)
      this.setState({
        groupUid,
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
        const groupUid = response.data.message ? response.data.message.groupUid : null;
        if (groupUid) analyticsUserJoinedGroup(groupUid)
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

  joinPublicGroup = async () => {
    try {
      //Just get the invite code and join via that. No need to reinvent the wheel.
      const inviteCode = await database().ref(`userGroupCodes/${this.state.groupUid}`).once("value")
      if (!inviteCode.exists()) return
      this.setState({inviteCode: inviteCode.val()}, this.joinGroupViaCode)

    } catch (error) {
      this.setState({ message: error.message })
      logError(error)
    }
  }

  //We add it to a list since this is asynchonous so we don't want to use just a single boolena flag
  checkIfMember = async (groupUid) => {
    if (this.state.groupsUserIsIn.includes(groupUid)) return;
    const membership = await database().ref(`/userGroupMemberships/${auth().currentUser.uid}/${groupUid}`).once("value")
    if (membership.exists())this.setState({groupsUserIsIn: [...this.state.groupsUserIsIn, groupUid]})
  }
}