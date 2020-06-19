import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import EditProfileScreen from './EditProfileScreen';
import SettingsMain from './SettingsMain';
import AccountManagementScreen from './AccountManagementScreen'
import ContactSupportPage from './ContactSupportPage'
import NotificationSettings from './NotificationSettings'
import LegalNotices from './LegalNotices'
import Header from 'reusables/Header'


const Navigator = createStackNavigator(
  {
    SettingsMain,
    EditProfileScreen,
    AccountManagementScreen,
    ContactSupportPage,
    NotificationSettings,
    LegalNotices
  },
  {
    initialRouteName: 'SettingsMain',
    defaultNavigationOptions: Header("Settings")
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