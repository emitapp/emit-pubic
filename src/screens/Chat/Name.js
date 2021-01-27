import PropTypes from 'prop-types';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';


/**
 * Component to render name of sender at the top of message instead of time
 * changed name to render at the top of messages if new user sends messages
 */
//Taken from react-native-gifted-chat code, then modified

export default class Name extends React.Component {
    render() {
        if (this.props.currentMessage.user.name !== this.props.user.name) {
            return (
                <View style={[styles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
                    <Text style={[styles[this.props.position].text, this.props.textStyle[this.props.position]]}>
                        {this.props.currentMessage.user.name}
                    </Text>
                </View>
            );
        }
        return null
    }
}

const containerStyle = {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 5,
};

const textStyle = {
    fontSize: 10,
    backgroundColor: 'transparent',
    textAlign: 'right',
};

const styles = {
    left: StyleSheet.create({
        container: {
            ...containerStyle,
        },
        text: {
            color: '#aaa',
            ...textStyle,
        },
    }),
    right: StyleSheet.create({
        container: {
            ...containerStyle,
        },
        text: {
            color: '#fff',
            ...textStyle,
        },
    }),
};

Name.contextTypes = {
    getLocale: PropTypes.func,
};

Name.defaultProps = {
    position: 'left',
    currentMessage: {
        createdAt: null,
    },
    containerStyle: {},
    textStyle: {},
};