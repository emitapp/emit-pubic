import DevModal from 'dev/DevModal';
import * as dev from 'dev/index';
import React, { PureComponent } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native';
const { width } = Dimensions.get("screen")

export default class DevBuildBanner extends PureComponent {


  isQA = dev.isQABuild()
  isDev = dev.isDevBuild()

  state = {
    isVisible: (this.isDev || this.isQA),
    usingEmulator: false,
  };

  modal : DevModal | null = null

  render(): React.ReactNode {
    const backgroundColor = this.isDev ? "lightblue" : "greenyellow"
    let text = this.isDev ? "Dev" : "QA"
    if (this.state.usingEmulator) { text += " (👷🏾‍♂️)" }

    if (this.state.isVisible) {
      return (
        <>
          <DevModal
            onEmulatorButtonPressed={() => this.setState({ usingEmulator: dev.usingFunctionsEmulator() })}
            ref = {this.setBannerRef}
          />
          <TouchableOpacity style={{ ...styles.networkBanner, backgroundColor }} onPress={this.onBannerClicked}>
            <Text style={{ fontSize: 12, color: "black", textAlign: "center", flex: 1 }}>{text}</Text>
            <Pressable onPress={() => this.setState({ isVisible: false })}>
              <Text style={{ fontSize: 12, color: "black" }}>[CLOSE]</Text>
            </Pressable>
          </TouchableOpacity>
        </>
      );
    } else {
      return null
    }
  }

  setBannerRef = (ref: DevModal) : void => {
    this.modal = ref
  }

  onBannerClicked = (): void => {
    this.modal?.open()
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
