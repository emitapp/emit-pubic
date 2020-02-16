import React from 'react'
import { createStackNavigator } from 'react-navigation-stack';

import FriendButtonHub from './FriendButtonHub'
import FriendRequests from './FriendReqBoxes'
import UserSearch from './UserSearch'
import QRScanner from './QRFriendAdder'
import FriendSearch from './FriendSearch'
import GroupSearch from './FriendGroupSearch'
import NewGroupScreen from './NewGroupScreen'
import GroupViewer from './GroupViewer'

const Navigator = createStackNavigator(
  {
    FriendButtonHub,
    UserSearch,
    FriendRequests,
    QRScanner,
    FriendSearch,
    GroupSearch,
    NewGroupScreen,
    GroupViewer
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