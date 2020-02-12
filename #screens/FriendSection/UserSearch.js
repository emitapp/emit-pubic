import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import SearchableInfiniteScroll from '../../#reusableComponents/SearchableInfiniteScroll'
import database from '@react-native-firebase/database';
import FriendReqDialogue from './FriendReqDialogue';

import Modal from "react-native-modal";
import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError } from '../../#constants/helpers';

export default class UserSearch extends React.Component {

  state = { 
    errorMessage: null, 
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
          animationOutTiming = {0}
        >
          <FriendReqDialogue 
            selectedUserData = {this.state.selectedUser}
            closeFunction={() => this.setState({ isModalVisible: false })}
          />
        </Modal>

        <Text>User Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => query.length > 0}
          queryTypes = {[{name: "Name", value: "name"}, {name: "Email", value: "email"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref("/userSnippets")}
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
  }
})