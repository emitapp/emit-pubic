import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';
import FriendReqModal from './FriendReqModal';


export default class ScanScreen extends Component {

    state = { QRData: "" }

    setQRData = (e) => {
        this.setState({ QRData: e.data })
        this.modal.open(e.data)
    }

    render() {
        return (
            <View style = {styles.container}>
                {this.state.QRData == "" &&
                    <QRCodeScanner
                        onRead={this.setQRData}
                        flashMode={RNCamera.Constants.FlashMode.off}
                        cameraProps={{ ratio: '1:1' }}
                        checkAndroid6Permissions={true}
                        showMarker={true}
                        markerStyle={styles.cameraBorder}
                        topContent={
                            <Text style={styles.centerText}>
                                Scan a Biteup QR Code to add someone!
                            </Text>}
                    />}

                <FriendReqModal 
                    ref={modal => this.modal = modal} 
                    onClosed = {() => this.setState({ QRData: "" })}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    centerText: {
        flex: 1,
        fontSize: 18,
        padding: 32,
        color: '#777',
    },
    textBold: {
        fontWeight: '500',
        color: '#000',
    },
    buttonText: {
        fontSize: 21,
        color: 'rgb(0,122,255)',
    },
    buttonTouchable: {
        padding: 16,
    },
    cameraBorder: {
        borderColor: "orange",
        borderRadius: 20
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
});