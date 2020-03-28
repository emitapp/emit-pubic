import React from 'react';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';
import { Overlay, Text } from 'react-native-elements';

export class SmallLoadingComponent extends React.Component {
    static defaultProps = {
        style: { height: 70, width: 120 }  
    }

    render() {
        return (
            <View style = {this.props.style}>
                <LottieView source={require('media/animations/material-wave-loading.json')} autoPlay loop />
            </View>
        )
    }
}

export class LargeLoadingComponent extends React.Component {
    static defaultProps = {
        style: { height: 120, width: 200 }  
    }

    render() {
        return (
            <View style = {this.props.style}>
                <LottieView source={require('media/animations/fire-loading.json')} autoPlay loop />
            </View>
        )
    }
}

export class DefaultLoadingModal extends React.Component {
    static defaultProps = {
        style: {justifyContent: "center", alignItems: "center"},
        title: "Working on it...",
        message: "Internie will keep you company as you wait",
        isVisible: false
    }

    render() {
        return (        
            <Overlay
              isVisible={this.props.isVisible}>
                <View style={this.props.style}>
                  <LargeLoadingComponent/>
                  {this.props.title && 
                    <Text h4>{this.props.title}</Text>}
                  {this.props.message && 
                    <Text style={{textAlign: 'center', width: 250, marginVertical: 8}}>{this.props.message}</Text>}
                </View>
            </Overlay>
        )
    }
}