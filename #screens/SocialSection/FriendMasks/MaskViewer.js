import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
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
      selectedUserUids: {},
      newMaskName: this.maskSnippet ? this.maskSnippet.name : "",
      inEditMode: false
    }
  }

  render() {
    let userUid = auth().currentUser.uid
    if (!this.maskSnippet) return null;
    const {inEditMode, newMaskName, maskName} = this.state;
    return (
      <View style={S.styles.containerFlexStart}>
   
        <Button title="Delete Mask" onPress={this.deleteMask}/>
        <Button title="Add Members" onPress={() => this.props.navigation.navigate('MaskMemberAdder', {mask: this.maskSnippet})}/>

        <TextInput
          style={S.styles.textInput}
          autoCapitalize="none"
          onChangeText={text => this.setState({ newMaskName: text })}
          value={inEditMode ? newMaskName : maskName}
          editable={inEditMode}
        />

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/details/${this.maskSnippet.uid}/memberSnippets`)}
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
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
    )
  }

  applyEdits = () => {
    const {selectedUserUids, newMaskName} = this.state
    if (isOnlyWhitespace(newMaskName)){
      console.log("No cigar, my friend")
    }
    const snippetPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/snippets/${this.maskSnippet.uid}`
    const infoPath = `/userFriendGroupings/${auth().currentUser.uid}/custom/details/${this.maskSnippet.uid}`

    const updates = {}
    for (const uid in selectedUserUids) {
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
    const {inEditMode, selectedUserUids} = this.state
    return (
      <TouchableOpacity 
        style = {[S.styles.listElement, {backgroundColor: selectedUserUids[item.uid] && inEditMode ? "red" : "white"}]}
        onPress={() => this.toggleSelection(item)}
        disabled={!this.state.inEditMode}>
          <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
          <View>
            <Text>{item.displayName}</Text>
            <Text>@{item.username}</Text>
            <Text>{item.uid}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  toggleSelection = (snippet) => {
    const copiedObj = {...this.state.selectedUserUids}
    if (copiedObj[snippet.uid]){
      //Then remove the user's uid
      delete copiedObj[snippet.uid]
    }else{
      //Add the user's uid
      copiedObj[snippet.uid] = true
    }
    this.setState({selectedUserUids: copiedObj});
  }
}

const styles = StyleSheet.create({
  bottomButton: {
    justifyContent: "center",
    alignItems: 'center', 
    height: 50,
    flexDirection: 'row',
    flex: 1
  },
})