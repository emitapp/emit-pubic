import MaskedView from '@react-native-community/masked-view';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Button, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import { TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import { ProfilePicRaw } from 'reusables/ProfilePicComponents';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { isValidDBPath, cloudFunctionStatuses } from 'utils/serverValues';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Clipboard } from "react-native";
import Snackbar from 'react-native-snackbar'

/**
 * This is the standard dialogue for viewing a user if you want the user to 
 * be able to manage their friendship status with the user they're viewing.
 * 
 * If the target's snippet is already available, then provide it via the selectedUserData prop.
 * Otherwise, just provide the target's uid via the userUid prop
 * One of these props MUST be provided
 * 
 * It also needs ot be given a closeFunction prop (argumentless function)
 */
//This is not used directly, but is instead wrapped in a modal and exported as a FriendReqModal
class FriendReqDialogue extends React.Component {

    constructor(props) {
        super(props)

        this.userUid = ""
        let userInfo = null

        if (this.props.selectedUserData) {
            userInfo = this.props.selectedUserData
            this.userUid = userInfo.uid
        } else {
            this.userUid = this.props.userUid
        }

        this.state = {
            gettingInitialData: true, //Getting initial information from Firebase
            waitingForFuncResponse: false,  //Waiting for a response from the Firebase Cloud Function
            userInfo,
            timedOut: false, //Timed out during any of the operations 
            extraMessage: false,
            option: "", //Which cloud function the user can user for this other user
            userSocials: null
        }
    }


    componentDidMount() {
        this.getInitialData();
        this.getSocialInfo();
    }

    render() {
        const { userSocials } = this.state
        return (
            <ThemeConsumer>
                {({ theme }) => (
                    <View style={styles.container}>

                        <MaskedView
                            style={{
                                width: ModalWidth,
                                height: ProfilePicHeight,
                                marginTop: -12,
                            }}
                            maskElement={
                                <View
                                    style={{
                                        // Mask is based off alpha channel.
                                        backgroundColor: 'black',
                                        width: "100%",
                                        height: "100%",
                                        borderTopRightRadius: theme.Overlay.borderRadius,
                                        borderTopLeftRadius: theme.Overlay.borderRadius
                                    }}
                                />
                            }>

                            <ProfilePicRaw
                                uid={this.userUid}
                                style={{ width: ModalWidth, height: ProfilePicHeight }} />
                        </MaskedView>

                        {this.state.userInfo !== null &&
                            <View style={{ alignSelf: "flex-start" }}>
                                <Text h4 h4Style={{ fontWeight: "bold", textAlign: "left" }}>
                                    {this.state.userInfo.displayName}
                                </Text>
                                <Text style={{ fontSize: 16, fontStyle: "italic", color: theme.colors.grey1 }}>
                                    @{this.state.userInfo.username}
                                </Text>
                            </View>
                        }

                        {this.state.extraMessage &&
                            <Text style={{ marginVertical: 8 }}>
                                {this.state.extraMessage}
                            </Text>
                        }

                        {this.displayOptionsLoading()}

                        {this.displayActionsPanel(theme)}


                        {userSocials !== null &&
                            <>
                                <Text style={{ alignSelf: "flex-start" }}>Other Socials:</Text>
                                <View style={styles.buttonPanelContainer}>
                                    <SocialsIcon name='facebook' data={userSocials.facebook} />
                                    <SocialsIcon name='twitter' data={userSocials.twitter} />
                                    <SocialsIcon name='instagram' data={userSocials.instagram} />
                                    <SocialsIcon name='snapchat' data={userSocials.snapchat} />
                                    <SocialsIcon name='github' data={userSocials.github} />
                                </View>
                            </>
                        }

                        {(!this.state.waitingForFuncResponse || this.state.timedOut) &&
                            <MinorActionButton title="Go Back" onPress={this.props.closeFunction} />
                        }

                    </View>
                )}
            </ThemeConsumer>
        )
    }

    displayOptionsLoading = () => {
        if (this.state.gettingInitialData) {
            return (
                <View style={{ height: 120 }}>
                    <TimeoutLoadingComponent
                        hasTimedOut={this.state.timedOut}
                        retryFunction={() => {
                            this.setState({ timedOut: false })
                            this.getInitialData()
                        }}
                    />
                </View>
            )
        }
    }

