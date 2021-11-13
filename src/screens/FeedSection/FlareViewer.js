import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Divider, Overlay, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import LockNotice from 'reusables/flares/BroadcastLockNotice';
import FlareTimeStatus from 'reusables/flares/FlareTimeStatus';
import PublicFlareNotice from 'reusables/flares/PublicFlareNotice';
import FriendReqModal from 'reusables/FriendReqModal';
import ProfilePicDisplayer, { ProfilePicList } from 'reusables/profiles/ProfilePicComponents';
import AutolinkText from 'reusables/ui/AutolinkText';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { DefaultLoadingModal, TimeoutLoadingComponent } from 'reusables/ui/LoadingComponents';
import { MinorActionButton } from 'reusables/ui/ReusableButtons';
import { analyticsFlareJoined, analyticsFlareLeft, analyticsFlareViewed, analyticsVideoChatUsed } from 'utils/analyticsFunctions';
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, shareFlare, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, PUBLIC_FLARE_COL_GROUP, responderStatuses } from 'utils/serverValues';
import Emoji from 'reusables/ui/Emoji'

/**
 * Class for viewing info about a broadcast.
 * Only prop used is for navigation.
 */
export default class FlareViewer extends React.Component {

  constructor(props) {
    super(props);

    this.broadcastSnippet = this.props.navigation.getParam('broadcast', { uid: " ", owner: { uid: " " } })
    this.isPublicFlare = this.props.navigation.getParam('isPublicFlare', false)
    this.isFlareOwner = auth().currentUser.uid == this.broadcastSnippet.owner.uid

    this.state = {
      attendees: [],
      errorMessage: null,
      //If the viewer is the flare owner the expectation is that they're 
      //coming from a screen that already had all the info about the flare
      broadcastData: this.isFlareOwner ? this.broadcastSnippet : null,
      // normal modal is the internie loading modal
      isModalVisible: false,
      // context modal is the owner's flare editing functionality
      isFlareOptionsModalVisible: false,
      jitsiUsername: null,
      showConfirmed: false
    }

  }

  componentDidMount = () => {

    if (!this.isFlareOwner) analyticsFlareViewed()

    let domainHash = ""
    if (this.isPublicFlare) {
      domainHash = this.broadcastSnippet.hashedDomain
      if (!domainHash) {
        this.setState({ errorMessage: "Missing domain info!" })
        return
      }
    }

    if (this.isPublicFlare && !this.isFlareOwner) {
      const ref = firestore().collection("publicFlares").doc(domainHash).collection(PUBLIC_FLARE_COL_GROUP)
      this.unsubscriber = ref.doc(this.broadcastSnippet.uid).onSnapshot({
        error: (err) => {
          this.setState({ errorMessage: err.message })
          logError(err)
        },
        next: (snapshot) => {
          const data = snapshot.data()
          this.setState({ broadcastData: data, attendees: data.responders })
        }
      })
    } else if (!this.isPublicFlare) {

      if (!this.isFlareOwner) {
        database()
          .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
          .on('value', snap => this.setState({ broadcastData: snap.val() }))
      }

      database()
        .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
        .on('value', snap => this.updateAttendeesForPrivateFlare(snap.val()))
    }

    this.getUsernameForJitsi()
  }

  componentWillUnmount = () => {
    if (this.isPublicFlare) {
      if (this.unsubscriber) this.unsubscriber()
    } else {
      database()
        .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
        .off()

      database()
        .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
        .off()
    }
  }

