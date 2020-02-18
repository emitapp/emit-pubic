import {StyleSheet} from "react-native"

const defaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    containerFlexStart: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center'
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
        backgroundColor: 'ghostwhite',
        paddingVertical: 5,
        alignItems: "center",
        flexDirection: 'row',
        marginLeft: 10,
        marginRight: 10
      }
  })

  export default defaultStyles