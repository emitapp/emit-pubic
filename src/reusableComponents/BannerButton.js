import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import styles from 'styling/styles';

/**
 * The reusable component for a banner button that spans the entire screen
 */
//Required props: onPress, title and iconName, color
//Optional Prop: extraStyles
export default class BannerButton extends React.PureComponent {

    render() {
        return (
            <TouchableOpacity 
                style = {[styles.bannerButton, {backgroundColor: this.props.color}, {...this.props.extraStyles}]}
                onPress={this.props.onPress}>
                <AwesomeIcon name={this.props.iconName} size={18} color= "white" style = {{marginRight: 18}} />
                <Text style = {{color: "white", fontWeight: "bold"}}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}