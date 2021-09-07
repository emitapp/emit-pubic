import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import Header from 'reusables/Header'


//Settings
import SettingsMain from './SettingsMain';
import EditProfileScreen from './EditProfileScreen';
import AccountManagementScreen from './AccountManagementScreen'
import ContactSupportPage from './ContactSupportPage'
import NotificationSettings from './NotificationSettings'
import LegalNotices from './LegalNotices'
import AppAppearanceSettings from './AppAppearanceSettings'

//Profile
import QRScanner from '../ProfileAndSettings/QRFriendAdder';
import ProfileScreen from '../ProfileAndSettings/ProfileScreen';
import FriendRequests from './FriendReqBoxes';

//Flares
import RecurringFlaresViewer from './RecurringFlaresViewer';


const Navigator = createStackNavigator(
  {
    SettingsMain,
    EditProfileScreen,
    AccountManagementScreen,
    ContactSupportPage,
    NotificationSettings,
    LegalNotices,
    QRScanner,
    ProfileScreen,
    FriendRequests,
    RecurringFlaresViewer,
    AppAppearanceSettings
  },
  {
    initialRouteName: 'ProfileScreen',
    defaultNavigationOptions: Header("Profile + Settings")
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