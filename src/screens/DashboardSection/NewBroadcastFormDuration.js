import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MAX_BROADCAST_WINDOW } from 'utils/serverValues';
import { BannerButton } from 'reusables/ReusableButtons';
import S from 'styling'
import { epochToDateString } from 'utils/helpers'
import ErrorMessageText from 'reusables/ErrorMessageText';


export default class NewBroadcastFormDuration extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      showingCustom: false,
      date: null,
      errorMessage: null
    }
  }


  static navigationOptions = ClearHeader("New Broadcast")

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
              <Text h4 h4Style={{ marginTop: 8, fontWeight: "bold" }}>
                How long?
                </Text>
              <View style={{ flex: 1, marginHorizontal: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", alignSelf: "flex-start" }}>
                  in...
                </Text>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(10, "black")}
                  {this.generateTimeButton(20, "black")}
                  {this.generateTimeButton(30, "black")}
                </View>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(40, "black")}
                  {this.generateTimeButton(45, "black")}
                  {this.generateTimeButton(60, "black")}
                </View>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(60 * 2, "black")}
                  {this.generateTimeButton(60 * 3, "black")}
                  {this.generateTimeButton(60 * 5, "black")}
                </View>
              </View>
            </View>
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  generateTimeButton = (minutes, color) => {
    let MILLI_PER_MIN = 1000 * 60
    let buttonText = ""
    let timeText = ""
    if (minutes < 60) {
      buttonText = `${minutes} mins`
      timeText = `${minutes} minutes`
    } else {
      buttonText = `${minutes / 60} hours`
      timeText = `${minutes / 60} hours`
    }
    return (
      <TimeButton
        color={color}
        text={buttonText}
        millis={MILLI_PER_MIN * minutes}
        onPress={() => this.saveDuration(timeText, MILLI_PER_MIN * minutes)}
      />
    )
  }


  saveDuration = (timeText, millis) => {
    this.props.navigation.state.params.durationText = timeText
    this.props.navigation.state.params.duration = millis
    this.props.navigation.goBack()
  }
}


class TimeButton extends React.Component {
  render() {
    const { text, color, onPress } = this.props
    return (
      <View style={{ ...styles.timeButton, borderColor: this.props.color }}>
        <TouchableOpacity
          style={{ height: "100%", width: "100%", alignItems: "center", justifyContent: "center" }}
          onPress={onPress}>
          <Text style={{ color, fontWeight: "bold", fontSize: 20, textAlign: "center" }}>{text}</Text>
        </TouchableOpacity>
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