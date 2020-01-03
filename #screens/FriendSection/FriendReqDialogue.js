import React from 'react';
import {StyleSheet, Text, View, Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import TimeoutLoadingComponent from '../../#reusableComponents/TimeoutLoadingComponent';
import {timedPromise, MEDIUM_TIMEOUT, LONG_TIMEOUT} from '../../#constants/helpers'

import * as responseStatuses from '../../#constants/standardHttpsData'

export default class FriendReqDialogue extends React.Component {

    state = {
        isLoadingOptions: true, 
        waitingForActionPromise: false, 
        timedOut: false, 
        fatalError: false,
        option: ""}

    componentDidMount(){
        this.retrieveOptions();
    }

    render() {
        return (
            <View style={styles.container}>
                <Text>User Name = {this.props.selectedUser.name}</Text>
                <Text>User ID = {this.props.selectedUser.uid}</Text>

                {this.state.fatalError &&
                    <Text>Looks like a fatal error ocurred!</Text>                
                }

                {(!this.state.waitingForActionPromise || this.state.timedOut) &&
                    <Button title="Go Back" onPress={this.props.closeFunction}/>
                }

                {this.displayOptionsLoading()}

                {this.displayActionsPanel()}

            </View>
        )       
    }

    displayOptionsLoading = () => {
        if (this.state.isLoadingOptions){
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={this.state.timedOut}
                    retryFunction={() => {
                        this.setState({timedOut: false})
                        this.retrieveOptions()
                    }}
                />
            )
        }
    }

    displayActionsPanel = () => {
        if (this.state.isLoadingOptions || this.state.option == actionOptions.NONE) return;
        if (!this.state.waitingForActionPromise){
            return(
                <Button title = {this.state.option} onPress = {this.performAction}/>
            )
        }else{
            return(
                <TimeoutLoadingComponent
                    hasTimedOut={this.state.timedOut}
                    retryFunction={() => {
                        this.setState({timedOut: false, waitingForActionPromise: false})
                        this.performAction()
                    }}
                />
            )
        }
    }

    retrieveOptions = async () => {
        try{
            const uid = auth().currentUser.uid; 
            if (uid == this.props.selectedUser.uid){
                this.setState({isLoadingOptions: false, option: actionOptions.NONE})
                return;
            }

            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/${this.props.selectedUser.uid}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), MEDIUM_TIMEOUT);
            if (friendSnapshot.exists()){
                this.setState({isLoadingOptions: false, option: actionOptions.REMOVE})
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.props.selectedUser.uid}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), MEDIUM_TIMEOUT);
            if (outboxSnapshot.exists()){
                this.setState({isLoadingOptions: false, option: actionOptions.CANCELREQ})
                return;
            }

            //Check if he's in my request inbox...
            const inboxRef = database().ref(`/friendRequests/${uid}/inbox/${this.props.selectedUser.uid}`);
            const inboxSnapshot = await timedPromise(inboxRef.once('value'), MEDIUM_TIMEOUT);
            if (inboxSnapshot.exists()){
                this.setState({isLoadingOptions: false, option: actionOptions.ACCEPTREQ})
            }else{
                this.setState({isLoadingOptions: false, option: actionOptions.SENDREQ})
            }
        }catch (err){
            if (err.message == "timeout"){
                this.setState({timedOut: true})
            }else{
                console.log(err)
                this.setState({fatalError: true})
            }
        }
    }

    performAction = async () => {
        this.setState({waitingForActionPromise: true})
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
                this.setState({waitingForActionPromise: false})
                return;
        }

        try {
            const response = await timedPromise(callableFunction({
                from: auth().currentUser.uid, 
                to: this.props.selectedUser.uid
            }), LONG_TIMEOUT);
            if (response.data.status === responseStatuses.returnStatuses.OK){
                this.refreshActionOption()
                this.setState({waitingForActionPromise: false})
            }else{
                this.setState({waitingForActionPromise: false, option: actionOptions.NONE})
                console.log(response, "problematic response")
            }
        } catch (err) {
            if (err.message == "timeout"){
                this.setState({timedOut: true, waitingForActionPromise: false})
            }else{
                this.setState({waitingForActionPromise: false})
                console.log(err)          
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