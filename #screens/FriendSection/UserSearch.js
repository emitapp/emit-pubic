import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import StaticInfiniteScroll from '../../#reusableComponents/StaticInfiniteScroll'
import database from '@react-native-firebase/database';
import AddFriendDialogue from './AddFriendDialogue';

import Modal from "react-native-modal";

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
    return (
      <View style={styles.container}>

        <Modal 
          isVisible={this.state.isModalVisible}
          style = {{justifyContent: "center", alignItems: "center"}}
          animationIn = "fadeInUp"
          animationOut = 'fadeOutUp'
          animationOutTiming = {0}
        >
          <AddFriendDialogue 
            selectedUser = {this.state.selectedUser}
            closeFunction={() => this.setState({ isModalVisible: false })}
          />
        </Modal>

        <Text>User Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Search using a user's email"
          onChangeText={query => this.setState({ query })}
          value={this.state.query}
        />

        <Button title="Search" onPress={this.search} />

        {(this.state.attemptedQuery.length < 1) ? (
            <Text>Try to find users with a long enough query</Text>
        ) : (
            <StaticInfiniteScroll style = {{width: "100%"}}
              chunkSize = {10}
              errorHandler = {this.scrollErrorHandler}
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              orderBy = "name"
              dbref = {database().ref("/userSnippets").orderByChild("name")}
              startingPoint = {this.state.attemptedQuery}
              endingPoint = {`${this.state.attemptedQuery}\uf8ff`}
              ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            />
        )}

      </View>
    )
  }


  scrollErrorHandler = (err) => {
    console.log(err)
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
        onPress={() => this.toggleModal(item)}
      >
        <Text>{item.name}</Text>
        <Text>{item.uid}</Text>
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
    height: 40,
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})