import React from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer } from 'react-native-elements';
import MainLinearGradient from 'reusables/containers/MainLinearGradient';
import { ClearHeader } from 'reusables/Header';
import Snackbar from 'react-native-snackbar';

const MILLI_PER_MIN = 1000 * 60
export default class NewBroadcastFormDuration extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      showingCustom: false,
      date: null,
      errorMessage: null,
      usingCustom: false,
      customMinutes: "0",
      customHours: "0"
    }
  }


  static navigationOptions = ClearHeader("New Flare")

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
              <Text h4 h4Style={{ marginTop: 8, fontWeight: "bold" }}>
                How long will this flare last?
              </Text>
              <View style={{ flex: 1, marginHorizontal: 16, alignItems: "center" }}>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(30, "black")}
                  {this.generateTimeButton(60, "black")}
                  {this.generateTimeButton(60 * 1.5, "black")}
                </View>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(60 * 2, "black")}
                  {this.generateTimeButton(60 * 2.5, "black")}
                  {this.generateTimeButton(60 * 3, "black")}
                </View>
                <View style={styles.rowStyle}>
                  {this.generateTimeButton(60 * 4, "black")}
                  {this.generateTimeButton(60 * 5, "black")}
                  {this.generateTimeButton(60 * 6, "black")}
                </View>

                <Button title="Custom" onPress={() => this.setState({ usingCustom: !this.state.usingCustom })} />
                {this.state.usingCustom &&
                  <>
                    <View style={{ flexDirection: "row" }}>
                      <Input
                        keyboardType='number-pad'
                        label="hours"
                        enablesReturnKeyAutomatically
                        containerStyle={{ flex: 1 }}
                        value={this.state.customHours}
                        onChangeText={(customHours) => this.setState({ customHours })}
                        errorMessage={this.getCustomHourError()}
                      />
                      <Input
                        keyboardType='number-pad'
                        label="minutes"
                        containerStyle={{ flex: 1 }}
                        value={this.state.customMinutes}
                        onChangeText={(customMinutes) => this.setState({ customMinutes })}
                        errorMessage={this.getCustomMinuteError()}
                      />
                    </View>

                    <Button title="Done" onPress={this.saveCustomDuration} />
                  </>
                }
              </View>
            </View>
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  generateTimeButton = (minutes, color) => {
    let buttonText = ""
    const timeText = this.createFormTextFromMinutes(minutes)

    if (minutes < 60) buttonText = `${minutes} mins`
    else buttonText = `${minutes / 60} hours`
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

  saveCustomDuration = () => {
    Keyboard.dismiss()
    if (this.getCustomHourError() || this.getCustomMinuteError()) {
      Snackbar.show({
        text: `Invalid duration. Check again!`,
        duration: Snackbar.LENGTH_SHORT
      });
      return
    }

    const parsedHours = parseInt(this.state.customHours)
    const parsedMinutes = parseInt(this.state.customMinutes)
    const totalMins = parsedHours * 60 + parsedMinutes;
    if (totalMins == 0) {
      Snackbar.show({
        text: `Your flare has no duration!`,
        duration: Snackbar.LENGTH_SHORT
      });
      return
    }

    let text = this.createFormTextFromMinutes(totalMins)
    this.saveDuration(text, totalMins * MILLI_PER_MIN)
  }



  getCustomMinuteError = () => {
    const parsedInput = parseInt(this.state.customMinutes)
    if (isNaN(parsedInput)) return "Invalid Input!"
    if (parsedInput > 59 || parsedInput < 0) return "Must be between 0 and 59!"
  }

  getCustomHourError = () => {
    const parsedInput = parseInt(this.state.customHours)
    if (isNaN(parsedInput)) return "Invalid Input!"
    if (parsedInput < 0) return "Must be non-negative"
  }

  createFormTextFromMinutes = (mins) => {
    if (mins < 60) return `${mins} minutes`
    else if (mins % 60) return `${Math.floor(mins / 60)} hours, ${mins % 60} minutes`
    else return `${Math.floor(mins / 60)} hours`
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