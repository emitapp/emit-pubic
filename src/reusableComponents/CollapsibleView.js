import React from 'react';
import { Text } from 'react-native-elements';
import { Animated, Easing, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

//Props (all optional)
//title (what's the tile of this section)
//flexOnExpand (should this take flex:1 on expansion?)
//titleStyle (style of the title)
export default class CollapsibleView extends React.PureComponent {

  constructor(props) {
    super(props)
    this.state = { animatedRotVal: new Animated.Value(0), expanded: false }
    this.degrees = this.state.animatedRotVal.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg']
    })
  }

  static defaultProps = {
    title: "This is an expandable view!",
  }

  render() {
    return (
      <View style = {{...this.props.style, ...(this.props.flexOnExpand && this.state.expanded ? {flex: 1} : {}) }}>
        <TouchableOpacity onPress={this.toggleExpansion} style={{ flexDirection: "row" }}>
          <Animated.View style={{ transform: [{ rotate: this.degrees }], justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}>
            <Icon name="caret-right" size={24} />
          </Animated.View>
          <Text style={{ marginRight: 16, flexShrink: 1, ...this.props.titleStyle }}>{this.props.title}</Text>
        </TouchableOpacity>
        <View style = {{...(this.props.flexOnExpand && this.state.expanded ? {flex: 1} : {})}}>
          {this.state.expanded && this.props.children}
        </View>
      </View>
    )
  }

  toggleExpansion = () => {
    if (this.state.expanded) {
      this.rotateIcon(0)
      this.setState({ expanded: false })
    } else {
      this.rotateIcon(1)
      this.setState({ expanded: true })
    }
  }

  rotateIcon = (destinationValue) => {
    this.state.animatedRotVal.stopAnimation()
    Animated.timing(
      this.state.animatedRotVal,
      {
        toValue: destinationValue,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true
      }
    ).start()
  }

}