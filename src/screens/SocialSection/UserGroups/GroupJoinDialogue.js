//TODO: Remove this screen once searchhub gets filtering
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View } from 'react-native';
import { Button, SearchBar, Text } from 'react-native-elements';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';
import { LoadableButton } from 'reusables/ui/ReusableButtons';
import { analyticsLogSearch, analyticsUserJoinedGroup } from 'utils/analyticsFunctions';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses } from 'utils/serverValues';


//Give it a  groupSnippet and it will not show the invite code UX
export default class GroupJoinDialogue extends React.PureComponent {

    constructor(props){
      super (props)
      this.state = {
        groupsUserIsIn: [],
        message: null,
        inviteCode: "",
        groupUid: props.groupSnippet ? props.groupSnippet.uid : null,
        groupName: props.groupSnippet ? props.groupSnippet.name : null,
        groupMemberCount: props.groupSnippet ? props.groupSnippet.memberCount : null,
        waitingForCloudFunc: false
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
              <Text>{this.state.groupMemberCount} members</Text>

              {this.state.groupsUserIsIn.includes(this.state.groupUid) ? (
                <Text>You're already a member.</Text>
              ) : (
                <LoadableButton 
                title="Join" 
                onPress={this.props.groupSnippet ? this.joinPublicGroup : this.joinGroupViaCode} 
                isLoading = {this.state.waitingForCloudFunc} />
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
        this.setState({waitingForCloudFunc: true})
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
      }finally{
        this.setState({waitingForCloudFunc: false})
      }
    }
  
    joinPublicGroup = async () => {
      try {
        //Just get the invite code and join via that. No need to reinvent the wheel.
        const inviteCode = await database().ref(`userGroupCodes/${this.state.groupUid}`).once("value")
        if (!inviteCode.exists()) return
        this.setState({inviteCode: inviteCode.val()}, this.joinGroupViaCode)
  
      } catch (error) {
        this.setState({ message: error.message, waitingForCloudFunc: false })
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