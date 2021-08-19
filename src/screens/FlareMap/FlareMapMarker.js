import React from 'react';
import { Platform } from 'react-native';
import { View } from 'react-native';
import { Text, withTheme } from 'react-native-elements';
import { Callout, Marker } from 'react-native-maps';
import FlareTimeStatus from 'reusables/flares/FlareTimeStatus';
import ProfilePicCircle from 'reusables/profiles/ProfilePicComponents';
import PublicFlareNotice from 'reusables/flares/PublicFlareNotice';
import NavigationService from 'utils/NavigationService';


// Design inspired by:
// https://github.com/react-native-maps/react-native-maps/issues/2658#issuecomment-455731624
// https://github.com/react-native-maps/react-native-maps/issues/3769

/**
 * Requrired Props: 
 * flare (from user feed suffices) (can be enriched with an isPublicFlare property),
 * generation (should change only when map is dragged or something)
 * 
 */
class FlareMapMarker extends React.PureComponent {

    state = {
        tracksViewChanges: false,
    }

    //Sets tracksViewChanges for one frame afer parent map changes to 
    //reposition the marker
    //TODO: look into whether I have to optimize this more by not rendering when out of view...
    componentDidUpdate(prevProps) {
        if (prevProps.generation !== this.props.generation) {
            this.setState({ tracksViewChanges: true })
        } else if (this.state.tracksViewChanges) {
            this.setState({ tracksViewChanges: false })
        }
    }

    render() {
        const { flare, zoom, altitude } = this.props
        let multiplier = 1;
        if (Platform.OS == "android") {
            //Zoom of 17 -> 1, zoom of 11 -> 0.3
            //y = mx + c
            //y = 0.11666666666666665x − 0.9833333333333332
            multiplier = 0.11666666666666665 * zoom - 0.9833333333333332
        }else{
            //Altitiude of 350 -> 1.2
            //Altitude of 15000 -> 0.3
            //y = -0.00006143344709897611x + 1.2215017064846416
            multiplier = -0.00006143344709897611 * altitude + 1.2215017064846416
        }

        //[0.05, 1.5]
        multiplier = Math.min(Math.max(multiplier, 0.05), 1.5)

        return (
            <Marker
                coordinate={flare.geolocation}
                tracksViewChanges={this.state.tracksViewChanges}>
                <View style={{
                    backgroundColor: "white",
                    padding: 8 * multiplier, borderRadius: 20 * multiplier,
                    borderColor: this.getBorderColor(flare),
                    borderWidth: 2
                }}>
                    <Text style={{ fontSize: 30 * multiplier }}>{flare.emoji}</Text>
                </View>
                <Callout onPress={() => NavigationService.push("FlareViewer", { broadcast: flare, isPublicFlare: flare.isPublicFlare })}>
                    <View style={{ width: 200, alignItems: "center" }}>
                        {/* For some reason non-text components must still be wrapped in a text */}
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                            <Text> <ProfilePicCircle uid={flare.owner.uid} diameter={35} /> </Text>
                            <Text style={{ color: this.props.theme.colors.grey3 }}>@{flare.owner.username}</Text>
                        </View>
                        <Text style={{ fontWeight: "bold" }}>{flare.activity}</Text>
                        {flare.isPublicFlare && <PublicFlareNotice />}
                        <Text>{flare.location}</Text>
                        <FlareTimeStatus item={flare} />
                        <Text style={{ color: this.props.theme.colors.primary, marginTop: 8, }}>Click to see more</Text>
                    </View>
                </Callout>
            </Marker>
        )
    }

    getBorderColor = (flare) => {
        if (Date.now() < flare.startingTime) return this.props.theme.colors.grey3
        return this.props.theme.colors.primary
    }
}

export default withTheme(FlareMapMarker)
