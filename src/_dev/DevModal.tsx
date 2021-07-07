import * as dev from 'dev/index';
import React from 'react';
import { View } from 'react-native';
import { Button, Overlay } from 'react-native-elements';
import { MinorActionButton } from 'reusables/ReusableButtons';

interface DevBannerProps {
    onEmulatorButtonPressed: () => void
}

interface DevBannerState {
    isVisible: boolean
}

export default class DevBanner extends React.PureComponent<DevBannerProps, DevBannerState> {

    state = { isVisible: false }

    render(): React.ReactNode {
        return (
            <Overlay
                isVisible={this.state.isVisible}
                onRequestClose={this.close}
                onBackdropPress={this.close}>
                <View style={{ height: "100%" }}>
                    <Button
                        title={(dev.usingEmulator()) ? "Use live functions" : "Use emulated functions"}
                        onPress={() => {
                            (dev.usingEmulator()) ? dev.switchToLiveFunctions() : dev.switchToEmulatedFunctions(dev._EMULATOR_IP)
                            this.props.onEmulatorButtonPressed()
                        }}
                    />
                    <Button
                        title={"Reload JS"}
                        onPress={dev.restartJSApp}
                    />
                    <Button
                        title={"Clear last login time"}
                        onPress={dev.clearLastLogInTime}
                    />
                    <MinorActionButton title="Close" />
                </View>
            </Overlay>
        )
    }

    open = (): void => {
        this.setState({ isVisible: true })
    }

    close = (): void => {
        this.setState({ isVisible: false })
    }
}
