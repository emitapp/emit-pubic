import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl } from 'react-native';
import { Text, ThemeConsumer, Button, Overlay } from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import UserProfileSummary from 'reusables/UserProfileSummary'
import UserBitecode from 'reusables/UserBitecode'
import { MinorActionButton } from 'reusables/ReusableButtons'
import AntIcon from 'react-native-vector-icons/AntDesign';

export default class SocialButtonHub extends React.Component {

    state = { QRVisible: false, refreshing: false }

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
                                    Your Bitecode
                                </Text>
                                <UserBitecode color={theme.colors.primary} />
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
                            title="Scan someone's Bitecode"
                            onPress={() => this.props.navigation.navigate('QRScanner')}
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