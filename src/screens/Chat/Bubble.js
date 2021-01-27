import React from 'react';
import {
    Clipboard,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Text
} from 'react-native';

import {MessageText, MessageImage, Time} from 'react-native-gifted-chat'
import Name from './Name'

import {isSameUser, isSameDay} from './utils';


/**
 * Component for rendering message bubble, modified it to make it orange, remove time,
 *  and generally look nicer.
 * Taken from react-native-gifted-chat code, then modified
 */
export default class Bubble extends React.Component {
    constructor(props) {
        super(props);
        this.onLongPress = this.onLongPress.bind(this);
    }

    handleBubbleToNext() {
        if (isSameUser(this.props.currentMessage, this.props.nextMessage) && isSameDay(this.props.currentMessage, this.props.nextMessage)) {
            return StyleSheet.flatten([styles[this.props.position].containerToNext, this.props.containerToNextStyle[this.props.position]]);
        }
        return null;
    }

    handleBubbleToPrevious() {
        if (isSameUser(this.props.currentMessage, this.props.previousMessage) && isSameDay(this.props.currentMessage, this.props.previousMessage)) {
            return StyleSheet.flatten([styles[this.props.position].containerToPrevious, this.props.containerToPreviousStyle[this.props.position]]);
        }
        return null;
    }

    renderMessageText() {
        if (this.props.currentMessage.text) {
            const {containerStyle, wrapperStyle, ...messageTextProps} = this.props;
            if (this.props.renderMessageText) {
                return this.props.renderMessageText(messageTextProps);
            }
            return <MessageText {...messageTextProps}/>;
        }
        return null;
    }

    renderMessageImage() {
        if (this.props.currentMessage.image) {
            const {containerStyle, wrapperStyle, ...messageImageProps} = this.props;
            if (this.props.renderMessageImage) {
                return this.props.renderMessageImage(messageImageProps);
            }
            return <MessageImage {...messageImageProps}/>;
        }
        return null;
    }

    //i use the name component to render name instead
    renderName() {
        {
            if (!isSameUser(this.props.currentMessage, this.props.previousMessage)){
                return <Name style={{ color: 'black'}, {backgroundColor: 'black'}} {...this.props} />;
            } 
          }
    }


    renderCustomView() {
        if (this.props.renderCustomView) {
            return this.props.renderCustomView(this.props);
        }
        return null;
    }

    //TODO: Add in more features like replying to chats, liking/disliking, etc
    onLongPress() {
        if (this.props.onLongPress) {
            this.props.onLongPress(this.context);
        } else {
            if (this.props.currentMessage.text) {
                const options = [
                    'Copy Text',
                    'Cancel',
                ];
                const cancelButtonIndex = options.length - 1;
                this.context.actionSheet().showActionSheetWithOptions({
                        options,
                        cancelButtonIndex,
                    },
                    (buttonIndex) => {
                        switch (buttonIndex) {
                            case 0:
                                Clipboard.setString(this.props.currentMessage.text);
                                break;
                        }
                    });
            }
        }
    }

    render() {
        return (
            <View style={[styles[this.props.position].container, this.props.containerStyle[this.props.position]]}>
                    {this.renderName()}
                <View
                    style={[styles[this.props.position].wrapper, this.props.wrapperStyle[this.props.position], this.handleBubbleToNext(), this.handleBubbleToPrevious()]}>
                    <TouchableWithoutFeedback
                        onLongPress={this.onLongPress}
                        accessibilityTraits="text"
                        {...this.props.touchableProps}
                    >
                        <View>
                            {this.renderCustomView()}
                            {this.renderMessageImage()}
                            {this.renderMessageText()}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </View>
        );
    }
}

const styles = {
    left: StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'flex-start',
        },
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#f0f0f0',
            marginRight: 60,
            minHeight: 20,
            justifyContent: 'flex-end',
        },
        containerToNext: {
            borderBottomLeftRadius: 3,
        },
        containerToPrevious: {
            borderTopLeftRadius: 3,
        },
        timeColor: {
            color: 'gray'
        }
    }),
    right: StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'flex-end',
        },
        wrapper: {
            borderRadius: 15,
            backgroundColor: '#0084ff',
            marginLeft: 60,
            minHeight: 20,
            justifyContent: 'flex-end',
        },
        containerToNext: {
            borderBottomRightRadius: 3,
        },
        containerToPrevious: {
            borderTopRightRadius: 3,
        },
        timeColor: {
            color:'gray'
        }
    }),
};


Bubble.defaultProps = {
    touchableProps: {},
    onLongPress: null,
    renderMessageImage: null,
    renderMessageText: null,
    renderCustomView: null,
    renderTime: null,
    position: 'left',
    currentMessage: {
        text: null,
        createdAt: null,
        image: null,
    },
    nextMessage: {},
    previousMessage: {},
    containerStyle: {},
    wrapperStyle: {},
    containerToNextStyle: {},
    containerToPreviousStyle: {},
};