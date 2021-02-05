import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Button, Divider, Input, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { ScrollingHeader } from "reusables/Header";
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, SmallLoadingComponent } from 'reusables/LoadingComponents';
import ProfilePicChanger from 'reusables/ProfilePicChanger';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import { AdditionalOptionsButton, BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, groupRanks, MAX_GROUP_NAME_LENGTH } from 'utils/serverValues';

export default class GroupScreen extends React.Component {

  constructor(props) {
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = this.initializeScreenState(GroupScreen.refreshModes.FIRST_LOAD)
    this.profilePicComponent = null
  }

  static navigationOptions = ({ navigation }) => {
    let title = ""
    let group = navigation.state?.params?.group
    if (group) title = group.name
    else title = "New Group"
    return ScrollingHeader(title)
  };

  static refreshModes = {
    FIRST_LOAD: "first load",
    INVITE_CODE_LOADED: "got invite code",
    NEW_RANK: "new rank",
    NEW_GROUP_DATA: "new group data"
  }

  componentDidMount() {
    if (!this.groupSnippet) return; //Otherwise this person is viewing a group that already exists
    let shouldGoBack = false

    database()
      .ref(`/userGroups/${this.groupSnippet.uid}/snippet`)
      .on("value", snap => {
        if (!snap.exists()) {
          shouldGoBack = true
          return;
        }
        this.setState(
          this.initializeScreenState(GroupScreen.refreshModes.NEW_GROUP_DATA, snap.val()),
          () => this.showDelayedSnackbar("Fetched group data")
        )
      })

    database()
      .ref(`/userGroups/${this.groupSnippet.uid}/memberUids/${auth().currentUser.uid}`)
      .on("value", snap => {
        if (!snap.exists()) {
          shouldGoBack = true
          return;
        }
        this.setState(
          this.initializeScreenState(GroupScreen.refreshModes.NEW_RANK, snap.val()),
          () => this.showDelayedSnackbar("Fetched user group rank")
        )
      })

    database()
      .ref(`/userGroupCodes/${this.groupSnippet.uid}`)
      .once("value", snap => this.setState({ inviteCode: snap.val().toUpperCase()}))

    if (shouldGoBack) {
      this.props.navigation.goBack()
    }
  }

  componentWillUnmount() {
    if (!this.groupSnippet) return;
    database().ref(`/userGroups/${this.groupSnippet.uid}/snippet`).off()
    database().ref(`/userGroups/${this.groupSnippet.uid}/memberUids/${auth().currentUser.uid}`).off()
  }

