import React from 'react';
import { Text } from 'react-native-elements';

export default class ErrorMessageText extends React.PureComponent {
	static defaultStyle = { color: "red", alignSelf: "center" }
	render() {
		const { message, ...otherProps } = this.props
		if (!message) return null
		return (
			<Text
				style={{ ...ErrorMessageText.defaultStyle, ...this.props.style }}
				{...otherProps}>
				{this.props.message}
			</Text>
    )
	}
}