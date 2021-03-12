import React from 'react';
import { AppRegistry, Alert, View, StyleSheet, Text, Image, requireNativeComponent } from 'react-native';
import AppIntro from 'rn-falcon-app-intro';
const styles = StyleSheet.create({
    slide: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: '#9DD6EB',
      padding: 15,
    },
    slideCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#9DD6EB',
        padding: 15,
      },
    
    text: {
      color: '#000000',
      fontSize: 30,
      fontWeight: 'bold',
    },
    smallBlackText: {
        color: '#000000',
        fontSize: 20,
    },
    smallWhiteText: {
        color: '#fff',
        fontSize: 20,
    }
  });

export default class SwiperOnboarding extends React.Component {
  onSkipBtnHandle = (index) => {
    this.props.navigation.navigate("CovidWarningPage")
  }
  doneBtnHandle = () => {
    this.props.navigation.navigate("CovidWarningPage")
  }
  render() {
    return (
        <AppIntro 
            dotColor="#808080"
            activeDotColor="#000000"
            leftTextColor="#000000" 
            rightTextColor="#000000"
            onDoneBtnClick={this.doneBtnHandle}
            onSkipBtnClick={this.onSkipBtnHandle}>
            <View style={[styles.slide,{ backgroundColor: '#ffffff' }]}>
            <View level={10}><Text style={styles.text}>Welcome to Emit!</Text></View>
            <View level={15}><Text style={styles.smallBlackText}>The app for spontaneous get-togethers</Text></View>
            </View>
            <View style={[styles.slide, { backgroundColor: '#ffffff'}]}>
            <View style={{alignItems: "center"}} level={9}>
              <Text style={{fontSize: 50}}>🔥</Text>
              <Text style={{fontSize: 30, fontWeight: 'bold',color: "#FA6C13"}}>Why use Emit?</Text>
            </View>
            <View style={{alignItems: "center"}} level={5}>
              <Text style={[styles.smallBlackText, {marginTop: 8}]}>Finding times to hang out</Text>
              <Text style={styles.smallBlackText}>with friends can be hard</Text>
              <Text style={[styles.smallBlackText]}>when they aren't all in an </Text>
              <Text style={[styles.smallBlackText, {marginBottom: 16}]}>active group chat together</Text>
              
            </View>
            </View>
            <View style={[styles.slide, { backgroundColor: '#ffffff'}]}>
            <View style={{alignItems: "center"}} level={9}><Text style={styles.smallBlackText}>With a few taps let your friends</Text></View>
            <View style={{alignItems: "center"}} level={5}><Text style={[styles.smallBlackText, {marginBottom: 16}]}>know what you're down to do</Text></View>
            <View style={{justifyContent: "center", alignItems: "center"}}><Image source={require("media/NewFlare.png")} style={{width: 250, height: 500, borderColor: "black", borderWidth: 1 }}/></View>
            </View>
            <View style={[styles.slide,{ backgroundColor: 'white', width: "100%", alignItems: "center" }]}>
            <View style={{alignItems: "center"}} level={9}><Text style={styles.smallBlackText}>Click the "+" button</Text></View>
            <View style={{alignItems: "center"}} level={5}><Text style={[styles.smallBlackText, {marginBottom: 16}]}> to send a flare to your friends</Text></View>
            <View style={{justifyContent: "center", alignItems: "center"}}><Image source={require("media/Feed.png")} style={{width: 250, height: 500, borderColor: "black", borderWidth: 1}}/></View>
            </View>
            <View style={[styles.slide,{ backgroundColor: 'white', width: "100%", alignItems: "center" }]}>
            <View style={{alignItems: "center"}} style={{marginBottom: 8}} level={8}><Text style={styles.smallBlackText}>Add groups and friends to send flares to!</Text></View>
            <View style={{justifyContent: "center", alignItems: "center"}}><Image source={require("media/groups.png")} style={{width: 250, height: 500, borderColor: "black", borderWidth: 1}}/></View>
            </View>
      </AppIntro>
    );
  }
}
AppRegistry.registerComponent('SwiperOnboarding', () => SwiperOnboarding);
