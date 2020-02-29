import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';


export default class GroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.groupSnapshot = {}
    this.state = { 
      errorMessage: null, 
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      selectedUserUids: {},
      newGroupName: this.groupSnippet ? this.groupSnippet.name : "",
      inEditMode: false
    }
  }

  componentDidMount(){
    if (this.groupSnapshot){
      database().ref(`/userGroups/${this.groupSnippet.uid}/snippet`)
      .once("value")
      .then(snapshot => {
        this.groupSnapshot = snapshot.val()
        this.setState({}) //Cause rerender
      })
      .catch(err => logError(err))
    }
  }

  render() {
    let userUid = auth().currentUser.uid
    if (!this.groupSnippet) return null;
    const {inEditMode, newGroupName, groupName} = this.state;
    return (
      <View style={S.styles.containerFlexStart}>
        <Modal 
          isVisible={this.state.isModalVisible}
          style = {{justifyContent: "center", alignItems: "center"}}
          animationIn = "fadeInUp"
          animationOut = 'fadeOutUp'
          animationOutTiming = {0}>
          <ActivityIndicator />
        </Modal>

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}
   
        <Button title="Delete Group" onPress={this.deleteGroup}/>
        <Button title="Add Members" onPress={() => this.props.navigation.navigate('GroupMemberAdder', {group: this.groupSnippet})}/>

        <TextInput
          style={S.styles.textInput}
          autoCapitalize="none"
          onChangeText={text => this.setState({ newGroupName: text })}
          value={inEditMode ? newGroupName : groupName}
          editable={inEditMode}
        />

        <Text>Total Members: {this.groupSnapshot?.memberCount}</Text>
        <Text>Admins: {this.groupSnapshot?.adminCount}</Text>

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userGroups/${this.groupSnippet.uid}/memberSnippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />

        
        {!inEditMode ? (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonBlue}
              onPress={() => this.setState({inEditMode: true})}
              iconName = {S.strings.edit}
              title = "EDIT"
            />
          </View>
        ) : (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonRed}
              onPress={() => this.setState({inEditMode: false})}
              iconName = {S.strings.cancel}
              title = "CANCEL"
            />        
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonGreen}
              onPress={this.applyEdits}
              iconName = {S.strings.confirm}
              title = "SAVE CHANGES"
            />
          </View>
        )}
        
      </View>
    )
  }

  applyEdits = async () => {
    this.setState({isModalVisible: true})
    const {selectedUserUids, newGroupName, groupName} = this.state
    if (isOnlyWhitespace(newGroupName)){
      console.log("No cigar, my friend")
      this.setState({isModalVisible: false})
      return;
    }
    try{    
      const params = {groupUid: this.groupSnippet.uid}
      if (Object.keys(selectedUserUids).length != 0) params['usersToRemove'] = selectedUserUids
      if (newGroupName != groupName) params['newName'] = newGroupName
      const cloudFunc = functions().httpsCallable('editGroup')
      await timedPromise(cloudFunc(params), LONG_TIMEOUT);
      this.setState({isModalVisible: false, inEditMode: false})
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }   
  }

  deleteGroup = async () => {
    this.setState({isModalVisible: true})
    try{    
      const cloudFunc = functions().httpsCallable('deleteGroup')
      await timedPromise(cloudFunc({groupUid: this.groupSnippet.uid}), LONG_TIMEOUT);
      this.props.navigation.goBack()
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }   
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    const {inEditMode, selectedUserUids} = this.state
    return (
      <TouchableOpacity 
        style = {[S.styles.listElement, {backgroundColor: selectedUserUids[item.uid] && inEditMode ? "red" : "white"}]}
        onPress={() => this.toggleSelection(item)}
        disabled={!this.state.inEditMode}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.displayName}</Text>
            <Text>@{item.username}</Text>
            <Text>{item.uid}</Text>
            <Text>{item.rank}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  toggleSelection = (snippet) => {
    const copiedObj = {...this.state.selectedUserUids}
    if (copiedObj[snippet.uid]){
      //Then remove the user's uid
      delete copiedObj[snippet.uid]
    }else{
      //Add the user's uid
      copiedObj[snippet.uid] = true
    }
    this.setState({selectedUserUids: copiedObj});
  }
}

const styles = StyleSheet.create({
  bottomButton: {
    justifyContent: "center",
    alignItems: 'center', 
    height: 50,
    flexDirection: 'row',
    flex: 1
  },
})