import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Overlay, Button } from 'react-native-elements';
import { RecipientListElement } from 'reusables/ListElements';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import FriendReqModal from 'screens/SocialSection/FriendReqModal';
import SectionInfiniteScroll from './SectionInfiniteScroll';
import FriendRequestPreviewer from 'screens/SocialSection/FriendRequestPreviewer'
import { GroupJoinDialogue } from 'screens/SocialSection/UserGroups/GroupSearch'
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import mainTheme from 'styling/mainTheme'

export default class SearchHub extends React.Component {

  constructor(props) { 
    super(props)

    this.userUid = auth().currentUser.uid
    this.dbRef = [{ title: "YOUR GROUPS", ref: database().ref(`/userGroupMemberships/${this.userUid}`), orderBy: ["nameQuery"] },
    { title: "YOUR FRIENDS", ref: database().ref(`/userFriendGroupings/${this.userUid}/_masterSnippets`), orderBy: ["displayNameQuery", "usernameQuery"]},
    { title: "USERS", ref: database().ref("/userSnippets"), orderBy: ["displayNameQuery", "usernameQuery"]},
    { title: "PUBLIC GROUPS", ref: database().ref("/publicGroupSnippets"), orderBy: ["nameQuery"]}]

    this.footerButtons = [{ text: "+ New Group", func: () => { this.props.navigation.navigate('GroupMemberAdder') } },
                            { text: "+ Invite Contacts", func: () => { this.props.navigation.navigate('InviteContacts') } }]
    this.rendererType = RecipientListElement
    this.dbRefShortened = this.dbRef.slice(0, 2)
  }

  static navigationOptions = {
    headerShown: false,
  }

  state = {
    isModalVisible: false,
    selectedPublicGroup: null
  }

  render() {
    return (
        <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
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

              <FriendReqModal
                ref={modal => this.modal = modal} />
              
              <SearchableInfiniteScroll
                type="section"
                queryValidator={(query) => query.length > 0}
                queryTypes={[{ name: "Name", value: "nameQuery" }]} //TODO: clean up SearchableInfiniteScroll to get this removed
                renderItem={this.itemRenderer}
                dbref={this.dbRef}
                additionalData={this.footerButtons}
                searchbarPlaceholder="Search"
                sectionSorter = {(a, b) => a.data.length > b.data.length ? -1 : 1}
                searchBarBuddy={
                  <TouchableOpacity
                    style={{ position: "relative", left: 8, top: 8}}
                    onPress={() => this.props.navigation.goBack()}
                    activeOpacity={1}>
                      <Icon
                        name="arrow-left"
                        size={30}
                        color={mainTheme.Input.selectionColor}/>
                    </TouchableOpacity>
                }
                parentEmptyStateComponent={
                    <SectionInfiniteScroll
                        renderItem={this.itemRenderer}
                        dbref={this.dbRefShortened}
                        onSectionData={null}
                        additionalData={this.footerButtons}
                        ListHeaderComponent={
                            <View>
                              <FriendRequestPreviewer
                                ref={ref => this.friendReqPreviewer = ref}
                                style={{ borderColor: "lightgrey", borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, marginBottom: 8 }} />
                            </View>
                        }
                    /> 
                  }
              />
      </View>
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
    // if user
    if (item.displayName) {
      this.modal.open(item)
    // if private group
    } else if (!item.isPublic) {
      this.props.navigation.navigate('GroupViewer', { group: item })
    } else {
      this.setState({ isModalVisible: true, selectedPublicGroup: item })
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
}

const styles = StyleSheet.create({
  bottomBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: 64,
    paddingTop: 6,
    paddingHorizontal: 10,
    width: "100%",
    borderTopWidth: 1,
    borderColor: "lightgrey"
  },
})