import database from '@react-native-firebase/database';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import CountdownComponent from 'reusables/CountdownComponent'
import auth from '@react-native-firebase/auth';
import { responderStatuses } from 'utils/serverValues';
import { TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import React from 'react';

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

    componentDidMount () {
        const ownerID = this.props.item.owner.uid;
        const dbref = database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`);
        var callBack =  (snapshot) => {
            this.setState({  
                isFetchingData: true,
                // Insert the owner and a string for his attendees into the map along with the old stuff
                attendees: {...this.state.attendees, [ownerID]: this.getAttendeesStringFromSnapshot(snapshot)}});
        }
        dbref.on("value", callBack);
    } 

    componentWillUnmount = () => {
        const ownerID = this.props.item.owner.uid;
        database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`).off();
      }

    render () {
        return (
            <TouchableOpacity 
                style = {{marginVertical: 8, marginLeft: 8}}
                onPress = {() => this.props.navigation.navigate('BroadcastViewer', {broadcast: this.props.item}) }>
                <View style = {{flexDirection: 'row', justifyContent: "space-between"}}>

                    <View style = {{flexDirection: 'row'}}>
                        <View style = {{alignItems: "center", justifyContent: "center", marginTop: -18, marginRight: 8}}>
                                {this.props.item.emoji ? 
                                    <Text style = {{fontSize: 50}}>{this.props.item.emoji}</Text>  :
                                    <Text style = {{fontSize: 50}}>🍲</Text>} 
                        </View>
                        <View style = {{flexDirection: 'column'}}>
                            {this.props.item.name ? 
                                <Text style = {{fontSize: 22, fontFamily: "NunitoSans-Semibold"}}>{this.props.item.name}</Text> :
                                <Text style = {{fontSize: 22, fontFamily: "NunitoSans-Semibold"}}>{this.props.item.location}</Text>}
                            <View style = {{flexDirection: 'row'}}>
                                <ProfilePicDisplayer diameter = {22} uid = {this.props.item.owner.uid} style = {{marginRight: 10}} />
                                <Text style = {{fontSize: 14, fontFamily: "NunitoSans-Semibold"}}>{this.props.item.owner.displayName}</Text>         
                            </View>
                        </View>
                    </View>

                    <CountdownComponent deadLine = {this.props.item.deathTimestamp}  renderer = {this.timeLeftRenderer} />
                   
                </View>
                
                {this.props.item.groupInfo &&  <Text style = {{fontStyle: "italic"}}>Sent via {this.props.item.groupInfo.name} group</Text>}
                <View>
                    {this.state.attendees[this.props.item.owner.uid] ?
                    <Text>{this.state.attendees[this.props.item.owner.uid]}</Text> : <></>}
                </View> 
                
                {this.props.item.note != undefined && this.props.item.note != "" &&
                    <Text style = {{fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8}}>{this.props.item.note}</Text>
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
    getAttendeesStringFromSnapshot (snapshot) {
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
     * Function to get the time left for an event
     * @param {*} time a time stamp
     * @returns a View including the formatted time left.
     */
    timeLeftRenderer = (time) => {

        let string = ""
        let metric = ""
        if (time.h){
          metric = "hours"
          if (time.m > 30) string = `in ${time.h}+`
          else string = `${time.h}`
          string = `in ${time.h}`
        }else if (time.m){
          if (time.s > 30) string = `in ${time.m}+`
          else string = `in ${time.m}`
          metric = "mins"
        }else{
          metric = "mins"
          string = "<1"
        }
        return(
        <View >
          <View style = {{flexDirection: 'row', marginLeft: 64}}>
            <Text style = {{textAlign: "right", fontSize: 16}}>{string}</Text>
            <Text style = {{textAlign: "right", fontSize: 16, marginLeft: 4}}>{metric}</Text>
          </View>
        </View>      
        );
      }

    /**
     * Function to display the status for a user.
     * @return a View representing a Confirmed status if the user
     * has accepted the event. 
     */
      displayStatus = () => {
        if (!this.props.item.status) return
        if (this.props.item.status == responderStatuses.PENDING){
          return (
            <View style={{...styles.statusParentStyle, backgroundColor: "dimgrey"}}>
              <MaterialIcons name = "access-time" size = {20} color = "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> {this.props.item.status}</Text>
            </View>
          )
        } else {
          return(
            <View style={{...styles.statusParentStyle, backgroundColor: "green"}}>
              <MaterialCommunityIcons name = "check-bold" size = {20} color = "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> {this.props.item.status}</Text>
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
