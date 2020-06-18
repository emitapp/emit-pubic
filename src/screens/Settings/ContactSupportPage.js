
import auth from '@react-native-firebase/auth'
import functions from '@react-native-firebase/functions'
import React from 'react'
import { ScrollView, View, Alert, Clipboard, Linking } from 'react-native'
import { Button, Divider, Input, Text } from 'react-native-elements'
import ErrorMessageText from 'reusables/ErrorMessageText'
import { DefaultLoadingModal } from 'reusables/LoadingComponents'
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers'
import Snackbar from 'react-native-snackbar'
import config from "react-native-ultimate-config";
import Icon from 'react-native-vector-icons/FontAwesome5'

export default class ContactSupportPage extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Contact or Support Us",    
    };
  };

  render() {
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{justifyContent: 'flex-start', alignItems: 'center', marginHorizontal: 4}}>

        <Text h4>Learn More</Text>
        <Text style = {{marginHorizontal: 8, marginBottom: 8}}>
          Like Biteup? Thanks! It was made out of lots of passion. 
          If you'd like to learn more about the project, have a look at our website at
          <Text style = {{fontWeight :"bold"}}>
            {" " + config.PROJECT_WEBSITE}
          </Text>.
          {"\n"}(P.S: We have merchandise, if that's your kind of thing.)
        </Text>
        <Button
          title = "Visit Website"
          onPress={() => Linking.openURL(config.PROJECT_WEBSITE) }
          icon = {<Icon name = "globe-africa" color = "white" size={24} style = {{marginRight: 8}}/>}
        />

        <Divider style = {{marginVertical: 12}}/>
        <Text h4>Contact Us</Text>
        <Text style = {{marginHorizontal: 8, marginBottom: 8}}>
          Do you have a question to ask, or feedback to give?{"\n"}
          We'd love to hear from you! You can contact us at 
          <Text style = {{fontWeight :"bold"}}>
            {" " + config.PROJECT_CONTACT_EMAIL + " "}
          </Text>
          or use the button below.
        </Text>
        <Button
          title = "Email Us"
          onPress={() => Linking.openURL(`mailto:${config.PROJECT_CONTACT_EMAIL}`)}
          icon = {<Icon name = "envelope-open-text" color = "white" size={24} style = {{marginRight: 8}}/>}
        />

        <Divider style = {{marginVertical: 12}}/>
        <Text h4>Support Us</Text>
        <Text style = {{marginHorizontal: 8, marginBottom: 8}}>
          Biteup may be free to use, but it certainly costs money to keep up. 
          We use a lot of web services, many of which are paid. Supporting us helps keep 
          Biteup running and encourages further development.
          {"\n"}Any and all support is appreciated!
        </Text>
        <View style = {{flexDirection: "row", alignSelf: "stretch", justifyContent: "space-around"}}>
          <Button
            title = "PayPal"
            onPress = {() => {
              Clipboard.setString(config.PROJECT_PAYPAL);
              Snackbar.show({text: 'PayPal link copied to clipboard', duration: Snackbar.LENGTH_SHORT})
            }}
            buttonStyle = {{backgroundColor: "#003087"}}
            icon = {<Icon name = "paypal" color = "white" size={24} style = {{marginRight: 8}}/>}
          />
          <Button
            title = "Patreon"
            buttonStyle = {{backgroundColor: "#f96854"}}
            onPress = {() => {
              Clipboard.setString(config.PROJECT_PATREON);
              Snackbar.show({text: 'Patreon link copied to clipboard', duration: Snackbar.LENGTH_SHORT})
            }}
            icon = {<Icon name = "patreon" color = "white" size={24} style = {{marginRight: 8}}/>}
          />
        </View>


      </ScrollView>
    )
  }
}