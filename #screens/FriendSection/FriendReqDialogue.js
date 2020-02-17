import React from 'react';
import {StyleSheet, Text, View, Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import TimeoutLoadingComponent from 'reusables/TimeoutLoadingComponent';
import {timedPromise, MEDIUM_TIMEOUT, LONG_TIMEOUT, logError} from 'utils/helpers'
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';

import * as responseStatuses from 'utils/serverValues'

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
export default class FriendReqDialogue extends React.Component {

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
            <View style={styles.container}>
                <ProfilePicDisplayer 
                    diameter = {30} 
                    uid = {this.userUid} 
                    style = {{marginRight: 10}} />

                {this.state.userInfo !== null &&
                    <Text>{this.state.userInfo.name}</Text>
                }

                {this.state.fatalError &&
                    <Text>Looks like a fatal error ocurred!</Text>                
                }

                {(!this.state.waitingForFuncResponse || this.state.timedOut) &&
                    <Button title="Go Back" onPress={this.props.closeFunction}/>
                }

                {this.displayOptionsLoading()}

                {this.displayActionsPanel()}

            </View>
        )       
    }

    displayOptionsLoading = () => {
        if (this.state.gettingInitialData){
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={this.state.timedOut}
                    retryFunction={() => {
                        this.setState({timedOut: false})
                        this.getInitialData()
                    }}
                />
            )
        }
    }

    displayActionsPanel = () => {
        if (this.state.gettingInitialData || this.state.option == actionOptions.NONE) return;
        if (!this.state.waitingForFuncResponse){
            return(
                <Button title = {this.state.option} onPress = {this.performAction}/>
            )
        }else{
            return(
                <TimeoutLoadingComponent
                    hasTimedOut={this.state.timedOut}
                    retryFunction={() => {
                        this.setState({timedOut: false, waitingForFuncResponse: false})
                        this.performAction()
                    }}
                />
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
            //It can be sone asynchronously tho
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


const actionOptions = {
    SENDREQ: 'Send Friend Request',
    ACCEPTREQ: 'Accept Friend Request',
    CANCELREQ: 'Cancel Friend Request',
    REMOVE: 'Remove Friend',
    NONE: "Nothing"
}

const styles = StyleSheet.create({
    container: {
        width: "70%",
        height: "50%",
        backgroundColor: "white",
        justifyContent: 'center',
        alignItems: 'center'
    }
})