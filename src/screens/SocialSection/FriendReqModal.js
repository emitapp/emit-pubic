import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Button, Overlay, SocialIcon, Text, ThemeConsumer } from 'react-native-elements';
import { TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import { ProfilePicRaw } from 'reusables/ProfilePicComponents';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { logError, LONG_TIMEOUT, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import * as responseStatuses from 'utils/serverValues';
import MaskedView from '@react-native-community/masked-view';


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

    constructor(props){
        super(props)

        this.userUid = ""
        let userInfo = null

        if (this.props.selectedUserData){
            userInfo = this.props.selectedUserData
            this.userUid = userInfo.uid
        }else{
            this.userUid = this.props.userUid
        }

        this.state = {
            gettingInitialData: true, //Getting initial information from Firebase
            waitingForFuncResponse: false,  //Waiting for a response from the Firebase Cloud Function
            userInfo,
            timedOut: false, //Timed out during any of the operations 
            fatalError: false,
            option: "" //Which cloud function the user can user for this other user
        }
    }


    componentDidMount(){
        this.getInitialData();
    }

    render() {
        return (
            <ThemeConsumer>
            {({ theme }) => (
            <View style={styles.container}>

                <MaskedView
                    style = {{
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
                    uid = {this.userUid} 
                    style = {{width: ModalWidth, height: ProfilePicHeight}} />
                </MaskedView>

                {this.state.userInfo !== null &&
                    <View style = {{alignSelf: "flex-start"}}>
                        <Text h4 h4Style = {{fontWeight: "bold", textAlign: "left"}}>
                            {this.state.userInfo.displayName}
                        </Text>
                        <Text style = {{fontSize: 20, fontStyle: "italic", color: theme.colors.grey1}}>
                            @{this.state.userInfo.username}
                        </Text>
                    </View>
                }

                {this.state.fatalError &&
                    <Text>Looks like a fatal error ocurred!</Text>                
                }

                {this.displayOptionsLoading()}

                {this.displayActionsPanel(theme)}


                {this.state.userInfo !== null &&
                    <Text style = {{alignSelf: "flex-start"}}>Other Socials:</Text>                
                }

                {this.state.userInfo !== null &&
                    <View style = {styles.buttonPanelContainer}>
                        <SocialIcon
                            raised={false}
                            type='facebook'
                        />
                        <SocialIcon
                            raised={false}
                            type='twitter'
                        />
                        <SocialIcon
                            raised={false}
                            type='instagram'
                        />
                        <SocialIcon
                            raised={false}
                            type='github'
                        />
                    </View>
                }

                {(!this.state.waitingForFuncResponse || this.state.timedOut) &&
                    <MinorActionButton title="Go Back" onPress={this.props.closeFunction}/>
                }

            </View>
            )}
            </ThemeConsumer>
        )       
    }

    displayOptionsLoading = () => {
        if (this.state.gettingInitialData){
            return (
                <View style = {{height: 120}}>
                    <TimeoutLoadingComponent
                        hasTimedOut={this.state.timedOut}
                        retryFunction={() => {
                            this.setState({timedOut: false})
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
        if (!this.state.waitingForFuncResponse){
            return(
                <Button 
                    title = {this.state.option} 
                    onPress = {this.performAction}
                    containerStyle = {{marginVertical: 16}}
                    buttonStyle = {{
                        backgroundColor: isWarningButton ? theme.colors.error : theme.colors.primary
                    }}
                />
            )
        }else{
            return(
                <View style = {{height: 120}}>
                    <TimeoutLoadingComponent
                        hasTimedOut={this.state.timedOut}
                        retryFunction={() => {
                            this.setState({timedOut: false, waitingForFuncResponse: false})
                            this.performAction()
                        }}
                    />
                </View>
            )
        }
    }

    getInitialData = async () => {
        try{
            const uid = auth().currentUser.uid; 
            if (!this.userUid) return;
            if (uid == this.userUid){
                this.setState({gettingInitialData: false, option: actionOptions.NONE})
                return;
            }

            //If we already don't have the user's snippet data, let's quickly get that
            //It can be dome asynchronously tho since it's not essential
            if (!this.state.userInfo){
                const snippetRef = database().ref(`/userSnippets/${this.userUid}`);
                timedPromise(snippetRef.once('value'), MEDIUM_TIMEOUT)
                    .then(snippetSnapshot => {
                        if (snippetSnapshot.exists()){
                            this.setState({userInfo: snippetSnapshot.val()})
                        }else{
                            this.setState({gettingInitialData: false, option: actionOptions.NONE})
                        }
                    })
                    .catch(err => logError(err, false)); //It's not a bit deal, just leave it alone
            }


            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/${this.userUid}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), MEDIUM_TIMEOUT);
            if (friendSnapshot.exists()){
                this.setState({gettingInitialData: false, option: actionOptions.REMOVE})
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.userUid}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), MEDIUM_TIMEOUT);
            if (outboxSnapshot.exists()){
                this.setState({gettingInitialData: false, option: actionOptions.CANCELREQ})
                return;
            }

            //Check if he's in my request inbox...
            const inboxRef = database().ref(`/friendRequests/${uid}/inbox/${this.userUid}`);
            const inboxSnapshot = await timedPromise(inboxRef.once('value'), MEDIUM_TIMEOUT);
            if (inboxSnapshot.exists()){
                this.setState({gettingInitialData: false, option: actionOptions.ACCEPTREQ})
            }else{
                this.setState({gettingInitialData: false, option: actionOptions.SENDREQ})
            }
        }catch (err){
            if (err.code == "timeout"){
                this.setState({timedOut: true})
            }else{
                logError(err)
                this.setState({fatalError: true})
            }
        }
    }

    performAction = async () => {
        this.setState({waitingForFuncResponse: true})
        var callableFunction;
        switch (this.state.option) {
            case actionOptions.SENDREQ:
                callableFunction =  functions().httpsCallable('sendFriendRequest');
                break;
            case actionOptions.CANCELREQ:
                callableFunction =  functions().httpsCallable('cancelFriendRequest');
                break;
            case actionOptions.ACCEPTREQ:
                callableFunction =  functions().httpsCallable('acceptFriendRequest');
                break;
            default:
                this.setState({waitingForFuncResponse: false})
                return;
        }

        this.props.disableClosing()
        try {
            const response = await timedPromise(callableFunction({
                from: auth().currentUser.uid, 
                to: this.userUid
            }), LONG_TIMEOUT);
            if (response.data.status === responseStatuses.returnStatuses.OK){
                this.refreshActionOption()
                this.setState({waitingForFuncResponse: false})
            }else{
                this.setState({waitingForFuncResponse: false, option: actionOptions.NONE})
                logError(new Error(`Problematic ${this.state.option} function response: ${response.data.status}`))
            }
        } catch (err) {
            if (err.code == "timeout"){
                this.setState({timedOut: true, waitingForFuncResponse: false})
            }else{
                this.setState({waitingForFuncResponse: false})
                logError(err)        
            }
        }
        this.props.enableClosing()
    }

    refreshActionOption = () => {
        var newOption = actionOptions.NONE;
        switch (this.state.option) {
            case actionOptions.SENDREQ:
                newOption = actionOptions.CANCELREQ;
                break;
            case actionOptions.CANCELREQ:
            case actionOptions.REMOVE:
                newOption = actionOptions.SENDREQ;
                break;
            case actionOptions.ACCEPTREQ:
                newOption = actionOptions.REMOVE;
                break;
        }

        this.setState({option: newOption})
    }
}

//This component can also be given the onClosed prop if 
//you want to trigger something when it's been closed
export default class FriendReqModal extends React.Component{

    constructor(){
        super()
        this.state = { 
            isModalVisible: false,
            selectedUser: null
        }
        this.canBeClosed = true;
    }


    render(){
        return(
            <Overlay 
                isVisible={this.state.isModalVisible}
                style = {{justifyContent: "center", alignItems: "center"}}
                onRequestClose = {this.attemptClose}
                onBackdropPress = {this.attemptClose}
                width = {ModalWidth}
            >
            <FriendReqDialogue 
              selectedUserData = {this.state.selectedUser}
              closeFunction={this.attemptClose}
              disableClosing = {() => this.canBeClosed = false}
              enableClosing = {() => this.canBeClosed = true}
            />
          </Overlay>
        )
    }

    attemptClose = () => {
        if (this.canBeClosed){
            this.setState({ isModalVisible: false })
            if (this.props.onClosed) this.props.onClosed()
        }
    }

    open = (user) => {
        this.setState({ isModalVisible: true, selectedUser: user })
    }
}

const ModalWidth = Dimensions.get('window').width * 0.7
const ProfilePicHeight = Dimensions.get('window').width * 0.6

const actionOptions = {
    SENDREQ: 'Send Friend Request',
    ACCEPTREQ: 'Accept Friend Request',
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