import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import SearchableInfiniteScroll from '../../#reusableComponents/SearchableInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

import ProfilePicDisplayer from '../../#reusableComponents/ProfilePicDisplayer';
import { logError } from '../../#constants/helpers';

export default class NewGroupScreen extends React.Component {

  state = { 
    errorMessage: null, 
    selectedUsersUids: [],
    groupName: ""
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={styles.container}>

              
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Enter your group's name"
          onChangeText={groupName => this.setState({ groupName })}
          value={this.state.groupName}
        />

        <Text>ADD FRIENDS</Text>

        <Text>{this.state.selectedUsersUids.map((uid) => `${uid}  `)}</Text>

        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}, {name: "Email", value: "email"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
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
        style = {[styles.listElement, {backgroundColor: this.state.selectedUsersUids.includes(item.uid) ? "lightgreen" : "white"}]}
        onPress={() => this.toggleSelection(item)}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.name}</Text>
            <Text>{item.uid}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  toggleSelection = (item) => {
    const copiedArray = [...this.state.selectedUsersUids]
    if (copiedArray.includes(item.uid)){
      //Then remove the user
      const targetIndex = copiedArray.indexOf(item.uid)
      copiedArray.splice(targetIndex, 1)
    }else{
      //Add the user
      copiedArray.push(item.uid)
    }
    this.setState({selectedUsersUids: copiedArray});
  }
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
    paddingVertical: 5,
    alignItems: "center",
    flexDirection: 'row',
    marginLeft: 10,
    marginRight: 10
  }
})