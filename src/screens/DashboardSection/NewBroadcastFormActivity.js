import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer, Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import S from 'styling'
import ErrorMessageText from 'reusables/ErrorMessageText';
import database from '@react-native-firebase/database';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import { ActivityListElement } from 'reusables/ListElements';

export default class NewBroadcastFormActivity extends React.Component {

    constructor(props){
        super(props)
        this.dbRef = [{title: "ACTIVITIES", ref: database().ref(`/activities`)}]
        this.queryTypes = [{name: "Name", value: "nameQuery"}]
        this.footerButtons = [{text: "Custom", func: () => {console.log("insert custom here")}}]
        this.state = {
            // showingCustom: false,
            // errorMessage: null
        }
    }


    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader("New Broadcast")
    };

    saveActivity = (activityName) => {
        this.props.navigation.state.params.activitySelected = activityName
        this.props.navigation.goBack()
    }

    itemRenderer = ({ item }) => {
        return (
          <View style = {{alignItems: "", width: "100%", flexDirection: "row"}}>
            <ActivityListElement 
                style = {{width: "100%"}}
                emoji = {item.emoji}
                activityName={item.name} 
                onPress={() => { this.saveActivity(item.emoji + " " + item.name)}}
            />
          </View>
        );
    }

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                <Text h4 h4Style={{marginTop: 8, fontWeight: "bold"}}>
                    Activity
                </Text>
                <SearchableInfiniteScroll
                type = "section"
                queryValidator = {(query) => true}
                queryTypes = {this.queryTypes}
                renderItem = {this.itemRenderer}
                dbref = {this.dbRef}
                additionalData = {this.footerButtons}
                >
                    <View/>
                </SearchableInfiniteScroll>
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }
}


const styles = StyleSheet.create({
    timeButton:{
        justifyContent: "center", 
        alignItems: "center",
        height: "100%",
        width: "25%",
        borderRadius: 10,
        borderWidth: 3
    },
    rowStyle: {
        width: "100%",
        flexDirection: "row",
        marginVertical: 8,
        height: 50,
        justifyContent: "space-between",
    },
})