import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { BannerButton } from 'reusables/ReusableButtons';
import { UserSnippetListElement } from 'reusables/ListElements';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';
import {Text, Input, CheckBox} from 'react-native-elements'


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
          <Input
            autoCapitalize="none"
            label="Enter your mask's name"
            placeholder = "Best group name ever"
            onChangeText={maskName => this.setState({ maskName })}
            value={this.state.maskName}
          />
        ) : (
          <Text h4>{this.state.maskName}</Text>
        )}
              

        <Text style = {{fontWeight: "bold"}}>Select the people you want to add</Text>

        {Object.keys(this.state.selectedUsers).length != 0 && 
          <Text style = {{textAlign: "center", marginTop: 8}}>
            Adding {Object.values(this.state.selectedUsers).map(({username}) => `@${username} `)}
          </Text>
        }

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
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
      <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
        <UserSnippetListElement 
          style = {{flex: 1}}
          snippet={item} 
          onPress={() => this.toggleSelection(item)}
        />
        {this.state.selectedUsers[item.uid] && <CheckBox checked = {true} /> }
      </View>
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