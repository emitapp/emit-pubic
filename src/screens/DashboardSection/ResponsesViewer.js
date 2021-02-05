import database from '@react-native-firebase/database';
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
import { shareFlare } from 'utils/helpers';


/**
 * Class for viewing info about a broadcast (owner side).
 * Only prop used is for navigation.
 */
export default class ResponsesViewer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      attendees: [],
      errorMessage: null,
      isModalVisible: false,
      showConfirmed: false
    }

    this.broadcastSnippet = this.props.navigation.getParam('broadcast', null)
  }

  componentDidMount = () => {
    if (!this.broadcastSnippet) return
    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .on('value', snap => this.updateAttendees(snap.val()))
  }

  componentWillUnmount = () => {
    if (!this.broadcastSnippet) return
    database()
      .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
      .off()
  }

  render() {
    // TODO: ResponsesViewer shares many similarities with BroadcastViewer - they should eventually be
    // replaced by an abstracted reusableComponent that can function in place of both
    if (!this.broadcastSnippet) return (<TimeoutLoadingComponent hasTimedOut={false} retryFunction={() => null} />)

    return (
      <View style={{ ...S.styles.containerFlexStart, alignItems: "flex-start", marginHorizontal: 16 }}>

        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        <ErrorMessageText message={this.state.errorMessage} />

        <Button
          icon={<AwesomeIcon name="share-square" size={30} color="black" />}
          containerStyle={{ position: 'absolute', top: 8, left: 8 }}
          onPress={() => shareFlare(this.broadcastSnippet)}
          type="clear"
        />

        <View style={{ width: "100%" }}>

          <View style={{ alignItems: "center", marginBottom: 25, marginTop: 25 }}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ alignItems: "center", justifyContent: "center", marginTop: -16, marginBottom: 8, marginRight: 8 }}>
                {this.broadcastSnippet.emoji ? <Text style={{ fontSize: 50 }}>{this.broadcastSnippet.emoji}</Text> : <Text style={{ fontSize: 50 }}>🍲</Text>}
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <View style={{ justifyContent: "center" }}>
                <ProfilePicDisplayer diameter={32} uid={this.broadcastSnippet.owner.uid} />
              </View>
              <Text style={{ marginLeft: 4, marginBottom: 8, color: "#3F83F9" }}>{this.broadcastSnippet.owner.displayName}</Text>
            </View>

            <FlareTimeStatus item={this.broadcastSnippet} />
          </View>

          <Divider style={{ marginBottom: 8 }} />

          {this.broadcastSnippet.location != undefined &&
            <View>
              <Text style={{ fontSize: 24, marginLeft: 4, color: "grey", marginBottom: 8 }}>Location</Text>
              <Text style={{ fontSize: 18, marginLeft: 4 }}>{this.broadcastSnippet.location}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {this.broadcastSnippet.geolocation &&
                  <Button
                    icon={<Icon name="location-pin" size={20} color="white" />}
                    onPress={this.openLocationOnMap}
                    containerStyle={{ marginRight: 8, marginLeft: 0 }}
                  />}
              </View>
            </View>
          }

          {this.broadcastSnippet.note != undefined &&
            <View>
              <Text style={{ marginTop: 8, fontSize: 24, marginLeft: 4, color: "grey" }}>
                Note
                </Text>
              <AutolinkText style={{ marginTop: 8, fontSize: 16, marginLeft: 4 }}>{this.broadcastSnippet.note}</AutolinkText>
            </View>
          }
        </View>

        {(this.broadcastSnippet && this.broadcastSnippet.locked) &&
          <LockNotice message={"This broadcast has reached the response limit it's creator set. It won't receive any more responses."} />
        }

        {this.broadcastSnippet &&
          <View >
            <Text style={{ marginTop: 8, fontSize: 24, marginLeft: 4, marginBottom: 4, color: "grey" }}>
              Who's In
            </Text>
            <Text style={{ alignSelf: "center", marginLeft: 4, marginBottom: 4 }}>{this.broadcastSnippet.totalConfirmations} user(s) are in!</Text>
            <View style={{ height: 36 }}>
              {this.state.attendees.length > 0 &&
                <ProfilePicList
                  uids={this.state.attendees}
                  diameter={36}
                  style={{ marginLeft: 0, marginRight: 2 }} />}
            </View>
          </View>
        }

        <Button
          title="Chat"
          //TODO: Would a deep copy of this.broadcastSnippet be a good idea? Probably
          //Will think about later
          onPress={() => this.props.navigation.navigate("ChatScreen", { broadcast: this.broadcastSnippet })}
          containerStyle={{ alignSelf: "center" }} />
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

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement
        snippet={item}
        onPress={null} />
    );
  }

  openLocationOnMap = () => {
    let geolocation = this.state.this.broadcastSnippet.geolocation
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