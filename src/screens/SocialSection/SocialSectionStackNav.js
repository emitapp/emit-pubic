import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import Header from 'reusables/Header'

import ExplorePage from 'screens/SocialSection/ExplorePage'
import GroupMemberAdder from './UserGroups/GroupMemberAdder';
import GroupViewer from './UserGroups/GroupViewer';
import InviteContacts from './InviteContacts'


const Navigator = createStackNavigator(
  {
    GroupMemberAdder,
    GroupViewer,
    InviteContacts,
    ExplorePage
  },
  {
    initialRouteName: 'ExplorePage',
    defaultNavigationOptions: Header("Explore")

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