  render() {
    const { broadcastData } = this.state
    return (
      <ScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{ alignItems: "flex-start", marginHorizontal: 16 }}>

        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        <ErrorMessageText message={this.state.errorMessage} />
        {!broadcastData &&
          <TimeoutLoadingComponent hasTimedOut={false} retryFunction={() => null} />
        }

        <Overlay
          isVisible={this.state.isFlareOptionsModalVisible}
          onRequestClose={() => this.setState({ isFlareOptionsModalVisible: false })}
          onBackdropPress={() => this.setState({ isFlareOptionsModalVisible: false })}
          overlayStyle={{ maxWidth: "70%" }}>
          <>
            <Button
              title={"Edit flare"}
              titleStyle={{ marginLeft: 10 }}
              icon={<AwesomeIcon name="edit" size={22} color="#FA6C13" />}
              onPress={this.editFlare}
              type='clear' />
            <Button
              title="Delete flare"
              titleStyle={{ marginLeft: 10 }}
              icon={<AwesomeIcon name="trash-alt" size={22} color="#FA6C13" />}
              onPress={this.deleteFlare}
              type='clear' />
            <MinorActionButton
              title="Close"
              onPress={() => this.setState({ isFlareOptionsModalVisible: false })} />
          </>
        </Overlay>

        <FriendReqModal
          ref={modal => this.friendRequestModal = modal} />

        {broadcastData &&
          <View style={{ width: "100%" }}>

            <View style={{ alignItems: "center", marginBottom: 25, marginTop: 25 }}>

              <View style={{ flexDirection: "row" }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: -16, marginBottom: 8, marginHorizontal: 64 }}>
                  <Emoji size={36} emoji={broadcastData.emoji} />
                  <Text style={{ fontSize: 24, textAlign: "center" }}>{broadcastData.activity}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Pressable onPress={this.friendRequestModal ? () => this.friendRequestModal.openUsingUid(this.broadcastSnippet.owner.uid) : null}>
                  <ProfilePicDisplayer
                    diameter={32}
                    uid={this.broadcastSnippet.owner.uid}
                  />
                </Pressable>
                <Text style={{ color: "#3F83F9", marginLeft: 8 }}>{this.broadcastSnippet.owner.displayName}</Text>
              </View>


              {broadcastData.recurringDays?.length > 0 &&
                <Text>Recurring: {broadcastData.recurringDays.join("/")} </Text>
              }

              <FlareTimeStatus item={broadcastData} fullInfo center />
              {this.isPublicFlare && <PublicFlareNotice flareInfo={broadcastData} style={{ marginTop: 8 }} />}
            </View>

            <Divider style={{ marginBottom: 8 }} />

            {broadcastData.location != undefined &&
              <View>
                <Text style={{ fontSize: 24, marginLeft: 4, color: "grey", marginBottom: 8 }}>Location</Text>
                <Text style={{ fontSize: 18, marginLeft: 4 }}>{broadcastData.location}</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {broadcastData.geolocation &&
                    <Button
                      icon={<Icon name="location-pin" size={20} color="white" />}
                      title={` View on ${Platform.OS == "android" ? "Google" : "Apple"} Maps`}
                      onPress={this.openLocationOnMap}
                      containerStyle={{ marginRight: 8, marginLeft: 0 }}
                    />}
                </View>
              </View>
            }

            {broadcastData.note != undefined &&
              <View>
                <Text style={{ marginTop: 8, fontSize: 24, marginLeft: 4, color: "grey" }}>
                  Note
                </Text>
                <AutolinkText style={{ marginTop: 8, fontSize: 16, marginLeft: 4 }}>{broadcastData.note}</AutolinkText>
              </View>
            }
          </View>
        }

        {(broadcastData && broadcastData.locked) &&
          <LockNotice message={"This broadcast has reached the response limit it's creator set. It won't receive any more responses."} />
        }

        {broadcastData &&
          <View >
            <Text style={{ marginTop: 8, fontSize: 24, marginLeft: 4, marginBottom: 4, color: "grey" }}>
              Who's In
            </Text>
            <Text style={{ alignSelf: "center", marginLeft: 4, marginBottom: 4 }}>{broadcastData.totalConfirmations} user(s) are in!</Text>
            <View style={{ height: 36 }}>
              {this.state.attendees.length > 0 &&
                <ProfilePicList
                  uids={this.state.attendees}
                  diameter={36}
                  style={{ marginLeft: 0, marginRight: 2 }}
                  onPress={this.friendRequestModal ? this.friendRequestModal.openUsingUid : null} />}
            </View>
          </View>
        }

        {broadcastData && this.displayBroadcastAction()}

        {/* Commented out due to Emit end of life (had been broken for public flares for a while now anyways) */}
        {/* 
        <Button
          icon={<AwesomeIcon name="share-square" size={20} color="grey" />}
          containerStyle={{ position: 'absolute', top: 8, left: 0 }}
          onPress={() => shareFlare(this.broadcastSnippet)}
          type="clear"
        /> */}

