import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, View } from 'react-native';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import {UserSnippetListElement} from 'reusables/ListElements';
import S from 'styling';
import { logError } from 'utils/helpers';
import FriendReqModal from './FriendReqModal';
import ErrorMessageText from 'reusables/ErrorMessageText';

export default class FriendSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Friend Search",    
    };
  };

  state = { 
    errorMessage: null, 
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <FriendReqModal 
          ref={modal => this.modal = modal} />

          <ErrorMessageText message = {this.state.errorMessage} />


        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
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
      onPress={() => this.modal.open(item)}/>
    );
  }
}