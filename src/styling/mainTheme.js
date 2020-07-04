//Used by react-native-elements
export default theme = {

    colors:{
        primary: "#6ACB17",
        secondary: "#01BAEF",
        statusBar: "#008000",

        gradientStart: "#6ACB17",
        gradientEnd: "#03925e"
    },

    Button:{
        containerStyle:{
            margin: 4,
        },
        buttonStyle:{
            borderRadius: 8
        },
        titleStyle:{
            fontFamily: "NunitoSans-Bold"
        }
    },

    ButtonGroup: {
        containerStyle: {
            height: 34,
            marginRight: 0,
            marginLeft: 0,
            marginTop: 0,
            borderRadius: 0
        },
        containerBorderRadius: 0,
        selectedButtonStyle: {
            backgroundColor: "grey"
        }
    },

    Input:{
        containerStyle: {
            marginBottom: 8 
        },
        inputContainerStyle: {
            width: "100%", 
            margin: 0,
            borderBottomWidth: 0,
            backgroundColor: "#E6E6E6",
            borderRadius: 16,
        },
        inputStyle:{
            marginLeft: 16,
            fontFamily: "NunitoSans-Regular",
        },
        labelStyle:{
            fontFamily: "NunitoSans-Bold",
            fontSize: 14,
            color: "black",
            marginBottom: 4
        },
        errorStyle:{
            fontFamily: "NunitoSans-Semibold",
            fontSize: 14,
        },
        selectionColor: "#92d558"
    },

    Text:{
        style: {
            fontFamily: "NunitoSans-Regular",
            fontSize: 15
        },
        h1Style: {
            fontFamily: "NunitoSans-Bold",
            fontWeight: "normal",
            textAlign: "center"
        },
        h2Style: {
            fontFamily: "NunitoSans-Bold",
            fontWeight: "normal",
            textAlign: "center"
        },
        h3Style: {
            fontFamily: "NunitoSans-Bold",
            fontWeight: "normal",
            textAlign: "center"
        },
        h4Style: {
            fontFamily: "NunitoSans-Semibold",
            fontWeight: "normal",
            textAlign: "center"
        },
        selectable: true,
        selectionColor: "#92d558"
    },

    Overlay: {
        windowBackgroundColor: "rgba(0, 0, 0, .5)",
        width: "auto",
        height: "auto",
        borderRadius: 16
    },

    SearchBar:{
        lightTheme: true,
        round: true,
        containerStyle: {
            backgroundColor: "transparent", 
            borderTopWidth: 0, 
            borderBottomWidth: 0, 
            paddingBottom: 0, 
            paddingTop: 0
        },
        inputContainerStyle: {
            marginTop: 0, 
            marginBottom: 0, 
            backgroundColor: "lightgrey"
        },
        inputStyle:{
            fontFamily: "NunitoSans-Regular",
        }
    },

    Badge: {
        textStyle: {
            fontSize: 16
        },
        badgeStyle: {
            padding: 8,
            height: 30,
        }
    },

    CheckBox: {
        containerStyle: {
            backgroundColor: "transparent", 
            borderWidth: 0
        },
        textStyle: {
            fontSize: 18,
            color: "black",
            fontWeight: "normal",
            flexShrink: 1
        },
        fontFamily: "NunitoSans-SemiBold",
    },

    SocialIcon: {
        style:{
            marginRight: 0,
            marginLeft: 0,
            backgroundColor: "grey"
        },
        iconSize: 20,
    },

    Divider: {
        style:{
            height: 1,
            width: "100%"
        }
    }
}
