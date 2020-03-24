import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from "react-native-modal";
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import S from 'styling';
import { epochToDateString, logError } from 'utils/helpers';
import FriendReqDialogue from './FriendReqDialogue';
import UserSnippetListElement from 'reusables/UserSnippetListElement'


export default class UserSearch extends React.Component {

  state = { 
    displayingInbox: true,
    errorMessage: null, 
    searchGeneration: 0, 
    isModalVisible: false,
    selectedUser: null
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
          <FriendReqDialogue 
            selectedUserData = {this.state.selectedUser}
            closeFunction={() => this.setState({ isModalVisible: false })}
          />
        </Modal>

        <View style = {{width: "100%", height: 30, flexDirection: 'row'}}>
            <TouchableOpacity 
                style = {this.state.displayingInbox ? styles.selectedTab : styles.dormantTab}
                onPress={() => this.toggleBox(true)}>
                <Text>INBOX</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style = {!this.state.displayingInbox ? styles.selectedTab : styles.dormantTab}
                onPress={() => this.toggleBox(false)}>
                <Text>OUTBOX</Text>
            </TouchableOpacity>
        </View>

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}


            <DynamicInfiniteScroll style = {{width: "100%"}}
              chunkSize = {10}
              errorHandler = {this.scrollErrorHandler}
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              dbref = {this.getRef().orderByChild("timestamp")}
              ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            />
      </View>
    )
  }


  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement 
      snippet={item} 
      onPress={() => this.toggleModal(item)}
      extraComponents={<Text>Date sent: {epochToDateString(item.timestamp)}</Text>} />
    );
  }

  toggleModal = (selectedUser) => {
    this.setState({ isModalVisible: true, selectedUser});
  }

  getRef = () => {
    if (this.state.displayingInbox)
        return database().ref(`/friendRequests/${auth().currentUser.uid}/inbox`)
    else
        return database().ref(`/friendRequests/${auth().currentUser.uid}/outbox`)
  }

  toggleBox = (shouldDisplayInbox) => {
    if (this.state.displayingInbox != shouldDisplayInbox){
        this.setState({
            displayingInbox: shouldDisplayInbox, 
            searchGeneration: this.state.searchGeneration + 1
        })
    }
  }

}

const styles = StyleSheet.create({
  selectedTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "dodgerblue"
  },
  dormantTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "grey"
  }
})