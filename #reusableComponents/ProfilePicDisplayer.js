import React from 'react';
import FastImage from 'react-native-fast-image'
import storage from '@react-native-firebase/storage';
import { Image } from 'react-native'

/**
 * This is a reusable component that displays profile pictues
 * Required props: `cloudStoragePath` (string indicating the path of the image to show)
 * and `diameter`
 * Be sure that it is given a proper cloudStoragePath by the time it enters the DOM
 */
export default class ProfilePicDisplayer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { downloadUrl: '' };
    }

    componentDidMount() {
        if (!this.props.cloudStoragePath) return;
        storage().ref(this.props.cloudStoragePath)
            .getDownloadURL()
            .then((downloadUrl) => this.setState({ downloadUrl }))
            .catch((err) => console.log(err));
    }

    render() {
        const { diameter } = this.props
        if (!this.state.downloadUrl) {
            return (
                <Image
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
                    source={require('../_media/ProfilePicPlaceholder.png')}
                    {...this.props}
                />)
        } else {
            return (
                <FastImage
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
                    source={{
                        uri: this.state.downloadUrl,
                        priority: FastImage.priority.normal,
                    }}
                    {...this.props}
                />)
        }
    }
}