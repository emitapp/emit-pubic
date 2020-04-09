import MainTheme from 'styling/mainTheme'

export default function navigationOptions (title) {
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