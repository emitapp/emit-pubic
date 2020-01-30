import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import StaticInfiniteScroll from '../../#reusableComponents/StaticInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

import FriendReqDialogue from './FriendReqDialogue';
import Modal from "react-native-modal";
import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError } from '../../#constants/helpers';

export default class UserSearch extends React.Component {

  state = { 
    query: '', 
    attemptedQuery: '', 
    errorMessage: null, 
    searchGeneration: 0, 
    isModalVisible: false,
    selectedUser: null
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={styles.container}>

        <Modal 
          isVisible={this.state.isModalVisible}
          style = {{justifyContent: "center", alignItems: "center"}}
          animationIn = "fadeInUp"
          animationOut = 'fadeOutUp'
          animationOutTiming = {0}
        >
          <FriendReqDialogue 
            selectedUserData = {this.state.selectedUser}
            closeFunction={() => this.setState({ isModalVisible: false })}
          />
        </Modal>

        <Text>Friend Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Search using a friend's name"
          onChangeText={query => this.setState({ query })}
          value={this.state.query}
        />

        <Button title="Search" onPress={this.search} />

        <StaticInfiniteScroll style = {{width: "100%"}}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          generation = {this.state.searchGeneration}
          orderBy = "name"
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`).orderByChild("name")}
          startingPoint = {this.state.attemptedQuery}
          endingPoint = {`${this.state.attemptedQuery}\uf8ff`}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />

      </View>
    )
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
        style = {styles.listElement}
        onPress={() => this.toggleModal(item)}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.name}</Text>
            <Text>{item.uid}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  toggleModal = (selectedUser) => {
    this.setState({ isModalVisible: true, selectedUser});
  };
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
    backgroundColor: 'ghostwhite',
    paddingVertical: 5,
    alignItems: "center",
    flexDirection: 'row',
    marginLeft: 10,
    marginRight: 10
  }
})