
import auth from '@react-native-firebase/auth'
import React from 'react'
import { Image, Linking, ScrollView, View } from 'react-native'
import { Button, Text } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome5'
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons"
import ErrorMessage from 'reusables/ErrorMessageText'
import { getFullHardwareInfo, getFullVersionInfo, logError } from 'utils/helpers'
import * as links from "utils/LinksAndUris"

export default class ContactSupportPage extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Get in Touch",
    };
  };

  state = { mailError: null }

  render() {
    return (
      <ScrollView
        style={{ flex: 1, marginTop: 8 }}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginHorizontal: 8,
          paddingBottom: 16
        }}>

        <View style={{ flexDirection: "row" }}>
          <View style={{ height: 150, width: 150 }}  >
            {/* //TODO: FOr android: https://stackoverflow.com/questions/35594783/how-do-i-display-an-animated-gif-in-react-native */}
            <Image
              source={require('media/animations/hi-mango.gif')} 
              style={{ height: "100%", width: "100%" }} 
              cont
              />
          </View>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Text h4 style={{ fontWeight: "bold" }}>Come say hi!</Text>
            <Text>We don't bite :)</Text>
          </View>
        </View>

        <Text style={{ marginHorizontal: 8, marginBottom: 8, textAlign: "center" }}>
          Do you have a question to ask, or feedback to give?{"\n"}
          We'd love to hear from you!
        </Text>

        <ErrorMessage message={this.state.mailError} />

        <Button
          title="Our Discord"
          onPress={() => Linking.openURL(links.PROJECT_DISCORD)}
          icon={<MaterialIcons name="discord" color="white" size={24} style={{ marginRight: 8 }} />}
          buttonStyle = {{backgroundColor: "#7289DA"}}
        />
        <Text style={{ marginBottom: 16, color: "grey" }}>{links.PROJECT_DISCORD}</Text>

        <Button
          title="Email Us"
          onPress={this.composeMail}
          icon={<Icon name="envelope-open-text" color="white" size={24} style={{ marginRight: 8 }} />}
        />
        <Text style={{ marginBottom: 16, color: "grey" }}>{links.PROJECT_CONTACT_EMAIL}</Text>

        <Button
          title="Our Website"
          onPress={() => Linking.openURL(links.PROJECT_WEBSITE)}
          icon={<Icon name="globe-africa" color="white" size={24} style={{ marginRight: 8 }} />}
        />
        <Text style={{ marginBottom: 16, color: "grey" }}>{links.PROJECT_WEBSITE}</Text>

        <Text>
          {"\n"}(P.S: We have merchandise, if that's your kind of thing.)
        </Text>

      </ScrollView>
    )
  }

  composeMail = async () => {
    this.setState({ mailError: null })
    try {
      let body = `\n\n\n\n\nPlease don't delete the section below\n`
      body += "-----------\n"
      body += `User ID: ${auth().currentUser.uid}\n`
      body += `${await getFullVersionInfo()}\n\n${await getFullHardwareInfo()}`
      Linking.openURL(`mailto:${links.PROJECT_CONTACT_EMAIL}?body=${body}`)
    } catch (err) {
      this.setState({ mailError: err.message })
      logError(err)
    }
  }
}