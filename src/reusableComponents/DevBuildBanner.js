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
  }

  componentDidMount(){
    //Only show on dev builds
    if (!DeviceInfo.getBundleId().endsWith(".dev")) this.setState({isVisible: false})
  }

  render() {
    if (this.state.isVisible) {
      return (
      <TouchableOpacity style={styles.networkBanner} onPress = {() => this.setState({isVisible: false})}>
        <Text style={{flex: 1, textAlign: "center", fontSize: 12}}>Development Build</Text>
      </TouchableOpacity>
      );
    }else{
      return null
    }
  }
}

const styles = StyleSheet.create({
  networkBanner: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
    backgroundColor: 'white',
    paddingHorizontal: 16
  },
});