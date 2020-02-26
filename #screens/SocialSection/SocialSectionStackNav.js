import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import SocialButtonHub from './SocialButtonHub';
import MaskSearch from './FriendMasks/MaskSearch';
import MaskMemberAdder from './FriendMasks/MaskMemberAdder';
import MaskViewer from './FriendMasks/MaskViewer';
import FriendRequests from './FriendReqBoxes';
import FriendSearch from './FriendSearch';
import QRScanner from './QRFriendAdder';
import UserSearch from './UserSearch';
import GroupMemberAdder from './UserGroups/GroupMemberAdder'
import GroupSearch from './UserGroups/GroupSearch'
import GroupViewer from './UserGroups/GroupViewer'

const Navigator = createStackNavigator(
  {
    SocialButtonHub,
    UserSearch,
    FriendRequests,
    QRScanner,
    FriendSearch,
    MaskSearch,
    MaskViewer,
    MaskMemberAdder,
    GroupMemberAdder,
    GroupSearch,
    GroupViewer
  },
  {
    initialRouteName: 'SocialButtonHub'
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