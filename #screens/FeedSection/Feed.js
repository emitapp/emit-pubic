import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import S from 'styling';
import { epochToDateString, logError } from 'utils/helpers';



export default class Feed extends React.Component {

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.container}>

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
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {S.styles.listElement}
        onPress = {() => this.props.navigation.navigate('BroadcastViewer', {broadcast: item}) }>
          <View>
            <ProfilePicDisplayer diameter = {30} uid = {item.owner.uid} style = {{marginRight: 10}} />
            <Text>{item.owner.name}</Text>
          </View>
          <View style={{marginHorizontal: 8}}>
            <Text>Dies at: {epochToDateString(item.deathTimestamp)}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Owner uid: {item.owner.uid}</Text>
            {item.status &&  <Text>Status: {item.status}</Text>}
            {item.groupInfo &&  <Text>Sent via {item.groupInfo.name} group</Text>}
          </View>
      </TouchableOpacity>
    );
  }

}