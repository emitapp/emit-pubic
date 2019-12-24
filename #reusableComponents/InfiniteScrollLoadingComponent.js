import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Button } from 'react-native';

export default class InfiniteScrollLoadingComponent extends React.Component {
    render() {
        if (!this.props.hasTimedOut) {
            return (<ActivityIndicator />)
        } else {
            return (
                <View style={styles.container}>
                    <Text style={{color: 'red'}}>Timed Out!</Text>
                    <Button title="Retry" onPress={this.props.retryFunction}/>
                </View>
            )
        }
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})