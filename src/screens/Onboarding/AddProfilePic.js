import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-elements';
import ProfilePicChanger from 'reusables/ProfilePicChanger';

export default class AddProfilePic extends React.Component {

    render() {
        return (
            <View style={{ height: "100%", width: "100%", alignItems: "center" }}>
                <View style={{ height: "10%" }} />
                <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: "bold", color: "black" }}>Add profile photo</Text>
                <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: "bold", color: "grey", width: "60%", marginVertical: 24 }}>
                    Add a photo of yourself so that your friends recognize you!
                </Text>

                <ProfilePicChanger
                    onSuccessfulUpload={this.onSuccess}
                    hideNote={true}
                />
                <TouchableOpacity onPress={this.onSkip}>
                    <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: "bold", color: "grey", width: "60%", marginTop: 16 }}>Skip</Text>
                </TouchableOpacity>
            </View>
        )
    }

    onSuccess = () => {
        this.props.navigation.navigate('CovidWarningPage');
    }

    onSkip = () => {
        this.props.navigation.navigate('CovidWarningPage');
    }
}