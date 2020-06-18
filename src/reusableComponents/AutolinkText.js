import React from 'react';
import Autolink from 'react-native-autolink';
import { Text } from 'react-native-elements';


export default class AutolinkText extends React.Component {
    render() {
        const {children, ...otherProps} = this.props
        return (
            <Autolink
                text={this.props.children}
                hashtag="instagram"
                mention="insatgram"
                component = {Text}
                linkStyle = {{color: "blue"}}
                truncate = {0}
                {...otherProps}
            />
        )
    }
}