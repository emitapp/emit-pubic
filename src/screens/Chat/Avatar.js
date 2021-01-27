import React from 'react';
import {
    Image,
    StyleSheet,
    View,
} from 'react-native';

import {GiftedAvatar }from 'react-native-gifted-chat';

import {isSameUser, isSameDay} from './utils';

/**
 * changed size of avatar rendering
 */
export default class Avatar extends React.Component {
    renderAvatar() {
        if (this.props.renderAvatar) {
            const {renderAvatar, ...avatarProps} = this.props;
            return this.props.renderAvatar(avatarProps);
        }
        return (
            <GiftedAvatar
                avatarStyle={StyleSheet.flatten([styles[this.props.position].image, this.props.imageStyle[this.props.position]])}
                user={this.props.currentMessage.user}
            />
        );
    }

    render() {
        if (isSameUser(this.props.currentMessage, this.props.nextMessage) && isSameDay(this.props.currentMessage, this.props.nextMessage)) {
            return (
                <View style={[styles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
                    <GiftedAvatar
                        avatarStyle={StyleSheet.flatten([styles[this.props.position].image, this.props.imageStyle[this.props.position]])}
                    />
                </View>
            );
        }
        return (
            <View style={[styles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
                {this.renderAvatar()}
            </View>
        );
    }
}

const styles = {
    left: StyleSheet.create({
        container: {
            marginRight: 8,
        },
        image: {
            height: 25,
            width: 25,
            borderRadius: 18,
        },
    }),
    right: StyleSheet.create({
        container: {
            marginLeft: 8,
        },
        image: {
            height: 25,
            width: 25,
            borderRadius: 18,
        },
    }),
};

Avatar.defaultProps = {
    position: 'left',
    currentMessage: {
        user: null,
    },
    nextMessage: {},
    containerStyle: {},
    imageStyle: {},
};