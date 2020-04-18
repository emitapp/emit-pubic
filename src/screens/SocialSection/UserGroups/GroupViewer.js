import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth'
import React from 'react';
import { View } from 'react-native';
import { Button, Divider, Input, Overlay, Text, ThemeConsumer, Tooltip } from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, SmallLoadingComponent } from 'reusables/LoadingComponents';
import { AdditionalOptionsButton, BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';
import { groupRanks } from 'utils/serverValues';
import Snackbar from 'react-native-snackbar';


export default class GroupScreen extends React.Component {

  constructor(props){
    super(props)
    this.groupSnippet = this.props.navigation.getParam('group', null)
    this.groupSnapshot = null
    this.state = { 
      errorMessage: null, 
      groupName: this.groupSnippet ? this.groupSnippet.name : "",
      usersToBeRemoved: {},
      newGroupName: this.groupSnippet ? this.groupSnippet.name : "",
      inEditMode: false,
      currentlySelectedUser: null,
      editingModalOpen: false,
      userRank: null
    }
  }

  componentDidMount(){
    if (this.groupSnippet) this.getInitalGroupInfo()
  }

  render() {
    const {
      inEditMode, 
      newGroupName, 
      currentlySelectedUser, 
      editingModalOpen, 
      isModalVisible,
      userRank
    } = this.state;
    if (!this.groupSnippet || !userRank || !this.groupSnapshot){
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

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>
        }

        <Overlay 
          isVisible = {currentlySelectedUser !== null}
          onBackdropPress = {this.deselectUser}
          onRequestClose = {this.deselectUser}>  
          <>       
            {currentlySelectedUser !== null && 
              <>
              <Text style = {{fontSize: 18, marginBottom: 16, textAlign: "center"}}>
                @{currentlySelectedUser.username}
              </Text>
              <Button 
                titleStyle = {{color: theme.colors.error}}
                type = "clear"
                title = "Remove User" 
                onPress = {() => this.queueForRemoval(currentlySelectedUser)}
              />
              <Button 
                titleStyle = {{color: theme.colors.black}}
                type = "clear"
                title = {currentlySelectedUser.rank == groupRanks.ADMIN ? "Demote from Admin" : "Promote to Admin"} 
                onPress={() => 
                  this.deselectUser(
                    () => this.changeRank(currentlySelectedUser)
                  )}
              />
              <MinorActionButton 
                title = "Close" 
                onPress = {this.deselectUser}
              />
              </>
            }
          </>
        </Overlay>

        <Overlay 
          isVisible = {editingModalOpen}
          onBackdropPress = {() => this.closeEditingModal()}
          onRequestClose = {() => this.closeEditingModal()}>         
          <>
          <Button 
              title = "Edit Name and Current Members" 
              type = "clear"
              titleStyle = {{color: theme.colors.black}}
              onPress={() => 
                this.closeEditingModal(
                  () => this.enterEditingMode()
                )}
          />
          <Button 
              title = "Add Members" 
              titleStyle = {{color: theme.colors.black}}
              type = "clear"
              onPress={() => 
                this.closeEditingModal(
                  () => this.props.navigation.navigate('GroupMemberAdder', {group: this.groupSnippet})
                )}
            />
            <Button 
              titleStyle = {{color: theme.colors.error}}
              type = "clear"
              title = "Leave Group" 
              onPress = {null}
            />
            <Button 
              titleStyle = {{color: theme.colors.error}}
              type = "clear"
              title = "Delete Group" 
              onPress = {this.deleteGroup}
            />
            <MinorActionButton 
              title = "Close" 
              onPress = {() => this.closeEditingModal()}
            />
          </>
        </Overlay>
   
        {inEditMode &&
          <>
            <View style = {{
              flexDirection: "row", 
              width: "100%", 
              justifyContent: "center", 
              marginBottom: 8,
              alignItems: "center"}}>
              <Input
                label = "Group Name"
                autoCapitalize="none"
                onChangeText={text => this.setState({ newGroupName: text })}
                value={newGroupName}
              /> 
            </View>
            <Divider />
          </>
        }

        <View style = {{flexDirection: "row"}}>
          <Tooltip 
            popover={<Text>Member Count</Text>}>
            <View style = {{flexDirection: "row", marginRight: 16}}>
              <FontAwesomeIcon name="users" size={24} color= "grey" style = {{marginHorizontal: 8}}/>
              <Text>: {this.groupSnapshot?.memberCount}</Text>
            </View>
          </Tooltip>

          <Tooltip 
            popover={<Text>Admin Count</Text>}>
            <View style = {{flexDirection: "row"}}>
              <FontAwesomeIcon name="star" size={24} color= "grey" style = {{marginHorizontal: 8}}/>
              <Text>: {this.groupSnapshot?.adminCount}</Text>
            </View>
          </Tooltip>
        </View>

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userGroups/${this.groupSnippet.uid}/memberSnippets`)}
        />

        
        {!inEditMode ? (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonBlue}
              onPress={() => this.openEditingModal()}
              iconName = {S.strings.edit}
              title = "EDIT"
            />
          </View>
        ) : (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonRed}
              onPress={() => this.setState({inEditMode: false})}
              iconName = {S.strings.cancel}
              title = "CANCEL"
            />        
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonGreen}
              onPress={this.applyEdits}
              iconName = {S.strings.confirm}
              title = "SAVE CHANGES"
            />
          </View>
        )}
        
      </View>
      )}
      </ThemeConsumer>
    )
  }

  getInitalGroupInfo = async () => {
    try{
      let groupSnippetSnapshot = await database()
        .ref(`/userGroups/${this.groupSnippet.uid}/snippet`)
        .once("value")
      let userMembershipSnippet = await database()
        .ref(`/userGroups/${this.groupSnippet.uid}/memberSnippets/${auth().currentUser.uid}`)
        .once("value")
      this.groupSnapshot = groupSnippetSnapshot.val()
      let userRank = userMembershipSnippet = userMembershipSnippet.val().rank
      this.setState({userRank}) //Rerender also necessary becuase of updated this.groupSnapshot
    }catch(err){
      logError(err)
    }
  }

  applyEdits = async () => {
    const {usersToBeRemoved, newGroupName, groupName} = this.state
    if (isOnlyWhitespace(newGroupName)){
      console.log("No cigar, my friend")
      this.setState({isModalVisible: false})
      return;
    }
    this.setState({isModalVisible: true})
    try{    
      const params = {groupUid: this.groupSnippet.uid}
      if (Object.keys(usersToBeRemoved).length != 0) params['usersToRemove'] = usersToBeRemoved
      if (newGroupName != groupName) params['newName'] = newGroupName
      const cloudFunc = functions().httpsCallable('editGroup')
      await timedPromise(cloudFunc(params), LONG_TIMEOUT);
      this.setState({isModalVisible: false, inEditMode: false, usersToBeRemoved: {}})
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }   
  }

  deleteGroup = async () => {
    if (this.state.userRank !== groupRanks.ADMIN){
      this.displayPermissionsMessage()
      return;
    }
    this.setState({isModalVisible: true})
    try{    
      const cloudFunc = functions().httpsCallable('deleteGroup')
      await timedPromise(cloudFunc({groupUid: this.groupSnippet.uid}), LONG_TIMEOUT);
      this.setState({isModalVisible: false}, () => this.props.navigation.goBack())
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }   
  }

  changeRank = (memberSnippet) => {

  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }


  itemRenderer = ({ item }) => {
    const {inEditMode, usersToBeRemoved} = this.state
    if (inEditMode && usersToBeRemoved[item.uid]) return null; //Stop rendering this user if he's queued for deletion
    return (
      <View style = {{width: "100%", flexDirection: "row", alignItems: "center"}}>
        <UserSnippetListElement snippet = {item} style = {{flex: 1}} />
        {item.rank === groupRanks.ADMIN &&
          <FontAwesomeIcon name="star" size={24} color= "grey" style = {{marginHorizontal: 8}}/>
        }
        {inEditMode && 
          <AdditionalOptionsButton onPress={() => this.selectUser(item)} />
        }
      </View>
    );
  }



  selectUser = (user) => {
    this.setState({currentlySelectedUser: user})
  }

  //Closes the selected user's modal
  deselectUser = (callback) => {
    if (callback) this.setState({currentlySelectedUser: null}, callback)
    else this.setState({currentlySelectedUser: null})
  }

  closeEditingModal = (callback) => {
    if (callback) this.setState({editingModalOpen: false}, callback)
    else this.setState({editingModalOpen: false})
  }

  openEditingModal = () => {
    this.setState({editingModalOpen: true})
  }

  enterEditingMode = () => {
    if (this.state.userRank == groupRanks.ADMIN){
      this.displayPermissionsMessage()
      return;
    }
    this.setState({inEditMode: true})
  }

  displayPermissionsMessage = () => {
    //There are modals being opened and closed on this screen, and if I close a modal
    //and then show the snackbar, the snackbar might be attached to the modal that was jsut in 
    //the process of being removed, meaning the snackbar will never be displayed. 
    //So, I use a small timeout to give the snackbar a bit of a delay
    //https://github.com/cooperka/react-native-snackbar/issues/67
    setTimeout(
      () => {
        Snackbar.show({
          text: 'You have to be an admin to be able to do this', 
          duration: Snackbar.LENGTH_SHORT
        });
      },
      150
    )
  }

  queueForRemoval = (snippet) => {
    const copiedObj = {...this.state.usersToBeRemoved}
    if (copiedObj[snippet.uid]){
      //Then remove the user's uid
      delete copiedObj[snippet.uid]
    }else{
      //Add the user's uid
      copiedObj[snippet.uid] = true
    }
    this.setState({usersToBeRemoved: copiedObj});
    this.deselectUser()
  }
}