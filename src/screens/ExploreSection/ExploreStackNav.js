import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';

import SearchHub from 'screens/ExploreSection/SearchHub'

//For the Profile Section...
import UserFriendSearch from '../SocialSection/UserFriendSearch';
import FriendRequests from '../SocialSection/FriendReqBoxes';
import QRScanner from '../SocialSection/QRFriendAdder';
import GroupMemberAdder from '../SocialSection/UserGroups/GroupMemberAdder';
import GroupSearch from '../SocialSection/UserGroups/GroupSearch';
import GroupViewer from '../SocialSection/UserGroups/GroupViewer';
import SocialButtonHub from '../SocialSection/SocialButtonHub';
import InviteContacts from '../SocialSection/InviteContacts'

const Navigator = createStackNavigator(
  {
    SocialButtonHub,
    FriendRequests,
    QRScanner,
    UserFriendSearch,
    GroupMemberAdder,
    GroupSearch,
    GroupViewer,
    InviteContacts,
    SearchHub
  },
  {
    initialRouteName: 'SearchHub',
  });

export default class ExploreStackNav extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}