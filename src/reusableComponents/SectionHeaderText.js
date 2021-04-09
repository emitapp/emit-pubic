import React from 'react';
import { Text } from 'react-native-elements';

export default class SectionHeaderText extends React.PureComponent {
	render() {
		const { style, children, ...otherProps } = this.props
		return (
			<Text
				style={{ marginTop: 14, color: "blue", fontSize: 14, fontWeight: "bold", ...style }}
				{...otherProps}>
				{children}
			</Text>
		)
	}
}