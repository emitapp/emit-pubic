import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import DynamicInfiniteScroll from '../../#reusableComponents/DynamicInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth'
import FriendReqDialogue from './FriendReqDialogue';

import Modal from "react-native-modal";
import { epochToDateString } from '../../#constants/helpers';

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
      <View style={styles.container}>

        <Modal 
          isVisible={this.state.isModalVisible}
          style = {{justifyContent: "center", alignItems: "center"}}
          animationIn = "fadeInUp"
          animationOut = 'fadeOutUp'
          animationOutTiming = {0}>
          <FriendReqDialogue 
            selectedUser = {this.state.selectedUser}
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
    console.log(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {styles.listElement}
        onPress={() => this.toggleModal(item)}>
        <Text>Date sent: {epochToDateString(item.timestamp)}</Text>
        <Text>{item.name}</Text>
        <Text>{item.uid}</Text>
      </TouchableOpacity>
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
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
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
  },
  listElement: {
    height: 40,
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})