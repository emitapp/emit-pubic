import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default class SocialButtonHub extends React.Component {

    render() {
        return (
            <View style={styles.container}>
                <Button
                    title="Find Users"
                    onPress={() => this.props.navigation.navigate('UserSearch')}
                />
                <Button
                    title="See your friends"
                    onPress={() => this.props.navigation.navigate('FriendSearch')}
                />
                <Button
                    title="See your masks"
                    onPress={() => this.props.navigation.navigate('MaskSearch')}
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