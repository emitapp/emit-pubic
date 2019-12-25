import React from 'react'
import { StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native'
import StaticInfiniteScroll from '../../#reusableComponents/StaticInfiniteScroll'
import database from '@react-native-firebase/database';

//import Modal from "react-native-modal";

export default class UserSearch extends React.Component {

  state = { 
    query: '', 
    attemptedQuery: '', 
    errorMessage: null, 
    searchGeneration: 0, 
    isModalVisible: false
  }

  render() {
    return (
      <View style={styles.container}>

        <Modal 
          isVisible={this.state.isModalVisible}
          onBackdropPress={() => this.setState({ isVisible: false })}
        >
          <View style={{ flex: 1 }}>
            <Text>Hello!</Text>
            <Button title="Hide modal" onPress={this.toggleModal} />
          </View>
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
              errorHandler = {(err) => console.log(err)}
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              orderBy = "name"
              dbref = {database().ref("/testScrollingData/testScrollingData").orderByChild("name")}
              startingPoint = {this.state.attemptedQuery}
              endingPoint = {`${this.state.attemptedQuery}\uf8ff`}
              ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            />
        )}

      </View>
    )
  }

  search = () => {
    this.setState({attemptedQuery: this.state.query, searchGeneration: this.state.searchGeneration + 1})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {styles.listElement}
        onPress={this.toggleModal}
      >
        <Text>{item.name}</Text>
        <Text>{item.key}</Text>
      </TouchableOpacity>
    );
  }

  toggleModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
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