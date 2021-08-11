//Design for this influenced by https://github.com/invertase/react-native-firebase/issues/2558
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import { cloudFunctionStatuses } from 'utils/serverValues';
import React, { Component } from 'react';
import { Alert, Image, Platform, StyleSheet, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Button, Overlay, Text } from 'react-native-elements';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS } from 'react-native-permissions';
import Snackbar from 'react-native-snackbar';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents';
import ProfilePicCircle from 'reusables/profiles/ProfilePicComponents';
import { MinorActionButton } from 'reusables/ui/ReusableButtons';
import AvatarCreationModal from 'screens/SocialSection/AvatarCreation';
import MainTheme from 'styling/mainTheme';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import Avatar from './Avatar';
var RNFS = require('react-native-fs');


const imagePickerOptions = {
  mediaType: 'photo'
};

/**
 * This is a component that is used to change the pic associated with either an
 * individual profile or a group. It manages everything itself, from permissions
 * to image selection to uploading.
 * Optinal Props: groupPic, onSuccessfulUpload, groupUid, hideNote
 */
export default class ProfilePicChanger extends Component {

  avatarModal = null

  state = {
    //For conventional image upload
    imageUri: '',
    pickingImage: false,
    uploadProgress: 0,

    //For avatar seeds
    avatarSeed: "",

    //Stays true the moment the user successfully picked a pic at least once
    hasSuccessfullyPicked: false,
    uploading: false,

    errorMessage: null,
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
            {!this.props.groupPic &&
              <Button
                title="Create An Avatar"
                onPress={() => this.setState({ modalVisible: false }, this.openAvatarModal)}
                type='clear' />
            }
            <MinorActionButton
              title="Close"
              onPress={() => this.setState({ modalVisible: false })} />
          </>
        </Overlay>

        <ErrorMessageText message={this.state.errorMessage} />

        <AvatarCreationModal ref={r => this.avatarModal = r} onSubmit={this.pickAvatar} />

        {!this.props.hideNote && <Text style={{ textAlign: "center", marginBottom: 16 }}>
          Note that your updated {this.props.groupPic ? "group" : "profile"} pic might take a few
          seconds to appear everywhere in the app
        </Text>}

        <View style={{ alignItems: "center", justifyContent: "center" }}>
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

          {this.state.avatarSeed ? (
            <Avatar
              seed={this.state.avatarSeed}
              style={styles.image} />
          ) : null}

          <AnimatedCircularProgress
            size={styles.image.width + 40}
            width={15}
            fill={this.state.uploadProgress}
            tintColor="orange"
            style={{ position: 'absolute', alignSelf: "center" }}
            lineCap="round" />
        </View>

        <View style={{ justifyContent: "center", marginTop: 16 }}>


          {(this.state.imageUri || this.state.avatarSeed) ? (
            <>
              <Button
                title={(this.state.uploading) ? "Uploading ..." : "Save"}
                onPress={this.uploadImageOrSeed}
                disabled={this.state.uploading}
                buttonStyle={{ backgroundColor: MainTheme.colors.bannerButtonGreen }} />

              <MinorActionButton
                title="Choose another image"
                onPress={() => this.setState({ modalVisible: true })}
                disabled={this.state.uploading} />
            </>
          ) : (
            <Button
              title="Change image"
              onPress={() => this.setState({ modalVisible: true })}
              disabled={this.state.uploading} />
          )}
        </View>

      </View>
    );
  }

  //When choosing the image from the gallery
  pickImageFromGallery = async () => {
    try {
      if (! await this.checkPermissions()) {
        Alert.alert("Can't do that!", `We don't have enough permissions`);
        return
      }

      this.setState({ pickingImage: true })
      launchImageLibrary(imagePickerOptions, response => {
        if (response.errorCode) {
          Alert.alert('Whoops!', `An error occured: ${response.errorMessage}`);
        } else if (!response.didCancel) {
          this.setState({ imageUri: response.uri, hasSuccessfullyPicked: true, avatarSeed: "" });
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
          this.setState({ imageUri: response.uri, hasSuccessfullyPicked: true, avatarSeed: "" });
        }
        this.setState({ pickingImage: false })
      });
    } catch (err) {
      this.setState({ errorMessage: err.message, pickingImage: false })
      logError(err)
    }
  };

  openAvatarModal = () => {
    this.avatarModal.open()
  }

  pickAvatar = (avatarSeed) => {
    this.setState({ avatarSeed, hasSuccessfullyPicked: true, imageUri: "" })
  }

  uploadImageOrSeed = () => {
    if (this.state.imageUri) this.uploadImage()
    if (this.state.avatarSeed) this.uploadAvatar()
  }

  uploadImage = async () => {
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
            this.onSuccessfulUpload()
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

  uploadAvatar = async () => {
    try {
      this.setState({ uploading: true })
      const response = await timedPromise(
        functions().httpsCallable('chooseAvatarSeed')(this.state.avatarSeed), LONG_TIMEOUT);
      if (response.data.status === cloudFunctionStatuses.OK) {
        this.onSuccessfulUpload()
      } else {
        this.setState({ errorMessage: "Couldn't get recommended contacts" })
        logError(new Error(`Problematic chooseAvatarSeed function response: ${response.data.message}`))
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
      this.setState({ errorMessage: "Couldn't upload avatar!" })
    } finally {
      this.setState({ uploading: false })
    }
  }

  onSuccessfulUpload = () => {
    Snackbar.show({
      text: `${this.props.groupPic ? "Group" : "Profile"} picture change successful`,
      duration: Snackbar.LENGTH_SHORT
    });
    if (this.props.onSuccessfulUpload) this.props.onSuccessfulUpload()
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
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100
  }
});