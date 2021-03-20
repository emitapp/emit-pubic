import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Tooltip, withTheme } from 'react-native-elements';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default class MoreInformationTooltip extends React.PureComponent {

  static defaultProps = {
    message: "This is a tooltip!",
    height: 200,
    width: 300
  }

  render() {
    return (
      <Tooltip
        popover={<Text>{this.props.message}</Text>}
        height={this.props.height}
        withPointer={false}
        width={this.props.width}
        skipAndroidStatusBar={true}>
        <View style={{
          marginTop: 8,
          flexDirection: "row",
          padding: 6,
          width: "auto",
          alignSelf: "flex-start"
        }}>
          <FontAwesome name="question-circle-o" color="#2F3ED6" size={24} />
        </View>
      </Tooltip>
    )
  }
}