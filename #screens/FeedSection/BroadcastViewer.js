import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth'

import { epochToDateString } from '../../#constants/helpers';
import TimeoutLoadingComponent from '../../#reusableComponents/TimeoutLoadingComponent'

export default class BroadcastViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            errorMessage: null, 
            broadcastData: null
        }

        this.ownerData = this.props.navigation.getParam('ownerSnippet', {uid: " "})
        this.broadcastID = this.props.navigation.getParam('broadcast', " ")
    }

  componentDidMount = () => {
    database()
    .ref(`activeBroadcasts/${this.ownerData.uid}/public/${this.broadcastID}`)
    .on('value', snap => this.setState({broadcastData: snap.val()}))
  }

  componentWillUnmount = () => {
    database()
    .ref(`activeBroadcasts/${this.ownerData.uid}/public/${this.broadcastID}`)
    .off()
  }



  render() {
    return (
      <View style={styles.container}>

        {this.state.broadcastData && 
        <View>
            <Text>Owner Name: {this.ownerData.name}</Text>
            <Text>Owner uid: {this.ownerData.uid}</Text>
            <Text>Broadcast uid: {this.broadcastID}</Text>
            <Text>Location: {this.state.broadcastData.location}</Text>
            <Text>Note: {this.state.broadcastData.location || " "}</Text>
            <Text>Death Time: {epochToDateString(this.state.broadcastData.deathTimestamp)}</Text>
            <Text>Confirmations: {this.state.broadcastData.totalConfirmations}</Text>
        </View>}

        {!this.state.broadcastData &&
            <TimeoutLoadingComponent
            hasTimedOut={false}
            retryFunction={() => null}/>
        }

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}
         
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  newBroadcastButton: {
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "mediumseagreen",
    width: "100%", 
    height: 50,
    flexDirection: 'row'
  },
  listElement: {
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})