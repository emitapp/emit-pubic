import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';
import MainLinearGradient from 'reusables/containers/MainLinearGradient';
import { ClearHeader } from 'reusables/Header';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { BannerButton } from 'reusables/ui/ReusableButtons';
import S from 'styling';
import MainTheme from 'styling/mainTheme';
import { epochToDateString } from 'utils/helpers';
import { MAX_BROADCAST_WINDOW } from 'utils/serverValues';


export default class NewBroadcastFormTime extends React.Component {

    constructor(props) {
        super(props)
        this.maxDate = null;
        this.recalculateDateLimits()

        let startingDate = new Date()
        startingDate.setMilliseconds(0)
        startingDate.setSeconds(0)
        startingDate.setTime(startingDate.getTime() + 3 * 60 * 1000)

        this.state = {
            showingCustom: false,
            showPicker: false,
            pickerMode: "",
            date: startingDate,
            errorMessage: null,
            currentTime: new Date()
        }

        this.pressedColors = {
            outerBorder: "lightgrey",
            innerBorder: "white",
            innerCircle: MainTheme.colors.primary,
            iconColor: "white"
        }

        this.refreshIntervalID = 0;
    }

    static navigationOptions = ClearHeader("New Flare")

    async componentDidMount() {
        // Refreshes the date every 3 minutes so that clock times don't become irrelevant
        this.refreshIntervalID = setInterval(() => {
            this.setState({ currentTime: new Date() });
        }, 3 * 60 * 1000)
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalID);
    }

    render() {
        return (
            <ThemeConsumer>
                {({ theme }) => (
                    <MainLinearGradient theme={theme}>
                        <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
                            <Text h4 h4Style={{ marginTop: 8, fontWeight: "bold" }}>
                                What time will your flare start?
                            </Text>
                            <View style={{ flexDirection: "row", flex: 1 }}>
                                <View style={{ flex: 1, marginHorizontal: 16, alignItems: "center" }}>
                                    <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 8 }}>
                                        in...
                                    </Text>
                                    <View style={styles.rowStyle}>
                                        {this.generateTimeButton(0, "black")}
                                        {this.generateTimeButton(10, "black")}
                                        {this.generateTimeButton(30, "black")}
                                    </View>
                                    <View style={styles.rowStyle}>
                                        {this.generateClockButton(1, 0, "black")}
                                        {this.generateClockButton(1, 30, "black")}
                                        {this.generateClockButton(2, 0, "black")}
                                    </View>
                                    <View style={styles.rowStyle}>
                                        {this.generateClockButton(2, 30, "black")}
                                        {this.generateClockButton(3, 0, "black")}
                                        {this.generateClockButton(3, 30, "black")}
                                    </View>

                                    {!this.state.showingCustom &&
                                        <Button
                                            title="Custom Time"
                                            containerStyle={{ marginTop: 16 }}
                                            onPress={() => this.setState({ showingCustom: true })}
                                        />
                                    }

                                    {this.state.showingCustom &&
                                        <>
                                            <ErrorMessageText message={this.state.errorMessage} />

                                            <Text style={{ textAlign: "center" }}> Chosen date: </Text>
                                            <Text style={{ textAlign: "center", fontWeight: "bold", margin: 8 }}>
                                                {epochToDateString(this.state.date.getTime())}
                                            </Text>
                                            {this.state.showPicker &&
                                                <DateTimePicker value={this.state.date}
                                                    style={{ width: '100%' }}
                                                    mode={this.state.pickerMode}
                                                    is24Hour={false}
                                                    display="default"
                                                    onChange={this.setDate}
                                                    minimumDate={new Date()} />
                                            }
                                            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
                                                <Button onPress={() => this.showPicker('date')} title="Change Date" />
                                                <Button onPress={() => this.showPicker('time')} title="Change Time" />
                                            </View>
                                        </>
                                    }

                                </View>
                            </View>
                            {this.state.showingCustom &&
                                <BannerButton
                                    iconName={S.strings.confirm}
                                    onPress={this.saveCustomTime}
                                    title="CONFIRM"
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
        if (minutes == 0) {
            buttonText = `Now`
            timeText = `Now`
        } else if (minutes < 60) {
            buttonText = `${minutes} mins`
            timeText = `In ${minutes} minutes`
        } else {
            buttonText = `${minutes / 60} hours`
            timeText = `In ${minutes / 60} hours`
        }
        return (
            <TimeButton
                color={color}
                text={buttonText}
                millis={MILLIPERMIN * minutes}
                onPress={() => this.saveStandardTime(timeText, MILLIPERMIN * minutes)}
            />
        )
    }

    generateClockButton = (hoursModifier, minuteModifier, color) => {
        let timeCopy = new Date(this.state.currentTime)
        let hours = this.state.currentTime.getHours() + hoursModifier
        let minutesTens = 0
        const round = this.clockRound(this.state.currentTime.getMinutes() + minuteModifier)
        switch (round) {
            case 1:
                minutesTens = 3;
                timeCopy.setMinutes(30)
                break;
            case 2:
                hours += 1;
                timeCopy.setMinutes(0)
                break;
            case 3:
                hours += 1;
                minutesTens = 3;
                timeCopy.setMinutes(30)
                break;
            default:
                timeCopy.setMinutes(0)
                break;
        }

        let hourTime = hours % 12
        let buttonText = (hourTime == 0 ? 12 : hourTime) + ":" + minutesTens + "0" + (hours >= 12 && hours < 24 ? "pm" : "am")
        timeCopy.setMilliseconds(0)
        timeCopy.setSeconds(0)
        timeCopy.setHours(0)
        timeCopy.setTime(timeCopy.getTime() + hours * 60 * 60 * 1000)
        return (
            <TimeButton
                color={color}
                text={buttonText}
                onPress={() => this.clockButtonOnPress(timeCopy)}
            />
        )
    }

    // Helper function specifically for generateClockButton - returns 0 for 0-14, 1 for 15-44, 2 for 45-74 and 3 for 75 to 90
    clockRound = (number) => {
        return Math.round(number / 30)
    }

    clockButtonOnPress = (time) => {
        this.props.navigation.state.params.startingTimeText = epochToDateString(time)
        this.props.navigation.state.params.startingTime = time.getTime()
        this.props.navigation.state.params.startingTimeRelative = false
        this.props.navigation.state.params.isStartingSameTime = false
        this.props.navigation.goBack()
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
            showPicker: true,
            pickerMode,
        });
    }

    //Returns an error message if there's a problem
    checkTimeLimits = (date) => {
        if (date.getTime() > this.maxDate.getTime())
            return `The time of this event should be less than ${Math.ceil(MAX_BROADCAST_WINDOW / 60)} hours away`
        else return null
    }

    recalculateDateLimits = () => {
        this.maxDate = new Date()
        let millisecondsToAdd = (MAX_BROADCAST_WINDOW) * 60 * 1000
        this.maxDate.setTime(this.maxDate.getTime() + millisecondsToAdd)
    }

    saveStandardTime = (timeText, millis) => {
        this.props.navigation.state.params.startingTimeText = timeText
        this.props.navigation.state.params.startingTime = millis
        this.props.navigation.state.params.startingTimeRelative = true
        this.props.navigation.state.params.isStartingSameTime = false
        this.props.navigation.goBack()
    }

    saveCustomTime = () => {
        //First doing checks...
        this.recalculateDateLimits()
        let errorMessage = this.checkTimeLimits(this.state.date);
        if (errorMessage) {
            this.setState({ errorMessage })
            return;
        }
        this.props.navigation.state.params.startingTimeText = epochToDateString(this.state.date.getTime())
        this.props.navigation.state.params.startingTime = this.state.date.getTime()
        this.props.navigation.state.params.startingTimeRelative = false
        this.props.navigation.state.params.isStartingSameTime = false
        this.props.navigation.goBack()
    }
}


class TimeButton extends React.Component {

    state = {
        pressedDown: false
    }

    unpressedColors = {
        outerBorder: "lightgrey",
        innerBorder: "white",
        iconColor: "white"
    }

    pressedColors = {
        outerBorder: "lightgrey",
        innerBorder: "lightgrey",
        iconColor: "lightgrey"
    }

    render() {
        const { text, color, onPress } = this.props
        return (
            <View style={{
                ...styles.timeButton, borderColor: this.props.color,
                backgroundColor: this.state.pressedDown ? this.pressedColors.iconColor : this.unpressedColors.iconColor
            }}>
                <Pressable
                    style={{ height: "100%", width: "100%", alignItems: "center", justifyContent: "center" }}
                    onPressIn={() => this.setState({ pressedDown: true })}
                    onPressOut={() => this.setState({ pressedDown: false })}
                    onPress={onPress}>
                    <Text style={{ color, fontWeight: "bold", fontSize: 20, textAlign: "center" }}>{text}</Text>
                </Pressable>
            </View>
        )
    }
}


const styles = StyleSheet.create({
    timeButton: {
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