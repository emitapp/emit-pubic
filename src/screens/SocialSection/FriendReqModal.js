import MaskedView from '@react-native-community/masked-view';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Dimensions, StyleSheet, View, Switch } from 'react-native';
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
            errorMessage: null,
            gettingInitialData: true, //Getting initial information from Firebase
            waitingForFuncResponse: false,  //Waiting for a response from the Firebase Cloud Function
            userInfo,
            timedOut: false, //Timed out during any of the operations 
            extraMessage: false,
            option: "", //Which cloud function the user can call
            userSocials: null,
            subscribedInFirestore: false, //Has our user subcribed to this other user's flares?
            localToggleValue: true, //What's the actual value of the toggle
            toggleShouldUseFirestoreValue: false, 
            //^ Should the toggle be set to sync with the firestore value or not? see getToggleValue()
        }
    }

    componentDidMount() {
        this.getInitialData();
        this.getSocialInfo();
        this.getFlareNotificationInfo();
    }

    componentWillUnmount() {
        if (this.unsubscribeFunction) this.unsubscribeFunction()
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
                                        borderTopRightRadius: theme.Overlay.overlayStyle.borderRadius,
                                        borderTopLeftRadius: theme.Overlay.overlayStyle.borderRadius
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

                        {(!this.state.gettingInitialData && this.state.option != actionOptions.NONE && !this.state.waitingForFuncResponse) &&
                            <View style={{ alignItems: "center" }}>
                                {this.state.option === actionOptions.REMOVE ?
                                    <Text>Receive Flare Notifications?</Text> :
                                    <Text>Receive Flare Notifications? (will be applied if friend request is accepted)</Text>
                                }
                                <Switch value={this.getToggleValue()}
                                    onValueChange={(val) => this.onToggleChanged(val)}
                                />
                            </View>
                        }


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

    /**
     * Some notes about chooseToggleSyncState, getToggleValue and onToggleChanged
     * This toggle does different things depening on the available option
     * If you're already friends with this person, or you've sent them a friend
     * request that they haven't responded to, then that means you've made the choise
     * to either subscribe to them already or not. In that case, the toggle's value and changes
     * to the toggle should be reflected in firebase. 
     * Otherwise, you're now making that choise, so the toggle's value and changes to that value
     * should be local and will be applied when the approporate cloud function is called
     */

    chooseToggleSyncState = (action) => {
        switch (action) {
            case actionOptions.SENDREQ:
            case actionOptions.ACCEPTREQ:
            case actionOptions.REJECTREQ:
            case actionOptions.NONE:
                this.setState({toggleShouldUseFirestoreValue: false})
                break;

            case actionOptions.CANCELREQ:
            case actionOptions.REMOVE:
                this.setState({toggleShouldUseFirestoreValue: true})
                break;
            
        }
    }

    getToggleValue = () => {
        return this.state.toggleShouldUseFirestoreValue ? this.state.subscribedInFirestore : this.state.localToggleValue
    }

    setToggleValue = (value) => {
        if (this.state.toggleShouldUseFirestoreValue){
            //you're probably setting the value optimistically, 
            //expecting that a pending update tp firesotre will succeed
            this.setState({subscribedInFirestore: value}) 
        }else{
            this.setState({localToggleValue: value}) 
        }
    }

    onToggleChanged = async (newToggleValue) => {
        this.setToggleValue(newToggleValue)
        if (!this.state.toggleShouldUseFirestoreValue) return;

        try {
            const subscriptionFunc = functions().httpsCallable('changeFlareSubscription');
            const id = this.userUid
            const response = await timedPromise(
                subscriptionFunc({ onBroadcastFrom: id, addUser: newToggleValue }),
                LONG_TIMEOUT);

            if (response.data.status !== cloudFunctionStatuses.OK) {
                this.setState({ errorMessage: response.data.message })
                logError(new Error("Problematic changeFlareSubscription function response: " + response.data.message))
            }
        } catch (err) {
            if (err.name != "timeout") logError(err)
            this.setState({ errorMessage: err.message })
        }
    }

    /**
     * Function to get initial notification info for a friend
     * in order to set the toggle (if needed).
     */
    getFlareNotificationInfo() {
        const onDataRetrievalError = (error) => {
            this.setState({ errorMessage: error.message })
            logError(error)
        }

        const onDataRetrieved = (docSnapshot) => {
            if (!docSnapshot.exists) {
                this.setState({ errorMessage: "Your notification data doesn't exists on our servers" })
            } else {
                const data = docSnapshot.data().notificationPrefs.onBroadcastFrom;
                if (data.find(x => x == this.userUid)) this.setState({ subscribedInFirestore: true })
            }
        }

        this.unsubscribeFunction = firestore()
            .collection('fcmData').doc(auth().currentUser.uid)
            .onSnapshot(onDataRetrieved, onDataRetrievalError);
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
                    extraMessage: "Invalid Emitcode"
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
                    this.setState(
                        {
                            gettingInitialData: false,
                            option: actionOptions.NONE,
                            extraMessage: "Looks like this user doesn't exist."
                        },
                        () => this.chooseToggleSyncState(actionOptions.NONE)
                    )
                    return
                }
            }

            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/${this.userUid}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), MEDIUM_TIMEOUT);
            if (friendSnapshot.exists()) {
                this.setState(
                    { gettingInitialData: false, option: actionOptions.REMOVE },
                    () => this.chooseToggleSyncState(actionOptions.REMOVE))
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.userUid}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), MEDIUM_TIMEOUT);
            if (outboxSnapshot.exists()) {
                this.setState(
                        { gettingInitialData: false, option: actionOptions.CANCELREQ },
                        () => this.chooseToggleSyncState(actionOptions.CANCELREQ))
                return;
            }

            //Check if he's in my request inbox...
            const inboxRef = database().ref(`/friendRequests/${uid}/inbox/${this.userUid}`);
            const inboxSnapshot = await timedPromise(inboxRef.once('value'), MEDIUM_TIMEOUT);
            if (inboxSnapshot.exists()) {
                this.setState(
                        { gettingInitialData: false, option: actionOptions.ACCEPTREQ },
                        () => this.chooseToggleSyncState(actionOptions.ACCEPTREQ)) //REJECTREQ also accessible via this
            } else {
                this.setState(
                        { gettingInitialData: false, option: actionOptions.SENDREQ },
                        () => this.chooseToggleSyncState(actionOptions.SENDREQ))
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
        let args = { 
            from: auth().currentUser.uid, 
            to: this.userUid,
            subscribeToFlares: this.getToggleValue() //Not needed for all cloud funcs, but doesn't hurt to keep it in
        }
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
        this.chooseToggleSyncState(newOption)
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
                overlayStyle={{ width: ModalWidth }}
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
    /**
     * If you can send a request to this person
     */
    SENDREQ: 'Send Friend Request', 

    /**
     * If you can accept a friend request from this person
     **/
    ACCEPTREQ: 'Accept Friend Request',

    /**
     * If you can reject a freind request 
     * This one comes hand in hand with ACCEPTREQ
     * so it's treated pretty different from the other options 
     * (ACCEPTREQ sometimes represents) both of them
     */
    REJECTREQ: 'Delete Friend Request',

    /**
     * If you've sent a friend request to this person and you want to remove it
     */
    CANCELREQ: 'Cancel Friend Request',

    /**
     * If you're already freinds, the only option possible is cancelling the friendship
     */
    REMOVE: 'Remove Friend',

    /**
     * The wildcard (invalid user uid, nonexsistent user, etc)
     */
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