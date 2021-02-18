import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View, Image } from 'react-native';
import { ButtonGroup, Text } from 'react-native-elements';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import {UserSnippetListElement} from 'reusables/ListElements';
import S from 'styling';
import { epochToDateString } from 'utils/helpers';
import FriendReqModal from './FriendReqModal';
import ErrorMessageText from 'reusables/ErrorMessageText';


export default class FriendReqBoxes extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Friend Requests",    
    };
  };

  constructor(props){
    super(props)
    this.INBOX_INDEX = 0
    this.OUTBOX_INDEX = 1
    this.state = { 
      boxIndex: this.props.navigation.getParam('outbox', false) ? this.OUTBOX_INDEX : this.INBOX_INDEX,
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
          buttons={["Requests you received", "Requests you sent"]}
        />

            <ErrorMessageText message = {this.state.errorMessage} />


            <DynamicInfiniteScroll
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              dbref = {this.getRef().orderByChild("timestamp")}
              emptyStateComponent = {
                <EmptyState 
                image =  {
                  <Image source={require('media/NoFriendReqs.png')} 
                  style = {{height: 80, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                  title = "It's all clear!" 
                  message = {`You have no friend requests in your ${this.state.boxIndex ? "outbox" : "inbox"}.`}
                />
              }
            />
      </View>
    )
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