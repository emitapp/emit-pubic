import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll'
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';


import { logError } from 'utils/helpers';

export default class FriendGroupSearch extends React.Component {

  state = { 
    errorMessage: null, 
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={styles.container}>

        <Text>Friend Group Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/snippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />


        <TouchableOpacity 
            style = {styles.newGroupButton}
            onPress={() => this.props.navigation.navigate('GroupMemberAdder')}>
            <AwesomeIcon name= "plus" size={18} color= "white" />
            <Text style = {{color: "white", fontWeight: "bold"}}> CREATE NEW MASK</Text>
        </TouchableOpacity>

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
        onPress = {() => this.props.navigation.navigate('GroupViewer', {group: item}) }>
            <Text>{item.name}</Text>
            <Text>Member count: {item.memberCount}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  newGroupButton: {
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "mediumseagreen",
    width: "100%", 
    height: 50,
    flexDirection: 'row'
  },
})