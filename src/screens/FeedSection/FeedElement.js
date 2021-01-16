import database from '@react-native-firebase/database';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import CountdownComponent from 'reusables/CountdownComponent'
import auth from '@react-native-firebase/auth';
import { TouchableOpacity, View, Text} from 'react-native';

import React from 'react';

export default class FeedElement extends React.Component {

    constructor(props) { 
        super(props);
        this.state = {
            isFetchingData: false,
            attendees: {},
        }
    }

    componentDidMount () {
        const ownerID = this.props.item.owner.uid;
        const dbref = database().ref(`/activeBroadcasts/${ownerID}/responders/${this.props.item.uid}`);
        var callBack =  (snapshot) => {
            this.setState({  
                isFetchingData: true,
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
                <View style = {{flexDirection: 'row'}}>

                    <View style = {{flexDirection: 'column'}}>
                    <ProfilePicDisplayer diameter = {52} uid = {this.props.item.owner.uid} style = {{marginRight: 20}} /> 
                    </View>
                    
                    <View style = {{flexDirection: 'column'}}>
                    <Text style = {{fontSize: 22, fontFamily: "NunitoSans-Semibold"}}>{this.props.item.location}</Text>
                    
                    <View style = {{flexDirection: 'row'}}>
                        <ProfilePicDisplayer diameter = {22} uid = {this.props.item.owner.uid} style = {{marginRight: 10}} />
                        <Text style = {{fontSize: 14, fontFamily: "NunitoSans-Semibold"}}>{this.props.item.owner.displayName}</Text>         
                    </View>

                    </View>
                    <View style = {{flexDirection: 'column', marginLeft: 80}}>
                    <CountdownComponent deadLine = {this.props.item.deathTimestamp}  renderer = {this.timeLeftRenderer} />
                    <Text>for X min</Text>
                    </View>
                    
                </View>
               
                {this.props.item.groupInfo &&  <Text style = {{fontStyle: "italic"}}>Sent via {this.props.item.groupInfo.name} group</Text>}
                <View>
                    {this.state.attendees[this.props.item.owner.uid] ?
                    <Text>{this.state.attendees[this.props.item.owner.uid]}</Text> : <Text>No data</Text>}
                    
                </View> 
                {this.props.item.note != undefined && this.props.item.note != "" &&
                    <Text style = {{fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8}}>{this.props.item.note}</Text>
                }
                

            </TouchableOpacity> 
        )
    }

    getAttendeesStringFromSnapshot (snapshot) {
        const user = auth().currentUser.uid;

        const data = snapshot.val();
        let attendeesList = [];
        for (let id in data) {
            if (id == user) {
                attendeesList.push("you")
            } else {
                attendeesList.push(data[id]['displayName']);
            }
        }

        let string = ""
        if (attendeesList.length > 3) {
            string = `${attendeesList.pop()}, ${attendeesList.pop()} and ${attendeesList.length} 
            other people are in.`
        } else if (attendeesList.length == 3) {
            string = `${attendeesList.pop()}, ${attendeesList.pop()} and 1
            other person are in.`
        } else if (attendeesList.length == 2) {
            string = `${attendeesList.pop()} and ${attendeesList.pop()} are in.`
        } else if (attendeesList.length == 1) {
            const attendee = attendeesList.pop();
            console.log(attendee);
            if (attendee == "you") {
                string = "You are in!" 
            } else {
                string = `${attendee} is in.` 
            }
        } else {
            string = "No responses yet." 
        }
        return string;
    }

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
        <View>
          <View style = {{flexDirection: 'row'}}>
            <Text style = {{textAlign: "center", fontSize: 15}}>{string}</Text>
            <Text style = {{textAlign: "center", fontSize: 16, marginLeft: 4}}>{metric}</Text>
          </View>
        </View>      
        );
      }
    
      displayStatus = (item) => {
        if (!item.status) return
        if (item.status == responderStatuses.PENDING){
          return (
            <View style={{...styles.statusParentStyle, backgroundColor: "dimgrey"}}>
              <MaterialIcons name = "access-time" size = {20} color = "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> {item.status}</Text>
            </View>
          )
        }else{
          return(
            <View style={{...styles.statusParentStyle, backgroundColor: "green"}}>
              <MaterialCommunityIcons name = "check-bold" size = {20} color = "white" />
              <Text style = {{color: "white", fontWeight: "bold"}}> {item.status}</Text>
            </View>
          )
        }  
      }
}