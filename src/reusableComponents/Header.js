import React from "react"
import ScrollingText from "reusables/HorizontalScrollingText"
import { Text, View } from 'react-native'
import MainTheme from 'styling/mainTheme'
import ProfilePicDisplayer from 'reusables/ProfilePicComponents'
import NavigationService from 'utils/NavigationService';
import auth from "@react-native-firebase/auth"
import { TouchableOpacity } from "react-native-gesture-handler"

const profilePic = () => {
    return (
        <View style={{position: "absolute", top: 0, right: 0}}>
            <TouchableOpacity onPress={() => NavigationService.navigate("SocialButtonHub")}>
                <ProfilePicDisplayer
                    diameter={36}
                    uid={auth().currentUser.uid}
                    style={{ marginLeft: 10 }}
                />
            </TouchableOpacity>
        </View>)
}

export default function StandardHeader(title) {
    return {
        headerTitle: props => {
            let textStyle = {}
            props.style.forEach(styleObject => {
                textStyle = { ...textStyle, ...styleObject }
            });
            return (
                <View style={{ flexDirection: "row", alignItems: "flex-end", marginHorizontal: 10}}>
                    <Text style={{...textStyle, flex: 1}}> {title} </Text>
                    {profilePic()}
                </View>
            )
        },
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
            ...Platform.select({
                ios: {
                  height: 58
                },
                default: {
                }
              })
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontFamily: "NunitoSans-Regular",
            color: "white",
            fontSize: 20
        }
    }
};

export function ClearHeader(title) {
    return {
        title,
        headerTitle: undefined,
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
            elevation: 0,
            shadowOpacity: 0,
            shadowColor: "transparent",
            borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
    };
}

export function ScrollingHeader(title) {
    return {
        headerTitle: props => {
            let textStyle = {}
            props.style.forEach(styleObject => {
                textStyle = { ...textStyle, ...styleObject }
            });
            return (
                <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 10}}>
                    <ScrollingText
                        containerStyle={{ flex: 1 }}
                        textStyle={{ ...textStyle, minWidth: "100%" }}>
                        {title}
                    </ScrollingText>
                    {profilePic()}
                </View>
            )
        },
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
        },
        headerBackTitle: null,
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontFamily: "NunitoSans-Regular",
            color: "white",
            fontSize: 20
        }
    }
};

