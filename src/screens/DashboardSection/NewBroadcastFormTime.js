import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MAX_BROADCAST_WINDOW, MIN_BROADCAST_WINDOW, } from 'utils/serverValues';
import { BannerButton } from 'reusables/ReusableButtons';
import S from 'styling'
import {epochToDateString} from 'utils/helpers'
import ErrorMessageText from 'reusables/ErrorMessageText';


export default class NewBroadcastFormTime extends React.Component {

    constructor(props){
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
            showingCustom: false,
            showPicker: false,
            pickerMode: "",
            date: startingDate,
            errorMessage: null
        }
    }


    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader(navigationOptions, "New Broadcast")
    };

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                <Text h4 h4Style={{marginTop: 8, fontWeight: "bold"}}>
                    What time?
                </Text>
                <View style = {{flexDirection: "row", flex: 1}}>
                <View style = {{flex: 1, marginHorizontal: 16, alignItems: "center"}}>
                    <Text style = {{fontSize: 18, fontWeight: "bold", alignSelf: "flex-start"}}>
                        in...
                    </Text>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(5, theme.colors.primary)}
                        {this.generateTimeButton(10, theme.colors.primary)}
                        {this.generateTimeButton(15, theme.colors.primary)}
                    </View>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(20, theme.colors.primary)}
                        {this.generateTimeButton(25, theme.colors.primary)}
                        {this.generateTimeButton(30, theme.colors.primary)}
                    </View>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(45, theme.colors.primary)}
                        {this.generateTimeButton(60, theme.colors.primary)}
                        {this.generateTimeButton(90, theme.colors.primary)}
                    </View>

                    {!this.state.showingCustom && 
                        <Button
                        title = "  Custom  "
                        containerStyle = {{marginTop: 16}}
                        onPress = {() => this.setState({showingCustom: true})}
                        />
                    }

                    {this.state.showingCustom && 
                        <>
                        <View style = {{flexDirection: 'row', marginVertical: 8}}>
                            <Button onPress={() => this.showPicker('date')} title="Choose Date" />
                            <Button onPress={() => this.showPicker('time')} title="Choose Time" />
                        </View>

                        <ErrorMessageText message = {this.state.errorMessage} />

                        <Text style={{ textAlign: "center" }}> Chosen date: </Text>
                        <Text style={{ textAlign: "center", fontWeight: "bold", margin: 8 }}>
                            {epochToDateString(this.state.date.getTime())}
                        </Text>
                        {this.state.showPicker &&
                            <DateTimePicker value={this.state.date}
                                style={{width:'100%'}}
                                mode={this.state.pickerMode}
                                is24Hour={false}
                                display="default"
                                onChange={this.setDate}
                                minimumDate={this.minDate} />
                            }
                        </>
                    }

                </View>
                </View>
                {this.state.showingCustom && 
                    <BannerButton
                    iconName = {S.strings.confirm}
                    onPress = {this.saveCustomTime}
                    title = "CONFIRM"
                    />  
                }
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }

    generateTimeButton = (minutes, color) => {
        let MILLIPERMIN = 1000 * 60
        let buttonText = ""
        let timeText = ""
        if (minutes < 60){
            buttonText = `${minutes} mins`
            timeText = `In ${minutes} minutes`
        }else{
            buttonText = `${minutes / 60} hours`
            timeText = `In ${minutes / 60} hours`
        }
        return(
            <TimeButton 
                color={color}
                text = {buttonText}
                millis = {MILLIPERMIN * minutes}
                onPress = {() => this.saveStandardTime(timeText, MILLIPERMIN * minutes)}
            />
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

    showPicker = (pickerMode) => {
        this.setState({
            //Allow the buttons to also act as visibility toggles for ios
            showPicker: Platform.OS === 'ios' ? (pickerMode != this.state.pickerMode) : true, 
            pickerMode,
        });
    }

    //Returns an error message if there's a problem
    checkTimeLimits = (date) => {
        if (date.getTime() < this.minDate.getTime())
            return`The time of this event should be at least ${MIN_BROADCAST_WINDOW + 1} minutes away`
        else if (date.getTime() > this.maxDate.getTime())
            return `The time of this event should be less than ${Math.ceil(MAX_BROADCAST_WINDOW / 60)} hours away`
        else return null
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

    saveStandardTime = (timeText, millis) => {
        this.props.navigation.state.params.timeText = timeText
        this.props.navigation.state.params.broadcastTTL = millis
        this.props.navigation.state.params.TTLRelative = true
        this.props.navigation.goBack()
    }

    saveCustomTime = () => {
        //First doing checks...
        this.recalculateDateLimits()
        let errorMessage = this.checkTimeLimits(this.state.date);
        if (errorMessage){
            this.setState({errorMessage})
            return;
        }
        this.props.navigation.state.params.timeText = epochToDateString(this.state.date.getTime())
        this.props.navigation.state.params.broadcastTTL = this.state.date.getTime()
        this.props.navigation.state.params.TTLRelative = false
        this.props.navigation.goBack()
    }
}


class TimeButton extends React.Component { 
    render() {
        const {text, color, onPress} = this.props
        return (
            <View style = {{...styles.timeButton, borderColor: this.props.color}}>
                <TouchableOpacity 
                    style = {{height: "100%", width: "100%", alignItems: "center",  justifyContent: "center"}}
                    onPress = {onPress}>
                    <Text style = {{color, fontWeight: "bold", fontSize: 20, textAlign: "center"}}>{text}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}


const styles = StyleSheet.create({
    timeButton:{
        justifyContent: "center", 
        alignItems: "center",
        height: "100%",
        width: "25%",
        borderRadius: 10,
        borderWidth: 3
    },
    rowStyle: {
        width: "100%",
        flexDirection: "row",
        marginVertical: 8,
        height: 50,
        justifyContent: "space-between",
    },
})