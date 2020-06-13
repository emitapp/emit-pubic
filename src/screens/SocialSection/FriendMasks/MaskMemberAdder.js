import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { BannerButton } from 'reusables/ReusableButtons';
import { UserSnippetListElement } from 'reusables/ListElements';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import {Text, Input, CheckBox} from 'react-native-elements'
import {ScrollingHeader} from "reusables/Header"
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import Snackbar from 'react-native-snackbar';

export default class NewMaskScreen extends React.Component {

  constructor(props){
    super(props)
    this.maskSnippet = this.props.navigation.getParam('mask', null)
    this.state = { 
      errorMessage: null, 
      selectedUsers: {},
      maskName: this.maskSnippet ? this.maskSnippet.name : "",
      isModalVisible: false
    }
  }

  static navigationOptions = ({ navigation }) => {
    let title = ""
    let mask = navigation.state?.params?.mask
    if (mask) title = mask.name
    else title = "New Mask"
    return ScrollingHeader(title)
  };

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

      <DefaultLoadingModal isVisible={this.state.isModalVisible} />

      {this.state.errorMessage != null &&
        <Text style={{ color: 'red' }}>
          {this.state.errorMessage}
        </Text>}

        {!this.maskSnippet && 
          <Input
            autoCapitalize="none"
            label="Enter your mask's name"
            placeholder = "Best mask name ever"
            onChangeText={maskName => this.setState({ maskName })}
            value={this.state.maskName}
          />}
              

        <Text style = {{fontWeight: "bold"}}>
          Select the people you want to add to
          {this.maskSnippet ? (" " + this.maskSnippet.name) : " this new mask"}
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

  createOrEditMask = async () => {
    try{
      const {selectedUsers, maskName} = this.state
      const memberCount = Object.keys(selectedUsers).length
      if (memberCount == 0){
        Snackbar.show({
          text: "You havent selected any people to add!", 
          duration: Snackbar.LENGTH_SHORT
        });
        return;
      }
  
      if (isOnlyWhitespace(maskName)){
        Snackbar.show({
          text: "Invalid name", 
          duration: Snackbar.LENGTH_SHORT
        });
        return;
      }

      this.setState({isModalVisible: true})

      let selectedUserUids = {}
      for (const uid in this.state.selectedUsers) {
        selectedUserUids[uid] = true
      }    
      const cloudFunc = functions().httpsCallable('createOrEditMask')
      await timedPromise(cloudFunc({
        maskUid: this.maskSnippet ? this.maskSnippet.uid : null,
        newName: this.state.maskName, 
        usersToAdd: selectedUserUids
      }), LONG_TIMEOUT);

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