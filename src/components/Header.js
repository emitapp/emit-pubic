import React from "react"
import ScrollingText from "reusables/ui/HorizontalScrollingText"
import { Text, View } from 'react-native'
import MainTheme from 'styling/mainTheme'

export default function StandardHeader(title) {
    return {
        headerTitle: props => {
            let textStyle = {}
            props.style.forEach(styleObject => {
                textStyle = { ...textStyle, ...styleObject }
            });
            return (
                <View style={{ flexDirection: "row", alignItems: "flex-end", marginHorizontal: 10 }}>
                    <Text style={{ ...textStyle, flex: 1 }}> {title} </Text>
                </View>
            )
        },
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontFamily: "NunitoSans-Regular",
            color: "white",
            fontSize: 20,
        },
        headerTitleContainerStyle: {
            ...Platform.select({ ios: { left: 0 }, default: {} }),
            right: 0,
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
                <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 10 }}>
                    <ScrollingText
                        containerStyle={{ flex: 1 }}
                        textStyle={{ ...textStyle, minWidth: "100%" }}>
                        {title}
                    </ScrollingText>
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
        },
        headerTitleContainerStyle: {
            ...Platform.select({ ios: { left: 0 }, default: {} }),
            right: 0
        }
    }
};

