import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import Feed from './Feed';
import Header from 'reusables/Header'
import BroadcastViewer from './BroadcastViewer';

//For the Profile section...
import UserFriendSearch from '../SocialSection/UserFriendSearch';
import FriendRequests from '../SocialSection/FriendReqBoxes';
import QRScanner from '../SocialSection/QRFriendAdder';
import GroupMemberAdder from '../SocialSection/UserGroups/GroupMemberAdder';
import GroupSearch from '../SocialSection/UserGroups/GroupSearch';
import GroupViewer from '../SocialSection/UserGroups/GroupViewer';
import SocialButtonHub from '../SocialSection/SocialButtonHub';
import InviteContacts from '../SocialSection/InviteContacts'
import JitsiComponent from 'reusables/JitsiComponent'


const Navigator = createStackNavigator(
  {
    Feed,
    BroadcastViewer,
    SocialButtonHub,
    FriendRequests,
    QRScanner,
    UserFriendSearch,
    GroupMemberAdder,
    GroupSearch,
    GroupViewer,
    InviteContacts,
    JitsiComponent
  },
  {
    initialRouteName: 'Feed',
    defaultNavigationOptions: Header("Flares Feed")
  });

export default class FeedStackNav extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}