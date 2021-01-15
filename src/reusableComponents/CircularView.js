import React from 'react';
import { View } from 'react-native';

export default class CircularView extends React.Component {
    static defaultProps = {
        diameter: 10
    }

    render() {
        const { style, ...otherProps } = this.props
        return (
            <View
                style={{
                    justifyContent: 'center', 
                    alignItems: 'center',
                    ...this.props.style,
                    height: this.props.diameter,
                    width: this.props.diameter,
                    borderRadius: this.props.diameter / 2,
                }}
                {...otherProps}
            />
        )
    }
}

