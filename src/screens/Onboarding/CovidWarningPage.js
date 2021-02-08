import React from 'react';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';

export default class CovidWarningPage extends React.Component {

    state = { errorMessage: null }  

    finishOnboarding = () => {
        this.props.navigation.navigate('MainTabNav');
    }
    render() {
        return (
            <ThemeConsumer>
            {({ theme }) => (
            <MainLinearGradient theme={theme}>
                <View style={{justifyContent:'center', height:"100%", width:"60%", alignItems:"center"}}>
                    <Text style={{fontSize: 64, marginBottom: 24}}>😷</Text>
                    <Text style={{textAlign:'center', fontSize: 24, fontWeight:"bold", color:"white"}}>We are still in a pandemic, please use Emit responsibly</Text>
                    <Button
                        title = "I will!"
                        buttonStyle = {{marginTop: 64, height: 50, width: 160, backgroundColor:theme.colors.bannerButtonBlue}}
                        titleStyle = {{fontSize: 18}}
                        onPress = {this.finishOnboarding}
                    />
                </View>
            </MainLinearGradient> )}
            </ThemeConsumer> )
    }
}