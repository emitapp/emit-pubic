import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';


export default class NewMaskScreen extends React.Component {

  constructor(props){
    super(props)
    this.maskSnippet = this.props.navigation.getParam('mask', null)
    this.state = { 
      errorMessage: null, 
      selectedUsers: {},
      maskName: this.maskSnippet ? this.maskSnippet.name : ""
    }
  }


  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        {!this.maskSnippet ? (
          <TextInput
            style={S.styles.textInput}
            autoCapitalize="none"
            placeholder="Enter your mask's name"
            onChangeText={maskName => this.setState({ maskName })}
            value={this.state.maskName}
          />
        ) : (
          <Text>{this.state.maskName}</Text>
        )}
              

        <Text>ADD FRIENDS</Text>

        <Text>{Object.keys(this.state.selectedUsers).map((uid) => `${uid}  `)}</Text>

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />


        <BannerButton
          color = {S.colors.buttonGreen}
          onPress={this.createOrEditMask}
          iconName = {S.strings.add}
          title = {this.maskSnippet ? "ADD" : "CREATE"}
        />

      </View>
    )
  }

  createOrEditMask = () => {
    const {selectedUsers, maskName} = this.state
    const memberCount = Object.keys(selectedUsers).length
    if (memberCount == 0 || isOnlyWhitespace(maskName)){
      console.log("No cigar, my friend")
      return;
    }
    const baseSnippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets`
    const baseInfoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details`
    const maskUid = this.maskSnippet? this.maskSnippet.uid : database().ref(baseSnippetPath).push().key

    const updates = {}
    for (const uid in selectedUsers) {
      updates[`${baseInfoPath}/${maskUid}/memberSnippets/${uid}`] = selectedUsers[uid]
      updates[`${baseInfoPath}/${maskUid}/memberUids/${uid}`] = true
    }

    //The member count is handled by cloud functions
    if (!this.maskSnippet) updates[`${baseSnippetPath}/${maskUid}`] = {name: maskName}

    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => console.log("createOrEditMask success!!"))
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
            <Text>{item.displayName}</Text>
            <Text>@{item.username}</Text>
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