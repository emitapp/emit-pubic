import MaskedView from '@react-native-community/masked-view';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { Dimensions, StyleSheet, Switch, View } from 'react-native';
import { Button, Overlay, Text, ThemeConsumer } from 'react-native-elements';
import { TimeoutLoadingComponent } from 'reusables/ui/LoadingComponents';
import { ProfilePicList, ProfilePicRaw } from 'reusables/profiles/ProfilePicComponents';
import { MinorActionButton } from 'reusables/ui/ReusableButtons';
import { analyticsFriendAction } from 'utils/analyticsFunctions';
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, isValidDBPath, recommentationDocName } from 'utils/serverValues';
import SchoolDomainBadge from 'reusables/schoolEmail/SchoolDomainBadge';
import { getSchoolInfoFromDomain } from 'data/schoolDomains';
import AutofetchingSchoolDomainBadge from 'reusables/schoolEmail/AutofetchingSchoolDomainBadge';

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
            mutualFriends: this.props.mutualFriends,
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
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <AutofetchingSchoolDomainBadge
                                        uid={this.userUid}
                                        tooltipMessage={(d) => `@${this.state.userInfo.username} has a verified ${d.shortName} email.`}
                                        tooltipWidth={200}
                                        style = {{marginRight: 8}}
                                    />
                                    <Text style={{ fontSize: 16, fontStyle: "italic", color: theme.colors.grey1 }}>
                                        @{this.state.userInfo.username}
                                    </Text>
                                </View>

                            </View>
                        }

                        {(this.state.mutualFriends && this.state.mutualFriends.length > 0) &&
                            <View style={{ height: 35, width: "100%", marginVertical: 10 }}>
                                <Text>Mutual Friends</Text>
                                <ProfilePicList diameter={30} uids={this.state.mutualFriends} />
                            </View>
                        }

                        {this.state.extraMessage &&
                            <Text style={{ marginVertical: 8 }}>
                                {this.state.extraMessage}
                            </Text>
                        }

                        {this.displayOptionsLoading()}

                        {this.displayActionsPanel(theme)}

                        {(!this.state.gettingInitialData && this.state.option != friendActionOptions.NONE && !this.state.waitingForFuncResponse) &&
                            <View style={{ alignItems: "center" }}>
                                {this.state.option === friendActionOptions.REMOVE ?
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
                                <Text style={{ alignSelf: "flex-start" }}>Bio:</Text>

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
        if (this.state.gettingInitialData || this.state.option == friendActionOptions.NONE) return;
        let isWarningButton =
            this.state.option === friendActionOptions.REMOVE || this.state.option === friendActionOptions.CANCELREQ
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
                    {this.state.option == friendActionOptions.ACCEPTREQ &&
                        <Button
                            title={friendActionOptions.REJECTREQ}
                            onPress={() => this.performAction(friendActionOptions.REJECTREQ)}
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
            case friendActionOptions.SENDREQ:
            case friendActionOptions.ACCEPTREQ:
            case friendActionOptions.REJECTREQ:
            case friendActionOptions.NONE:
                this.setState({ toggleShouldUseFirestoreValue: false })
                break;

            case friendActionOptions.CANCELREQ:
            case friendActionOptions.REMOVE:
                this.setState({ toggleShouldUseFirestoreValue: true })
                break;

        }
    }

    getToggleValue = () => {
        return this.state.toggleShouldUseFirestoreValue ? this.state.subscribedInFirestore : this.state.localToggleValue
    }

    setToggleValue = (value) => {
        if (this.state.toggleShouldUseFirestoreValue) {
            //you're probably setting the value optimistically, 
            //expecting that a pending update tp firesotre will succeed
            this.setState({ subscribedInFirestore: value })
        } else {
            this.setState({ localToggleValue: value })
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
                    option: friendActionOptions.NONE,
                    extraMessage: "This is you!"
                })
                return;
            }
            if (!isValidDBPath(this.userUid)) {
                this.setState({
                    gettingInitialData: false,
                    option: friendActionOptions.NONE,
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
                            option: friendActionOptions.NONE,
                            extraMessage: "Looks like this user doesn't exist."
                        },
                        () => this.chooseToggleSyncState(friendActionOptions.NONE)
                    )
                    return
                }
            }

            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/${this.userUid}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), MEDIUM_TIMEOUT);
            if (friendSnapshot.exists()) {
                this.setState(
                    { gettingInitialData: false, option: friendActionOptions.REMOVE },
                    () => this.chooseToggleSyncState(friendActionOptions.REMOVE))
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.userUid}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), MEDIUM_TIMEOUT);
            if (outboxSnapshot.exists()) {
                this.setState(
                    { gettingInitialData: false, option: friendActionOptions.CANCELREQ },
                    () => this.chooseToggleSyncState(friendActionOptions.CANCELREQ))
                this.getMutualFriends()
                return;
            }

            //Check if he's in my request inbox...
            const inboxRef = database().ref(`/friendRequests/${uid}/inbox/${this.userUid}`);
            const inboxSnapshot = await timedPromise(inboxRef.once('value'), MEDIUM_TIMEOUT);
            if (inboxSnapshot.exists()) {
                this.setState(
                    { gettingInitialData: false, option: friendActionOptions.ACCEPTREQ },
                    () => this.chooseToggleSyncState(friendActionOptions.ACCEPTREQ)) //REJECTREQ also accessible via this
                this.getMutualFriends()
            } else {
                this.setState(
                    { gettingInitialData: false, option: friendActionOptions.SENDREQ },
                    () => this.chooseToggleSyncState(friendActionOptions.SENDREQ))
                this.getMutualFriends()
            }


        } catch (err) {
            if (err.name == "timeout") {
                this.setState({ timedOut: true })
            } else {
                logError(err)
                this.setState({
                    gettingInitialData: false,
                    option: friendActionOptions.NONE,
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
            case friendActionOptions.SENDREQ:
                callableFunction = functions().httpsCallable('sendFriendRequest');
                break;
            case friendActionOptions.CANCELREQ:
                callableFunction = functions().httpsCallable('cancelFriendRequest');
                break;
            case friendActionOptions.ACCEPTREQ:
                callableFunction = functions().httpsCallable('acceptFriendRequest');
                break;
            case friendActionOptions.REJECTREQ:
                callableFunction = functions().httpsCallable('cancelFriendRequest');
                args.fromInbox = true;
                break;
            case friendActionOptions.REMOVE:
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
                analyticsFriendAction(actionToDo, args)
                this.refreshActionOption(actionToDo)
                this.setState({ waitingForFuncResponse: false })
            } else {
                this.setState({
                    waitingForFuncResponse: false,
                    option: friendActionOptions.NONE,
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
        var newOption = friendActionOptions.NONE;
        switch (lastChosenAction) {
            case friendActionOptions.SENDREQ:
                newOption = friendActionOptions.CANCELREQ;
                break;
            case friendActionOptions.CANCELREQ:
            case friendActionOptions.REMOVE:
            case friendActionOptions.REJECTREQ:
                newOption = friendActionOptions.SENDREQ;
                break;
            case friendActionOptions.ACCEPTREQ:
                newOption = friendActionOptions.REMOVE;
                break;
        }
        this.chooseToggleSyncState(newOption)
        this.setState({ option: newOption })
    }

    getMutualFriends = async () => {
        if (this.state.mutualFriends) return;
        try {
            const uid1 = auth().currentUser.uid
            const uid2 = this.userUid
            const ref = firestore()
                .collection("friendRecommendations")
                .doc(recommentationDocName(uid1, uid2))
            const doc = await ref.get()
            if (!doc.exists) return
            this.setState({ mutualFriends: doc.data().mutualFriends })
        } catch (err) {
            logError(err) //Silently log the error for now...
        }
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
            selectedUserUid: null,
            mutualFriends: null
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
                    mutualFriends={this.state.mutualFriends}
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

    /**
     * Use this if you already know the snippet of the user
     * @param {*} snippet The snippet of the user
     * @param {Array<string>} mutualFriends (optional) the mutual friends this person has with the user
     */
    openUsingSnippet = (snippet, mutualFriends = null) => {
        this.setState({ isModalVisible: true, selectedUser: snippet, mutualFriends })
    }

    /**
     * Use this if you only know the uid of the user
     * @param {*} uid The uid
     */
    openUsingUid = (uid) => {
        this.setState({ isModalVisible: true, selectedUserUid: uid, mutualFriends: null })
    }
}

const ModalWidth = Dimensions.get('window').width * 0.7
const ProfilePicHeight = Dimensions.get('window').width * 0.6

export const friendActionOptions = {
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
    }
})