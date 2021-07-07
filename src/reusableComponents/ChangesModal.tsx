import MaskedView from '@react-native-community/masked-view';
import LottieView from 'lottie-react-native';
import React from 'react';
import { Dimensions, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { FullTheme, Overlay, Text, ThemeProps, withTheme } from 'react-native-elements';
import changes from 'utils/changeList';
import { MinorActionButton } from './ReusableButtons';
import AsyncStorage from '@react-native-community/async-storage';
import { ASYNC_LAST_LOG_ON_KEY } from 'utils/helpers';
import Markdown from 'react-native-markdown-display'

type ChangesModalProps = {

}

interface ChangesModalState {
    isVisible: boolean,
    lastLogOnTime: number
}


const ModalWidth = Dimensions.get('window').width * 0.7
const ModalHeight = Dimensions.get('window').height * 0.6

//TODO: Consider recoloring the confetti randomly with something like...
//https://colorize-react-native-lottie.netlify.app/

export class ChangesModal extends React.PureComponent<ChangesModalProps & ThemeProps<FullTheme>, ChangesModalState>{

    state = {
        isVisible: false,
        lastLogOnTime: 0,
    }

    componentDidMount(): void {
        this.getInitialLogOnTime()
    }

    render(): React.ReactNode {
        const { theme } = this.props
        return (
            <Overlay
                isVisible={this.state.isVisible}
                onRequestClose={this.close}
                onBackdropPress={this.close}
                overlayStyle={{
                    width: ModalWidth,
                    borderColor: theme.colors.primary,
                    borderWidth: 1,
                    height: ModalHeight,
                }}>
                <View style={{ height: "100%" }}>
                    <MaskedView
                        style={{
                            marginTop: -12,
                            height: 70,
                            width: ModalWidth,
                            justifyContent: "center",
                            alignSelf: "center",
                            backgroundColor: "beige",
                            marginVertical: 8,
                        }}
                        maskElement={
                            <View
                                style={{
                                    // Mask is based off alpha channel.
                                    backgroundColor: 'black',
                                    width: "100%",
                                    height: "100%",
                                    borderTopRightRadius: (theme.Overlay.overlayStyle as ViewStyle).borderRadius,
                                    borderTopLeftRadius: (theme.Overlay.overlayStyle as ViewStyle).borderRadius,
                                }}
                            />
                        }>

                        <LottieView
                            source={require('media/animations/confetti.json')}
                            autoPlay loop resizeMode="cover"
                        />
                        <Text h4>New Features/Fixes!</Text>
                    </MaskedView>

                    <ScrollView
                        style={{ flex: 1, width: "100%" }}>
                        {changes.map(change => {
                            if (this.state.lastLogOnTime > change.timestamp) { return null }
                            return (
                                <View style={{ marginBottom: 16 }} key={change.change}>
                                    <Markdown style={{ body: theme.Text.style as TextStyle }}>
                                       {` * ${change.change}`}
                                    </Markdown>
                                </View>
                            )
                        })}
                    </ScrollView>
                    <MinorActionButton title="Close" onPress = {this.close} />
                </View>
            </Overlay >
        )
    }

    getInitialLogOnTime = async (): Promise<void> => {
        const storedTime = (await AsyncStorage.getItem(ASYNC_LAST_LOG_ON_KEY)) || "0"
        let time = parseInt(storedTime, 10)
        if (isNaN(time)) { time = 0 }
        await AsyncStorage.setItem(ASYNC_LAST_LOG_ON_KEY, Date.now().toString())
        const mostRecentTime = changes[0].timestamp
        if (mostRecentTime > time) { this.setState({ isVisible: true, lastLogOnTime: time }) }
    }

    close = (): void => {
        this.setState({ isVisible: false })
    }
}

export default withTheme(ChangesModal)
