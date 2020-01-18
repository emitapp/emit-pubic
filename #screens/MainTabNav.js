// The overall partent tab navigator screen for the main interface

import React from 'react'
import auth from '@react-native-firebase/auth';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';

import FeedStackNav from './FeedSection/FeedStackNav'
import SettingsStackNav from "./Settings/SettingsStackNav"
import DashboardStackNav from "./DashboardSection/DashboardStackNav"
import FriendStackNav from './FriendSection/FriendSectionStackNav'


const Tab = createBottomTabNavigator(
  {
    DashboardStackNav,
    FeedStackNav,
    FriendStackNav,
    SettingsStackNav,
  },
  {
    defaultNavigationOptions: ({ navigation }) =>
      ({
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          const { routeName } = navigation.state;
          let iconName;
          if (routeName === 'DashboardStackNav') {
            iconName = `home`;
          } else if (routeName === 'FeedStackNav') {
            iconName = `rss`;
          }else if (routeName === 'FriendStackNav') {
            iconName = `user-friends`;
          }else{
            iconName = `cog`;
          }

          return <AwesomeIcon name={iconName} size={25} color={tintColor} />;
        },
      }),
    tabBarOptions: {
      activeTintColor: 'tomato',
      inactiveTintColor: 'gray',
    },
  }
);

export default class Main extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Tab.router;

  constructor(props) {
    super(props)
    global.MainTabRoot = this;
  }

  render() {
    return (
      <Tab navigation={this.props.navigation} />
    )
  }

  signOut = () => {
    auth().signOut()
      .then(() => this.props.navigation.navigate("AuthDecisionLander"))
      .catch(() => console.error("Something went wrong with signing out!"))
  }
}