import React from 'react';
import { Text, View } from 'react-native';
import CountdownComponent from 'reusables/CountdownComponent';


/**
 * Displays the time status of a flare (starts in..., ongoing, ends in ...)
 */
//Basic state machine
export default class FlareTimeStatus extends React.PureComponent {

  //TODO: Investigate https://stackoverflow.com/questions/41408025/react-native-tolocalestring-not-working-on-android
  options = {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };

  static defaultProps = {
    diameter: 10
  }

  constructor(props) {
    super(props)
    this.NOTSTARTED = 0
    this.ONGOING = 1
    this.OVER = 2

    let currentState = null
    if (props.item.startingTime > Date.now()) currentState = this.NOTSTARTED
    else if (props.item.startingTime <= Date.now() && Date.now() < props.item.deathTimestamp) currentState = this.ONGOING
    else currentState = this.OVER

    this.state = { currentState }
  }

  render() {
    const { item } = this.props
    let style = {}
    if (this.props.center) style = {alignItems: "center"}
    return (
      <View style = {style}>
        {this.state.currentState == this.NOTSTARTED &&
          <>
            <CountdownComponent
              deadLine={item.startingTime}
              renderer={this.startingTimeRenderer}
              onTimeout={this.setStateToOngoing} />
            {this.durationRenderer(CountdownComponent.secondsToTime(item.duration / 1000))}
          </>
        }

        {this.state.currentState == this.ONGOING &&
          <>
            <Text style={{ fontSize: 18, color: "forestgreen" }}>Ongoing</Text>
            <CountdownComponent
              deadLine={item.deathTimestamp}
              renderer={this.deathTimeRenderer}
              onTimeout={this.setStateToOver} />
          </>
        }

        {this.state.currentState == this.OVER &&
          <Text style={{ fontSize: 18, color: "tomato" }}>Over</Text>
        }
      </View>
    )
  }

  startingTimeRenderer = (time) => {
    let string = "in "
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins ` : ""
    if (!time.h && !time.m) string += "< 1 min"
    return (
      <View>
        <Text style={this.props.style}>
          {this.removeTrailingComma(string)}
          {this.props.fullInfo && ` (${new Date(this.props.item.startingTime).toLocaleString(undefined, this.options)})`}
        </Text>
      </View>
    );
  }

  deathTimeRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins` : ""
    if (!time.h && !time.m) string += "< 1 min"
    string += " left"
    return (
      <View>
        <Text style={this.props.style}>
          {this.removeTrailingComma(string)}
          {this.props.fullInfo && ` (${new Date(this.props.item.deathTimestamp).toLocaleString(undefined, this.options)})`}
        </Text>

      </View>
    );
  }

  durationRenderer = (time) => {
    let string = "for "
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins` : ""
    if (!time.h && !time.m) string += "< 1 min"
    return (
      <View>
        <Text style={this.props.style}>
          {this.removeTrailingComma(string)}
        </Text>
      </View>
    );
  }

  setStateToOngoing = () => {
    this.setState({ currentState: this.ONGOING })
  }

  setStateToOver = () => {
    this.setState({ currentState: this.OVER })
  }

  removeTrailingComma = (str) => {
    return str.replace(/(^\s*,)|(,\s*$)/g, '')
  }
}

