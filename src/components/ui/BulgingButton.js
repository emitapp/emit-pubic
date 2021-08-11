import React from 'react';
import { Animated, Easing } from 'react-native';
import { Button } from 'react-native-elements';

export default class BulgingButton extends React.Component {

    bulgeValue = new Animated.Value(0)

    static defaultProps = {
        bulgeTime: 0.5, //in seconds
        width: 50,
        height: 50,
        increase: 10
    }

    state = {
        width: this.props.width,
        height: this.props.height,
    }


    componentDidMount() {
        this.bulge()
    }

    componentWillUnmount() {
        this.bulgeValue.removeAllListeners()
    }

    render() {
        const {buttonStyle, ...other} = this.props
        const { width, height } = this.state

        return (
            <Button {...other} ref={r => this.button = r} buttonStyle = {{...buttonStyle, width, height}} />
        )
    }

    bulge = () => {
        //In case this is not the first time this is being called
        this.bulgeValue.removeAllListeners()
        this.bulgeValue.stopAnimation()

        let duration = this.props.bulgeTime * 1000
        let startingEasing = Easing.inOut(Easing.quad)
        let endingEasing = Easing.bounce
        let useNativeDriver = true
        const { increase, width, height } = this.props

        Animated.sequence([
            Animated.timing(this.bulgeValue,
                { toValue: this.props.increase, duration, easing: startingEasing, useNativeDriver }),
            Animated.timing(this.bulgeValue,
                { toValue: 0, duration, easing: endingEasing, useNativeDriver })
        ]).start()

        this.bulgeValue.addListener(({ value }) =>
            this.setState({ width: width + value, height: height + value })
        )
    }
}