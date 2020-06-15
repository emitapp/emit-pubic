import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import EditProfileScreen from './EditProfileScreen';
import SettingsMain from './SettingsMain';
import AccountManagementScreen from './AccountManagementScreen'
import Header from 'reusables/Header'


const Navigator = createStackNavigator(
  {
    SettingsMain,
    EditProfileScreen,
    AccountManagementScreen
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