import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { withTheme, Text } from 'react-native-elements';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { logError } from 'utils/helpers';
import FriendRequestPreviewElement from './FriendRequestPreviewElement';
import { MinorActionButton } from 'reusables/ReusableButtons'
import NavigationService from 'utils/NavigationService'

class FriendRequestPreviewer extends React.Component {

    constructor(props) {
        super(props)
        this.ref = database().ref(`/friendRequests/${auth().currentUser.uid}/inbox`).limitToFirst(3)
        this.state = {
            listData: [],
            gettingFirstLoad: true,
            errorText: null
        }
    }

    componentDidMount() {
        this.ref.on("value", this.refListenerCallback, this.onError)
    }

    componentWillUnmount() {
        this.ref.off();
    }

    render() {
        if (this.state.gettingFirstLoad) {
            return <ErrorMessageText message={this.state.errorMessage} />
        }
        if (this.state.listData.length == 0) {
            return (
                <View style={{ ...this.props.style, alignItems: "center", justifyContent: "center", }}>
                    <Text style={{textAlign: "center", }}>
                        No incoming friend requests.
                    </Text>
                    
                    <MinorActionButton
                        title="See outbox"
                        onPress={() => NavigationService.navigate('FriendRequests')}
                    />
                </View>
            )
        }
        return (
            <View style={{ ...this.props.style, alignItems: "center", justifyContent: "center", }}>
                <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18 }}>
                    Friend Requests
                </Text>
                {this.state.listData.map(item => this.itemRenderer(item))}
                <MinorActionButton
                    title="See all"
                    onPress={() => NavigationService.navigate('FriendRequests')}
                />
            </View>
        )
    }

    onError = (error) => {
        logError(error)
        this.errorMessage = error.message;
    }

    refListenerCallback = (snap) => {
        this.transformSnapshotData(snap)
        this.setState({ gettingFirstLoad: false })
    }

    transformSnapshotData = (snap) => {
        var listData = []
        snap.forEach(childSnapshot => {
            if (childSnapshot.exists())
                listData.push({
                    uid: childSnapshot.key,
                    ...childSnapshot.val(),
                })
        });
        this.setState({ listData })
    }

    itemRenderer = (item) => {
        return (
            <FriendRequestPreviewElement item={item} key={item.uid} forcedUpdateMethod = {this.forcedUpdateRef} />
        );
    }

    //For a wierd bug where the reference isn't updating when it needs to... 
    //TODO: Maybe look into this...
    forcedUpdateRef = () => {
        this.ref.once("value", this.refListenerCallback, this.onError)
    }

}

export default withTheme(FriendRequestPreviewer)