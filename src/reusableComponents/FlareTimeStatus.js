import React from 'react';
import { Text, View } from 'react-native';
import CountdownComponent from 'reusables/CountdownComponent';


/**
 * Displays the time status of a flare (starts in..., ongoing, ends in ...)
 */
//Basic state machine
export default class FlareTimeStatus extends React.PureComponent {
  static defaultProps = {
    diameter: 10
  }

  constructor(props){
    super()
    this.NOTSTARTED = 0
    this.ONGOING = 1
    this.OVER = 2

    let currentState = null
    if (props.item.startingTime > Date.now()) currentState = this.NOTSTARTED
    else if (props.item.startingTime <= Date.now() && Date.now() < props.item.deathTimestamp) currentState = this.ONGOING
    else currentState = this.OVER

    this.state = {currentState}
  }

  render() {
    const { item } = this.props
    return (
      <View>
        {this.state.currentState == this.NOTSTARTED &&
          <>
            <CountdownComponent
              deadLine={item.startingTime}
              renderer={this.startingTimeRenderer} 
              onTimeout = {this.setStateToOngoing}/>
            {this.durationRenderer(CountdownComponent.secondsToTime(item.duration / 1000))}
          </>
        }

        {this.state.currentState == this.ONGOING &&
          <>
            <Text style={{ fontSize: 18, color: "forestgreen" }}>Ongoing</Text>
            <CountdownComponent
              deadLine={item.deathTimestamp}
              renderer={this.deathTimeRenderer} 
              onTimeout = {this.setStateToOver}/>
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
    if (!time.h && ! time.m) string += "< 1 min"
    return (
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }

  deathTimeRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins` : ""
    if (!time.h && ! time.m) string += "< 1 min"
    string += " left"
    return (
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }

  durationRenderer = (time) => {
    let string = "for "
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins` : ""
    if (!time.h && ! time.m) string += "< 1 min"
    return (
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }

  setStateToOngoing = () => {
    this.setState({currentState: this.ONGOING})
  }

  setStateToOver = () => {
    this.setState({currentState: this.OVER})
  }
}

