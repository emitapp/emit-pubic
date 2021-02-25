import React, { PureComponent } from "react";
import {
  View,
  TouchableHighlight,
  Text,
  StyleSheet,
} from "react-native";
import PropTypes from "prop-types";

class ListItem extends PureComponent {
  static propTypes = {
    leftElement: PropTypes.element,
    title: PropTypes.string,
    description: PropTypes.string,
    rightElement: PropTypes.element,
    rightText: PropTypes.string,
    onPress: PropTypes.func,
    onDelete: PropTypes.func,
    onLongPress: PropTypes.func,
    disabled: PropTypes.bool
  };

  updateRef = ref => {
    this.swipeableRow = ref;
  };

  close = () => {
    this.swipeableRow.close();
  };

  render() {
    const {
      leftElement,
      title,
      description,
      rightElement,
      rightText,
      onPress,
      onLongPress,
      disabled
    } = this.props;

    const Component = onPress || onLongPress ? TouchableHighlight : View;

    const {
      itemContainer,
      leftElementContainer,
      rightSectionContainer,
      mainTitleContainer,
      rightElementContainer,
      rightTextContainer,
      titleStyle,
      descriptionStyle
    } = styles;

    return (
      <View>
        <Component
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled}
          underlayColor="#f2f3f5"
        >
          <View style={itemContainer}>
            {leftElement ? (
              <View style={leftElementContainer}>{leftElement}</View>
            ) : (
                <View />
              )}
            <View style={rightSectionContainer}>
              <View style={mainTitleContainer}>
                <Text style={titleStyle}>{title}</Text>
                {description ? (
                  <Text style={descriptionStyle}>{description}</Text>
                ) : (
                    <View />
                  )}
              </View>
              <View style={rightTextContainer}>
                {rightText ? <Text>{rightText}</Text> : <View />}
              </View>

              {rightElement ? (
                <View style={rightElementContainer}>{rightElement}</View>
              ) : (
                  <View />
                )}
            </View>
          </View>
        </Component>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    minHeight: 44,
    height: 63
  },
  leftElementContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 2,
    paddingLeft: 13
  },
  rightSectionContainer: {
    marginLeft: 18,
    flexDirection: "row",
    flex: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#515151"
  },
  mainTitleContainer: {
    justifyContent: "center",
    flexDirection: "column",
    flex: 1
  },
  rightElementContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 0.4
  },
  rightTextContainer: {
    justifyContent: "center",
    marginRight: 10
  },
  titleStyle: {
    fontSize: 16
  },
  descriptionStyle: {
    fontSize: 14,
    color: "#515151"
  },
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  }
});

export default ListItem;