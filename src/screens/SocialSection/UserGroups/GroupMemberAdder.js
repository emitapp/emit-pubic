import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { BannerButton } from 'reusables/ReusableButtons';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import {Text, Input, CheckBox} from 'react-native-elements'



export default class NewGroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = { 
      errorMessage: null, 
      selectedUsers: {},
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      isModalVisible: false
    }
  }


  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <DefaultLoadingModal isVisible={this.state.isModalVisible} />

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        {!this.groupSnippet && 
          <Input
            autoCapitalize="none"
            label="Enter your grops's name"
            placeholder = "Best group name ever"
            onChangeText={groupName => this.setState({ groupName })}
            value={this.state.groupName}
          />}
        
        <Text style = {{fontWeight: "bold"}}>
          Select the people you want to add to
          {this.groupSnippet ? (" " + this.groupSnippet.name) : " this new group"}
        </Text>

            <ScrollView 
              style = {{maxHeight: 55, width: "100%"}}>
              {Object.keys(this.state.selectedUsers).length != 0 && 
                <Text style = {{textAlign: "center", marginTop: 8}}>
                  Adding {Object.values(this.state.selectedUsers).map(({username}) => `@${username} `)}
                </Text>
              }
            </ScrollView>

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref("/userSnippets")}
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

  createOrEditGroup = async () => {
    if (isOnlyWhitespace(this.state.groupName)){
      console.log("No cigar, my friend")
      return;
    }
    this.setState({isModalVisible: true})
    let selectedUserUids = {}
    for (const uid in this.state.selectedUsers) {
      selectedUserUids[uid] = true
    }
    try{
      if (!this.groupSnippet){
        const cloudFunc = functions().httpsCallable('createGroup')
        await timedPromise(cloudFunc({
          name: this.state.groupName, 
          usersToAdd: selectedUserUids
        }), LONG_TIMEOUT);
      }else{
        const cloudFunc = functions().httpsCallable('editGroup')
        await timedPromise(cloudFunc({
          groupUid: this.groupSnippet.uid,
          usersToAdd: selectedUserUids
        }), LONG_TIMEOUT);
      }
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
    return (
      <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
        <UserSnippetListElement 
          style = {{flex: 1}}
          snippet={item} 
          onPress={() => this.toggleSelection(item)}
          imageDiameter = {45}
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