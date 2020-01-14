import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, PanResponder } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import uuid from 'uuid/v4';

import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

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
    uploadProgress: 0
  };

  render() {
    const disabledStyle = this.state.uploading ? styles.disabledBtn : {};
    const actionBtnStyles = [styles.btn, disabledStyle];

    return (
      <View style={styles.container}>
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

  pickImage = () => {
    ImagePicker.showImagePicker(options, response => {
      if (response.didCancel) {
        alert('You cancelled image picker 😟');
      } else if (response.error) {
        alert('And error occured: ', response.error);
      } else {
        this.setState({imageUri: response.uri});
      }
    });
  };

  uploadImage = () => {
    if (!this.state.imageUri) return;
    const ext = this.state.imageUri.split('.').pop(); // Extract image extension
    const filename = `${uuid()}.${ext}`; // Generate unique name
    this.setState({ uploading: true });
    let unsubscribe = storage()
      .ref(`profilePictures/${auth().currentUser.uid}/${filename}`)
      .putFile(this.state.imageUri)
      .on(
        storage.TaskEvent.STATE_CHANGED,
        snapshot => {
          let stateDeltas = {
            uploadProgress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
          };

          if (snapshot.state === storage.TaskState.SUCCESS) {
            stateDeltas = {
              uploading: false,
              imageUri: '',
              uploadProgress: 0
            };
          }

          this.setState(stateDeltas);
        },
        error => {
          unsubscribe();
          console.log(error)
        }
    )}

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