import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native'
import { Button } from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome';
import { SmallLoadingComponent } from 'reusables/LoadingComponents'

export default class JitsiComponent extends React.Component {

  constructor(props) {
    super(props);
    this.meetingID = this.props.navigation.getParam('meetingID', '')
    this.displayName = this.props.navigation.getParam('displayName', '')
    this.state = {
      isLoading: true
    }
  }

  static navigationOptions = {
    headerShown: false,
  }

  render() {
    const jsCode = `$(document).ready(function() {
        $('button:contains("Launch in web")').click()
      });`

    return (
      <View style={styles.container}>
        {this.state.isLoading &&
          <SmallLoadingComponent style = {{height: 100, width: 200, alignSelf: "center"}}/>
        }

        <WebView
          style={{ flex: this.state.isLoading ? 0 : 1 }}
          source={{ uri: `https://meet.jit.si/${this.meetingID}#userInfo.displayName="${this.displayName}"` }}
          javaScriptEnabledAndroid={true}
          injectedJavaScript={jsCode}
          onLoad={() => setTimeout(() => this.setState({ isLoading: false }), 750)}>
        </WebView>

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
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});