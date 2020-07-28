import React from 'react';
import LottieView from 'lottie-react-native';
import { Overlay, Text, Button } from 'react-native-elements';
import S from "styling";
import { View } from 'react-native';



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

export class TimeoutLoadingComponent extends React.Component {
    render() {
        if (!this.props.hasTimedOut) {
            return (
                <View style={S.styles.container}>
                    <SmallLoadingComponent />
                </View>
            )
        } else {
            return (
                <View style={{ ...S.styles.container, flexDirection: "row" }}>
                    <View style={{ width: 70, height: 70 }}>
                        <LottieView source={require('media/animations/timeout-animation.json')} autoPlay loop={false} />
                    </View>
                    <View>
                        <Text style={{ color: 'red', fontWeight: "bold" }}>Timed Out!</Text>
                        <Button title="Retry" onPress={this.props.retryFunction} />
                    </View>
                </View>
            )
        }
    }
}

//Needs one prop: condition
// -> disabled, loading, success, error
export class DataEmailSendingModal extends React.PureComponent {
    render() {
        let source = ""
        let text = ""
        let loop = true
        switch (this.props.condition){
            case "disabled": 
                source = require('media/animations/file-search.json')
                text = ''
                break
            case "loading": 
                source = require('media/animations/file-search.json')
                text = 'Combing our database...'
                break
            case "success": 
                source = require('media/animations/success-check.json')
                text = 'Email sent!'
                loop = false
                break
            case "error": 
                source = require('media/animations/error-state-dog.json')
                text = 'Oops! Looks like something went wrong.'
                break
        }

        return (
            <Overlay isVisible={this.props.condition != 'disabled'}>
            <View>
                <View style={{ width: 200, height: 200 }}>
                    <LottieView source={source} autoPlay loop={loop} />
                </View>
                <Text style={{fontWeight: "bold", width: 200, textAlign: 'center' }}>{text}</Text>
            </View>
            </Overlay>
        )
    }
}