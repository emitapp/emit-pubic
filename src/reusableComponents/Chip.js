import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

//RequiredProps: mainColor, selected
//OptionalProps: selectedTextColor
//It's children could just be text components (they will automatically be boldened)
export default class Chip extends React.PureComponent {

    render() {
        var mainTheme, backgroundColor, borderColor, color = null;
        const {mainColor, selected, style, selectedTextColor, children, ...otherProps} = this.props
        if (selected){
          mainTheme = styles.selected
          backgroundColor = mainColor
          borderColor = mainColor
          color = selectedTextColor || "white"
        }else{
          mainTheme = styles.dormant
          backgroundColor = "transparent"
          borderColor = mainColor
          color = mainColor
        }

        return (
            <TouchableOpacity 
                {...otherProps}
                style = {{...mainTheme, ...style, borderColor, backgroundColor}}>
                {React.Children.map(children, child => this.mapTextChild(child, color))}
            </TouchableOpacity>
        )
    }

    mapTextChild = (child, color) => {
      var style = {...child.props.style, color, fontWeight: "bold" };
      return React.cloneElement(child, {style}, child.props.children)
    }
}

const styles = StyleSheet.create({
    dormant: {
      marginRight: 10,
      borderWidth: 2,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    selected: {
      marginRight: 10,
      borderWidth: 2,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4
    }
  })