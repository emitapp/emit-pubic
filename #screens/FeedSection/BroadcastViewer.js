import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Button, Text, View } from 'react-native';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import {TimeoutLoadingComponent} from 'reusables/LoadingComponents'
import S from "styling";
import { epochToDateString, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { responderStatuses, returnStatuses } from 'utils/serverValues';
import UserSnippetListElement from 'reusables/UserSnippetListElement'
import {DefaultLoadingModal} from 'reusables/LoadingComponents'


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
    return (
      <View style={S.styles.containerFlexStart}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        {this.state.broadcastData && 
        <View>
            <Text>Owner Name: {this.broadcastSnippet.owner.name}</Text>
            <Text>Owner uid: {this.broadcastSnippet.owner.uid}</Text>
            <Text>Broadcast uid: {this.broadcastSnippet.uid}</Text>
            <Text>Location: {this.state.broadcastData.location}</Text>
            <Text>Note: {this.state.broadcastData.note || " "}</Text>
            <Text>Death Time: {epochToDateString(this.state.broadcastData.deathTimestamp)}</Text>
            <Text>Confirmations: {this.state.broadcastData.totalConfirmations}</Text>
        </View>}

        {this.displayBroadcastAction()}

        {!this.state.broadcastData &&
            <TimeoutLoadingComponent
            hasTimedOut={false}
            retryFunction={() => null}/>
        }

        {!this.state.showConfirmed &&
          <Button 
            title="Show Other Confirmations" 
            onPress={() => this.setState({showConfirmed: true})}/>
        }

        {this.state.showConfirmed &&
          <DynamicInfiniteScroll
            chunkSize = {10}
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {
              database()
              .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
              .orderByChild("status")
              .equalTo(responderStatuses.CONFIRMED)
            }
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
          />
        }
      </View>
    )
  }

  displayBroadcastAction = () => {
    if (!this.broadcastSnippet.status){
      return (<Button title="Express Interest" onPress={this.sendConfirmationRequest} />)
    }else{
      return <Text>{this.broadcastSnippet.status}</Text>
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
        this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
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
}