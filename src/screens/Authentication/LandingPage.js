import React from 'react';
import { Image, View, ImageBackground, StatusBar } from 'react-native';
import { Button, Text } from 'react-native-elements';
import S from "styling";

export default class LandingPage extends React.Component {

    render() {
      return (
          <ImageBackground
            source={require('media/AuthFlowBackground.jpg')}
            //The background color is added so users don't get a flash of white when the image is loading
            style = {{...S.styles.containerFlexStart, backgroundColor: "black"}} 
            resizeMode = 'cover'>
              <StatusBar backgroundColor={'black'} barStyle="light-content"/>

              <View style = {{flexDirection: "row", alignItems: "center", marginTop: 100, marginBottom: 20}}>
                <Image
                  source={require('media/LogoWhite.png')}
                  style = {{height: 80, width: 80}}
                  resizeMode = 'contain'
                />
                <Text h1 h1Style = {{color: 'white', fontFamily: 'NunitoSans-SemiBold'}}>
                  Emit
                </Text>
              </View>

              <Button
              title = "Create Account"
              buttonStyle = {{height: 50, width: 256}}
              titleStyle = {{fontSize: 22}}
              onPress = {() => this.props.navigation.navigate("SignUp")}
              />

              <Text 
              style={{marginTop: 20, textDecorationLine: 'underline', color: "white"}}
              onPress = {() => this.props.navigation.navigate("Login")}>
                  Returning to Emit? Sign in here
              </Text>
            </ImageBackground>
      )
    }
  }