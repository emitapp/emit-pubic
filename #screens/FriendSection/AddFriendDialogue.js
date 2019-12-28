import React from 'react';
import {StyleSheet, Text, View, Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import TimeoutLoadingComponent from '../../#reusableComponents/TimeoutLoadingComponent';
import {timedPromise} from '../../#constants/helpers'
import { ThemeColors } from 'react-navigation';

export default class AddFriendDialogue extends React.Component {

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
                <Text>User ID = {this.props.selectedUser.key}</Text>

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
        if (this.state.isLoadingOptions) return;
        if (!this.state.waitingForActionPromise){
            return(
                <Button title = {this.state.option} onPress = {this.performAction}/>
            )
        }else{
            return(
                <TimeoutLoadingComponent
                    hasTimedOut={this.state.timedOut}
                    retryFunction={() => {
                        this.setState({timedOut: false, isWaiting: false})
                        this.performAction()
                    }}
                />
            )
        }
    }

    retrieveOptions = async () => {
        try{
            const uid = auth().currentUser.uid; 
            //Check if he's already a friend...
            const friendRef = database().ref(`/userFriendGroupings/${uid}/all/${this.props.selectedUser.key}`);
            const friendSnapshot = await timedPromise(friendRef.once('value'), 5000);
            if (friendSnapshot.exists()){
                this.setState({isLoadingOptions: false, option: actionOptions.REMOVE})
                return;
            }

            //Check if he's in my request outbox...
            const outboxRef = database().ref(`/friendRequests/${uid}/outbox/${this.props.selectedUser.key}`);
            const outboxSnapshot = await timedPromise(outboxRef.once('value'), 5000);
            if (outboxSnapshot.exists()){
                this.setState({isLoadingOptions: false, option: actionOptions.CANCEL})
            }else{
                this.setState({isLoadingOptions: false, option: actionOptions.ADD})
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

    performAction = () => {
        console.log(this.state.option)
    }
}


const actionOptions = {
    REMOVE: 'Remove Friend',
    ADD: 'Add Friend',
    CANCEL: 'Cancel Friend Request'
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