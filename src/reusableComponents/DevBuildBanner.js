import React, { PureComponent } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DeviceInfo from 'react-native-device-info';
const { width } = Dimensions.get('window');

export default class DevBuildBanner extends PureComponent {

  constructor (props){
    super(props)
    this.state = {
      isVisible: true,
    };
    this.isQA = DeviceInfo.getBundleId().endsWith(".qa")
    this.isDev = DeviceInfo.getBundleId().endsWith(".dev")
  }

  componentDidMount(){
    //Only show on dev builds
    if (!(this.isDev || this.isQA)) this.setState({isVisible: false})
  }

  render() {
    const backgroundColor =  this.isDev ? "lightblue" : "greenyellow"
    const text =  this.isDev ? "Dev" : "QA"
    if (this.state.isVisible) {
      return (
      <TouchableOpacity style={{...styles.networkBanner, backgroundColor }} onPress = {() => this.setState({isVisible: false})}>
        <Text style={{fontSize: 12, color: "black"}}>{text}</Text>
      </TouchableOpacity>
      );
    }else{
      return null
    }
  }
}

const styles = StyleSheet.create({
  networkBanner: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 40,
  },
});