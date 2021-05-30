import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { Overlay } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import ContactsRecommendations from 'reusables/ContactsRecommendationsList';
import { RecipientListElement } from 'reusables/ListElements';
import MutualFriendsList from 'reusables/MutualFriendsList';
import { MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import SectionInfiniteScroll from 'reusables/SectionInfiniteScroll'
import FriendReqModal from 'screens/SocialSection/FriendReqModal';
import mainTheme from 'styling/mainTheme';
import GroupJoinDialogue from 'screens/SocialSection/UserGroups/GroupJoinDialogue'

export default class ExplorePage extends React.Component {

  constructor(props) {
    super(props)

    this.userUid = auth().currentUser.uid
    this.dbRef = [
      { title: "GROUPS YOU'RE IN", ref: database().ref(`/userGroupMemberships/${this.userUid}`), orderBy: ["nameQuery"] },
      { title: "YOUR FRIENDS", ref: database().ref(`/userFriendGroupings/${this.userUid}/_masterSnippets`), orderBy: ["displayNameQuery", "usernameQuery"] },
      { title: "USERS", ref: database().ref("/userSnippets"), orderBy: ["displayNameQuery", "usernameQuery"] },
      { title: "PUBLIC GROUPS", ref: database().ref("/publicGroupSnippets"), orderBy: ["nameQuery"] }
    ]

    this.footerButtons = [
      [
        { text: "+ New Group", func: () => { this.props.navigation.navigate('GroupMemberAdder') } },
        { text: "+ Join Group via Code", func: () => this.setState({ isGroupModalVisible: true, selectedPublicGroup: null }) }
      ],
      [{ text: "+ Invite Contacts", func: () => { this.props.navigation.navigate('InviteContacts') } }]
    ]

    this.dbRefShortened = [this.dbRef[0], this.dbRef[3]]
    this.footerButtonsShortened = [this.footerButtons[0]]
  }


  state = {
    isGroupModalVisible: false,
    selectedPublicGroup: null
  }

  static navigationOptions = {
    headerShown: false,
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: mainTheme.colors.primary, width: "100%" }}>
        <View style={{ flex: 1, backgroundColor: "white", width: "100%" }}>

          <Overlay isVisible={this.state.isGroupModalVisible}>
            <View>
              <GroupJoinDialogue
                groupSnippet={this.state.selectedPublicGroup}
                joinSuccessFunction={() => {
                  this.showDelayedSnackbar("Join Successful!")
                  this.setState({ isGroupModalVisible: false })
                }} />
              <MinorActionButton
                title="Close"
                onPress={() => this.setState({ isGroupModalVisible: false })} />
            </View>
          </Overlay>

          <FriendReqModal
            ref={modal => this.friendRequestModal = modal} />

          <SearchableInfiniteScroll
            type="section"
            queryValidator={(query) => query.length > 0}
            queryTypes={[{ name: "Name", value: "nameQuery" }]} //TODO: clean up SearchableInfiniteScroll to get this removed
            renderItem={this.itemRenderer}
            dbref={this.dbRef}
            additionalData={this.footerButtons}
            searchbarPlaceholder="Search for Users, Friends and Groups"
            sectionSorter={(a, b) => a.data.length > b.data.length ? -1 : 1}
            parentEmptyStateComponent={
              <SectionInfiniteScroll
                renderItem={this.itemRenderer}
                dbref={this.dbRefShortened}
                onSectionData={null}
                additionalData={this.footerButtonsShortened}
                ListHeaderComponent={this.renderFriendRecommendations}
              />
            }
          />
        </View>
      </SafeAreaView>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <View style={{ alignItems: "center", width: "100%", flexDirection: "row" }}>
        <RecipientListElement
          style={{ flex: 1 }}
          snippet={item}
          groupInfo={item}
          // If it's a user, open modal, otherwise go to group page.
          // TODO: If we wanna return events and other stuff too, we might want to make this more generic
          onPress={() => this.navigateSearchElement(item)}
          imageDiameter={24}
        >
        </RecipientListElement>
      </View>
    );
  }

  navigateSearchElement = (item) => {
    if (item.displayName) {   // if user
      this.friendRequestModal.openUsingSnippet(item)
    } else if (!item.isPublic) { // if a group the user is a part of
      this.props.navigation.navigate('GroupViewer', { group: item })
    } else { //Then its a public group
      this.setState({ isGroupModalVisible: true, selectedPublicGroup: item })
    }
  }

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

  renderFriendRecommendations = () => {
    return (
      <View>
        <MutualFriendsList />
        <ContactsRecommendations />
      </View>
    )
  }
}