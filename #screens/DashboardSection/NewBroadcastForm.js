// Self explanatory what this does

import React from 'react'
import { StyleSheet, Text, TextInput, View, Button, 
        Platform, TouchableOpacity, ActivityIndicator } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import Modal from 'react-native-modal'

import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';

import { timedPromise, LONG_TIMEOUT, MEDIUM_TIMEOUT,
     MIN_BROADCAST_WINDOW, MAX_BROADCAST_WINDOW, logError } from '../../#constants/helpers';
import {returnStatuses} from '../../#constants/serverValues'

export default class NewBroadcastForm extends React.Component {

    constructor(props) {
        super(props)

        this.minDate = null;
        this.maxDate = null;
        this.recalculateDateLimits()

        //I'm starting them off with a date that should be far enough from the 
        //actual hard cutoff to give them ample time to fill the form
        let startingDate = new Date()
        startingDate.setMilliseconds(0)
        startingDate.setSeconds(0)
        const millisecondsToAdd = (MIN_BROADCAST_WINDOW + 3) * 60 * 1000
        startingDate.setTime(startingDate.getTime() + millisecondsToAdd)

        this.state = {
            showPicker: false,
            pickerMode: "time",
            location: '',
            date: startingDate,
            errorMessage: null,
            isModalVisible: false
        }
    }

    render() {
        return (
            <View style={styles.container}>

                <Modal 
                    isVisible={this.state.isModalVisible}
                    style = {{justifyContent: "center", alignItems: "center"}}
                    animationIn = "fadeInUp"
                    animationOut = 'fadeOutUp'
                    animationOutTiming = {0}>
                    <ActivityIndicator />
                </Modal>

                <Text>Create a New Broadcast</Text>
                {this.state.errorMessage &&
                    <Text style={{ color: 'red' }}>
                        {this.state.errorMessage}
                    </Text>}
                <View style={styles.mainForm}>
                    <TextInput
                        style={styles.textInput}
                        autoCapitalize="words"
                        placeholder="Place"
                        onChangeText={location => this.setState({ location })}
                        value={this.state.location}/>

                    <Text> Time and Date</Text>
                    <View>
                        <Button onPress={() => this.showPicker('date')} title="Choose Date" />
                    </View>
                    <View>
                        <Button onPress={() => this.showPicker('time')} title="Choose Time" />
                    </View>

                    {this.state.showPicker &&
                     <DateTimePicker value={this.state.date}
                        style={{width:'100%'}}
                        mode={this.state.pickerMode}
                        is24Hour={false}
                        display="default"
                        onChange={this.setDate}
                        minimumDate={this.minDate} />
                    }

                    <Text style={{ textAlign: "center" }}> Chosen date: </Text>
                    <Text style={{ textAlign: "center", fontWeight: "bold", margin: 8 }}>
                        {this.state.date.toString()}
                    </Text>

                    <Text>FOR NOW, BROADCASTS ARE SENT TO ALL FRIENDS</Text>
                </View>

                <TouchableOpacity
                    style={styles.newBroadcastButton}
                    onPress={this.createBroadcast}>
                    <AwesomeIcon name="plus" size={18} color="white" />
                    <Text style={{ color: "white", fontWeight: "bold" }}> CREATE </Text>
                </TouchableOpacity>

            </View>
        )
    }

    setDate = (event, newDate) => {
        newDate = newDate || this.state.date;
        let oldDate = this.state.date;
        oldDate.setMilliseconds(0)
        oldDate.setSeconds(0)

        if (this.state.pickerMode == "time") {
            oldDate.setHours(newDate.getHours(), newDate.getMinutes())
        } else {
            oldDate.setFullYear(newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate())
        }

        this.recalculateDateLimits()
        let errorMessage = this.checkTimeLimits(oldDate);
 
        this.setState({
            showPicker: Platform.OS === 'ios' ? true : false,
            date: oldDate,
            errorMessage
        });
    }

    showPicker = pickerMode => {
        this.setState({
            showPicker: true,
            pickerMode,
        });
    }

    //Returns an error message if there's a problem
    checkTimeLimits = (date) => {
        if (date.getTime() < this.minDate.getTime())
            return`The time of this event should be at least ${MIN_BROADCAST_WINDOW + 1} minutes away`
        else if (date.getTime() > this.maxDate.getTime())
            return `The time of this event should be less than ${Math.ceil(MAX_BROADCAST_WINDOW / 60)} hours away`
    }

    recalculateDateLimits = () => {
        this.minDate = new Date()
        this.minDate.setMilliseconds(0)
        this.minDate.setSeconds(0)
        //I'm adding 1 to the limit becuase I want to round up after removing the seconds
        let millisecondsToAdd = (MIN_BROADCAST_WINDOW + 1) * 60 * 1000
        this.minDate.setTime(this.minDate.getTime() + millisecondsToAdd)

        this.maxDate = new Date()
        millisecondsToAdd = (MAX_BROADCAST_WINDOW) * 60 * 1000
        this.maxDate.setTime(this.maxDate.getTime() + millisecondsToAdd)
    }

    createBroadcast = async () => {
        try{
            this.setState({isModalVisible: true})
            const uid = auth().currentUser.uid

            //First doing checks...
            this.recalculateDateLimits()
            let errorMessage = this.checkTimeLimits(this.state.date);
            if (errorMessage){
                this.setState({isModalVisible: false, errorMessage})
                return;
            }

            //Getting the uid's of all my recepients (and making sure I have some)...
            const friendsRef = database().ref(`/userFriendGroupings/${uid}/_masterUIDs/`);
            const friendsSnapshot = await timedPromise(friendsRef.once('value'), MEDIUM_TIMEOUT);
            if (!friendsSnapshot.exists()){
                this.setState({isModalVisible: false, errorMessage: "No recepients"})
                return;
            }

            const recepients = friendsSnapshot.val()
            const creationFunction = functions().httpsCallable('createActiveBroadcast');
            const response = await timedPromise(creationFunction({
                ownerUid: uid, 
                autoConfirm: false,
                location: this.state.location,
                deathTimestamp: this.state.date.getTime(),
                recepients
            }), LONG_TIMEOUT);

            if (response.data.status === returnStatuses.OK){
                this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
            }else{
                logError(new Error("Problematic createActiveBroadcast function response: " + response.data.status))
            }
        }catch(err){
            if (err.code == "timeout"){
                this.setState({errorMessage: "Timeout!"})
            }else{
                logError(err)       
            }
        }
        this.setState({isModalVisible: false})
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainForm: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: "100%",
        margin: 8
    },
    textInput: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 8
    },
    newBroadcastButton: {
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: "mediumseagreen",
        width: "100%",
        height: 50,
        flexDirection: 'row'
    }
})