    displayActionsPanel = (theme) => {
        if (this.state.gettingInitialData || this.state.option == actionOptions.NONE) return;
        let isWarningButton =
            this.state.option === actionOptions.REMOVE || this.state.option === actionOptions.CANCELREQ
        if (!this.state.waitingForFuncResponse) {
            return (
                <>
                    <Button
                        title={this.state.option}
                        onPress={() => this.performAction(this.state.option)}
                        containerStyle={{ marginVertical: 16 }}
                        buttonStyle={{
                            backgroundColor: isWarningButton ? theme.colors.error : theme.colors.primary
                        }}
                    />
                    {this.state.option == actionOptions.ACCEPTREQ &&
                        <Button
                            title={actionOptions.REJECTREQ}
                            onPress={() => this.performAction(actionOptions.REJECTREQ)}
                            containerStyle={{ marginVertical: 16 }}
                            buttonStyle={{ backgroundColor: theme.colors.grey1 }}
                            containerStyle={{ marginTop: 0 }}
                        />
                    }
                </>
            )
        } else {
            return (
                <View style={{ height: 120 }}>
                    <TimeoutLoadingComponent
                        hasTimedOut={this.state.timedOut}
                        retryFunction={() => {
                            this.setState({ timedOut: false, waitingForFuncResponse: false })
                            this.performAction(this.state.option)
                        }}
                    />
                </View>
            )
        }
    }

    getSocialInfo = async () => {
        try {
            const socialsRef = database().ref(`/userSnippetExtras/${this.userUid}`);
            const socialsSnap = await timedPromise(socialsRef.once('value'), LONG_TIMEOUT);
            this.setState({ userSocials: socialsSnap.val() })
        } catch (err) {
            if (err.name !== "timeout") {
                logError(err)
            }
        }
    }

    getInitialData = async () => {
        try {
            const uid = auth().currentUser.uid;
            if (!this.userUid) {
                this.setState({ extraMessage: "No data" })
                return;
            }
            if (uid == this.userUid) {
                this.setState({
                    gettingInitialData: false,
                    option: actionOptions.NONE,
                    extraMessage: "This is you!"
                })
                return;
            }
            if (!isValidDBPath(this.userUid)) {
                this.setState({
                    gettingInitialData: false,
                    option: actionOptions.NONE,
                    extraMessage: "Invalid Bitecode"
                })
                return;
            }

            //If we already don't have the user's snippet data, let's quickly get that
            //This is also a good way to check if this user even exists in the first place
            if (!this.state.userInfo) {
                const snippetRef = database().ref(`/userSnippets/${this.userUid}`);
                const snippetSnapshot = await timedPromise(snippetRef.once('value'), MEDIUM_TIMEOUT)
                if (snippetSnapshot.exists()) {
                    this.setState({ userInfo: snippetSnapshot.val() })
                } else {
                    this.setState({
                        gettingInitialData: false,
                        option: actionOptions.NONE,
                        extraMessage: "Looks like this user doesn't exist."
                    })
                    return
                }
            }


            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/${this.userUid}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), MEDIUM_TIMEOUT);
            if (friendSnapshot.exists()) {
                this.setState({ gettingInitialData: false, option: actionOptions.REMOVE })
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.userUid}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), MEDIUM_TIMEOUT);
            if (outboxSnapshot.exists()) {
                this.setState({ gettingInitialData: false, option: actionOptions.CANCELREQ })
                return;
            }

            //Check if he's in my request inbox...
            const inboxRef = database().ref(`/friendRequests/${uid}/inbox/${this.userUid}`);
            const inboxSnapshot = await timedPromise(inboxRef.once('value'), MEDIUM_TIMEOUT);
            if (inboxSnapshot.exists()) {
                this.setState({ gettingInitialData: false, option: actionOptions.ACCEPTREQ }) //REJECTREQ also accessible via this
            } else {
                this.setState({ gettingInitialData: false, option: actionOptions.SENDREQ })
            }
        } catch (err) {
            if (err.name == "timeout") {
                this.setState({ timedOut: true })
            } else {
                logError(err)
                this.setState({
                    gettingInitialData: false,
                    option: actionOptions.NONE,
                    extraMessage: "Looks like something went wrong!"
                })
            }
        }
    }

    performAction = async (actionToDo) => {
        this.setState({ waitingForFuncResponse: true })
        var callableFunction;
        let args = { from: auth().currentUser.uid, to: this.userUid }
        switch (actionToDo) {
            case actionOptions.SENDREQ:
                callableFunction = functions().httpsCallable('sendFriendRequest');
                break;
            case actionOptions.CANCELREQ:
                callableFunction = functions().httpsCallable('cancelFriendRequest');
                break;
            case actionOptions.ACCEPTREQ:
                callableFunction = functions().httpsCallable('acceptFriendRequest');
                break;
            case actionOptions.REJECTREQ:
                callableFunction = functions().httpsCallable('cancelFriendRequest');
                args.fromInbox = true;
                break;
            case actionOptions.REMOVE:
                callableFunction = functions().httpsCallable('removeFriend');
                break;
            default:
                this.setState({ waitingForFuncResponse: false })
                return;
        }

        this.props.disableClosing()
        try {
            const response = await timedPromise(callableFunction(args), LONG_TIMEOUT);
            if (response.data.status === cloudFunctionStatuses.OK) {
                this.refreshActionOption(actionToDo)
                this.setState({ waitingForFuncResponse: false })
            } else {
                this.setState({
                    waitingForFuncResponse: false,
                    option: actionOptions.NONE,
                    gettingInitialData: false,
                    extraMessage: response.data.message
                })
                logError(new Error(`Problematic ${this.state.option} function response: ${response.data.message}`))
            }
        } catch (err) {
            if (err.name == "timeout") {
                this.setState({ timedOut: true, waitingForFuncResponse: false })
            } else {
                this.setState({ waitingForFuncResponse: false })
                logError(err)
            }
        }
        this.props.enableClosing()
    }

    refreshActionOption = (lastChosenAction) => {
        var newOption = actionOptions.NONE;
        switch (lastChosenAction) {
            case actionOptions.SENDREQ:
                newOption = actionOptions.CANCELREQ;
                break;
            case actionOptions.CANCELREQ:
            case actionOptions.REMOVE:
            case actionOptions.REJECTREQ:
                newOption = actionOptions.SENDREQ;
                break;
            case actionOptions.ACCEPTREQ:
                newOption = actionOptions.REMOVE;
                break;
        }

        this.setState({ option: newOption })
    }
}

