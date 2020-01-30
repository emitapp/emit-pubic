import React, { PureComponent } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
const { width } = Dimensions.get('window');
import database from '@react-native-firebase/database'
import {logError} from '../#constants/helpers'
import NetInfo from "@react-native-community/netinfo";

export default class OfflineNotice extends PureComponent {

  constructor (props){
    super(props)
    this.state = {
      connectedToFirebase: false,
      connectedToNetwork: false,
      isVisible: false,
    };
    this.unsubscribe = null;
  }

  componentDidMount() {
    //For this banner to work, there has to be a constant connection to the database
    //(this is an issue on Android, more info here:
    //https://stackoverflow.com/questions/53320480
    //This creates a constant connection to a dummy location in my database
    database().ref('dummyDatabaseLocation').keepSynced(true).catch(err => logError(err)) 
    database().ref(".info/connected").on("value", snap => {
      if (!snap) return;
      this.setState({connectedToFirebase: snap.val()}, this.decideVisibility)
    })

    this.unsubscribe = NetInfo.addEventListener(state => {
      //If https://github.com/react-native-community/react-native-netinfo/issues/254
      //if ever fixed, might switch to state.isInternetReachable
      this.setState({connectedToNetwork: state.isConnected}, this.decideVisibility);
    });
  }

  componentWillUnmount(){
    //cannot call keepSynced(true) because it's asynchronous
    database().ref(".info/connected").off()
    this.unsubscribe()
  }

  decideVisibility = () => {
    let shouldBeVisible = !this.state.connectedToFirebase
    if (shouldBeVisible) this.setState({isVisible: true})
    else setTimeout(() => this.setState({isVisible: false}), 2000);
  }

  render() {
    if (!this.state.isVisible) return null;
    if (this.state.connectedToFirebase) {
      return (
      <View style={[styles.networkBanner, {'backgroundColor': "green"}]}>
        <Text style={styles.offlineText}>Connected!</Text>
      </View>);
    }

    if (this.state.connectedToNetwork) {
      return (
        <View style={[styles.networkBanner, {'backgroundColor': "gold"}]}>
        <Text style={styles.offlineText}>Connecting to Biteup...</Text>
      </View>);
    }

    return (
      <View style={[styles.networkBanner, {'backgroundColor': "red"}]}>
      <Text style={styles.offlineText}>Disonnected. Syncing will fail</Text>
    </View>);
  }
}

const styles = StyleSheet.create({
  networkBanner: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
  },
  offlineText: { color: '#fff' }
});