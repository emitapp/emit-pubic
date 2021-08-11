//TODO: remove this screen once Search hub gets filtering
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import SearchableInfiniteScroll from 'reusables/lists/SearchableInfiniteScroll';
import { UserSnippetListElement } from 'reusables/ListElements';
import S from 'styling';
import { Text, Button } from "react-native-elements"
import FriendRequestPreviewer from '../SocialSection/FriendRequestPreviewer'
import FriendReqModal from '../../components/FriendReqModal';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import DymanicInfiniteScroll from 'reusables/lists/DynamicInfiniteScroll';
import EmptyState from 'reusables/ui/EmptyState';
import Icon from 'react-native-vector-icons/Ionicons';


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

                  <View style={{ flexDirection: "column", alignItems: "center" }}>
                    <Button
                      containerStyle={{ marginHorizontal: 16 }}
                      onPress={() => { this.props.navigation.navigate("InviteContacts") }}
                      title="Invite Contacts"
                      accessibilityLabel="Invite contacts to Bitup" />
                    <Text style={{
                      textAlign: "center", fontSize: 16, flex: 1,
                      color: "grey", marginTop: 8, paddingVertical: 4, borderTopColor: "lightgrey",
                      borderTopWidth: 1, width: "100%"
                    }}>
                      Your Friends
                    </Text>
                  </View>

                </View>
              }
              emptyStateComponent={
                <EmptyState
                  image =  {
                    <Icon name="ios-people" size={50} color="grey" />
                  }
                  title="Your friends will show up here!"
                  message="Invite some of your contacts onto Emit, or search for some existing users."
                />
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
        onPress={() => this.modal.openUsingSnippet(item)} />
    );
  }
}