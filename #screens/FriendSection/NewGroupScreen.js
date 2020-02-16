import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import SearchableInfiniteScroll from '../../#reusableComponents/SearchableInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError, isOnlyWhitespace } from '../../#constants/helpers';

export default class NewGroupScreen extends React.Component {

  state = { 
    errorMessage: null, 
    selectedUsers: {},
    groupName: ""
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={styles.container}>

              
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Enter your group's name"
          onChangeText={groupName => this.setState({ groupName })}
          value={this.state.groupName}
        />

        <Text>ADD FRIENDS</Text>

        <Text>{Object.keys(this.state.selectedUsers).map((uid) => `${uid}  `)}</Text>

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}, {name: "Email", value: "email"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />

        <TouchableOpacity 
            style = {styles.newGroupButton}
            onPress={this.createGroup}>
            <AwesomeIcon name= "plus" size={18} color= "white" />
            <Text style = {{color: "white", fontWeight: "bold"}}> CREATE </Text>
        </TouchableOpacity>

      </View>
    )
  }

  createGroup = () => {
    const {selectedUsers, groupName} = this.state
    const memberCount = Object.keys(selectedUsers).length
    if (memberCount == 0 || isOnlyWhitespace(groupName)){
      console.log("No cigar, my friend")
    }
    const baseSnippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets`
    const baseInfoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details`
    const newKey = database().ref(baseSnippetPath).push().key
    const newGroupSnippet = {name: groupName} //The member count is handled by cloud functions

    const updates = {}
    for (const uid in selectedUsers) {
      updates[`${baseInfoPath}/${newKey}/memberSnippets/${uid}`] = selectedUsers[uid]
      updates[`${baseInfoPath}/${newKey}/memberUids/${uid}`] = true
    }
    updates[`${baseSnippetPath}/${newKey}`] = newGroupSnippet

    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => console.log("Name the new friend group!!"))
      .catch((err) => logError(err));
    this.props.navigation.goBack()
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  search = () => {
    this.setState({
      attemptedQuery: this.state.query, 
      searchGeneration: this.state.searchGeneration + 1
    })
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {[styles.listElement, {backgroundColor: this.state.selectedUsers[item.uid] ? "lightgreen" : "white"}]}
        onPress={() => this.toggleSelection(item)}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.name}</Text>
            <Text>{item.uid}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  toggleSelection = (snippet) => {
    const copiedObj = {...this.state.selectedUsers}
    if (copiedObj[snippet.uid]){
      //Then remove the user
      delete copiedObj[snippet.uid]
    }else{
      //Add the user
      const {uid, ...snippetSansUid} = snippet
      copiedObj[snippet.uid] = snippetSansUid
    }
    this.setState({selectedUsers: copiedObj});
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
  newGroupButton: {
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "mediumseagreen",
    width: "100%", 
    height: 50,
    flexDirection: 'row'
  },
})