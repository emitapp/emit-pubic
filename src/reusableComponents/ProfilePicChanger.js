//Design for this influenced by https://github.com/invertase/react-native-firebase/issues/2558
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import React, { Component } from 'react';
import { Platform, StyleSheet, View, Image, Alert, Linking } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { logError } from 'utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { Text, Button, Overlay } from 'react-native-elements'
import { SmallLoadingComponent } from 'reusables/LoadingComponents'
import Snackbar from 'react-native-snackbar';
var RNFS = require('react-native-fs');
import ProfilePicCircle from 'reusables/ProfilePicComponents';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { checkAndGetPermissions } from 'utils/AppPermissions'

const imagePickerOptions = {
  mediaType: 'photo'
};

/**
 * This is a component that is used to change the pic associated with either an
 * individual profile or a group. It manages everything itself, from permissions
 * to image selection to uploading.
 * Optinal Props: groupPic, onSuccessfulUpload, groupUid
 */
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
          onRequestClose={() => this.setState({ modalVisible: false })}
          onBackdropPress={() => this.setState({ modalVisible: false })}
          overlayStyle={{ maxWidth: "70%" }}>
          <>
            <Text style={{ textAlign: "center" }}>
              How would you like to change your {this.props.groupPic ? "group" : "profile"} pic
            </Text>
            <Button
              title="Choose image from phone"
              onPress={() => this.setState({ modalVisible: false }, this.pickImageFromGallery)}
              type='clear' />
            <Button
              title="Take image using camera"
              onPress={() => this.setState({ modalVisible: false }, this.pickImageFromCamera)}
              type='clear' />
            <MinorActionButton
              title="Close"
              onPress={() => this.setState({ modalVisible: false })} />
          </>
        </Overlay>

        <ErrorMessageText message={this.state.errorMessage} />

        <Text style={{ textAlign: "center", marginBottom: 16 }}>
          Note that your updated {this.props.groupPic ? "group" : "profile"} pic might take a few seconds to appear everywhere in the app
        </Text>

        {(!this.state.hasSuccessfullyPicked && !this.state.pickingImage) ? (
          <ProfilePicCircle
            diameter={styles.image.width}
            uid={this.props.groupPic ? this.props.groupUid : auth().currentUser.uid}
            groupPic={this.props.groupPic} />
        ) : null}

        {this.state.pickingImage && (
          <View style={{ ...styles.image, alignItems: "center", justifyContent: "center" }}>
            <SmallLoadingComponent />
          </View>
        )}

        {this.state.imageUri ? (
          <Image
            source={{ uri: this.state.imageUri }}
            style={styles.image} />
        ) : null}

        <View style={styles.progressBarParent}>
          <View style={{ ...styles.progressBar, width: `${this.state.uploadProgress}%` }} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", width: "100%", marginTop: 16 }}>
          <Button
            title="Change image"
            onPress={() => this.setState({ modalVisible: true })}
            disabled={this.state.uploading} />

          {this.state.imageUri ? (
            <Button
              title={(this.state.uploading) ? "Uploading ..." : "Upload image"}
              onPress={this.uploadImage}
              disabled={this.state.uploading} />
          ) : null}
        </View>

      </View>
    );
  }

  //When choosing the image from the gallery
  pickImageFromGallery = async () => {
    try {
      if (! await this.checkPermissions()){
        Alert.alert("Can't do that!", `We don't have enough permissions`);
        return
      }
      
      this.setState({ pickingImage: true })
      launchImageLibrary(imagePickerOptions, response => {
        if (response.errorCode) {
          Alert.alert('Whoops!', `An error occured: ${response.errorMessage}`);
        } else if (!response.didCancel) {
          this.setState({ imageUri: response.uri, hasSuccessfullyPicked: true });
        }
        this.setState({ pickingImage: false })
      });
    } catch (err) {
      this.setState({ errorMessage: err.message, pickingImage: false })
      logError(err)
    }
  };

  //When you're taking the image using the camera
  pickImageFromCamera = async () => {
    try {
      if (! await this.checkPermissions()) return;
      this.setState({ pickingImage: true })
      launchCamera(imagePickerOptions, response => {
        if (response.errorCode) {
          Alert.alert('Whoops!', `An error occured: ${response.errorMessage}`);
        } else if (!response.didCancel) {
          this.setState({ imageUri: response.uri, hasSuccessfullyPicked: true });
        }
        this.setState({ pickingImage: false })
      });
    } catch (err) {
      this.setState({ errorMessage: err.message, pickingImage: false })
      logError(err)
    }
  };

  uploadImage = async () => {
    if (!this.state.imageUri) return;
    let filename = `${uuidv4()}` // Generate unique name
    this.setState({ uploading: true });
    let task = this.props.groupPic ?
      storage().ref(`groupPictures/${this.props.groupUid}/${filename}`) :
      storage().ref(`profilePictures/${auth().currentUser.uid}/${filename}`)

    if (Platform.OS == 'android') {
      try {
        const fileStats = await RNFS.stat(this.state.imageUri)
        task = task.putFile(fileStats.originalFilepath)
      } catch (err) {
        logError(err, false)
        task = task.putFile(this.state.imageUri)
      }
    } else {
      task = task.putFile(this.state.imageUri)
    }
    try {
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
              text: `${this.props.groupPic ? "Group" : "Profile"} picture change successful`,
              duration: Snackbar.LENGTH_SHORT
            });
            if (this.props.onSuccessfulUpload) this.props.onSuccessfulUpload()
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
    } catch (err) {
      logError(err)
    }
  }

  //This promise rejects if there's not enough permissions
  checkPermissions = async () => {
    try {
      return await checkAndGetPermissions(
        {
          required: [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE],
          optional: [PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, PERMISSIONS.ANDROID.CAMERA]
        },
        {
          required: [PERMISSIONS.IOS.PHOTO_LIBRARY],
          optional: [PERMISSIONS.IOS.CAMERA]
        })
    } catch (err) {
      logError(err)
      this.setState({ errorMessage: err.message })
    }
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
  progressBarParent: {
    width: "100%",
    paddingHorizontal: 16,
    alignItems: "center"
  }
});