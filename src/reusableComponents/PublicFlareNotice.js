import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Tooltip, withTheme } from 'react-native-elements';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

class PublicFlareNotice extends React.PureComponent {

  render() {
    return (
      <Tooltip
        popover={<Text>This flare is visible to any nearby Emit users.</Text>}
        height={100}
        withPointer={false}
        skipAndroidStatusBar={true}>
        <View style={{ ...styles.mainStyle, ...this.props.style }}>
          <AwesomeIcon name="globe" color="grey" size={24} style={{ marginRight: 8 }} />
          <Text style={{ color: "grey" }}>Public Flare</Text>
        </View>
      </Tooltip>
    )
  }
}


const styles = StyleSheet.create({
  mainStyle: {
    flexDirection: "row",
    width: "auto",
    alignSelf: "flex-start",
    alignItems: "center"
  }
})

export default withTheme(PublicFlareNotice)