class SocialsIcon extends React.Component {
    render() {
        const { data, name } = this.props
        if (!data) return null;
        return (
            <Icon
                name={name}
                size={24}
                color="dimgray"
                onPress={() => {
                    Clipboard.setString(data);
                    Snackbar.show({ text: `"${data}" copied to clipboard`, duration: Snackbar.LENGTH_SHORT })
                }} />
        )
    }
}


//This component can also be given the onClosed prop if 
//you want to trigger something when it's been closed
export default class FriendReqModal extends React.Component {

    constructor() {
        super()
        this.state = {
            isModalVisible: false,
            selectedUser: null,
            selectedUserUid: null
        }
        this.canBeClosed = true;
    }

    render() {
        return (
            <Overlay
                isVisible={this.state.isModalVisible}
                style={{ justifyContent: "center", alignItems: "center" }}
                onRequestClose={this.attemptClose}
                onBackdropPress={this.attemptClose}
                width={ModalWidth}
            >
                <FriendReqDialogue
                    selectedUserData={this.state.selectedUser}
                    userUid={this.state.selectedUserUid}
                    closeFunction={this.attemptClose}
                    disableClosing={() => this.canBeClosed = false}
                    enableClosing={() => this.canBeClosed = true}
                />
            </Overlay>
        )
    }

    attemptClose = () => {
        if (this.canBeClosed) {
            this.setState({ isModalVisible: false })
            if (this.props.onClosed) this.props.onClosed()
        }
    }

    open = (user) => {
        this.setState({ isModalVisible: true, selectedUser: user })
    }

    openUsingUid = (uid) => {
        this.setState({ isModalVisible: true, selectedUserUid: uid })
    }
}

const ModalWidth = Dimensions.get('window').width * 0.7
const ProfilePicHeight = Dimensions.get('window').width * 0.6

const actionOptions = {
    SENDREQ: 'Send Friend Request',
    ACCEPTREQ: 'Accept Friend Request',
    //This one is paired with ACCEPTREQ so it's treated pretty different from the other options
    REJECTREQ: 'Delete Friend Request', 
    CANCELREQ: 'Cancel Friend Request',
    REMOVE: 'Remove Friend',
    NONE: "Nothing"
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "white",
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonPanelContainer: {
        flexDirection: "row",
        marginTop: 8,
        width: "100%",
        justifyContent: 'space-evenly',
        alignContent: "center",
    }
})