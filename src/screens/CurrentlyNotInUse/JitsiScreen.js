//Currently not in use, see https://github.com/emitapp/emit/issues/78
import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { Button } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents'
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { PERMISSIONS } from 'react-native-permissions';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';

export default class JitsiScreen extends React.Component {

  static navigationOptions = {
    headerShown: false,
  }


  constructor(props) {
    super(props);
    this.meetingID = this.props.navigation.getParam('meetingID', '')
    this.displayName = this.props.navigation.getParam('displayName', '')
    this.state = {
      isLoading: true,
      permissionsGranted: false,
      errorMessage: null
    }
  }

  componentDidMount() {
    checkAndGetPermissions(
      { required: [PERMISSIONS.ANDROID.RECORD_AUDIO, PERMISSIONS.ANDROID.CAMERA] },
      { required: [PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.IOS.CAMERA] }
    )
      .then(permissionsGranted => {
        if (permissionsGranted) this.setState({ permissionsGranted: true })
        else this.setState({ errorMessage: "Emit hasn't been granted the camera and microphone permissions." })
      })
      .catch(err => {
        logError(err)
        this.setState({ errorMessage: err.message })
      })
  }

  render() {
    const buttonClickCode =
      `$(document).ready(function() {
        $('button:contains("Launch in web")').click()
      });`

    return (
      <SafeAreaView style={{ backgroundColor: "black", flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "white", justifyContent: "center", alignContent: "center" }}>
          <ErrorMessageText message={this.state.errorMessage} />

          {(this.state.isLoading || !this.state.permissionsGranted) &&
              <SmallLoadingComponent style={{ height: 100, width: 200, alignSelf: "center" }} />
          }

          <WebView
            containerStyle = {this.state.isLoading ? { maxHeight: 0 } : { flex: 1 }}
            source={{ uri: encodeURI(`https://meet.jit.si/${this.meetingID}#userInfo.displayName="${this.displayName}"`) }}
            javaScriptEnabledAndroid={true}
            injectedJavaScript={buttonClickCode}
            onLoad={() => setTimeout(() => this.setState({ isLoading: false }), 750)}
            onMessage={() => true} //https://github.com/react-native-webview/react-native-webview/issues/1311
          />

          <Button
            containerStyle={{ position: "absolute", left: 8, top: 8 }}
            icon={
              <Icon
                name="arrow-left"
                size={15}
                color="white"
              />
            }
            onPress={() => this.props.navigation.goBack()}
            buttonStyle={{ width: 50 }}
          />
        </View>
      </SafeAreaView>
    );
  }
}