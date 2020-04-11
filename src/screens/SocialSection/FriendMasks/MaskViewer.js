import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Button, Divider, Icon, Input, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import BannerButton from 'reusables/BannerButton';
import { UserSnippetListElement } from 'reusables/ListElements';
import { MinorActionButton, AdditionalOptionsButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { isOnlyWhitespace, logError } from 'utils/helpers';


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
      extraOptionsModalOpen: false
    }
  }

  render() {
    let userUid = auth().currentUser.uid
    if (!this.maskSnippet) return null;
    const {inEditMode, newMaskName, currentlySelectedUser, extraOptionsModalOpen} = this.state;
    return (
      <ThemeConsumer>
      {({ theme }) => (
      <View style={S.styles.containerFlexStart}>

        <Overlay 
          isVisible = {currentlySelectedUser !== null}
          onBackdropPress = {this.deselectUser}
          onRequestClose = {this.deselectUser}>         
          <>
            {currentlySelectedUser !== null && 
              <Text style = {{fontWeight: "bold", fontSize: 18, marginBottom: 8}}>
                @{currentlySelectedUser.username}
              </Text>
            }
            <Button 
              buttonStyle = {{backgroundColor: theme.colors.error}}
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
          isVisible = {extraOptionsModalOpen}
          onBackdropPress = {() => this.closeExtraOptionsModal()}
          onRequestClose = {() => this.closeExtraOptionsModal()}>         
          <>
          <Button 
              title = "Add Members" 
              onPress={() => 
                this.closeExtraOptionsModal(
                  () => this.props.navigation.navigate('MaskMemberAdder', {mask: this.maskSnippet})
                )}
            />
            <Button 
              buttonStyle = {{backgroundColor: theme.colors.error}}
              title = "Delete Mask" 
              onPress = {() => this.deleteMask}
            />
            <MinorActionButton 
              title = "Close" 
              onPress = {() => this.closeExtraOptionsModal()}
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
              alignItems: "center"}}
            >
              <View style = {{flex: 1}}>
                <Input
                  label = "Mask Name"
                  autoCapitalize="none"
                  onChangeText={text => this.setState({ newMaskName: text })}
                  value={newMaskName}
                /> 
              </View>
              <AdditionalOptionsButton onPress={this.openExtraOptionsModal} />
            </View>
            <Divider />
          </>
        }

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/details/${this.maskSnippet.uid}/memberSnippets`)}
        />

        
        {!inEditMode ? (
          <View style={{flexDirection: "row"}}>
            <BannerButton
              extraStyles = {{flex: 1}}
              color = {S.colors.buttonBlue}
              onPress={() => this.setState({inEditMode: true})}
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

  applyEdits = () => {
    const {usersToBeRemoved, newMaskName} = this.state
    if (isOnlyWhitespace(newMaskName)){
      console.log("No cigar, my friend")
    }
    const snippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets/${this.maskSnippet.uid}`
    const infoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details/${this.maskSnippet.uid}`

    const updates = {}
    for (const uid in usersToBeRemoved) {
      //Deleting all selected users
      updates[`${infoPath}/memberSnippets/${uid}`] = null
      updates[`${infoPath}/memberUids/${uid}`] = null
    }
    updates[`${snippetPath}/name`] = newMaskName
 
    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => {
        this.setState({maskName: newMaskName})
        console.log("Edited the friend mask!!")
      })
      .catch((err) => logError(err));

    this.setState({inEditMode: false})
  }

  deleteMask = () => {
    const snippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets/${this.maskSnippet.uid}`
    const infoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details/${this.maskSnippet.uid}`
    const updates = {}
    updates[infoPath] = null
    updates[snippetPath] = null
 
    //We're gonna let this happen asynchronously
    database().ref().update(updates)
      .then(() => {
        console.log("Deleted friend mask!!")
      })
      .catch((err) => logError(err));

    this.props.navigation.goBack()
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    const {inEditMode, usersToBeRemoved} = this.state
    if (usersToBeRemoved[item.uid]) return null; //Stop rendering this user if he's queued for deletion
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

  closeExtraOptionsModal = (callback) => {
    console.log(callback)
    if (callback) this.setState({extraOptionsModalOpen: false}, callback)
    else this.setState({extraOptionsModalOpen: false})
  }

  openExtraOptionsModal = () => {
    this.setState({extraOptionsModalOpen: true})
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