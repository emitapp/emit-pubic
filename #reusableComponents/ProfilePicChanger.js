//Design for this influenced by https://github.com/invertase/react-native-firebase/issues/2558
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import React, { Component } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { logError } from 'utils/helpers';
import uuid from 'uuid/v4';

var RNFS = require('react-native-fs');

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
    uploadProgress: 0,
    errorMessage: null
  };

  render() {
    const disabledStyle = this.state.uploading ? styles.disabledBtn : {};
    const actionBtnStyles = [styles.btn, disabledStyle];

    return (
      <View style={styles.container}>
        {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
        <Text style={styles.welcome}>React Native Firebase Image Upload </Text>
        <Text style={styles.instructions}>Hello 👋, Let us upload an Image</Text>

        <TouchableOpacity style={actionBtnStyles} onPress={this.pickImage} disabled = {this.state.uploading}>
            <Text style={styles.btnTxt}>Pick image</Text>
        </TouchableOpacity>

        {this.state.imageUri ? (
          <Image
            source={{ uri: this.state.imageUri }}
            style={styles.image}/>
        ) : (
          <Text>Select an Image!</Text>
        )}

        <View style={[styles.progressBar, { width: `${this.state.uploadProgress}%` }]}/>

        <TouchableOpacity
            style={actionBtnStyles}
            onPress={this.uploadImage}
            disabled={this.state.uploading}>
            <Text style={styles.btnTxt}>{(this.state.uploading) ? "Uploading ..." : "Upload image"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  pickImage = async () => {
      try{
        await this.checkPermissions();
        ImagePicker.showImagePicker(options, response => {
            if (response.didCancel) {
              alert('You cancelled image picker 😟');
            } else if (response.error) {
              alert('And error occured: ', response.error);
            } else {
              this.setState({imageUri: response.uri});
            }
        });
      }catch(err){
          logError(err)
      }
  };

  uploadImage = async () => {
    if (!this.state.imageUri) return;
    let filename = `${uuid()}` // Generate unique name
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
        snapshot => {
        let stateDeltas = {
            uploadProgress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
        };
          if (snapshot.state === storage.TaskState.SUCCESS) {
              stateDeltas = {
              uploading: false,
              imageUri: '',
              uploadProgress: 0,
              errorMessage: null
              };
          }

          this.setState(stateDeltas);
        },
        error => {
        unsubscribe();
        logError(err, false)
        this.setState({uploading: false, uploadProgress: 0, errorMessage: "Upload Error, please try again!"})
       })
    }catch(err){
      logError(err)
    }
  }

    //Rejcests if there's not enough permissions
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

                if (finalResults[1] != RESULTS.GRANTED){
                    logError(new Error ("Essential Permission not Granted, aborted"), false)
                    throw "invalid permission combination"
                }
            }else{
                const permissionResults = await Promise.all([
                    check(PERMISSIONS.IOS.CAMERA),
                    check(PERMISSIONS.IOS.PHOTO_LIBRARY)])
                const finalResults = []
                finalResults[0] = await this.requestIfNeeded(PERMISSIONS.IOS.CAMERA, permissionResults[0])
                finalResults[1] = await this.requestIfNeeded(PERMISSIONS.IOS.PHOTO_LIBRARY, permissionResults[1])

                if (finalResults[1] != RESULTS.GRANTED){
                  logError(new Error ("Essential Permission not Granted, aborted"), false)
                  throw "invalid permission combination"
                }
            }
        }catch (err){
            logError(err, err != "invalid permission combination")
            throw "invalid permission combination"
        }
    }

    requestIfNeeded = async (permission, checkResult) => {
        try{
            if (checkResult == RESULTS.GRANTED){
                return checkResult;
            }else if (checkResult == RESULTS.UNAVAILABLE || checkResult == RESULTS.BLOCKED){
                return checkResult;
            }else{
                newStatus = await request(permission);
                return newStatus;
            }
        }catch(err){
            logError(err)
        }
    } 

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  btn: {
    borderWidth: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    borderColor: 'rgba(0,0,0,0.3)',
    backgroundColor: 'rgb(68, 99, 147)'
  },
  btnTxt: {
    color: '#fff'
  },
  disabledBtn: {
    backgroundColor: 'rgba(3,155,229,0.5)'
  },
  image: {
    marginTop: 20,
    minWidth: 200,
    height: 200
  },
  progressBar: {  
      backgroundColor: 'rgb(3, 154, 229)',  
      height: 3,  
      shadowColor: '#000'
  }
});