import React from 'react';
import { Image, View } from 'react-native';
import { Button, Text } from 'react-native-elements';
import S from "styling";

export default class LandingPage extends React.Component {

    render() {
      return (
        <View style={S.styles.container}>
            <Text h1>Biteup</Text>

            <Image
                source={require('media/unDrawEatingTogether.png')}
                style = {{height: "30%"}}
                resizeMode = 'contain'
            />
            
            <Button
            title = "Sign in with Email"
            buttonStyle = {{height: 50, width: 256}}
            titleStyle = {{fontSize: 22}}
            onPress = {() => this.props.navigation.navigate("Login")}
            />

            <Text 
            style={{marginTop: 20, textDecorationLine: 'underline'}}
            onPress = {() => this.props.navigation.navigate("SignUp")}>
                New to Biteup? Sign up for free
            </Text>
        </View>
      )
    }
  }