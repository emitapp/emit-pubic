import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import FriendButtonHub from './FriendButtonHub';
import GroupSearch from './FriendMasks/FriendGroupSearch';
import GroupMemberAdder from './FriendMasks/GroupMemberAdder';
import GroupViewer from './FriendMasks/GroupViewer';
import FriendRequests from './FriendReqBoxes';
import FriendSearch from './FriendSearch';
import QRScanner from './QRFriendAdder';
import UserSearch from './UserSearch';


const Navigator = createStackNavigator(
  {
    FriendButtonHub,
    UserSearch,
    FriendRequests,
    QRScanner,
    FriendSearch,
    GroupSearch,
    GroupViewer,
    GroupMemberAdder
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