import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import { logError } from 'utils/helpers';
import Avatar from 'reusables/Avatar'

/**
 * This is a reusable component that displays profile pictues
 * Required props: `uid` (uid of the user/group to display) and `diameter`
 * Be sure that it is given a proper uid by the time it enters the DOM
 * Optional prop: groupPic (boolean), onImageDataGotten, 
 * imageData (you can also give it an avatar seed or url to display)
 */
export default class ProfilePicCircle extends React.PureComponent {

    render() {
        const { diameter, style, ...otherProps } = this.props
        return (
            <ProfilePicRaw
                style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                ref={ref => this.picComponent = ref}
                {...otherProps}
            />
        )
    }
    refresh = () => {
        this.picComponent.refresh()
    }
}

/**
 * This is a reusable component that displays profile pictues in a row
 * Required props: `diameter`, and spacing
 * Optional props: `uids` (list of user uids), `groupUids` (uids of groups)
 */
export class ProfilePicList extends React.PureComponent {
    itemRenderer = (uid) => {
        const { diameter, spacing, style, uids, onPress, ...otherProps } = this.props
        return (
            <View style={{ ...style }} >
                <View style={{ justifyContent: "center", alignItems: "center", width: diameter + 2, height: diameter + 2, borderRadius: (diameter + 2) / 2, borderColor: "white", borderWidth: 2, padding: 1 }}>
                    <Pressable onPress={onPress ? () => onPress(uid.item) : null}>
                        <ProfilePicRaw
                            style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
                            uid={uid.item}
                            ref={ref => this.picComponent = ref}
                            groupPic={uids ? !uids.includes(uid.item) : false}
                            {...otherProps} />
                    </Pressable>
                </View>
            </View>
        )
    }

    render() {
        let { uids, groupUids, diameter, spacing, style, ...otherProps } = this.props
        if (!uids) uids = []
        if (!groupUids) groupUids = []
        return (
            <View style={{ flexGrow: 1 }}>
                <FlatList
                    horizontal
                    data={uids.concat(groupUids)}
                    keyExtractor={(item) => item}
                    renderItem={this.itemRenderer}
                    showsHorizontalScrollIndicator={false}
                    {...otherProps}
                />
            </View>
        )
    }

    refresh = () => {
        this.picComponent.refresh()
    }
}

//Requires width and height as part of sytle props
export class ProfilePicRaw extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            downloadUrl: "",
            avatarSeed: ""
        };
        if (props.imageData) {
            if (this.isUrl(props.imageData)) this.state.downloadUrl = props.imageData
            if (this.isAvatarSeed(props.imageData)) this.state.avatarSeed = props.imageData
        }
        this._isMounted = false; //Using this is an antipattern, but simple enough for now
    }

    componentDidMount() {
        if (!this.props.uid && !this.props.imageData) return;
        this._isMounted = true;
        if (!this.props.imageData) this.getURLOrSeed();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        const { style, ...otherProps } = this.props
        if (this.state.downloadUrl) {
            return (
                <FastImage
                    style={style}
                    source={{
                        uri: this.state.downloadUrl,
                        priority: FastImage.priority.normal,
                    }}
                    {...otherProps}
                />)
        }
        else if (this.state.avatarSeed) {
            return (
                <Avatar {...this.props} seed={this.state.avatarSeed} />
            )
        } else {
            return (
                <Image
                    style={style}
                    source={this.props.groupPic ?
                        require('media/DefualtGroupPic.png') :
                        require('media/DefualtProfilePic.png')}
                    {...otherProps}
                />)
        }
    }

    getURLOrSeed = async () => {
        try {
            const downloadUrl = await this.getUrl()
            if (downloadUrl) {
                if (this._isMounted) this.setState({ downloadUrl })
                if (this.props.onImageDataGotten) this.props.onImageDataGotten(downloadUrl)
                return;
            }
            const avatarSeed = await this.getAvatarSeed()
            if (avatarSeed) {
                if (this._isMounted) this.setState({ avatarSeed })
                if (this.props.onImageDataGotten) this.props.onImageDataGotten(avatarSeed)
                return;
            }

        } catch (err) {
            logError(err)
        }
    }

    getUrl = async () => {
        const listResult = this.props.groupPic ?
            await storage().ref(`groupPictures/${this.props.uid}/scaled/`).list() :
            await storage().ref(`profilePictures/${this.props.uid}/scaled/`).list()
        if (this._isMounted && listResult._items[0]) {
            const downloadUrl = await listResult._items[0].getDownloadURL()
            return downloadUrl
        }
    }

    getAvatarSeed = async () => {
        const snap = await database().ref(`profilePicInfo/${this.props.uid}`).once("value")
        if (snap.exists()) return snap.val()
    }

    refresh = () => {
        this.setState({ downloadUrl: '', avatarSeed: "" }, this.getURLOrSeed)
    }

    isUrl = (imageData) => {
        return imageData.startsWith("https://")
    }

    isAvatarSeed = (imageData) => {
        return imageData.length == 12
    }
}