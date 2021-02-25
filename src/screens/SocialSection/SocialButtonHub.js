import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
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
        subscribeToEvent(events.PROFILE_PIC_CHNAGE, this, () => this.summaryComponent.refresh())
    }

    componentWillUnmount() {
        unsubscribeToEvent(events.PROFILE_PIC_CHNAGE, this)
    }

    render() {
        return (
            <ThemeConsumer>
                {({ theme }) => (
                    <ScrollView
                        style={{ flex: 1, marginTop: 8, width: "100%" }}
                        contentContainerStyle={{ height: "100%", alignItems: "center" }}
                        refreshControl={
                            <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
                        }>

                        <UserProfileSummary style={{ marginTop: 8, marginBottom: 8 }} ref={ref => this.summaryComponent = ref} />

                        <Overlay
                            isVisible={this.state.QRVisible}
                            onBackdropPress={() => this.setState({ QRVisible: false })}
                            onRequestClose={() => this.setState({ QRVisible: false })}>
                            <View>
                                <Text style={{ textAlign: "center", marginVertical: 8, fontWeight: "bold" }}>
                                    Your Emitcode
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
                            onPress={() => this.props.navigation.navigate("SettingsStackNav")}
                            type="clear"
                        />

                        <View style={styles.rowStyle}>
                            <SocialSectionButton color={theme.colors.secondary}
                                onPress={() => this.props.navigation.navigate('UserFriendSearch')}
                                icon={<FontAwesomeIcon name="search" size={32} />}
                                text={<Text>Users & Friends</Text>}
                            />

                            <SocialSectionButton color={theme.colors.secondary}
                                onPress={() => this.props.navigation.navigate('GroupSearch')}
                                icon={<FontAwesomeIcon name="user-friends" size={32} />}
                                text={<Text>Groups</Text>}
                            />
                        </View>

                        <Button
                            title="Scan someone's Emitcode"
                            onPress={() => this.props.navigation.navigate('QRScanner')}
                        />

                        <Button
                            title="Get in touch with us!"
                            buttonStyle={{ backgroundColor: "skyblue" }}
                            onPress={() => this.props.navigation.navigate("ContactSupportPage")}
                        />
                        <Text>{`We'd love to hear from you!\nWe'll try to reply individually.`}</Text>
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