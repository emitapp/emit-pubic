import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { ButtonGroup, Text } from 'react-native-elements';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import UserSnippetListElement from 'reusables/UserSnippetListElement';
import S from 'styling';
import { epochToDateString, logError } from 'utils/helpers';
import FriendReqModal from './FriendReqModal';


export default class UserSearch extends React.Component {

  constructor(props){
    super(props)
    this.INBOX_INDEX = 0
    this.OUTBOX_INDEX = 1
    this.state = { 
      boxIndex: this.INBOX_INDEX,
      errorMessage: null, 
      searchGeneration: 0, 
      isModalVisible: false,
    }
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>


        <FriendReqModal 
          ref={modal => this.modal = modal} /> 

        <ButtonGroup
          onPress={this.toggleBox}
          selectedIndex={this.state.boxIndex}
          buttons={["Inbox", "Outbox"]}
        />

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}


            <DynamicInfiniteScroll
              chunkSize = {10}
              errorHandler = {this.scrollErrorHandler}
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              dbref = {this.getRef().orderByChild("timestamp")}
              ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
              emptyStateComponent = {
                <EmptyState 
                  title = "It's all clear!" 
                  message = {`You have no friend requests in your ${this.state.boxIndex ? "outbox" : "inbox"}.`}
                />
              }
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
      <UserSnippetListElement 
      snippet={item} 
      onPress={() => this.modal.open(item)}
      extraComponents={<Text>Date sent: {epochToDateString(item.timestamp)}</Text>} />
    );
  }

  getRef = () => {
    if (this.state.boxIndex === this.INBOX_INDEX)
        return database().ref(`/friendRequests/${auth().currentUser.uid}/inbox`)
    else
        return database().ref(`/friendRequests/${auth().currentUser.uid}/outbox`)
  }

  toggleBox = (selectedIndex) => {
    if (this.state.boxIndex != selectedIndex){
        this.setState({
            boxIndex: selectedIndex, 
            searchGeneration: this.state.searchGeneration + 1
        })
    }
  }

}