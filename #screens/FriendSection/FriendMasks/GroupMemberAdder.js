import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';



export default class NewGroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = { 
      errorMessage: null, 
      selectedUsers: {},
      groupName: this.groupSnippet ? this.groupSnippet.name : ""
    }
  }


  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        {!this.groupSnippet ? (
          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Enter your group's name"
            onChangeText={groupName => this.setState({ groupName })}
            value={this.state.groupName}
          />
        ) : (
          <Text>{this.state.groupName}</Text>
        )}
              

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


        <BannerButton
          color = {S.colors.buttonGreen}
          onPress={this.createOrEditGroup}
          iconName = {S.strings.add}
          title = {this.groupSnippet ? "ADD" : "CREATE"}
        />

      </View>
    )
  }

  createOrEditGroup = () => {
    const {selectedUsers, groupName} = this.state
    const memberCount = Object.keys(selectedUsers).length
    if (memberCount == 0 || isOnlyWhitespace(groupName)){
      console.log("No cigar, my friend")
    }
    const baseSnippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets`
    const baseInfoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details`
    const groupUid = this.groupSnippet? this.groupSnippet.uid : database().ref(baseSnippetPath).push().key

    const updates = {}
    for (const uid in selectedUsers) {
      updates[`${baseInfoPath}/${groupUid}/memberSnippets/${uid}`] = selectedUsers[uid]
      updates[`${baseInfoPath}/${groupUid}/memberUids/${uid}`] = true
    }

    //The member count is handled by cloud functions
    if (!this.groupSnippet) updates[`${baseSnippetPath}/${groupUid}`] = {name: groupName}

    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => console.log("createOrEditGroup success!!"))
      .catch((err) => logError(err));
    this.props.navigation.goBack()
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {[S.styles.listElement, {backgroundColor: this.state.selectedUsers[item.uid] ? "lightgreen" : "white"}]}
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