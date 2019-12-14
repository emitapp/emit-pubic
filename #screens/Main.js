// The overall partent tab navigator screen for the main interface

import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';
import { createBottomTabNavigator } from 'react-navigation-tabs';

import Feed from './FeedSection/Feed'
import LogOut from "./Settings/LogOut"
import Active from "./DashboardSection/ActiveBroadcasts"


const Tab = createBottomTabNavigator({
  Feed,
  LogOut,
  Active
});

export default class Main extends React.Component {

    //https://reactnavigation.org/docs/en/common-mistakes.html
    static router = Tab.router;

    constructor(props){
      super(props)
      global.MainTabRoot = this;
    }

    render() {
      return (
          <Tab navigation={this.props.navigation}/>
      )
    }

    signOut = () => {
      auth().signOut()
      .then(() => this.props.navigation.navigate("AuthDecisionLander"))
      .catch(() => console.error("Something went wrong with signing out!"))
    }
  }