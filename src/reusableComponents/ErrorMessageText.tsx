import React from 'react';
import { StyleProp, TextProps, TextStyle } from 'react-native';
import { Text } from 'react-native-elements';

/**
 * Standard error text. Defaults to null if the message is falsey (ie "", null or undefined)
 */

interface ErrorMessageTextProps extends TextProps {
	message?: string
}

export default class ErrorMessageText extends React.PureComponent<ErrorMessageTextProps> {
	static defaultStyle : StyleProp<TextStyle> = { color: "red", alignSelf: "center" }

	render() : React.ReactNode | null {
		const { message, ...otherProps } = this.props
		if (!message) {return null}
		return (
			<Text
				style={[ErrorMessageText.defaultStyle, this.props.style]}
				{...otherProps}>
				{this.props.message}
			</Text>
    )
	}
}
