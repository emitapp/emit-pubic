import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FriendRequestPreviewer from 'screens/SocialSection/FriendRequestPreviewer'
import OctIcon from 'react-native-vector-icons/Octicons';
import StandardHeader from 'reusables/Header';
import { MinorActionButton } from 'reusables/ReusableButtons';
import UserEmitcode from 'reusables/UserEmitcode';
import UserProfileSummary from 'reusables/UserProfileSummary';
import { subscribeToEvent, unsubscribeToEvent, events } from 'utils/subcriptionEvents'

export default class SocialButtonHub extends React.Component {

    state = { QRVisible: false, refreshing: false }

    static navigationOptions = StandardHeader("My Profile");


    componentDidMount() {
        subscribeToEvent(events.PROFILE_PIC_CHANGE, this, () => this.summaryComponent.refresh())
    }

    componentWillUnmount() {
        unsubscribeToEvent(events.PROFILE_PIC_CHANGE, this)
    }

    render() {
        return (
            <ThemeConsumer>
                {({ theme }) => (
                    <ScrollView
                        style={{ flex: 1, width: "100%" }}
                        contentContainerStyle={{ height: "100%", alignItems: "center" }}
                        refreshControl={
                            <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
                        }>

                        <UserProfileSummary style={{ marginTop: 8, marginBottom: 8 }} ref={ref => this.summaryComponent = ref} />

                        <Overlay
                            isVisible={this.state.QRVisible}
                            onBackdropPress={() => this.setState({ QRVisible: false })}
                            onRequestClose={() => this.setState({ QRVisible: false })}>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ textAlign: "center", marginVertical: 8, fontWeight: "bold" }}>
                                    Your Emitcode
                                </Text>
                                {/* Width of 180 chosen to match width of UserEmitcode components*/}
                                <Text style={{ textAlign: "center", marginVertical: 8, width: 180 }}>
                                    People can use Emit's scanner to scan Emitcodes and send friend requests.
                                </Text>
                                <UserEmitcode color={theme.colors.primary} />
                                <MinorActionButton
                                    title="Go Back"
                                    onPress={() => this.setState({ QRVisible: false })} />
                            </View>
                        </Overlay>

                        <Button
                            icon={<AntIcon name="qrcode" size={40} color="white" />}
                            containerStyle={{ position: 'absolute', top: 16, left: 16 }}
                            onPress={() => this.setState({ QRVisible: true })}
                        />

                        <Button
                            icon={<OctIcon name="gear" size={40} color={theme.colors.primary} />}
                            containerStyle={{ position: 'absolute', top: 16, right: 16 }}
                            onPress={() => this.props.navigation.navigate("SettingsMain")}
                            type="clear"
                        />

                        <FriendRequestPreviewer
                            ref={ref => this.friendReqPreviewer = ref}
                            style={{
                                borderColor: "lightgrey", borderWidth: 1,
                                borderRadius: 10, paddingHorizontal: 8, marginBottom: 8,
                                marginHorizontal: 8
                            }} />

                        <Button
                            title="Your recurring flares"
                            onPress={() => this.props.navigation.navigate('RecurringFlaresViewer')}
                        />

                        <Button
                            title="Scan someone's Emitcode"
                            onPress={() => this.props.navigation.navigate('QRScanner')}
                        />

                        <Button
                            title="Get in touch with us!"
                            buttonStyle={{ backgroundColor: "skyblue" }}
                            onPress={() => this.props.navigation.navigate("ContactSupportPage")}
                        />
                    </ScrollView>
                )}
            </ThemeConsumer>
        )
    }

    wait = (timeout) => {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }

    onRefresh = () => {
        this.summaryComponent.refresh()
        this.wait(500).then(this.setState({ refreshing: false }))
    }
}

class SocialSectionButton extends React.Component {
    render() {
        const { icon, text, color } = this.props
        let iconProps = { color: "white" }
        let textProps = { style: { ...styles.buttonTextStyle, color: "white" } }
        return (
            <TouchableOpacity
                style={{ ...styles.socialButton, backgroundColor: color }}
                onPress={this.props.onPress}>
                {React.cloneElement(icon, iconProps)}
                {React.cloneElement(text, textProps)}
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    socialButton: {
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "45%",
        borderRadius: 10,
    },
    buttonTextStyle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 8,
        marginHorizontal: 8
    },
    rowStyle: {
        height: 150,
        flexDirection: "row",
        width: "85%",
        justifyContent: 'space-around',
        marginVertical: 8
    },
})