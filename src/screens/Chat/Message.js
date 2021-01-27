import React from 'react';
import {
    View,
    StyleSheet,
    Text
} from 'react-native';

import Avatar from './Avatar'
import Bubble from './Bubble.js'
import Day from './Day.js'



import {isSameUser, isSameDay} from './utils';


/**
 * Component to render message
 * Changed rendering of day and avatar size, as well as some minor styling stuff
 */
//Taken from react-native-gifted-chat code, then modified
export default class Message extends React.Component {

    getInnerComponentProps() {
        const {containerStyle, ...props} = this.props;
        return {
            ...props,
            isSameUser,
            isSameDay
        }
    }
    renderDay() {
        if (this.props.currentMessage.createdAt) {
            const dayProps = this.getInnerComponentProps();
            if (this.props.renderDay) {
                return this.props.renderDay(dayProps);
            }
            return <Day {...dayProps}/>;
        }
        return null;
    }

    renderBubble() {
        const bubbleProps = this.getInnerComponentProps();
        if (this.props.renderBubble) {
            return this.props.renderBubble(bubbleProps);
        }
        return <Bubble {...bubbleProps}
        wrapperStyle={{
            left: {
              backgroundColor: 'lightgray',
            },
            right: {
              backgroundColor: '#FF8C00'
            }
          }}
        />;
    }

    //TODO: change so avatar is from node-modules and not local code. When doing that size needs to be changed
    renderAvatar() {
        if (this.props.user._id !== this.props.currentMessage.user._id) {
            const avatarProps = this.getInnerComponentProps();
            return <Avatar {...avatarProps}/>;
        }
        return null;
    }

    render() {
        return (
            <View>
    
                {this.renderDay()}
                <View style={[styles[this.props.position].container, {
                    marginBottom: isSameUser(this.props.currentMessage, this.props.nextMessage) ? 2 : 10,
                }, this.props.containerStyle[this.props.position]]}>
                    {this.props.position === 'left' ? this.renderAvatar() : null}
                    {this.renderBubble()}
                    {this.props.position === 'right' ? this.renderAvatar() : null}
                </View>
            </View>
        );
    }
}

const styles = {
    left: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            marginLeft: 8,
            marginRight: 0,
        },
    }),
    right: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginLeft: 0,
            marginRight: 8,
        },
    }),
};

Message.defaultProps = {
    // renderAvatar: null,
    renderBubble: null,
    renderDay: null,
    position: 'left',
    currentMessage: {},
    nextMessage: {},
    previousMessage: {},
    user: {},
    containerStyle: {},
};