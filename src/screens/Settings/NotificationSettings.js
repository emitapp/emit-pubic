
import React from 'react'
import { ScrollView } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome5'
import EmptyState from 'reusables/EmptyState'

export default class NotificationSettings extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Notification Settings",    
    };
  };

  render() {
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        marginHorizontal: 4,
        paddingBottom: 16,
        height: "100%"}}>

        <EmptyState 
          image = {<Icon name="wrench" size={50} color = "grey" />}
          title = "Workin' on it!" 
          message = "We're still working on getting notifications to work - they're pretty tricky! Check back here soon."
        />

      </ScrollView>
    )
  }
}