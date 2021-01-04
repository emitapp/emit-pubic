//Design for this influenced by https://github.com/invertase/react-native-firebase/issues/2558
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import React, { Component } from 'react';
import { Platform, StyleSheet, View, Image, Alert, Linking } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { logError } from 'utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import {Text, Button, Overlay} from 'react-native-elements'
import {SmallLoadingComponent} from 'reusables/LoadingComponents'
import Snackbar from 'react-native-snackbar';
var RNFS = require('react-native-fs');
import ProfilePicCircle from 'reusables/ProfilePicComponents';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { MinorActionButton } from 'reusables/ReusableButtons';


const options = {
  title: 'Select Image',
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
};

export default class ProfilePicChanger extends Component {

  state = {
    imageUri: '',
    uploading: false,
    pickingImage: false,
    uploadProgress: 0,
    errorMessage: null,
    //Stays true the moment the user successfully picked a pic at least once
    hasSuccessfullyPicked: false,
    modalVisible: false
  };

  render() {
    return (
      <View style={styles.container}>

        <Overlay 
          isVisible={this.state.modalVisible}
          onRequestClose = {() => this.setState({modalVisible: false})}
          onBackdropPress = {() => this.setState({modalVisible: false})}
          overlayStyle = {{maxWidth: "70%"}}>
            <>
            <Text style = {{textAlign: "center"}}>
              How would you like to change your profile pic?
            </Text>
            <Button 
              title = "Choose image from phone" 
              onPress={() => this.setState({modalVisible: false}, this.pickImage)}
              type = 'clear'/>
            <Button 
              title = "Create avatar" 
              onPress={() => this.setState({modalVisible: false}, this.createAvatar)}
              type = 'clear'/>
            <MinorActionButton 
              title="Close" 
              onPress={() => this.setState({modalVisible: false})}/>
            </>
        </Overlay>

        <ErrorMessageText message = {this.state.errorMessage} />

        <Text style = {{textAlign: "center", marginBottom: 16}}>
          Note that your updated profile pic might take a few seconds to appear everywhere in the app
        </Text>

        {(!this.state.hasSuccessfullyPicked && !this.state.pickingImage) ? (
          <ProfilePicCircle 
            diameter = {styles.image.width} 
            uid = {auth().currentUser.uid}/>
        ): null}

        {this.state.pickingImage && (
          <View style = {{...styles.image, alignItems: "center", justifyContent: "center"}}> 
            <SmallLoadingComponent />
          </View>
        )}

        {this.state.imageUri ? (
          <Image
            source={{ uri: this.state.imageUri }}
            style = {styles.image}/>
        ): null}

        <View style = {styles.progressBarParent}>
          <View style={{...styles.progressBar,  width: `${this.state.uploadProgress}%` }}/>
        </View>
       
        <View style = {{flexDirection: "row", justifyContent: "center", width: "100%", marginTop: 16}}>
          <Button 
            title = "Change image" 
            onPress={() => this.setState({modalVisible: true})} 
            disabled = {this.state.uploading}/>

        {this.state.imageUri ? (     
          <Button 
            title = {(this.state.uploading) ? "Uploading ..." : "Upload image"} 
            onPress={this.uploadImage} 
            disabled = {this.state.uploading}/>
        ): null}
        </View>

      </View>
    );
  }

  pickImage = async () => {
      try{
        await this.checkPermissions();
        this.setState({pickingImage: true})
        ImagePicker.showImagePicker(options, response => {
          if (response.didCancel) {
            Alert.alert('You changed your mind?', 'Image selection cancelled');
          } else if (response.error) {
            Alert.alert('Whoops!', `An error occured: ${response.error}`);
          } else {
            this.setState({imageUri: response.uri, hasSuccessfullyPicked: true});
          }
          this.setState({pickingImage: false})
        });
      }catch(err){
        this.setState({errorMessage: err.message, pickingImage: false})
        logError(err)
      }
  };

