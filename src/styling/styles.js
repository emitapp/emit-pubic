import {StyleSheet} from "react-native"

const defaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 8
    },
    containerFlexStart: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 8
    },
    textInput: {
      height: 40,
      width: '90%',
      borderColor: 'gray',
      borderWidth: 1,
      marginTop: 8
    },
    bannerButton: {
        justifyContent: "center",
        alignItems: 'center',
        width: "100%", 
        height: 50,
        flexDirection: 'row'
    },
    listElement: {
        paddingVertical: 8,
        alignItems: "center",
        flexDirection: 'row',
      }
  })

  export default defaultStyles