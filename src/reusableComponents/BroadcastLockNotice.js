import React from 'react';
import { View, StyleSheet} from 'react-native';
import { Text, Tooltip, withTheme } from 'react-native-elements';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome';

class BroadcastLockNotice extends React.PureComponent {

    render() {
        return (
            <Tooltip 
            popover={<Text>{this.props.message}</Text>}
            height = {200}
            withPointer = {false}>
              <View style = {styles.lockedNotice}>
                <AwesomeIcon name="lock" color="white" size={24} style = {{marginRight: 8}}/>
                <Text style = {{color: "white", fontWeight: "bold"}}>Locked</Text>
              </View>
            </Tooltip>
        )
    }
}


const styles = StyleSheet.create({
    lockedNotice:{
      marginTop: 8,
      flexDirection: "row", 
      backgroundColor: "dimgrey", 
      padding: 6, 
      borderRadius: 4, 
      width: "auto", 
      alignSelf: "flex-start"
    }
  })

export default withTheme(BroadcastLockNotice)