import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Overlay, Text, Button } from 'react-native-elements';
import { MinorActionButton } from 'reusables/ReusableButtons'
import ErrorMessageText from 'reusables/ErrorMessageText'

/**
 * Skype page is hosted in a webview, but for some reason the clipboard in the webview
 * doesn't sync with the clibboard of the phone itself.
 * So, we'll have to extract it the link the skype page gives us ourselves.
 * We use postmessage and oneventlistener to establish a two way communication layer
 * between the webview's world and the react-native world.
 * I manually looked at the source code of the skype page to know what element to probe
 * to get the link.
 */

/**
 * Needed props: onLinkReceived (takes in the link as the parameter), isVisible, onCancel
 */
export default class SkypeRoomLinkGetter extends React.Component {

  constructor() {
    super()
    this.webviewReference = null
    this.webviewLoaded = false
    this.state = {
      errorMessage: null
    }
    this.buttonPressed = false;
  }

  //I recommend editing this in something like https://jsfiddle.net/
  webviewInjectdJS = `
  //Will be triggered by sendMessageToWebview
  window.addEventListener("message", message => returnLink(message));
    
    //Gets the link using ...questionable methods haha
    returnLink = (message) => {
        var nodes = document.getElementsByClassName('joinLinkText')
        if (nodes.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({link: nodes[0].innerText}))
        } else{
              window.ReactNativeWebView.postMessage(JSON.stringify({error: "Couldn't get link!"}))
        }
    }
  `

  render() {
    return (
      <Overlay isVisible={this.props.isVisible} overlayStyle={{ height: 550, marginHorizontal: 8, width: "100%" }}>
        <View style = {{height: "100%", width: "100%"}}>
          <Text style = {styles.instructionsText}>To add a video conferencing link to this flare's decription:</Text>
          <Text style = {styles.instructionsText}>1. "Create Free Meeting" button</Text>
          <Text style = {styles.instructionsText}>2. Press the orange "Done" button</Text>
          <Text>Room will be open for 24 hours for free! No skype accont required.</Text>


          <ErrorMessageText message={this.state.errorMessage} />
          <WebView
            source={{ uri: 'https://api.join.skype.com/v1/meetnow' }}
            style={{ flex: 1, width: "100%" }}
            onError={this.handleWebviewError}
            onHttpError={this.handleWebviewError}
            onMessage={this.returnLink}
            ref={webView => (this.webviewReference = webView)}
            onLoad={() => this.webviewLoaded = true}
            javaScriptEnabled={true}
            injectedJavaScript={this.webviewInjectdJS}
          />

          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Button
              title="Done"
              onPress={() => {
                this.buttonPressed = true;
                this.requestLinkFromWebview()
              }}
              buttonStyle={{ paddingHorizontal: 20 }} />

            <MinorActionButton
              title="Cancel"
              onPress={this.props.onCancel} />
          </View>
        </View>
      </Overlay>
    )
  }

  handleWebviewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    this.setState({ errorMessage: nativeEvent.description })
  }

  //Called to promt the webview to return the link form the skype webpage
  requestLinkFromWebview = () => {
    if (!this.webviewReference || !this.webviewLoaded) {
      console.log("Webview not ready yet!")
      return
    }

    //Trailing "true" needed to prevent silent failures
    //https://github.com/react-native-community/react-native-webview/blob/master/docs/Guide.md#the-injectedjavascript-prop

    //FIXME: For some reason, the message always turns out to be undefined on the webview side
    //Investigate this. There are lots of things that can send messages to the webview, which will call the 
    //returnLink() callback. So, if we can't use the message itself to differentiate, we'll have 
    // to use button clicks
    const injection = `window.postMessage("getLink", "*"); 
    true;
    `;
    this.webviewReference.injectJavaScript(injection);
  }

  returnLink = (event) => {
    if (this.buttonPressed) {
      //^That means this was called as a result of a button click (see FIXME)
      this.buttonPressed = false
      const data = JSON.parse(event.nativeEvent.data)
      if (data.error) this.setState({ errorMessage: data.error })
      else this.props.onLinkReceived("https://"+data.link)
    }
  }
}

const styles = StyleSheet.create({
  instructionsText: {
    fontSize: 15,
    fontWeight: "bold",
    marginHorizontal: 8
  }
});


