import React from 'react';
import { Text, View } from 'react-native';
import CountdownComponent from 'reusables/CountdownComponent';


/**
 * Displays the time status of a flare (starts in..., ongoing, ends in ...)
 */
export default class FlareTimeStatus extends React.PureComponent {
  static defaultProps = {
    diameter: 10
  }

  render() {
    const { item } = this.props
    return (
      <View>
        {item.startingTime > Date.now() &&
          <>
            <CountdownComponent
              deadLine={item.startingTime}
              renderer={this.startingTimeRenderer} />
            {this.durationRenderer(CountdownComponent.secondsToTime(item.duration / 1000))}
          </>
        }

        {item.startingTime < Date.now() &&
          <>
            <Text style={{ fontSize: 18, color: "forestgreen" }}>Ongoing</Text>
            <CountdownComponent
              deadLine={item.deathTimestamp}
              renderer={this.deathTimeRenderer} />
          </>
        }
      </View>
    )
  }

  startingTimeRenderer = (time) => {
    let string = "in "
    string += time.h ? `${time.h} hrs, ` : ""
    string += time.m ? `${time.m} mins ` : ""
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
    return (
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }
}

