import React from 'react'
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';

export default class FriendButtonHub extends React.Component {

    render() {
        return (
            <View style={styles.container}>
                <Button
                    title="Find Users"
                    onPress={() => this.props.navigation.navigate('UserSearch')}
                />
                <Button
                    title="Friend Requests"
                    onPress={() => this.props.navigation.navigate('FriendRequests')}
                />
                <Button
                    title="Scan someone's QR Code"
                    onPress={() => this.props.navigation.navigate('QRScanner')}
                />
            </View>
        )
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})