  render() {
    const {
      inEditMode,
      newGroupName,
      currentlySelectedUser,
      editingModalOpen,
      isModalVisible,
      fetchedUserRank,
      fetchedGroupData
    } = this.state;
    if (!this.groupSnippet || !fetchedUserRank || !fetchedGroupData) {
      return (
        <View style={S.styles.container}>
          <SmallLoadingComponent />
        </View>
      )
    }
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <View style={S.styles.containerFlexStart}>

            <DefaultLoadingModal isVisible={isModalVisible} />

            <ErrorMessageText message={this.state.errorMessage} />


            <Overlay
              isVisible={currentlySelectedUser !== null}
              onBackdropPress={() => this.deselectUser()}
              onRequestClose={() => this.deselectUser()}>
              <>
                {currentlySelectedUser !== null &&
                  <>
                    <Text style={{ fontSize: 18, marginBottom: 16, textAlign: "center" }}>
                      @{currentlySelectedUser.username}
                    </Text>
                    <Button
                      titleStyle={{ color: theme.colors.error }}
                      type="clear"
                      title="Remove User"
                      onPress={() => this.queueForRemoval(currentlySelectedUser)}
                    />
                    <Button
                      titleStyle={{ color: theme.colors.black }}
                      type="clear"
                      title={currentlySelectedUser.rank == groupRanks.ADMIN ? "Demote from Admin" : "Promote to Admin"}
                      onPress={() =>
                        this.deselectUser(
                          () => this.changeRank(currentlySelectedUser)
                        )}
                    />
                    <MinorActionButton
                      title="Close"
                      onPress={() => this.deselectUser()}
                    />
                  </>
                }
              </>
            </Overlay>

            <Overlay
              isVisible={editingModalOpen}
              onBackdropPress={() => this.closeEditingModal()}
              onRequestClose={() => this.closeEditingModal()}>
              <>
                <Button
                  title="Edit Name and Current Members"
                  type="clear"
                  titleStyle={{ color: theme.colors.black }}
                  onPress={() =>
                    this.closeEditingModal(
                      () => this.enterEditingMode()
                    )}
                />
                <Button
                  title="Add Members"
                  titleStyle={{ color: theme.colors.black }}
                  type="clear"
                  onPress={() =>
                    this.closeEditingModal(
                      () => this.props.navigation.navigate('GroupMemberAdder', { group: this.groupSnippet })
                    )}
                />
                <Button
                  titleStyle={{ color: theme.colors.error }}
                  type="clear"
                  title="Leave Group"
                  onPress={this.leaveGroup}
                />
                <Button
                  titleStyle={{ color: theme.colors.error }}
                  type="clear"
                  title="Delete Group"
                  onPress={this.deleteGroup}
                />
                <MinorActionButton
                  title="Close"
                  onPress={() => this.closeEditingModal()}
                />
              </>
            </Overlay>

            {inEditMode &&
              <>
                <View style={{
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "center",
                  marginBottom: 8,
                  alignItems: "center"
                }}>
                  <Input
                    label="Group Name"
                    autoCapitalize="none"
                    onChangeText={text => this.setState({ newGroupName: text })}
                    value={newGroupName}
                    errorMessage={newGroupName.length > MAX_GROUP_NAME_LENGTH ? "Too long" : undefined}
                  />
                </View>
                <Divider />
              </>
            }

            <View style={{ flexDirection: "row", alignSelf: "stretch", justifyContent: "center", alignItems: "center" }}>
              <Pressable onPress={() => this.setState({ showProfilePicChanger: true })}>
                <ProfilePicDisplayer
                  diameter={40}
                  uid={this.groupSnippet.uid}
                  style={{ marginLeft: 8, marginRight: 8 }}
                  groupPic={true}
                  ref={ref => this.profilePicComponent = ref}
                />
              </Pressable>
              <View>
                <View style={{ flexDirection: "row", marginRight: 16 }}>
                  <FontAwesomeIcon name="users" size={24} color="grey" style={{ marginHorizontal: 8 }} />
                  <Text>{this.state.fetchedGroupData?.memberCount} admins</Text>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <FontAwesomeIcon name="star" size={24} color="grey" style={{ marginHorizontal: 8 }} />
                  <Text>{this.state.fetchedGroupData?.adminCount} members</Text>
                </View>
              </View>
            </View>

            <View style = {{marginTop : 8}}>
                <Text>Invite Code: {this.state.inviteCode}</Text>
                <Text>Invite codes are case insensitive</Text>
            </View>

            {this.state.showProfilePicChanger &&
              <View style={{ borderColor: "lightgrey", borderWidth: 1, marginHorizontal: 8, flexDirection: "row" }}>
                <ProfilePicChanger
                  groupPic={true}
                  groupUid={this.groupSnippet.uid}
                  onSuccessfulUpload={() => setTimeout(() => {
                    this.setState({ showProfilePicChanger: false })
                    this.profilePicComponent.refresh()
                  }, 3500)}
                />
              </View>
            }

            <SearchableInfiniteScroll
              type="dynamic"
              queryValidator={(query) => true}
              queryTypes={[{ name: "Display Name", value: "displayNameQuery" }, { name: "Username", value: "usernameQuery" }]}
              renderItem={this.itemRenderer}
              dbref={database().ref(`/userGroups/${this.groupSnippet.uid}/memberSnippets`)}
            />


            {!inEditMode ? (
              <View style={{ flexDirection: "row" }}>
                <BannerButton
                  extraStyles={{ flex: 1 }}
                  onPress={() => this.openEditingModal()}
                  iconName={S.strings.edit}
                  title="EDIT"
                />
              </View>
            ) : (
                <View style={{ flexDirection: "row" }}>
                  <BannerButton
                    extraStyles={{ flex: 1 }}
                    color={theme.colors.bannerButtonRed}
                    onPress={() => this.setState({ inEditMode: false })}
                    iconName={S.strings.cancel}
                    title="CANCEL"
                  />
                  <BannerButton
                    extraStyles={{ flex: 1 }}
                    color={theme.colors.bannerButtonGreen}
                    onPress={this.applyEdits}
                    iconName={S.strings.confirm}
                    title="SAVE CHANGES"
                  />
                </View>
              )}

          </View>
        )}
      </ThemeConsumer>
    )
  }

  //Mode should be one of the refreshModes
  initializeScreenState = (mode, newData = null) => {
    let newState = {
      errorMessage: null,
      isModalVisible: false,
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      inEditMode: false,
      newGroupName: this.groupSnippet ? this.groupSnippet.name : "",
      usersToBeRemoved: {},
      usersToBePromoted: {},
      usersToBeDemoted: {},
      currentlySelectedUser: null,
      editingModalOpen: false,
      showProfilePicChanger: false
    }
    if (mode == GroupScreen.refreshModes.FIRST_LOAD) {
      newState.fetchedUserRank = newData,
        newState.fetchedGroupData = newData
    } else if (mode == GroupScreen.refreshModes.NEW_RANK) {
      newState.fetchedUserRank = newData
    } else {
      newState.fetchedGroupData = newData
    }
    return newState
  }

  applyEdits = async (exitScreenWhenDone = false) => {
    const { usersToBeRemoved, usersToBeDemoted, usersToBePromoted, newGroupName, groupName } = this.state
    if (isOnlyWhitespace(newGroupName)) {
      this.setState({ isModalVisible: false, errorMessage: "Your group name can't be just whitespace" })
      return;
    }

    if (newGroupName.length > MAX_GROUP_NAME_LENGTH) {
      this.setState({ isModalVisible: false, errorMessage: "Your group name is too long" })
      return;
    }

    //Cleaning up the data first before contructing the arguments for the cloud functions
    const copiedUsersToBeDemoted = usersToBeDemoted
    const copiedUsersToBePromoted = usersToBePromoted
    for (const uid in copiedUsersToBeDemoted) {
      if (usersToBeRemoved.hasOwnProperty(uid)) delete copiedUsersToBeDemoted[uid]
    }
    for (const uid in copiedUsersToBePromoted) {
      if (usersToBeRemoved.hasOwnProperty(uid)) delete copiedUsersToBePromoted[uid]
    }

    this.setState({ isModalVisible: true })
    try {
      const params = { groupUid: this.groupSnippet.uid }
      if (Object.keys(usersToBeRemoved).length != 0) params['usersToRemove'] = usersToBeRemoved
      if (Object.keys(copiedUsersToBeDemoted).length != 0) params['usersToDemote'] = copiedUsersToBeDemoted
      if (Object.keys(copiedUsersToBePromoted).length != 0) params['usersToPromote'] = copiedUsersToBePromoted
      if (newGroupName != groupName) params['newName'] = newGroupName
      const cloudFunc = functions().httpsCallable('editGroup')
      const response = await timedPromise(cloudFunc(params), LONG_TIMEOUT);
      if (response.data.status != cloudFunctionStatuses.OK) {
        const message = (response.data.status == cloudFunctionStatuses.LEASE_TAKEN)
          ? "This group is currently being edited by someone, please wait a few seconds"
          : response.data.message
        this.setState({
          errorMessage: message,
          isModalVisible: false
        })
      } else {
        //If the method was successful, the fireabse listeners will clean up the state for us
        if (exitScreenWhenDone) this.props.navigation.goBack();
      }
    } catch (err) {
      if (err.name != 'timeout') logError(err)
      this.setState({ errorMessage: err.message, isModalVisible: false })
    }
  }

  leaveGroup = () => {
    this.queueForRemoval({ uid: auth().currentUser.uid }, () => {
      this.applyEdits(true)
    })
  }

  deleteGroup = async () => {
    if (this.state.fetchedUserRank !== groupRanks.ADMIN) {
      this.displayPermissionsMessage()
      return;
    }
    this.setState({ isModalVisible: true })
    try {
      const cloudFunc = functions().httpsCallable('deleteGroup')
      const response = await timedPromise(cloudFunc({ groupUid: this.groupSnippet.uid }), LONG_TIMEOUT);
      if (response.data.status != cloudFunctionStatuses.OK) {
        const message = (response.data.status == cloudFunctionStatuses.LEASE_TAKEN)
          ? "This group is currently being edited by someone, please wait a few seconds"
          : response.data.message
        this.setState({
          errorMessage: message,
          isModalVisible: false
        })
        this.closeEditingModal()
      } else {
        this.setState({ isModalVisible: false }, () => this.props.navigation.goBack())
      }
    } catch (err) {
      if (err.name != 'timeout') logError(err)
      this.setState({ errorMessage: err.message, isModalVisible: false })
    }
  }

  changeRank = (memberSnippet) => {
    if (this.state.fetchedUserRank !== groupRanks.ADMIN) {
      this.displayPermissionsMessage()
      return;
    }
    if (memberSnippet.rank == groupRanks.ADMIN) {
      const copiedObj = { ...this.state.usersToBeDemoted }
      copiedObj[memberSnippet.uid] = true
      this.setState({ usersToBeDemoted: copiedObj });
    } else {
      const copiedObj = { ...this.state.usersToBePromoted }
      copiedObj[memberSnippet.uid] = true
      this.setState({ usersToBePromoted: copiedObj });
    }
    this.deselectUser()
  }

  queueForRemoval = (snippet, callback = null) => {
    if (this.state.fetchedUserRank !== groupRanks.ADMIN && snippet.uid !== auth().currentUser.uid) {
      this.displayPermissionsMessage()
      return;
    }
    const copiedObj = { ...this.state.usersToBeRemoved }
    copiedObj[snippet.uid] = true
    if (callback) this.setState({ usersToBeRemoved: copiedObj }, callback);
    else this.setState({ usersToBeRemoved: copiedObj });
    this.deselectUser()
  }

  itemRenderer = ({ item }) => {
    const { inEditMode, usersToBeRemoved } = this.state
    if (inEditMode && usersToBeRemoved[item.uid]) return null; //Stop rendering this user if he's queued for deletion
    return (
      <View style={{ width: "100%", flexDirection: "row", alignItems: "center" }}>
        <UserSnippetListElement snippet={item} style={{ flex: 1 }} />
        {(item.rank === groupRanks.ADMIN || this.state.usersToBePromoted[item.uid]) && !this.state.usersToBeDemoted[item.uid] &&
          <FontAwesomeIcon name="star" size={24} color="grey" style={{ marginHorizontal: 8 }} />
        }
        {inEditMode &&
          <AdditionalOptionsButton onPress={() => this.selectUser(item)} />
        }
      </View>
    );
  }

  selectUser = (user) => {
    this.setState({ currentlySelectedUser: user })
  }

  //Closes the selected user's modal
  deselectUser = (callback) => {
    if (callback) this.setState({ currentlySelectedUser: null }, callback)
    else this.setState({ currentlySelectedUser: null })
  }

  closeEditingModal = (callback) => {
    if (callback) this.setState({ editingModalOpen: false }, callback)
    else this.setState({ editingModalOpen: false })
  }

  openEditingModal = () => {
    this.setState({ editingModalOpen: true })
  }

  enterEditingMode = () => {
    if (this.state.fetchedUserRank !== groupRanks.ADMIN) {
      this.displayPermissionsMessage()
      return;
    }
    this.setState({ inEditMode: true })
  }

  displayPermissionsMessage = () => {
    this.showDelayedSnackbar('You have to be an admin to be able to do this')
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