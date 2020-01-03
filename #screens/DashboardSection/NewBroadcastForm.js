// Self explanatory what this does

import React from 'react'
import { StyleSheet, Text, TextInput, View, Button, Platform, TouchableOpacity } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';


import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { timedPromise, MEDIUM_TIMEOUT, MIN_BROADCAST_WINDOW, MAX_BROADCAST_WINDOW } from '../../#constants/helpers';

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
            place: '',
            date: startingDate,
            errorMessage: null
        }
    }

    render() {
        return (
            <View style={styles.container}>
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
                        onChangeText={place => this.setState({ place })}
                        value={this.state.place}/>

                    <Text> Time and Date</Text>
                    <View>
                        <Button onPress={() => this.showPicker('date')} title="Choose Date" />
                    </View>
                    <View>
                        <Button onPress={() => this.showPicker('time')} title="Choose Time" />
                    </View>

                    {this.state.showPicker && <DateTimePicker value={this.state.date}
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
        let errorMessage = null;
        if (oldDate.getTime() < this.minDate.getTime())
            errorMessage = `The time of this event should be at least ${MIN_BROADCAST_WINDOW + 1} minutes away`
        else if (oldDate.getTime() > this.maxDate.getTime())
            errorMessage = `The time of this event should be less than ${Math.ceil(MAX_BROADCAST_WINDOW / 60)} hours away`

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

    createBroadcast = () => {
        console.log("Hah! I bet you thought this did something, eh?")
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
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