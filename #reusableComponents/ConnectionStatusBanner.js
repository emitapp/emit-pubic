import React, { PureComponent } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
const { width } = Dimensions.get('window');
import database from '@react-native-firebase/database'
import {logError} from '../#constants/helpers'

export default class OfflineNotice extends PureComponent {
  state = {
    isConnected: true
  };

  componentDidMount() {
    //For this banner to work, there has to be a constant connection to the database
    //(this is an issue on Android, more info here:
    //https://stackoverflow.com/questions/53320480
    //This creates a constant connection to a dummy location in my database
    database().ref('dummyDatabaseLocation').keepSynced(true).catch(err => logError(err)) 
    database().ref(".info/connected").on("value", this.hanldeConnectionChange)
  }

  hanldeConnectionChange = (snap) => {
      if (!snap) return;
      this.setState({isConnected: snap.val()})
  }

  componentWillUnmount(){
    database().ref(".info/connected").off()
  }

  render() {
    if (!this.state.isConnected) {
      return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>Not connected to Biteup Cloud</Text>
      </View>);
    }
    return null;
  }
}

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
  },
  offlineText: { color: '#fff' }
});