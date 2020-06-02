import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View, Linking, Platform } from 'react-native';
import { Button, Divider, Text } from 'react-native-elements';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import S from "styling";
import {logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { responderStatuses, returnStatuses } from 'utils/serverValues';
import CountdownComponent from 'reusables/CountdownComponent'
import Icon from 'react-native-vector-icons/Entypo';
import AutolinkText from 'reusables/AutolinkText'


export default class BroadcastViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
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
  }

  componentWillUnmount = () => {
    database()
    .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
    .off()
  }



  render() {
    const {broadcastData} = this.state
    return (
      <View style={{...S.styles.containerFlexStart, alignItems: "flex-start", marginHorizontal: 16}}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>
        }

        {!broadcastData &&
            <TimeoutLoadingComponent hasTimedOut={false} retryFunction={() => null}/>
        }

        {broadcastData && 
          <>
              <UserSnippetListElement  snippet={this.broadcastSnippet.owner} onPress={null}/>
              <Divider />
              <Text h4 h4Style = {{marginVertical: 8}}>Will be at</Text>
              <View style = {{flexDirection: "row", alignItems: "center"}}>
                {broadcastData.geolocation && 
                  <Button
                    icon={ <Icon name="location-pin" size={20} color = "white" /> }
                    onPress = {this.openLocationOnMap}
                    containerStyle = {{marginRight: 8, marginLeft: 0}}
                  />    
                }
                <Text style = {{fontSize: 18}}>{broadcastData.location}</Text>
              </View>
              <CountdownComponent deadLine = {broadcastData.deathTimestamp}  renderer = {this.timeLeftRenderer} />
              {broadcastData.note != undefined &&
                <AutolinkText style = {{fontStyle: "italic", marginTop: 8, fontSize: 18, color: "grey", marginLeft: 4, borderLeftColor: "grey", borderLeftWidth: 2, paddingLeft: 8}}>
                  {broadcastData.note}
                </AutolinkText>
              }
          </>
        }

        <Divider style = {{marginVertical: 8}} />
        {this.displayBroadcastAction()}
        <Divider style = {{marginVertical: 8}} />

        {broadcastData && 
            <Text style = {{alignSelf: "center"}}>{broadcastData.totalConfirmations} user(s) have confirmed to join</Text>
        }
        {!this.state.showConfirmed && broadcastData && broadcastData.totalConfirmations != 0 &&
          <Button 
            title="Show Confirmations" 
            onPress={() => this.setState({showConfirmed: true})}
            containerStyle = {{alignSelf: "center"}}/>
        }

        {this.state.showConfirmed &&
          <DynamicInfiniteScroll
            
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {
              database()
              .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
              .orderByChild("status")
              .equalTo(responderStatuses.CONFIRMED)
            }
          />
        }
      </View>
    )
  }

  displayBroadcastAction = () => {
    if (!this.broadcastSnippet.status){
      return (<Button 
        title="Express Interest" 
        onPress={this.sendConfirmationRequest} 
        containerStyle = {{alignSelf: "center"}}/>)
    }else{
      let color = "green"
      if (this.broadcastSnippet.status == responderStatuses.PENDING) color = "grey"
      return (
        <Text style = {{fontSize: 18, marginVertical: 8}}>
        Status: <Text style={{color, fontSize: 18}}> {this.broadcastSnippet.status} </Text>
        </Text>
      )
    }
  }

  sendConfirmationRequest = async () => {
    this.setState({isModalVisible: true})
    try{
      const newStatus = (this.state.broadcastData.autoConfirm ? responderStatuses.CONFIRMED : responderStatuses.PENDING)
      const newStatuses = {}
      newStatuses[auth().currentUser.uid] = newStatus

      const requestFunction = functions().httpsCallable('setBroadcastResponse');
      const response = await timedPromise(requestFunction({
        broadcasterUid: this.broadcastSnippet.owner.uid,
        broadcastUid: this.broadcastSnippet.uid,
        newStatuses
      }), LONG_TIMEOUT);

      if (response.data.status === returnStatuses.OK){
        this.broadcastSnippet.status = newStatus
      }else{
        logError(new Error("Problematic setBroadcastResponse function response: " + response.data.status))
      }
    }catch(err){
      if (err.code == "timeout"){
          this.setState({errorMessage: "Timeout!"})
      }else{
          logError(err)        
      }
    }
    this.setState({isModalVisible: false})
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
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
    string += time.h ? `${time.h} hours, ` : ""
    string += time.m ? `${time.m} minutes, ` : ""
    string += time.s ? `${time.s} seconds` : ""
    return(
        <Text style = {{fontSize: 18, marginTop: 8}}>in {string}</Text>
    );
  }

  openLocationOnMap = () => {
    let geolocation = this.state.broadcastData.geolocation
    let pinTitle = `${this.broadcastSnippet.owner.username}'s planned location`
    let url = ""
    if (Platform.OS == "android"){
      url = `geo:0,0?q=${geolocation.latitude},${geolocation.longitude}(${pinTitle})`
    }
    else{
      url = `http://maps.apple.com/?ll=${geolocation.latitude},${geolocation.longitude}`
      url += `&q=${encodeURIComponent(pinTitle)}`
    }
    Linking.openURL(url)
  }
}