        {this.isFlareOwner && <Button
          icon={<AwesomeIcon name="ellipsis-h" size={18} color="grey" />}
          containerStyle={{ position: 'absolute', top: 8, right: 0 }}
          onPress={() => this.setState({ isFlareOptionsModalVisible: true })}
          type="clear"
        />}

      </ScrollView>
    )
  }
  /**
   * Method to update the list of attendees with
   * whatever data comes from the database call
   * @param {*} data, a dictionary, the result of snapshot.val()
   */
  updateAttendeesForPrivateFlare = (data) => {
    var attendeesNew = []
    for (var id in data) {
      attendeesNew.push(id)
    }
    this.setState({ attendees: attendeesNew })
  }

  getUsernameForJitsi = async () => {
    if (this.isFlareOwner) {
      this.setState({ jitsiUsername: this.broadcastSnippet.owner.username })
      return
    }
    try {
      const uid = auth().currentUser.uid;
      const ref = database().ref(`/userSnippets/${uid}`);
      const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
      if (snapshot.exists()) this.setState({ jitsiUsername: snapshot.val().username })
    } catch (err) {
      this.setState({ jitsiUsername: "-" })
      if (err.name != "timeout") logError(err)
    }
  }

  displayBroadcastAction = () => {
    if (!this.isFlareOwner && !this.hasJoinedFlare()) {
      return (
        <View style={{ alignSelf: "center", marginTop: 40 }}>
          <Button
            title="I'm In"
            onPress={() => this.isPublicFlare ? this.respondToPublicFlare(true) : this.respondToPrivateFlare(true)}
            containerStyle={{ alignSelf: "center" }} />
          <Text>Joining gives you access to this flare's chat room.</Text>
        </View>
      )
    } else {
      return (
        <View style={{ flexDirection: "row", alignSelf: "center", marginTop: 60 }}>

          {(!this.isFlareOwner && this.hasJoinedFlare()) &&
            <Button
              title="I'm Out"
              onPress={() => this.isPublicFlare ? this.respondToPublicFlare(false) : this.respondToPrivateFlare(false)}
              containerStyle={{ alignSelf: "center" }} />
          }

          <Button
            title="Chat"
            //TODO: Would a deep copy of this.broadcastSnippet be a good idea? Probably
            //Will think about later
            onPress={() => this.props.navigation.navigate("ChatScreen", { broadcast: this.broadcastSnippet, isPublicFlare: this.isPublicFlare })}
            containerStyle={{ alignSelf: "center" }} />

          <Button
            title="Video Chat 📹"
            containerStyle={{ alignSelf: "center" }}
            onPress={() => {
              Linking.openURL(encodeURI(`https://meet.jit.si/${this.broadcastSnippet.uid}#userInfo.displayName="${this.state.jitsiUsername}"&config.disableDeepLinking=true`))
              analyticsVideoChatUsed({ ...this.broadcastSnippet, isPublicFlare: false })
            }} />
        </View>
      )
    }
  }


  /**
   * Calls cloud function that will either 
   * confirm a user for an event, or take a user off an event
   * depending on the confirm parameter
   * @param {*} isJoining a boolean, if true will confirm a user
   * otherwise, it will take them off the broadcast
   */
  respondToPrivateFlare = async (isJoining) => {
    this.setState({ isModalVisible: true })
    try {
      const requestFunction = functions().httpsCallable('setBroadcastResponse');

      const response = await timedPromise(requestFunction({
        broadcasterUid: this.broadcastSnippet.owner.uid,
        broadcastUid: this.broadcastSnippet.uid,
        attendOrRemove: isJoining
      }), LONG_TIMEOUT);

      if (isJoining && response.data.status === cloudFunctionStatuses.OK) {
        this.broadcastSnippet.status = responderStatuses.CONFIRMED
      } else if (response.data.status === cloudFunctionStatuses.OK) {
        this.broadcastSnippet.status = responderStatuses.CANCELLED
      } else {
        this.setState({ errorMessage: response.data.message })
        logError(new Error("Problematic setBroadcastResponse function response: " + response.data.message))
      }

      if (response.data.status === cloudFunctionStatuses.OK) {
        if (isJoining) analyticsFlareJoined({ ...this.broadcastSnippet, isPublicFlare: false })
        else analyticsFlareLeft({ ...this.broadcastSnippet, isPublicFlare: false })
      }

    } catch (err) {
      if (err.name != "timeout") logError(err)
      this.setState({ errorMessage: err.message })
    }
    this.setState({ isModalVisible: false })

    // TODO: very hacky workaround for ref.on not updating properly. Fix this after investigating.
    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .once('value').then(snap => this.updateAttendeesForPrivateFlare(snap.val()))
  }


  /**
 * Makes the user respond to the public flare
 * @param {*} confirm a boolean, if true the user will join, if false they will leave
 */
  respondToPublicFlare = async (isJoining) => {
    this.setState({ isModalVisible: true })
    try {
      const requestFunction = functions().httpsCallable('respondToPublicFlare');

      const response = await timedPromise(requestFunction({
        flareUid: this.broadcastSnippet.uid,
        isJoining
      }), LONG_TIMEOUT);

      if (response.data.status !== cloudFunctionStatuses.OK) {
        this.setState({ errorMessage: response.data.message })
        logError(new Error("Problematic setBroadcastResponse function response: " + response.data.message))
      } else {
        if (isJoining) analyticsFlareJoined({ ...this.broadcastSnippet, isPublicFlare: true })
        else analyticsFlareLeft({ ...this.broadcastSnippet, isPublicFlare: true })
      }

    } catch (err) {
      if (err.name != "timeout") logError(err)
      this.setState({ errorMessage: err.message })
    }
    this.setState({ isModalVisible: false })
  }


  openLocationOnMap = () => {
    let geolocation = this.state.broadcastData.geolocation
    let pinTitle = `${this.broadcastSnippet.owner.username}'s planned location`
    let url = ""
    if (Platform.OS == "android") {
      url = `geo:0,0?q=${geolocation.latitude},${geolocation.longitude}(${pinTitle})`
    } else {
      url = `http://maps.apple.com/?ll=${geolocation.latitude},${geolocation.longitude}`
      url += `&q=${encodeURIComponent(pinTitle)}`
    }
    Linking.openURL(url)
  }

  hasJoinedFlare = () => {
    if (this.isPublicFlare) {
      if (!this.state.broadcastData) return false
      return this.state.broadcastData.responders.includes(auth().currentUser.uid)
    }
    return (this.broadcastSnippet.status && this.broadcastSnippet.status != responderStatuses.CANCELLED)
  }

  editFlare = () => {
    this.setState({ isFlareOptionsModalVisible: false })
    this.props.navigation.navigate('NewBroadcastForm', {
      needUserConfirmation: false,
      broadcastSnippet: this.broadcastSnippet,
      isEditing: true,
      isPublicFlare: this.isPublicFlare
    })
  }

  deleteFlare = () => {
    Alert.alert("Delete Flare?", "Are you sure you want to cancel this flare?", [
      {
        text: 'Confirm',
        onPress: async () => {
          this.setState({ isFlareOptionsModalVisible: false, isModalVisible: true })
          try {
            let params = { ownerUid: this.broadcastSnippet.owner.uid, flareUid: this.broadcastSnippet.uid }
            let broadcastFunction = functions().httpsCallable(this.isPublicFlare ? 'deletePublicFlare' : 'deleteBroadcast');
            const response = await timedPromise(broadcastFunction(params), LONG_TIMEOUT);
            if (response.data.status === cloudFunctionStatuses.OK) {
              this.props.navigation.navigate('Feed')
            } else {
              this.setState({ errorMessage: response.data.message })
              logError(new Error("Problematic createActiveBroadcast function response: " + response.data.message))
            }
          } catch (err) {
            if (err.name == "timeout") {
              this.setState({ errorMessage: "Timeout!" })
            } else {
              this.setState({ errorMessage: err.message })
              logError(err)
            }
          }
          this.setState({ isModalVisible: false })
        },
        style: "destructive",
      },
      {
        text: 'Cancel',
        onPress: () => { },
        style: "cancel",
      },
    ]);
  }
}