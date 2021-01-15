import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Image} from 'react-native';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import S from 'styling';
import {FlatList} from 'react-native';
import {Text} from 'react-native-elements'
import { epochToDateString } from 'utils/helpers';
import EmptyState from 'reusables/EmptyState'
import CountdownComponent from 'reusables/CountdownComponent'
import { responderStatuses } from 'utils/serverValues';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorMessageText from 'reusables/ErrorMessageText';

export default class Feed extends React.Component {

  state = { 
    string: "",
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.container}>

          <ErrorMessageText message = {this.state.errorMessage} />

          <DynamicInfiniteScroll
            renderItem = {this.itemRenderer}
            generation = {0}
            
            dbref = {database().ref(`/feeds/${auth().currentUser.uid}`)}
            emptyStateComponent = {
              <EmptyState 
                image =  { 
                  <Image source={require('media/EmptyFeed.png')} 
                  style = {{height: 80, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                title = "It's pretty quiet here." 
                message = "You have no flares in your feed right now." 
              />
            }
          />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {{marginVertical: 8, marginLeft: 8}}
        onPress = {() => this.props.navigation.navigate('BroadcastViewer', {broadcast: item}) }>
          <View style = {{flexDirection: 'row'}}>

            <View style = {{flexDirection: 'column'}}>
              <ProfilePicDisplayer diameter = {52} uid = {item.owner.uid} style = {{marginRight: 20}} /> 
            </View>
            
            <View style = {{flexDirection: 'column'}}>
              <Text style = {{fontSize: 22, fontFamily: "NunitoSans-Semibold"}}>{item.location}</Text>
             
              <View style = {{flexDirection: 'row'}}>
                <ProfilePicDisplayer diameter = {22} uid = {item.owner.uid} style = {{marginRight: 10}} />
                <Text style = {{fontSize: 14, fontFamily: "NunitoSans-Semibold"}}>{item.owner.displayName}</Text>         
              </View>

            </View>
            <View style = {{flexDirection: 'column', marginLeft: 80}}>
              <CountdownComponent deadLine = {item.deathTimestamp}  renderer = {this.timeLeftRenderer} />
              <Text>for X min</Text>
            </View>
          </View>
          
          {item.groupInfo &&  <Text style = {{fontStyle: "italic"}}>Sent via {item.groupInfo.name} group</Text>}

          {item.note != undefined && item.note != "" &&
            <Text style = {{fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8}}>{item.note}</Text>
          }

          <View><Text>{this.displayAttendees(item)}</Text></View>
      
          
      </TouchableOpacity> 
    );
  }
  
  displayAttendees = (item) => {
    const owner = item.owner.uid;
    const dbref = database().ref(`/activeBroadcasts/${owner}/responders/${item.uid}`); 
    let string = "";
    dbref.on("value", function(snapshot) {
      let attendees = [];
      const data = snapshot.val();
      for (let id in data) {
        attendees.push(data[id]['displayName']);
      } 
      if (attendees.length > 2) {
        string = `${attendees.pop()}, ${attendees.pop()} and ${attendees.length} 
        other people are in `
      } else if (attendees.length == 2) {
        string = `${attendees.pop()} and ${attendees.pop()} are in`
      } else {
        string = `${attendees.pop()} is in`
      } 
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    })
    console.log(string);
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

const styles = StyleSheet.create({
  statusParentStyle: {
    flexDirection: "row", 
    alignItems: "center", 
    alignSelf: "flex-start", 
    padding: 6, 
    borderRadius: 4,
    marginTop: 4
  }
})