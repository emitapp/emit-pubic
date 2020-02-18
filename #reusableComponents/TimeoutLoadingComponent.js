import React from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import S from "styling";

export default class TimeoutLoadingComponent extends React.Component {
    render() {
        if (!this.props.hasTimedOut) {
            return (<ActivityIndicator />)
        } else {
            return (
                <View style={S.styles.container}>
                    <Text style={{color: 'red'}}>Timed Out!</Text>
                    <Button title="Retry" onPress={this.props.retryFunction}/>
                </View>
            )
        }
    }
}