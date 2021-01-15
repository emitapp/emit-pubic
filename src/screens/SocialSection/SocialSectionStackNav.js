import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import SocialButtonHub from './SocialButtonHub';
import FriendRequests from './FriendReqBoxes';
import UserFriendSearch from './UserFriendSearch';
import QRScanner from './QRFriendAdder';
import GroupMemberAdder from './UserGroups/GroupMemberAdder'
import GroupSearch from './UserGroups/GroupSearch'
import GroupViewer from './UserGroups/GroupViewer'
import Header from 'reusables/Header'

const Navigator = createStackNavigator(
  {
    SocialButtonHub,
    FriendRequests,
    QRScanner,
    UserFriendSearch,
    GroupMemberAdder,
    GroupSearch,
    GroupViewer
  },
  {
    initialRouteName: 'SocialButtonHub',
    defaultNavigationOptions: Header("Community")
  });

export default class SocailSectionStackNav extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}