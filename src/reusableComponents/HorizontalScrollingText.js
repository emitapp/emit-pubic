import React from 'react';
import { Text } from 'react-native-elements';
import {ScrollView, Animated, Easing} from 'react-native' 

//Props (all optional):
//scrollSpeed, containerHeight, containerStyle, textStyle, parentStyle
export default class HorizontalScrollingText extends React.Component {

    scrollValue = new Animated.Value(0)
    containerWidth = 0
    scrollViewWidth = 0

    static defaultProps = {
        scrollSpeed: 100, //in units per second
        containerHeight: 30
    }

    componentWillUnmount(){
        this.scrollValue.removeAllListeners()
    }

    render() {
        return (
            <ScrollView 
            style = {{width: "100%", maxHeight: this.props.containerHeight, ...this.props.parentStyle}}
            contentContainerStyle = {{maxHeight: this.props.containerHeight, ...this.props.containerStyle}}
            horizontal
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled = {false}
            ref = {ref => this.scrollView = ref}
            onContentSizeChange = {(width, _) => this.updateContainerWidth(width)}
            onLayout = {(e) => this.updateScrollViewWidth(e.nativeEvent.layout.width)}>
                <Text style = {{...this.props.textStyle}}>
                    {this.props.children}
                </Text>
            </ScrollView>
        )
    }

    startScrolling = () => {
        //In case this is not the first time this is being called
        this.scrollValue.removeAllListeners()
        this.scrollValue.stopAnimation() 

        var dimensionDifference = Math.max(0, this.containerWidth - this.scrollViewWidth)
        var duration = (dimensionDifference / this.props.scrollSpeed) * 1000    
        var easing = Easing.inOut(Easing.quad)

        Animated.loop(
            Animated.sequence([
                Animated.delay(2000),
                Animated.timing(this.scrollValue, 
                    {toValue: dimensionDifference, duration, easing}),
                Animated.delay(2000),
                Animated.timing(this.scrollValue, 
                    {toValue: 0, duration, easing})
            ])
        ).start()

        this.scrollValue.addListener(({value}) => this.scrollView.scrollTo({x: value, animated: false}))
    }

    updateContainerWidth = (width) => {
        this.containerWidth = width
        if (this.containerWidth && this.scrollViewWidth) this.startScrolling()
    }

    updateScrollViewWidth = (width) => {
        this.scrollViewWidth = width
        if (this.containerWidth && this.scrollViewWidth) this.startScrolling()
    }
}