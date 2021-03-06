import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import AutolinkText from 'reusables/AutolinkText';
import LockNotice from 'reusables/BroadcastLockNotice';
import ErrorMessageText from 'reusables/ErrorMessageText';
import FlareTimeStatus from 'reusables/FlareTimeStatus';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import ProfilePicDisplayer, { ProfilePicList } from 'reusables/ProfilePicComponents';
import S from "styling";
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, shareFlare, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, responderStatuses } from 'utils/serverValues';

/**
 * Class for viewing info about a broadcast.
 * Only prop used is for navigation.
 */
export default class BroadcastViewer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      attendees: [],
      errorMessage: null,
      broadcastData: null,
      isModalVisible: false,
      userSnippet: null,
      showConfirmed: false
    }
    this.broadcastSnippet = this.props.navigation.getParam('broadcast', { uid: " ", owner: { uid: " " } })
  }

  componentDidMount = () => {
    database()
      .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
      .on('value', snap => this.setState({ broadcastData: snap.val() }))

    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .on('value', snap => this.updateAttendees(snap.val()))
    this.getUserSnippet()
  }

  componentWillUnmount = () => {
    database()
      .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
      .off()

    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .off()
  }

  render() {
    const { broadcastData } = this.state
    return (
      <View style={{ ...S.styles.containerFlexStart, alignItems: "flex-start", marginHorizontal: 16 }}>

        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        <ErrorMessageText message={this.state.errorMessage} />
        {!broadcastData &&
          <TimeoutLoadingComponent hasTimedOut={false} retryFunction={() => null} />
        }

        {broadcastData &&
          <View style={{ width: "100%" }}>

            <View style={{ alignItems: "center", marginBottom: 25, marginTop: 25 }}>
              <View style={{ flexDirection: "row" }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: -16, marginBottom: 8, marginRight: 8 }}>
                  <Text style={{ fontSize: 36 }}>{broadcastData.emoji}</Text>
                  <Text style={{ fontSize: 24 }}>{broadcastData.activity}</Text>
                </View>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{broadcastData.location}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <View style={{ justifyContent: "center" }}>
                  <ProfilePicDisplayer diameter={32} uid={this.broadcastSnippet.owner.uid} />
                </View>
                <Text style={{ marginLeft: 4, marginBottom: 8, color: "#3F83F9" }}>{this.broadcastSnippet.owner.displayName}</Text>
              </View>

              <FlareTimeStatus item={broadcastData} />

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
                  style={{ marginLeft: 0, marginRight: 2 }} />}
            </View>
          </View>
        }

        {broadcastData && this.displayBroadcastAction()}

        <Button
          icon={<AwesomeIcon name="share-square" size={30} color="black" />}
          containerStyle={{ position: 'absolute', top: 8, left: 8 }}
          onPress={() => shareFlare(this.broadcastSnippet)}
          type="clear"
        />

      </View>
    )
  }
  /**
   * Method to update the list of attendees with
   * whatever data comes from the database call
   * @param {*} data, a dictionary, the result of snapshot.val()
   */
  updateAttendees = (data) => {
    var attendeesNew = []
    for (var id in data) {
      attendeesNew.push(id)
    }
    this.setState({ attendees: attendeesNew })
  }

  getUserSnippet = async () => {
    try {
      const uid = auth().currentUser.uid;
      const ref = database().ref(`/userSnippets/${uid}`);
      const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
      if (snapshot.exists()) {
        this.setState({ userSnippet: snapshot.val() })
      }
    } catch (err) {
      this.setState({ userSnippet: { displayName: "-", username: "-" } })
      if (err.name != "timeout") logError(err)
    }
  }

  displayBroadcastAction = () => {
    if (!this.broadcastSnippet.status || this.broadcastSnippet.status == responderStatuses.CANCELLED) {
      return (
        <View style={{ alignSelf: "center", marginTop: 60 }}>
          <Button
            title="I'm In"
            onPress={() => this.sendConfirmOrCancelRequest(true)}
            containerStyle={{ alignSelf: "center" }} />
        </View>
      )
    } else {
      return (
        <View style={{ flexDirection: "row", alignSelf: "center", marginTop: 60 }}>
          <Button
            title="I'm Out"
            onPress={() => this.sendConfirmOrCancelRequest(false)}
            containerStyle={{ alignSelf: "center" }} />
          <Button
            title="Chat"
            //TODO: Would a deep copy of this.broadcastSnippet be a good idea? Probably
            //Will think about later
            onPress={() => this.props.navigation.navigate("ChatScreen", { broadcast: this.broadcastSnippet })}
            containerStyle={{ alignSelf: "center" }} />

          <Button
            title="Video Chat 📹"
            containerStyle={{ alignSelf: "center" }}
            onPress={() => Linking.openURL(encodeURI(`https://meet.jit.si/${this.broadcastSnippet.uid}#userInfo.displayName="${this.state.userSnippet.username}"&config.disableDeepLinking=true`))} />
        </View>
      )
    }
  }
  /**
   * Calls cloud function that will either 
   * confirm a user for an event, or take a user off an event
   * depending on the confirm parameter
   * @param {*} confirm a boolean, if true will confirm a user
   * otherwise, it will take them off the broadcast
   */
  sendConfirmOrCancelRequest = async (confirm) => {
    this.setState({ isModalVisible: true })
    try {
      const requestFunction = functions().httpsCallable('setBroadcastResponse');

      const response = await timedPromise(requestFunction({
        broadcasterUid: this.broadcastSnippet.owner.uid,
        broadcastUid: this.broadcastSnippet.uid,
        attendOrRemove: confirm
      }), LONG_TIMEOUT);

      if (confirm && response.data.status === cloudFunctionStatuses.OK) {
        this.broadcastSnippet.status = responderStatuses.CONFIRMED
      } else if (response.data.status === cloudFunctionStatuses.OK) {
        this.broadcastSnippet.status = responderStatuses.CANCELLED
      } else {
        this.setState({ errorMessage: response.data.message })
        logError(new Error("Problematic setBroadcastResponse function response: " + response.data.message))
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
      this.setState({ errorMessage: err.message })
    }
    this.setState({ isModalVisible: false })

    // TODO: very hacky workaround for ref.on not updating properly. Fix this after investigating.
    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .once('value').then(snap => this.updateAttendees(snap.val()))

    const rerender = this.props.navigation.getParam('rerenderCallback');
    rerender && rerender();
  }

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement
        snippet={item}
        onPress={null} />
    );
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
}