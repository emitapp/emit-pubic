import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import Snackbar from 'react-native-snackbar';


export default class NewBroadcastFormTime extends React.Component {

    constructor(props){
        super(props)
        this.state = {showingMore: false}
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

                    <Button
                        title = "  Custom  "
                        containerStyle = {{marginTop: 16}}
                        onPress = {() => (
                            Snackbar.show({
                            text: 'Not supported yet!', 
                            duration: Snackbar.LENGTH_SHORT
                            })
                        )}
                    />
                </View>
                </View>
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }

    updateTime = (timeText, millis) => {
        this.props.navigation.state.params.timeText = timeText
        this.props.navigation.state.params.broadcastTTL = millis
        this.props.navigation.goBack()
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
                onPress = {() => this.updateTime(timeText, MILLIPERMIN * minutes)}
            />
        )
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