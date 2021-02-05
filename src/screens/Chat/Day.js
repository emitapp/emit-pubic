import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { isSameTime } from './utils';



/**
 * Component to reflect when and how date is rendered
 */
//Taken from react-native-gifted-chat code, then modified
export default class Day extends React.Component {

    render() {
        if (!isSameTime(this.props.currentMessage, this.props.previousMessage)) {
            const time = moment(this.props.currentMessage.createdAt).locale(this.context.getLocale())
            return (
                <View style={[styles.container, this.props.containerStyle]}>
                    <View style={[styles.wrapper, this.props.wrapperStyle]}>
                        <Text style={[styles.text, this.props.textStyle]}>
                            {time.format('ll').toUpperCase()},  {time.format('LT')}
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    }
}


const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 10,
    },
    wrapper: {
    },
    text: {
        backgroundColor: 'transparent',
        color: '#b2b2b2',
        fontSize: 12,
        fontWeight: '600',
    },
});

Day.contextTypes = {
    getLocale: PropTypes.func,
};

Day.defaultProps = {
    currentMessage: {
        // TODO test if crash when createdAt === null
        createdAt: null,
    },
    previousMessage: {},
    containerStyle: {},
    wrapperStyle: {},
    textStyle: {},
};