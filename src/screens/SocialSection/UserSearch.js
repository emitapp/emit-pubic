import database from '@react-native-firebase/database';
import React from 'react';
import { Text, View } from 'react-native';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import {UserSnippetListElement} from 'reusables/ListElements';
import S from 'styling';
import { logError } from 'utils/helpers';
import FriendReqModal from './FriendReqModal';
import ErrorMessageText from 'reusables/ErrorMessageText';

export default class UserSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "User Search",    
    };
  };

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <FriendReqModal 
          ref={modal => this.modal = modal} />

        <ErrorMessageText message = {this.state.errorMessage} />


        <SearchableInfiniteScroll
          type = "static"
          queryValidator = {(query) => query.length > 0}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          renderItem = {this.itemRenderer}
          dbref = {database().ref("/userSnippets")}
        />

      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement 
      snippet={item} 
      onPress={() => this.modal.open(item)}/>
    );
  }
}