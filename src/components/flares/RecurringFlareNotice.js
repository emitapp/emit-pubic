import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Tooltip, withTheme } from 'react-native-elements';
import Entypo from 'react-native-vector-icons/Entypo';

class RecurringFlareNotice extends React.PureComponent {

  render() {
    return (
      <Tooltip
        popover={<Text>This flare recurs every {this.props.days.join("/")} </Text>}
        height={100}
        withPointer={false}
        skipAndroidStatusBar={true}>
          <Entypo name="cycle" color="grey" size={24} style={{ marginRight: 8 }} />
      </Tooltip>
    )
  }
}



export default withTheme(RecurringFlareNotice)