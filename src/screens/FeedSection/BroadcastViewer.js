import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import AutolinkText from 'reusables/AutolinkText';
import LockNotice from 'reusables/BroadcastLockNotice';
import CountdownComponent from 'reusables/CountdownComponent';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import S from "styling";
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, responderStatuses } from 'utils/serverValues';
import { ProfilePicList } from 'reusables/ProfilePicComponents';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents'

export default class BroadcastViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            attendees: [],
            errorMessage: null, 
            broadcastData: null,
            isModalVisible: false,
            showConfirmed: false
        }

        this.broadcastSnippet = this.props.navigation.getParam('broadcast', {uid: " ", owner: {uid: " "}})
    }

  componentDidMount = () => {
    database()
    .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
    .on('value', snap => this.setState({broadcastData: snap.val()}))

    database()
    .ref(`/activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
    .on('value', snap => this.updateAttendees(snap.val()))
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
    const {broadcastData} = this.state
    return (
      <View style={{...S.styles.containerFlexStart, alignItems: "flex-start", marginHorizontal: 16}}>
        
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        
        <ErrorMessageText message = {this.state.errorMessage} />

        {!broadcastData &&
            <TimeoutLoadingComponent hasTimedOut={false} retryFunction={() => null}/>
        }

        {broadcastData && 
          <View style={{width: "100%"}}>
              <View style={{alignItems: "center", marginBottom: 50, marginTop: 50}}>
                <View style={{flexDirection: "row"}}>
                  <View style={{alignItems: "center", justifyContent: "center", marginTop: -16, marginBottom: 8, marginRight: 8}}>
                    {broadcastData.emoji ? <Text style = {{fontSize: 50}}>{broadcastData.emoji}</Text> : <Text style = {{fontSize: 50}}>🍲</Text> }
                  </View>
                  <Text style={{fontSize: 32, marginBottom: 8}}>{broadcastData.location}</Text>
                </View>
                <View style={{flexDirection: "row", alignItems: "center", justifyContent: "center"}}>
                  <View style={{justifyContent: "center"}}>
                    <ProfilePicDisplayer diameter = {32} uid = {this.broadcastSnippet.owner.uid} />
                  </View>
                  <Text style={{marginLeft: 4, marginBottom: 8, color: "#3F83F9"}}>{this.broadcastSnippet.owner.displayName}</Text>
                </View>
                <CountdownComponent deadLine = {broadcastData.deathTimestamp}  renderer = {this.timeLeftRenderer} />
            </View>
            <Divider style = {{marginVertical: 8}} />
            <View >
              <Text style = {{marginTop: -8, fontSize: 24, marginLeft: 4, color: "grey", marginBottom: 8}}>Location</Text>
              <Text style = {{fontSize: 18, marginLeft: 4}}>{broadcastData.location}</Text>
              <View style = {{flexDirection: "row", alignItems: "center"}}>
                {broadcastData.geolocation && 
                  <Button
                    icon={ <Icon name="location-pin" size={20} color = "white" /> }
                    onPress = {this.openLocationOnMap}
                    containerStyle = {{marginRight: 8, marginLeft: 0}}
                  /> }
              </View>
            </View>
            {broadcastData.note != undefined &&
              <View>
                <Text style = {{marginTop: 8, fontSize: 24, marginLeft: 4, color: "grey"}}>
                Note
                </Text>
                  <AutolinkText style = {{marginTop: 8, fontSize: 16, marginLeft: 4}}>{broadcastData.note}</AutolinkText>
              </View>
            }   
          </View>
        }
        {(broadcastData && broadcastData.locked) && 
            <LockNotice message={"This broadcast has react the response limit it's creator set. It won't receive any more responses."} />
        }
        {broadcastData && 
          <View >
            <Text style = {{marginTop: 8, fontSize: 24, marginLeft: 4, marginBotton: 4, color: "grey"}}>
              Who's In
            </Text>
            <Text style = {{alignSelf: "center", marginLeft: 4, marginBottom: 4}}>{broadcastData.totalConfirmations} user(s) are in!</Text>
            <View style={{height: 36}}> 
              {this.state.attendees.length > 0 &&
              <ProfilePicList 
                uids={this.state.attendees} 
                diameter={36}
                style = {{marginLeft: 0, marginRight: 2}}/>}
            </View> 
          </View>
        }

        <Divider style = {{marginVertical: 8}} />

        {broadcastData && this.displayBroadcastAction()}
           
      </View>
    )
  }

  updateAttendees = (data) => {
    var attendeesNew = []
    for (var id in data) {
      attendeesNew.push(id)
    }
    this.setState({attendees: attendeesNew})
  }

  displayBroadcastAction = () => {
    console.log(this.broadcastSnippet.status)
    if (!this.broadcastSnippet.status || this.broadcastSnippet.status == responderStatuses.CANCELLED) {
      return (
        <View style={{alignSelf: "center", marginTop: 60}}>
          <Button 
            title="I'm In" 
            onPress={() => this.sendConfirmOrCancelRequest(true)} 
            containerStyle = {{alignSelf: "center"}}/>
        </View>
      )
    } else {
      return (
        <View style={{flexDirection: "row", alignSelf: "center", marginTop: 60}}>
          <Button 
          title="I'm Out" 
          onPress={() => this.sendConfirmOrCancelRequest(false)} 
          containerStyle = {{alignSelf: "center"}}/>
          <Button 
            title="Chat" 
            onPress={() => console.log("go to chat")} // TODO: Use navigator to go to chat
            containerStyle = {{alignSelf: "center"}}/>
        </View> 
      ) 
    }
  }

  sendConfirmOrCancelRequest = async (confirm) => {
    this.setState({isModalVisible: true})
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
        this.setState({errorMessage: response.data.message})
        logError(new Error("Problematic setBroadcastResponse function response: " + response.data.message))
      }
    } catch(err) {
      if (err.name != "timeout") logError(err)      
      this.setState({errorMessage: err.message})
    }
    this.setState({isModalVisible: false})
  }
  
  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement 
      snippet={item} 
      onPress={null}/>
    );
  }

  timeLeftRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hours ` : ""
    string += time.m ? `${time.m} minutes ` : ""
    return(
        <Text style = {{fontSize: 16, marginTop: 8}}>Starts in {string}</Text>
    );
  }

  openLocationOnMap = () => {
    let geolocation = this.state.broadcastData.geolocation
    let pinTitle = `${this.broadcastSnippet.owner.username}'s planned location`
    let url = ""
    if (Platform.OS == "android"){
      url = `geo:0,0?q=${geolocation.latitude},${geolocation.longitude}(${pinTitle})`
    } else {
      url = `http://maps.apple.com/?ll=${geolocation.latitude},${geolocation.longitude}`
      url += `&q=${encodeURIComponent(pinTitle)}`
    }
    Linking.openURL(url)
  }
}