  uploadImage = async () => {
    if (!this.state.imageUri) return;
    let filename = `${uuidv4()}` // Generate unique name
    this.setState({ uploading: true });
    let task = storage().ref(`profilePictures/${auth().currentUser.uid}/${filename}`)

    if (Platform.OS == 'android'){
        try{
            const fileStats = await RNFS.stat(this.state.imageUri)
            task = task.putFile(fileStats.originalFilepath)
        }catch(err){
            logError(err, false)
            task = task.putFile(this.state.imageUri)
        }
    }else{
        task = task.putFile(this.state.imageUri)
    }
    try{
      let unsubscribe = task.on(
        storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {
          // Calculate progress percentage
          let stateDeltas = {
            uploadProgress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 
          };
          if (snapshot.state === storage.TaskState.SUCCESS) {
              stateDeltas = {
                uploading: false,
                uploadProgress: 0,
                errorMessage: null,
              };
              Snackbar.show({
                text: 'Profile picture change successful', 
                duration: Snackbar.LENGTH_SHORT
              });
          }
          this.setState(stateDeltas);
        },
        (err) => {
          unsubscribe();
          logError(err, false)
          this.setState({
            uploading: false, 
            uploadProgress: 0, 
            errorMessage: "Upload Error, please try again!"
          })
       })
    }catch(err){
      logError(err)
    }
  }

    //This promise rejects if there's not enough permissions
    checkPermissions = async () => {
        try{
            if (Platform.OS == "android"){
                const permissionResults = await Promise.all([
                    check(PERMISSIONS.ANDROID.CAMERA),
                    check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE),
                    check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE)])
                const finalResults = []
                finalResults[0] = await this.requestIfNeeded(PERMISSIONS.ANDROID.CAMERA, permissionResults[0])
                finalResults[1] = await this.requestIfNeeded(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE, permissionResults[1])
                finalResults[2] = await this.requestIfNeeded(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, permissionResults[2])

                if (finalResults[1] != RESULTS.GRANTED && finalResults[1] != RESULTS.LIMITED){
                    logError(new Error ("Essential Permission not Granted, aborted"), false)
                    throw new Error("Invalid permissions")
                }
            }else{
                const permissionResults = await Promise.all([
                    check(PERMISSIONS.IOS.CAMERA),
                    check(PERMISSIONS.IOS.PHOTO_LIBRARY)])
                const finalResults = []
                finalResults[0] = await this.requestIfNeeded(PERMISSIONS.IOS.CAMERA, permissionResults[0])
                finalResults[1] = await this.requestIfNeeded(PERMISSIONS.IOS.PHOTO_LIBRARY, permissionResults[1])

                if (finalResults[1] != RESULTS.GRANTED && finalResults[1] != RESULTS.LIMITED){
                  logError(new Error ("Essential Permission not Granted, aborted"), false)
                  throw new Error("Invalid permissions")
                }
            }
        }catch (err){
            logError(err, err.message != "Invalid permissions")
            this.setState({errorMessage: "Invalid permissions!"})
            throw new Error("Invalid permissions")
        }
    }

    requestIfNeeded = async (permission, checkResult) => {
        try{
            if (checkResult == RESULTS.GRANTED || checkResult == RESULTS.LIMITED){
                return checkResult;
            }else if (checkResult == RESULTS.UNAVAILABLE || checkResult == RESULTS.BLOCKED){
                return checkResult;
            }else{
                let newStatus = await request(permission);
                return newStatus;
            }
        }catch(err){
            logError(err)
        }
    } 

    createAvatar = () => {
      Linking.openURL("https://personas.draftbit.com/")
    }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100
  },
  progressBar: {  
      backgroundColor: 'deepskyblue',  
      height: 3,
      borderRadius: 3,
      marginHorizontal: 16,
      marginTop: 8
  },
  progressBarParent:{
    width: "100%", 
    paddingHorizontal: 16, 
    alignItems: "center"
  }
});