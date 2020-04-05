//Used by react-native-elements
export default theme = {

    colors:{
        primary: "#6ACB17",
        secondary: "#01BAEF",
        statusBar: "#008000"
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

    Input:{
        containerStyle: {
            width: "80%", 
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
        containerStyle:{
            marginBottom:8,
        }
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
    }
}
