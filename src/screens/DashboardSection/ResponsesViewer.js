import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View, Linking, StyleSheet } from 'react-native';
import { Button, ButtonGroup, Text, Tooltip } from 'react-native-elements';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CountdownComponent from 'reusables/CountdownComponent';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import { BannerButton } from 'reusables/ReusableButtons';
import S from "styling";
import { epochToDateString, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { responderStatuses, cloudFunctionStatuses } from 'utils/serverValues';
import AutolinkText from 'reusables/AutolinkText'
import ErrorMessageText from 'reusables/ErrorMessageText';
import LockNotice from 'reusables/BroadcastLockNotice'

export default class ResponsesViewer extends React.Component {

    constructor(props) {
        super(props);
        this.broadcastData = this.props.navigation.getParam('broadcast', {uid: " "})
        this.respondersListPath = `activeBroadcasts/${auth().currentUser.uid}/responders/${this.broadcastData.uid}`

        this.PENDING_INDEX = 0
        this.CONFIRMED_INDEX = 1
        this.IGNORED_INDEX = 2

        this.state = { 
            errorMessage: null, 
            responseStatusDeltas: {},
            isModalVisible: false,
            currentTargetIndex: this.broadcastData.autoConfirm ? this.CONFIRMED_INDEX : this.PENDING_INDEX,
            searchGeneration: 0
        }
    }

  componentDidMount = () => {
    //I'd want to remove the removed responser from the responseStatusDeltas object
    //If it's there too.
    database()
    .ref(this.respondersListPath)
    .on('child_removed', snap => {
      let { [snap.key]: _, ...newDeltaObject } = this.state.responseStatusDeltas
      this.setState({responseStatusDeltas: newDeltaObject})
    })
  }

  componentWillUnmount = () => {
    database()
    .ref(this.respondersListPath)
    .off()
  }

  render() {
    return (
      <View style={{...S.styles.containerFlexStart, alignItems: "flex-start"}}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />

        <ErrorMessageText message = {this.state.errorMessage} />

        <View style = {{marginLeft: 16, marginBottom: 8}}>
          <View style = {{flexDirection: "row", alignItems: "center"}}>
            {this.broadcastData.geolocation && 
              <Button
                icon={ <EntypoIcon name="location-pin" size={20} color = "white" /> }
                onPress = {this.openLocationOnMap}
                containerStyle = {{marginRight: 8, marginLeft: 0}}
              />    
            }
            <Text style = {{fontSize: 18}}>{this.broadcastData.location}</Text>
          </View>
          <CountdownComponent deadLine = {this.broadcastData.deathTimestamp}  renderer = {this.timeLeftRenderer} />
          <Text>Death Time: {epochToDateString(this.broadcastData.deathTimestamp)}</Text>

          {this.broadcastData.locked && 
            <LockNotice message={"This broadcast has react the response limit you set. It won't receive any more responses."} />
          }

          {this.broadcastData.note != undefined &&
            <AutolinkText style = {styles.noteStyle}>
              {this.broadcastData.note}
            </AutolinkText>
          }
        </View>

        <ButtonGroup
          onPress={this.changeTargetIndex}
          selectedIndex={this.state.currentTargetIndex}
          buttons={["Pending", "Confirmed", "Ignored"]}
        />

        <DynamicInfiniteScroll
          renderItem = {this.itemRenderer}
          generation = {this.state.searchGeneration}
          dbref = {
            database()
            .ref(this.respondersListPath)
            .orderByChild("status")
            .equalTo(this.getTargetName(this.state.currentTargetIndex))
          }
        />

        <BannerButton
          onPress={this.confirmChanges}
          title="CONFIRM CHANGES"
          iconName = {S.strings.add}
          color = {S.colors.buttonGreen}
        />
      </View>
    )
  }

  changeTargetIndex = (newIndex) => {
    this.setState({
      currentTargetIndex: newIndex,
      searchGeneration: ++this.state.searchGeneration
    })
  }

  getTargetName = (index) => {
    switch (index) {
      case this.CONFIRMED_INDEX:
        return responderStatuses.CONFIRMED;
      case this.PENDING_INDEX:
        return responderStatuses.PENDING
      default:
        return responderStatuses.IGNORED
    }
  }
  
  itemRenderer = ({ item }) => {
    return (
      <View>
        <View style = {S.styles.listElement}>
          <UserSnippetListElement snippet = {item} style = {{flex: 1}}/>
          {item.status !== responderStatuses.CONFIRMED && 
            <Button
            icon = {<MaterialCommunityIcons name = "check-bold" size = {20} color = "white" />}
            onPress = {() => this.createDelta(item.uid, responderStatuses.CONFIRMED)}
            />
          }
          {item.status !== responderStatuses.IGNORED && 
            <Button
            icon = {<MaterialCommunityIcons name = "close-circle-outline" size = {20} color = "white" />}
            buttonStyle = {{backgroundColor: "red"}}
            onPress = {() => this.createDelta(item.uid, responderStatuses.IGNORED)}
            />
          }
        </View>
        <Text>Changing to: {this.state.responseStatusDeltas[item.uid]}</Text>
      </View>
    )
  }

  createDelta = (targetUid, newStatus) => {
    let responseStatusDeltas = {...this.state.responseStatusDeltas}
    responseStatusDeltas[targetUid] = newStatus;
    this.setState({responseStatusDeltas})
  }

  confirmChanges = async () => {
    if (Object.keys(this.state.responseStatusDeltas).length === 0) return;
    this.setState({isModalVisible: true})
    try{
      const requestFunction = functions().httpsCallable('setBroadcastResponse');
      const response = await timedPromise(requestFunction({
        broadcasterUid: auth().currentUser.uid,
        broadcastUid: this.broadcastData.uid,
        newStatuses: this.state.responseStatusDeltas
      }), LONG_TIMEOUT);

      if (response.data.status !== cloudFunctionStatuses.OK){
          this.setState({errorMessage: response.data.message})
          logError(new Error("Problematic setBroadcastResponse fucntion response: " + response.data.message))
      }
    }catch(err){
      if (err.name != "timeout") logError(err)  
      this.setState({errorMessage: err.message})
    }
    this.setState({isModalVisible: false, responseStatusDeltas: {}})
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
    let geolocation = this.broadcastData.geolocation
    let pinTitle = `Your planned location`
    let url = ""
    if (Platform.OS == "android"){
      url = `geo:${geolocation.latitude},${geolocation.longitude}?q=${geolocation.latitude},${geolocation.longitude}(${pinTitle})`
    }
    else{
      url = `http://maps.apple.com/?ll=${geolocation.latitude},${geolocation.longitude}`
      url += `&q=${encodeURIComponent(pinTitle)}`
    }
    Linking.openURL(url)
  }
}

const styles = StyleSheet.create({
  noteStyle: {
    fontStyle: "italic", 
    marginTop: 8, 
    fontSize: 18, 
    color: "grey", 
    marginLeft: 4, 
    borderLeftColor: "grey", 
    borderLeftWidth: 2, 
    paddingLeft: 8
  }
})
