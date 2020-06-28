import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View } from 'react-native';
import { Button, Divider, Input, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import { BannerButton } from 'reusables/ReusableButtons';
import { UserSnippetListElement } from 'reusables/ListElements';
import { AdditionalOptionsButton, MinorActionButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import {ScrollingHeader} from "reusables/Header"
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import ErrorMessageText from 'reusables/ErrorMessageText';
import {MAX_MASK_NAME_LENGTH} from 'utils/serverValues'

export default class NewMaskScreen extends React.Component {

  constructor(props){
    super(props)
    this.maskSnippet = this.props.navigation.getParam('mask', null)
    this.state = { 
      errorMessage: null, 
      maskName: this.maskSnippet ? this.maskSnippet.name : "",
      usersToBeRemoved: {},
      currentlySelectedUser: null,
      newMaskName: this.maskSnippet ? this.maskSnippet.name : "",
      inEditMode: false,
      editingModalOpen: false,
      isModalVisible: false
    }
  }

  static navigationOptions = ({ navigation }) => {
    let title = ""
    let mask = navigation.state?.params?.mask
    if (mask) title = mask.name
    else title = "New Mask"
    return ScrollingHeader(title)
  };

  render() {
    let userUid = auth().currentUser.uid
    if (!this.maskSnippet) return null;
    const {inEditMode, newMaskName, currentlySelectedUser, editingModalOpen} = this.state;
    return (
      <ThemeConsumer>
      {({ theme }) => (
      <View style={S.styles.containerFlexStart}>

        <ErrorMessageText message = {this.state.errorMessage} />


        <DefaultLoadingModal isVisible={this.state.isModalVisible} />

        <Overlay 
          isVisible = {currentlySelectedUser !== null}
          onBackdropPress = {this.deselectUser}
          onRequestClose = {this.deselectUser}>         
          <>
            {currentlySelectedUser !== null && 
              <Text style = {{fontSize: 18, marginBottom: 16, textAlign: "center"}}>
                @{currentlySelectedUser.username}
              </Text>
            }
            <Button 
              titleStyle = {{color: theme.colors.error}}
              type = "clear"
              title = "Remove User" 
              onPress = {() => this.queueForRemoval(currentlySelectedUser)}
            />
            <MinorActionButton 
              title = "Close" 
              onPress = {this.deselectUser}
            />
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
                  () => this.setState({inEditMode: true})
                )}
          />
          <Button 
              title = "Add Members" 
              titleStyle = {{color: theme.colors.black}}
              type = "clear"
              onPress={() => 
                this.closeEditingModal(
                  () => this.props.navigation.navigate('MaskMemberAdder', {mask: this.maskSnippet})
                )}
            />
            <Button 
              titleStyle = {{color: theme.colors.error}}
              type = "clear"
              title = "Delete Mask" 
              onPress = {() => this.deleteMask()}
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
                label = "Mask Name"
                autoCapitalize="none"
                onChangeText={text => this.setState({ newMaskName: text })}
                value={newMaskName}
                errorMessage = {newMaskName.length > MAX_MASK_NAME_LENGTH ? "Too long" : undefined}
              /> 
            </View>
            <Divider />
          </>
        }

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/details/${this.maskSnippet.uid}/memberSnippets`)}
        />

        
        {!inEditMode ? (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonBlue}
              onPress={this.openEditingModal}
              iconName = {S.strings.edit}
              title = "EDIT"
            />
          </View>
        ) : (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonRed}
              onPress={() => this.setState({
                inEditMode: false, 
                usersToBeRemoved: {}, 
                newMaskName: this.maskSnippet ? this.maskSnippet.name : ""
              })}
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

  applyEdits = async () => {
    try{
      const {usersToBeRemoved, newMaskName} = this.state
      if (isOnlyWhitespace(newMaskName) || newMaskName.length > MAX_MASK_NAME_LENGTH){
        this.setState({errorMessage: "Invalid name"});
        return;
      }
  
      this.setState({isModalVisible: true})
      const cloudFunc = functions().httpsCallable('createOrEditMask')
      await timedPromise(cloudFunc({
        maskUid: this.maskSnippet.uid,
        newName: newMaskName, 
        usersToRemove: usersToBeRemoved
      }), LONG_TIMEOUT);
  
      this.setState({inEditMode: false, usersToBeRemoved: {}, maskName: newMaskName, isModalVisible: false})
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }
  }

  deleteMask = async () => {
    try{
      this.setState({isModalVisible: true})
      const cloudFunc = functions().httpsCallable('deleteMask')
      await timedPromise(cloudFunc({
        maskUid: this.maskSnippet.uid,
      }), LONG_TIMEOUT);
  
      this.props.navigation.goBack()
    }catch(err){
      if (err.message != 'timeout') logError(err)
      this.setState({errorMessage: err.message, isModalVisible: false})
    }
  }

  itemRenderer = ({ item }) => {
    const {inEditMode, usersToBeRemoved} = this.state
    if (inEditMode && usersToBeRemoved[item.uid]) return null; //Stop rendering this user if he's queued for deletion
    return (
      <View style = {{width: "100%", flexDirection: "row", alignItems: "center"}}>
        <UserSnippetListElement snippet = {item} style = {{flex: 1}} />
        {inEditMode && 
          <AdditionalOptionsButton
            onPress={() => this.selectUser(item)} />
          }
      </View>
    );
  }

  selectUser = (user) => {
    this.setState({currentlySelectedUser: user})
  }

  deselectUser = () => {
    this.setState({currentlySelectedUser: null})
  }

  closeEditingModal = (callback) => {
    if (callback) this.setState({editingModalOpen: false}, callback)
    else this.setState({editingModalOpen: false})
  }

  openEditingModal = () => {
    this.setState({editingModalOpen: true})
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