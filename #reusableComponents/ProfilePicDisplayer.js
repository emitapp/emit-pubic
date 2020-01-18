import React from 'react';
import FastImage from 'react-native-fast-image'
import storage from '@react-native-firebase/storage';
import { Image } from 'react-native'
import { logError } from '../#constants/helpers';

/**
 * This is a reusable component that displays profile pictues
 * Required props: `uid` (uid of the user to display) and `diameter`
 * Be sure that it is given a proper uid by the time it enters the DOM
 */
export default class ProfilePicDisplayer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { downloadUrl: '' };
    }

    componentDidMount() {
        if (!this.props.uid) return;
        this.getURL();
    }

    render() {
        const { diameter, style, ...otherProps } = this.props
        if (!this.state.downloadUrl) {
            return (
                <Image
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                    source={require('../_media/ProfilePicPlaceholder.png')}
                    {...otherProps}
                />)
        } else {
            return (
                <FastImage
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                    source={{
                        uri: this.state.downloadUrl,
                        priority: FastImage.priority.normal,
                    }}
                    {...otherProps}
                />)
        }
    }

    getURL = async () => {
        try{
            const listResult = 
                await storage().ref(`profilePictures/${this.props.uid}/scaled/`).list()
            if (listResult._items[0]){
                const downloadUrl = await listResult._items[0].getDownloadURL()
                this.setState({ downloadUrl })
            }
        }catch(err){
            logError(err)
        }
    }
}