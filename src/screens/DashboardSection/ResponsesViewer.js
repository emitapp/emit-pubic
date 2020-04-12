import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerButton } from 'reusables/ReusableButtons';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import S from "styling";
import { epochToDateString, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { responderStatuses, returnStatuses } from 'utils/serverValues';
import {DefaultLoadingModal} from 'reusables/LoadingComponents'
import {Button, ButtonGroup} from 'react-native-elements'


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
      <View style={S.styles.containerFlexStart}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <View>
            <Text>Location: {this.broadcastData.location}</Text>
            <Text>Note: {this.broadcastData.note || " "}</Text>
            <Text>Death Time: {epochToDateString(this.broadcastData.deathTimestamp)}</Text>
        </View>

        <ButtonGroup
          onPress={this.changeTargetIndex}
          selectedIndex={this.state.currentTargetIndex}
          buttons={["Pending", "Confirmed", "Ignored"]}
        />

        <DynamicInfiniteScroll
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          generation = {this.state.searchGeneration}
          dbref = {
            database()
            .ref(this.respondersListPath)
            .orderByChild("status")
            .equalTo(this.getTargetName(this.state.currentTargetStatus))
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

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <View 
        style = {S.styles.listElement}>
        <Text>{item.name}</Text>
        <Text>{item.uid}</Text>
        {item.status !== responderStatuses.CONFIRMED && 
          <Button title = "Accept" onPress = {() => this.createDelta(item.uid, responderStatuses.CONFIRMED)}/>}
        {item.status !== responderStatuses.IGNORED && 
          <Button title = "Ignore" onPress = {() => this.createDelta(item.uid, responderStatuses.IGNORED)}/>}
          <Text>Pending Change: {this.state.responseStatusDeltas[item.uid]}</Text>
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

      if (response.data.status === returnStatuses.OK){
        this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
      }else{
          logError(new Error("Problematic setBroadcastResponse fucntion response: " + response.data.status))
      }
    }catch(err){
      if (err.code == "timeout"){
          this.setState({errorMessage: "Timeout!"})
      }else{
          logError(err)        
      }
    }
    this.setState({isModalVisible: false, responseStatusDeltas: {}})
  }

}
