import NetInfo from "@react-native-community/netinfo";
import database from '@react-native-firebase/database';
import React, { PureComponent } from 'react';
import { Dimensions, StyleSheet, Text, View, Linking, Alert } from 'react-native';
import { logError } from 'utils/helpers';
const { width } = Dimensions.get('window');

export default class OfflineNotice extends PureComponent {

  constructor (props){
    super(props)
    this.bannerStates = {
      CONNECTED_TO_FIREBASE: 1,
      CONNECTED_TO_NETWORK: 2,
      OFFLINE: 3
    }

    this.currentBannerState = null
    this.netInfoUnsubscribe = null;
    this.timeoutID = null;
    this.connectedToFirebase = false;
    this.connectedToNetwork = false;
    //The banner will have a short time period where it's inactive
    //This will prevent the banner showing up annoyingly when the user is 
    //just initially opening the app and connecting to Biteup
    this.bannerInactive = true; 
    this.state = {
      isVisible: false,
      text: "",
      color: "black",
      textColor: "black"
    };
  }

  componentDidMount() {
    //For this banner to work, there has to be a constant connection to the database
    //(this is an issue on Android, more info here:
    //https://stackoverflow.com/questions/53320480)
    //This creates a constant connection to a dummy location in my database
    database().ref('dummyDatabaseLocation').keepSynced(true).catch(err => logError(err)) 
    database().ref(".info/connected").on("value", snap => {
      if (!snap) return;
      this.connectedToFirebase = snap.val()
      this.changeBannerState()
    })

    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      //If https://github.com/react-native-community/react-native-netinfo/issues/254
      //is ever fixed, might switch to state.isInternetReachable
      this.connectedToNetwork = state.isConnected;
      this.changeBannerState()
    });

    setTimeout(() => this.activateBanner(), 1500)
  }

  componentWillUnmount(){
    //cannot call keepSynced(true) because it's asynchronous
    database().ref(".info/connected").off()
    this.netInfoUnsubscribe()
  }

  changeBannerState = () => {
    if (this.bannerInactive) return;

    let newState = this.determineNewState()
    if (newState == this.currentBannerState) return
    this.currentBannerState = newState
    //Clearing any timeout that might have been set by a previous state
    if (this.timeoutID) clearTimeout(this.timeoutID) 

    if (this.currentBannerState == this.bannerStates.OFFLINE){
      this.setState({
        isVisible: true,
        color: "red",
        text: "Disconnected. Syncing will delay until reconnected.",
        textColor: "white"
      })
    }else if (this.currentBannerState == this.bannerStates.CONNECTED_TO_NETWORK){
      this.setState({
        isVisible: true,
        color: "gold",
        text: "Connecting to Biteup...",
        textColor: "black"
      })
    }else{
      this.setState({
        isVisible: true,
        color: "mediumseagreen",
        text: "Connected!",
        textColor: "white"
      })
      this.timeoutID = setTimeout(() => this.setState({isVisible: false}), 500)
    }

  }

  render() {
    if (!this.state.isVisible) return null;
    return (
      <View style={{...styles.networkBanner, backgroundColor: this.state.color}}>
        <Text style={{color: this.state.textColor}}>
          {this.state.text}
        </Text>
        {this.currentBannerState == this.bannerStates.CONNECTED_TO_NETWORK && 
        <Text 
          style={{color: this.state.textColor, textDecorationLine: "underline"}}
          onPress = {this.networkAdviceAlert}>
          {"Taking too long?"}
        </Text>
        }
      </View>);
  }

  activateBanner = () => {
    this.bannerInactive = false;
    if (this.determineNewState() != this.bannerStates.CONNECTED_TO_FIREBASE) this.changeBannerState()
  }

  determineNewState = () => {
    if (!this.connectedToNetwork)  return this.bannerStates.OFFLINE
    else if (!this.connectedToFirebase) return  this.bannerStates.CONNECTED_TO_NETWORK
    else return this.bannerStates.CONNECTED_TO_FIREBASE
  }

  networkAdviceAlert = () => {
    Alert.alert(
      "Connection Advice",
      "Having trouble connecting to Biteup? Make sure your network has internet access. If it does, maybe check our server status page.",
      [
        {
          text: "Check Status Page",
          style: "cancel",
          onPress: () => Linking.openURL("https://status.firebase.google.com/")
        },
        { 
          text: "Close", 
          style: "cancel"
        }
      ],
    );
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
});