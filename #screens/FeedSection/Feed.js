import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import DynamicInfiniteScroll from '../../#reusableComponents/DynamicInfiniteScroll'
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth'

import { epochToDateString } from '../../#constants/helpers';

export default class Feed extends React.Component {

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={styles.container}>

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

          <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
            chunkSize = {10}
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {database().ref(`/feeds/${auth().currentUser.uid}`)}
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
        onPress = {() => this.props.navigation.navigate('BroadcastViewer', {ownerSnippet: item.owner, broadcast: item.uid}) }>
        <Text>Dies at: {epochToDateString(item.deathTimestamp)}</Text>
        <Text>Location: {item.location}</Text>
        <Text>Owner name: {item.owner.name}</Text>
        <Text>Owner uid: {item.owner.uid}</Text>
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
  newBroadcastButton: {
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "mediumseagreen",
    width: "100%", 
    height: 50,
    flexDirection: 'row'
  },
  listElement: {
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})