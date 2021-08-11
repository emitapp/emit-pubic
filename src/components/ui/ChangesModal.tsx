import MaskedView from '@react-native-community/masked-view';
import LottieView from 'lottie-react-native';
import React from 'react';
import { Dimensions, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { FullTheme, Overlay, Text, ThemeProps, withTheme } from 'react-native-elements';
import changes from 'data/changeList';
import { MinorActionButton } from './ReusableButtons';
import AsyncStorage from '@react-native-community/async-storage';
import { LAST_UPDATE_TIMESTAMP_SEEN, sleep } from 'utils/helpers';
import Markdown from 'react-native-markdown-display'
import { events, subscribeToEventRetroactively, unsubscribeToEvent } from 'utils/subcriptionEvents';

type ChangesModalProps = {

}

interface ChangesModalState {
    isVisible: boolean,
    lastSeenTimestamp: number
}


const ModalWidth = Dimensions.get('window').width * 0.7
const ModalHeight = Dimensions.get('window').height * 0.6

//TODO: Consider recoloring the confetti randomly with something like...
//https://colorize-react-native-lottie.netlify.app/

export class ChangesModal extends React.PureComponent<ChangesModalProps & ThemeProps<FullTheme>, ChangesModalState>{

    state = {
        isVisible: false,
        lastSeenTimestamp: 0,
    }

    componentDidMount(): void {
        subscribeToEventRetroactively(events.SPLASH_SCREEN_DISMISSED, this, this.checkForNewUpdates)
    }

    componentWillUnmount() : void {
        unsubscribeToEvent(events.SPLASH_SCREEN_DISMISSED, this)
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
                            if (this.state.lastSeenTimestamp >= change.timestamp) { return null }
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

    checkForNewUpdates = async (): Promise<void> => {
        if (!changes.length) return
        //There's been this bug in iOS where some users can't interact with the UI of the app
        //when they first open the app, and it started happening after we added this modal.
        //I suspect it might have to do with the modal being opened too early, 
        //not investigated, don't have much time atm
        //TODO: Investigate this ._.
        await sleep(500)
        const lastSeenTimestamp = (await AsyncStorage.getItem(LAST_UPDATE_TIMESTAMP_SEEN)) || "0"
        let time = parseInt(lastSeenTimestamp, 10)
        if (isNaN(time) || time === 0) {
            //So they don't get flooded with updates...
            let recentUpdateIndex = changes.length - 4
            //In case there aren't that many updates and we get a non-positive number
            if (recentUpdateIndex <= 0) recentUpdateIndex = changes.length - 1 
            const relativelyRecentTimestamp = changes[recentUpdateIndex].timestamp
            time = relativelyRecentTimestamp
        } 
        const mostRecentTimestamp = changes[0].timestamp
        await AsyncStorage.setItem(LAST_UPDATE_TIMESTAMP_SEEN, mostRecentTimestamp.toString())
        if (mostRecentTimestamp > time) { this.setState({ isVisible: true, lastSeenTimestamp: time }) }
    }

    close = (): void => {
        this.setState({ isVisible: false })
    }
}

export default withTheme(ChangesModal)
