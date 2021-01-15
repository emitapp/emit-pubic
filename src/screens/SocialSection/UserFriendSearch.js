import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import { UserSnippetListElement } from 'reusables/ListElements';
import S from 'styling';
import { Text } from "react-native-elements"
import FriendRequestPreviewer from './FriendRequestPreviewer'
import FriendReqModal from './FriendReqModal';
import ErrorMessageText from 'reusables/ErrorMessageText';
import StaticInfiniteScroll from 'reusables/StaticInfiniteScroll';

export default class UserFriendSearch extends React.Component {

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

        <ErrorMessageText message={this.state.errorMessage} />

        <SearchableInfiniteScroll
          type="static"
          queryValidator={(query) => query.length > 0}
          parentEmptyStateComponent={
            <StaticInfiniteScroll
              renderItem={this.itemRenderer}
              dbref={database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
              orderBy="username"
              ListHeaderComponent={
                <View>
                  <FriendRequestPreviewer />
                  <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18 }}>
                    Your Friends
                  </Text>
                </View>

              }
            />
          }
          searchbarPlaceholder="Search for Biteup users"
          queryTypes={[{ name: "Display Name", value: "displayNameQuery" }, { name: "Username", value: "usernameQuery" }]}
          renderItem={this.itemRenderer}
          dbref={database().ref("/userSnippets")}
        />

      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement
        snippet={item}
        onPress={() => this.modal.open(item)} />
    );
  }
}