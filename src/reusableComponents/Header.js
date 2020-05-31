import React from "react"
import ScrollingText from "reusables/HorizontalScrollingText"
import MainTheme from 'styling/mainTheme'

export default function StandardHeader (title) {
    return {
        title,
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontFamily: "NunitoSans-Regular",
            color: "white"
        }
    }
};

export function ScrollingHeader (title) {
    return {
        headerTitle: props => {
            let textStyle = {}
            props.style.forEach(styleObject => {
                textStyle = {...textStyle, ...styleObject}
            });
            return (<ScrollingText 
                containerStyle = {{minWidth: "100%"}}
                textStyle = {{...textStyle, minWidth: "100%"}}>
                    {title}
                </ScrollingText>)
        },
        headerStyle: {
            backgroundColor: MainTheme.colors.primary,
        },
        headerBackTitle: null,
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontFamily: "NunitoSans-Regular",
            color: "white"
        }
    }
};

export function ClearHeader (navigationOptions, title) {
    return {
        title,
        headerStyle: {
            ...navigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            shadowColor: "transparent",
            borderBottomWidth: 0,
        },
        headerTintColor: navigationOptions.headerTintColor,
    };
}