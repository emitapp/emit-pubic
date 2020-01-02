import React from 'react'
import { createStackNavigator } from 'react-navigation-stack';

import FriendButtonHub from './FriendButtonHub'
import FriendRequests from './FriendReqBoxes'
import UserSearch from './UserSearch'

const Navigator = createStackNavigator(
  {
    FriendButtonHub,
    UserSearch,
    FriendRequests
  },
  {
    initialRouteName: 'FriendButtonHub'
  });

export default class FriendSectionStackNav extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}