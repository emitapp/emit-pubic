import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Button, Overlay, Text } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import DymanicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import { UserGroupListElement } from 'reusables/ListElements';
import { BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import GroupJoinDialogue from 'screens/SocialSection/UserGroups/GroupJoinDialogue'

export default class GroupSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Group Search",
      headerBackTitle: null, //Because the Group management screens use ScrollableHeaders
    };
  };

  state = {
    isModalVisible: false,
    selectedPublicGroup: null
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <Overlay isVisible={this.state.isModalVisible}>
          <View>
            <GroupJoinDialogue
              groupSnippet={this.state.selectedPublicGroup}
              joinSuccessFunction={() => {
                this.showDelayedSnackbar("Join Successful!")
                this.setState({ isModalVisible: false })
              }} />

            <MinorActionButton
              title="Close"
              onPress={() => this.setState({ isModalVisible: false })} />
          </View>
        </Overlay>

        <SearchableInfiniteScroll
          type="static"
          queryValidator={(query) => query.length > 1}
          parentEmptyStateComponent={
            <DymanicInfiniteScroll
              renderItem={this.itemRenderer}
              dbref={database().ref(`/userGroupMemberships/${userUid}`).orderByChild("queryName")}
              ListHeaderComponent={
                <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18, flex: 1 }}>
                  Your Groups
                </Text>
              }
            />
          }
          searchbarPlaceholder="Search Your Groups or Public Groups"
          queryTypes={[{ name: "Name", value: "nameQuery" }]}
          renderItem={this.publicGroupRenderer}
          dbref={database().ref("/publicGroupSnippets")}
        />

        <Button
          title="Join Group via invite code"
          onPress={() => this.setState({ isModalVisible: true, selectedPublicGroup: null })} />

        <BannerButton
          onPress={() => this.props.navigation.navigate('GroupMemberAdder')}
          title="CREATE NEW GROUP"
          iconName={S.strings.add}
        />

      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserGroupListElement
        groupInfo={item}
        onPress={() => this.props.navigation.navigate('GroupViewer', { group: item })}
      />
    );
  }

  publicGroupRenderer = ({ item }) => {
    return (
      <UserGroupListElement
        groupInfo={item}
        onPress={() => this.setState({ isModalVisible: true, selectedPublicGroup: item })}
      />
    );
  }

  //There are modals being opened and closed on this screen, and if I close a modal
  //and then show the snackbar, the snackbar might be attached to the modal that was jsut in 
  //the process of being removed, meaning the snackbar will never be displayed. 
  //So, I use a small timeout to give the snackbar a bit of a delay
  //https://github.com/cooperka/react-native-snackbar/issues/67
  showDelayedSnackbar = (message) => {
    setTimeout(
      () => {
        Snackbar.show({
          text: message,
          duration: Snackbar.LENGTH_SHORT
        });
      },
      150
    )
  }
}