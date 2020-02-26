import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError, LONG_TIMEOUT, timedPromise, isOnlyWhitespace } from 'utils/helpers';


export default class NewGroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = { 
      errorMessage: null, 
      selectedUserUids: {},
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      isModalVisible: false
    }
  }


  render() {
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
              

        <Text>ADD USERS</Text>

        <Text>{Object.keys(this.state.selectedUserUids).map((uid) => `${uid}  `)}</Text>

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}, {name: "Email", value: "email"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref("/userSnippets")}
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

  createOrEditGroup = async () => {
    if (isOnlyWhitespace(this.state.groupName)){
      console.log("No cigar, my friend")
      return;
    }
    this.setState({isModalVisible: true})
    try{
      if (!this.groupSnippet){
        const cloudFunc = functions().httpsCallable('createGroup')
        await timedPromise(cloudFunc({
          name: this.state.groupName, 
          usersToAdd: this.state.selectedUserUids
        }), LONG_TIMEOUT);
      }else{
        const cloudFunc = functions().httpsCallable('editGroup')
        await timedPromise(cloudFunc({
          groupUid: this.groupSnippet.uid,
          usersToAdd: this.state.selectedUserUids
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
      <TouchableOpacity 
        style = {[S.styles.listElement, {backgroundColor: this.state.selectedUserUids[item.uid] ? "lightgreen" : "white"}]}
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
    const copiedObj = {...this.state.selectedUserUids}
    if (copiedObj[snippet.uid]){
      //Then remove the user
      delete copiedObj[snippet.uid]
    }else{
      //Add the user
      copiedObj[snippet.uid] = true
    }
    this.setState({selectedUserUids: copiedObj});
  }
}