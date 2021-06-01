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
    pillButton: {
        justifyContent: "center",
        alignItems: 'center',
        borderRadius: 100, // A large hardcoded value to ensure the pill button is rounded
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    listElement: {
        paddingVertical: 8,
        alignItems: "center",
        flexDirection: 'row',
      }
  })
  
  export default defaultStyles