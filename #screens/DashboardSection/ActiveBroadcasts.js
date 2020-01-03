import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import DynamicInfiniteScroll from '../../#reusableComponents/DynamicInfiniteScroll'
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth'

import { epochToDateString } from '../../#constants/helpers';

export default class ActiveBroadcasts extends React.Component {

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
            dbref = {database().ref(`/activeBroadcasts/${auth().currentUser.uid}`)}
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
          />



          <TouchableOpacity 
              style = {styles.newBroadcastButton}
              onPress={() => this.props.navigation.navigate('NewBroadcastForm')}>
              <AwesomeIcon name= "plus" size={18} color= "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> CREATE NEW BROADCAST</Text>
          </TouchableOpacity>
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
        style = {styles.listElement}>
        <Text>TTL: {epochToDateString(item.deathTimestamp)}</Text>
        <Text>{item.ownerUid}</Text>
        <Text>{item.uid}</Text>
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
    height: 40,
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})