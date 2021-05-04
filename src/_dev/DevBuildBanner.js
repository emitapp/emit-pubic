import React, { PureComponent } from 'react';
import { StyleSheet, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as dev from 'dev/index'
import { Pressable } from 'react-native';
const { width } = Dimensions.get("screen")

export default class DevBuildBanner extends PureComponent {

  constructor(props) {
    super(props)
    this.state = {
      isVisible: true,
      usingEmulator: false
    };
    this.isQA = DeviceInfo.getBundleId().endsWith(".qa")
    this.isDev = DeviceInfo.getBundleId().endsWith(".dev")
  }

  componentDidMount() {
    //Only show on dev and qa builds
    if (!(this.isDev || this.isQA)) this.setState({ isVisible: false })
  }

  render() {
    const backgroundColor = this.isDev ? "lightblue" : "greenyellow"
    let text = this.isDev ? "Dev" : "QA"
    if (this.state.usingEmulator) text += " (👷🏾‍♂️)"

    if (this.state.isVisible) {
      return (
        <TouchableOpacity style={{ ...styles.networkBanner, backgroundColor }} onPress={this.onBannerClicked}>
          <Text style={{ fontSize: 12, color: "black", textAlign: "center", flex: 1 }}>{text}</Text>
          <Pressable onPress={() => this.setState({ isVisible: false })}>
            <Text style={{ fontSize: 12, color: "black" }}>[CLOSE]</Text>
          </Pressable>
        </TouchableOpacity>
      );
    } else {
      return null
    }
  }

  onBannerClicked = () => {
    Alert.alert(
      "Dev Stuff here :3",
      "",
      [
        {
          text: "Reload JS",
          onPress: () => dev.restartJSApp(),
        },
        {
          text: (dev.usingEmulator()) ? "Use live functions" : "Use emulated functions",
          onPress: () => {
            (dev.usingEmulator()) ? dev.switchToLiveFuntions() : dev.switchToEmulatedFunctions(dev._EMULATOR_IP)
            this.setState({usingEmulator: dev.usingEmulator()})
          },
        }
      ],
      { cancelable: true }
    );
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
    width: width * 0.35,
  },
});