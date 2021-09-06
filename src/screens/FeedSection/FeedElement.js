import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FlareTimeStatus from 'reusables/flares/FlareTimeStatus';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';
import PublicFlareNotice from 'reusables/flares/PublicFlareNotice';
import RecurringFlareNotice from 'reusables/flares/RecurringFlareNotice';
import NavigationService from 'utils/NavigationService';

/**
 * Component for each event in a feed. Maintains state for
 * attendees and when the event is happening. 
 * Props: item (the flare), isPublicFlare (optional, assumes false)
 */
export default class FeedElement extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      attendeesInfo: ""
    }
  }

  componentDidMount() {
    if (!this.props.isPublicFlare) {
      const ownerID = this.props.item.owner.uid;
      const dbref = database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`);
      var callBack = (snapshot) => {
        this.setState({ attendeesInfo: this.formatAttendeeInfo(snapshot) });
      }
      dbref.on("value", callBack);
    }
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
        onPress={() => NavigationService.push("FlareViewer", { broadcast: item, isPublicFlare: this.props.isPublicFlare })}>

        <View style={{ flexDirection: "row" }}>

          {/* Emoji, profile pic, activity name */}
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Text style={{ fontSize: 36, marginHorizontal: 8 }}>{item.emoji}</Text>
            {/* flexShrink important to prevent flare activity from bleeding out of parent  */}
            <View style={{ justifyContent: "center", flexShrink: 1}}> 
              <Text style={{ fontSize: 18 }}>{item.activity}</Text>
              <View style={{ flexDirection: 'row' }}>
                <ProfilePicDisplayer diameter={22} uid={this.props.item.owner.uid} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontFamily: "NunitoSans-Semibold" }}>{this.props.item.owner.displayName}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.recurringDays?.length > 0 && <RecurringFlareNotice days={item.recurringDays} />}
            <FlareTimeStatus item={item} />
          </View>


        </View>

        {/* ^ Main row ends there */}

        <View style={{ marginHorizontal: 8, marginTop: 4 }}>
          {this.props.item.groupInfo && <Text style={{ fontStyle: "italic" }}>Sent via {this.props.item.groupInfo.name} group</Text>}
          {this.props.isPublicFlare && <PublicFlareNotice flareInfo = {item} />}
        </View>

        <View style={{ marginLeft: 8 }}>
          {this.props.item.note != undefined && this.props.item.note != "" &&
            <Text style={{ fontStyle: "italic", color: "dimgrey", marginVertical: 4 }}>{this.props.item.note}</Text>
          }
          {this.state.attendeesInfo != "" && <Text>{this.state.attendeesInfo}</Text>}

        </View>


      </TouchableOpacity>
    )
  }
  /**
   * Function to take what was returned from the database call
   * and format a string representing who's attending an event.
   * @param {*} snapshot what's returned from the database
   * @returns a formatted string with who's going
   */
  formatAttendeeInfo(snapshot) {
    const user = auth().currentUser.uid;

    const data = snapshot.val();
    let attendeesList = data ? Object.keys(data).filter(x => x != user).map(x => data[x].displayName) : [];

    let string = ""
    if (attendeesList.length > 3) {
      string = `${attendeesList.pop()}, ${attendeesList.pop()} and ${attendeesList.length} other people are in!`
    } else if (attendeesList.length == 3) {
      string = `${attendeesList.pop()}, ${attendeesList.pop()} and 1 other person are in!`
    } else if (attendeesList.length == 2) {
      string = `${attendeesList.pop()} and ${attendeesList.pop()} are in!`
    } else if (attendeesList.length == 1) {
      const attendee = attendeesList.pop();
      string = `${attendee} is in!`
    }
    return string;
  }
}