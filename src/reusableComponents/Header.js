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

export function ClearHeader (navigationOptions, title) {
    return {
        title,
        headerStyle: {
            ...navigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
        },
        headerTintColor: navigationOptions.headerTintColor,
    };
}