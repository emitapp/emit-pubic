import LinearGradient from 'react-native-linear-gradient';
import S from 'styling';
import React from 'react'

export default class MainLinearGradient extends React.PureComponent {
    render() {
        return (
            <LinearGradient 
            style={{...S.styles.containerFlexStart}}
            colors={[this.props.theme.colors.gradientStart, this.props.theme.colors.gradientEnd]}
            start={{x: 0.2, y: 0.2}} end={{x: 1, y: 1}}>  
                {this.props.children}
            </LinearGradient>
        )
    }
}