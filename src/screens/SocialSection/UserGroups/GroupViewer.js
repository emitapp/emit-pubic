import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Button, Divider, Input, Overlay, Text, ThemeConsumer, Tooltip } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { ScrollingHeader } from "reusables/Header";
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, SmallLoadingComponent } from 'reusables/ui/LoadingComponents';
import ProfilePicChanger from 'reusables/profiles/ProfilePicChanger';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';
import { AdditionalOptionsButton, BannerButton, LoadableButton, MinorActionButton } from 'reusables/ui/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/lists/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise, showDelayedSnackbar } from 'utils/helpers';
import { cloudFunctionStatuses, groupRanks, MAX_GROUP_NAME_LENGTH } from 'utils/serverValues';
import FriendReqModal from '../../../components/FriendReqModal';

export default class GroupScreen extends React.Component {

  constructor(props) {
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.state = this.initializeScreenState(GroupScreen.refreshModes.FIRST_LOAD)
    this.profilePicComponent = null
    this.userUid = auth().currentUser.uid
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
          () => console.log("Fetched group data")
        )
      })

    database()
      .ref(`/userGroups/${this.groupSnippet.uid}/memberUids/${this.userUid}`)
      .on("value", snap => {
        if (!snap.exists()) {
          shouldGoBack = true
          return;
        }
        this.setState(
          this.initializeScreenState(GroupScreen.refreshModes.NEW_RANK, snap.val()),
          () => console.log("Fetched user group rank")
        )
      })

    database()
      .ref(`/userGroupCodes/${this.groupSnippet.uid}`)
      .once("value", snap => this.setState({ inviteCode: snap.val().toUpperCase() }))

    if (shouldGoBack) {
      this.props.navigation.goBack()
    }
  }

  componentWillUnmount() {
    if (!this.groupSnippet) return;
    database().ref(`/userGroups/${this.groupSnippet.uid}/snippet`).off()
    database().ref(`/userGroups/${this.groupSnippet.uid}/memberUids/${this.userUid}`).off()
  }

  render() {
    const {
      inEditMode,
      newGroupName,
      currentlySelectedUser,
      editingModalOpen,
      isModalVisible,
      fetchedUserRank,
      fetchedGroupData,
      visibilityModalOpen
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

            <FriendReqModal
              ref={modal => this.modal = modal} />

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
              isVisible={visibilityModalOpen}
              onBackdropPress={() => this.closeVisibilityModal()}
              onRequestClose={() => this.closeVisibilityModal()}
              overlayStyle={{ width: "80%" }}>
              <>
                <Text style={{ margin: 8 }}>
                  {this.state.fetchedGroupData.isPublic ?
                    "Making the group private means members can only be join via invitation or by using the invite code." :
                    "Making the group public means members can join via invitation, ivite code or by searching for the group."}
                </Text>

                <LoadableButton
                  title="Proceed"
                  onPress={() => this.updateGroupVisibility()}
                  isLoading={this.state.waitingForGroupVisibilityChange}
                />
                {
                  !this.state.waitingForGroupVisibilityChange &&
                  <MinorActionButton
                    title="Cancel"
                    onPress={() => this.closeVisibilityModal()}
                  />
                }

              </>

            </Overlay>

            <Overlay
              isVisible={editingModalOpen}
              onBackdropPress={() => this.closeEditingModal()}
              onRequestClose={() => this.closeEditingModal()}
              overlayStyle={{ width: "60%" }}>
              <>
                {this.state.fetchedUserRank == groupRanks.ADMIN &&
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
                      title={this.state.fetchedGroupData.isPublic ? "Make Group Private" : "Make Group Public"}
                      type="clear"
                      titleStyle={{ color: theme.colors.black }}
                      onPress={() =>
                        this.closeEditingModal(
                          () => this.showVisbilityModal()
                        )}
                    />
                  </>
                }

                {this.state.fetchedUserRank != groupRanks.ADMIN &&
                  <Text style={{ color: "#555555", textAlign: "center", marginBottom: 8 }}>
                    Only group admins can rename the group and remove other members.
                  </Text>
                }

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
                {this.state.fetchedUserRank == groupRanks.ADMIN &&
                  <Button
                    titleStyle={{ color: theme.colors.error }}
                    type="clear"
                    title="Delete Group"
                    onPress={this.deleteGroup}
                  />
                }

                <MinorActionButton
                  title="Cancel"
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

            <View style={{ flexDirection: "row", alignSelf: "stretch", alignItems: "center", marginHorizontal: 16 }}>
              <Pressable onPress={() => this.setState({ showProfilePicChanger: !this.state.showProfilePicChanger })}>
                <ProfilePicDisplayer
                  diameter={60}
                  uid={this.groupSnippet.uid}
                  style={{ marginLeft: 8, marginRight: 8 }}
                  groupPic={true}
                  ref={ref => this.profilePicComponent = ref}
                />
              </Pressable>
              <View style={{ marginLeft: 8, flex: 1 }}>
                <View style={{ flexDirection: "row" }}>
                  <FontAwesomeIcon name="users" size={24} color="grey" style={{ marginRight: 8 }} />
                  <Text>{this.state.fetchedGroupData?.memberCount} members</Text>
                </View>
                <View>
                  <Text>Invite Code: {this.state.inviteCode}</Text>
                </View>
              </View>

              {this.displayDiscoverablilityBadge()}
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
                  title="EDIT GROUP"
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
      visibilityModalOpen: false,
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      inEditMode: false,
      newGroupName: this.groupSnippet ? this.groupSnippet.name : "",
      usersToBeRemoved: {},
      usersToBePromoted: {},
      usersToBeDemoted: {},
      currentlySelectedUser: null,
      editingModalOpen: false,
      showProfilePicChanger: false,
      waitingForGroupVisibilityChange: false
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
        else this.setState({ errorMessage: null })
      }
    } catch (err) {
      if (err.name != 'timeout') logError(err)
      this.setState({ errorMessage: err.message, isModalVisible: false })
    }
  }

  leaveGroup = () => {
    this.queueForRemoval({ uid: this.userUid }, () => {
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
    if (this.state.fetchedUserRank !== groupRanks.ADMIN && snippet.uid !== this.userUid) {
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
        <UserSnippetListElement snippet={item} style={{ flex: 1 }} onPress={() => this.modal.openUsingSnippet(item)} />
        {(item.rank === groupRanks.ADMIN || this.state.usersToBePromoted[item.uid]) && !this.state.usersToBeDemoted[item.uid] &&
          <View style = {{alignItems: "center"}}>
            <FontAwesomeIcon name="star" size={24} color="grey" style={{ marginHorizontal: 8 }} />
            <Text style = {{textAlign: "center"}}>Admin</Text>
          </View>
        }
        {inEditMode &&
          <AdditionalOptionsButton onPress={() => this.selectUser(item)} />
        }
      </View>
    );
  }

  updateGroupVisibility = async () => {
    this.setState({ waitingForGroupVisibilityChange: true })
    try {
      const cloudFunc = functions().httpsCallable('changeGroupVisibility')
      const response = await timedPromise(cloudFunc(this.groupSnippet.uid), LONG_TIMEOUT);
      if (response.data.status != cloudFunctionStatuses.OK) {
        const message = (response.data.status == cloudFunctionStatuses.LEASE_TAKEN)
          //LEASE status Currently not possible for this func, maybe later on tho
          ? "This group is currently being edited by someone, please wait a few seconds"
          : response.data.message
        this.setState({
          errorMessage: message,
          visibilityModalOpen: false
        })
      } else {
        this.setState({ visibilityModalOpen: false, errorMessage: null })
      }
    } catch (err) {
      if (err.name != 'timeout') logError(err)
      this.setState({ errorMessage: err.message, isModalVisible: false })
    } finally {
      this.setState({ waitingForGroupVisibilityChange: false })
    }
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

  showVisbilityModal = () => {
    this.setState({ visibilityModalOpen: true })
  }

  closeVisibilityModal = () => {
    this.setState({ visibilityModalOpen: false })
  }

  enterEditingMode = () => {
    if (this.state.fetchedUserRank !== groupRanks.ADMIN) {
      this.displayPermissionsMessage()
      return;
    }
    this.setState({ inEditMode: true })
  }

  displayPermissionsMessage = () => {
    showDelayedSnackbar('You have to be an admin to be able to do this')
  }


  displayDiscoverablilityBadge = () => {
    let details = {
      tooltip: "Members can only be join via invitation or by using the invite code.",
      darkColor: "green",
      backgroundColor: "azure",
      title: "Private"
    }
    if (this.state.fetchedGroupData.isPublic) {
      details = {
        tooltip: "Members can join via invitation, invite code or by searching for the group.",
        darkColor: "#111111",
        backgroundColor: "gainsboro",
        title: "Public"
      }
    }

    return (
      <Tooltip
        popover={<Text>{details.tooltip}</Text>}
        backgroundColor="lightgrey"
        skipAndroidStatusBar={true}
        height={130}>
        <View style={{
          borderColor: details.darkColor,
          padding: 2,
          borderRadius: 5,
          borderWidth: 1,
          backgroundColor: details.backgroundColor
        }}>
          <Text style={{ color: details.darkColor }}>
            {details.title}
          </Text>
        </View>
      </Tooltip>
    )
  }
}