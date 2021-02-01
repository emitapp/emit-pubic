import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FlareTimeStatus from 'reusables/FlareTimeStatus';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import { responderStatuses } from 'utils/serverValues';


/**
 * Component for each event in a feed. Maintains state for
 * attendees and when the event is happening. 
 */
export default class FeedElement extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      attendees: {},
    }
  }

  componentDidMount() {
    const ownerID = this.props.item.owner.uid;
    const dbref = database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`);
    var callBack = (snapshot) => {
      this.setState({
        isFetchingData: true,
        // Insert the owner and a string for his attendees into the map along with the old stuff
        attendees: { ...this.state.attendees, [ownerID]: this.getAttendeesStringFromSnapshot(snapshot) }
      });
    }
    dbref.on("value", callBack);
  }

  componentWillUnmount = () => {
    const ownerID = this.props.item.owner.uid;
    database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`).off();
  }

  render() {
    const { item } = this.props
    return (
      <TouchableOpacity
        style={{ marginVertical: 8, marginLeft: 8 }}
        onPress={() => this.props.navigation.navigate('BroadcastViewer', { broadcast: item })}>

        <View style={{ flexDirection: "row" }}>

          {/* Emoji, profile pic, activity name */}
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Text style={{ fontSize: 40, marginHorizontal: 8 }}>{item.emoji}</Text>
            <View style={{ justifyContent: "center" }}>
              <Text style={{ fontSize: 20 }}>{item.activity}</Text>
              <View style={{ flexDirection: 'row' }}>
                <ProfilePicDisplayer diameter={22} uid={this.props.item.owner.uid} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontFamily: "NunitoSans-Semibold" }}>{this.props.item.owner.displayName}</Text>
              </View>
            </View>
          </View>

          <FlareTimeStatus item = {item} />

        </View>

        {/* ^ Main row ends there */}

        {this.props.item.groupInfo && <Text style={{ fontStyle: "italic" }}>Sent via {this.props.item.groupInfo.name} group</Text>}
        <View>
          {this.state.attendees[this.props.item.owner.uid] ?
            <Text>{this.state.attendees[this.props.item.owner.uid]}</Text> : <></>}
        </View>

        {this.props.item.note != undefined && this.props.item.note != "" &&
          <Text style={{ fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8 }}>{this.props.item.note}</Text>
        }

      </TouchableOpacity>
    )
  }
  /**
   * Function to take what was returned from the database call
   * and format a string representing who's attending an event.
   * @param {*} snapshot what's returned from the database
   * @returns a formatted string with who's going
   */
  getAttendeesStringFromSnapshot(snapshot) {
    const user = auth().currentUser.uid;

    const data = snapshot.val();
    let attendeesList = [];
    for (let id in data) {
      if (id != user) {
        // this is just so the user doesn't see their own username in the 
        // feed the split second before it moves to the dashboard.
        attendeesList.push(data[id]['displayName']);
      }
    }

    let string = ""
    if (attendeesList.length > 3) {
      string = `${attendeesList.pop()}, ${attendeesList.pop()} and ${attendeesList.length} 
            other people are in!`
    } else if (attendeesList.length == 3) {
      string = `${attendeesList.pop()}, ${attendeesList.pop()} and 1
            other person are in!`
    } else if (attendeesList.length == 2) {
      string = `${attendeesList.pop()} and ${attendeesList.pop()} are in!`
    } else if (attendeesList.length == 1) {
      const attendee = attendeesList.pop();
      string = `${attendee} is in!`
    }
    return string;
  }

  
  /**
   * Function to display the status for a user.
   * @return a View representing a Confirmed status if the user
   * has accepted the event. 
   */
  displayStatus = () => {
    if (!this.props.item.status) return
    if (this.props.item.status == responderStatuses.PENDING) {
      return (
        <View style={{ ...styles.statusParentStyle, backgroundColor: "dimgrey" }}>
          <MaterialIcons name="access-time" size={20} color="white" />
          <Text style={{ color: "white", fontWeight: "bold" }}> {this.props.item.status}</Text>
        </View>
      )
    } else {
      return (
        <View style={{ ...styles.statusParentStyle, backgroundColor: "green" }}>
          <MaterialCommunityIcons name="check-bold" size={20} color="white" />
          <Text style={{ color: "white", fontWeight: "bold" }}> {this.props.item.status}</Text>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  statusParentStyle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 6,
    borderRadius: 4,
    marginTop: 4
  }
});
