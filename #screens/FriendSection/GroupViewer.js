import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import SearchableInfiniteScroll from '../../#reusableComponents/SearchableInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError, isOnlyWhitespace } from '../../#constants/helpers';

export default class NewGroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = { 
      errorMessage: null, 
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      selectedUserUids: {},
      newGroupName: this.groupSnippet ? this.groupSnippet.name : "",
      inEditMode: false
    }
  }

  render() {
    let userUid = auth().currentUser.uid
    if (!this.groupSnippet) return null;
    const {inEditMode, newGroupName, groupName} = this.state;
    return (
      <View style={styles.container}>
   
        <Button title="Delete Group" onPress={this.deleteGroup}/>

        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          onChangeText={text => this.setState({ newGroupName: text })}
          value={inEditMode ? newGroupName : groupName}
          editable={inEditMode}
        />

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}, {name: "Email", value: "email"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/details/${this.groupSnippet.uid}/memberSnippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />

        
        {!inEditMode ? (
          <View style={{flexDirection: "row"}}>
            <TouchableOpacity 
              style = {[styles.bottomButton, {backgroundColor: "skyblue"}]}
              onPress={() => this.setState({inEditMode: true})}>
              <AwesomeIcon name= "edit" size={18} color= "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> EDIT </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{flexDirection: "row"}}>
            <TouchableOpacity 
              style = {[styles.bottomButton, {backgroundColor: "red"}]}
              onPress={() => this.setState({inEditMode: false})}>
              <AwesomeIcon name= "ban" size={18} color= "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> CANCEL </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style = {[styles.bottomButton, {backgroundColor: "green"}]}
              onPress={this.applyEdits}>
              <AwesomeIcon name= "check" size={18} color= "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> SAVE CHANGES </Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
    )
  }

  applyEdits = () => {
    const {selectedUserUids, newGroupName} = this.state
    if (isOnlyWhitespace(newGroupName)){
      console.log("No cigar, my friend")
    }
    const snippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets/${this.groupSnippet.uid}`
    const infoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details/${this.groupSnippet.uid}`

    const updates = {}
    for (const uid in selectedUserUids) {
      //Deleting all selected users
      updates[`${infoPath}/memberSnippets/${uid}`] = null
      updates[`${infoPath}/memberUids/${uid}`] = null
    }
    updates[`${snippetPath}/name`] = newGroupName
 
    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => {
        this.setState({groupName: newGroupName})
        console.log("Edited the friend group!!")
      })
      .catch((err) => logError(err));

    this.setState({inEditMode: false})
  }

  deleteGroup = () => {
    const snippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets/${this.groupSnippet.uid}`
    const infoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details/${this.groupSnippet.uid}`
    const updates = {}
    updates[infoPath] = null
    updates[snippetPath] = null
 
    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => {
        this.setState({groupName: newGroupName})
        console.log("Deleted new friend group!!")
      })
      .catch((err) => logError(err));

    this.props.navigation.goBack()
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    const {inEditMode, selectedUserUids} = this.state
    return (
      <TouchableOpacity 
        style = {[styles.listElement, {backgroundColor: selectedUserUids[item.uid] && inEditMode ? "red" : "white"}]}
        onPress={() => this.toggleSelection(item)}
        disabled={!this.state.inEditMode}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.name}</Text>
            <Text>{item.uid}</Text>
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
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  textInput: {
    height: 40,
    width: '90%',
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 8
  },
  listElement: {
    paddingVertical: 5,
    alignItems: "center",
    flexDirection: 'row',
    marginLeft: 10,
    marginRight: 10
  },
  bottomButton: {
    justifyContent: "center",
    alignItems: 'center', 
    height: 50,
    flexDirection: 'row',
    flex: 1
  },
})