import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import { UserSnippetListElement } from 'reusables/ListElements';
import S from 'styling';
import { Text, Button } from "react-native-elements"
import FriendRequestPreviewer from './FriendRequestPreviewer'
import FriendReqModal from './FriendReqModal';
import ErrorMessageText from 'reusables/ErrorMessageText';
import DymanicInfiniteScroll from 'reusables/DynamicInfiniteScroll';

export default class UserFriendSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "User Search",
    };
  };

  state = {
    errorMessage: null,
    isModalVisible: false,
  }


  componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      //Look into forcedUpdateRef definiton to learn why we're using this
      if (this.friendReqPreviewer) this.friendReqPreviewer.forcedUpdateRef()
    });
  }

  componentWillUnmount() {
    this.focusListener.remove();
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
            <DymanicInfiniteScroll
              renderItem={this.itemRenderer}
              dbref={database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`).orderByChild("username")}
              ListHeaderComponent={
                <View>
                  <FriendRequestPreviewer
                    ref={ref => this.friendReqPreviewer = ref}
                    style={{ borderColor: "lightgrey", borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, marginBottom: 8 }} />

                  <View style = {{flexDirection: "row", alignItems: "center"}}>
                    <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18, flex: 1 }}>
                      Your Friends
                    </Text>
                    <Button
                      containerStyle = {{marginHorizontal: 16}}
                      onPress={() => { this.props.navigation.navigate("InviteContacts") }}
                      title="Invite Contacts"
                      accessibilityLabel="Invite contacts to Bitup" />
                  </View>


                </View>
              }
            />
          }
          searchbarPlaceholder="Search for Emit users"
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