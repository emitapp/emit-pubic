import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import ProfilePicScreen from './ProfilePicChangingScreen';
import SettingsMain from './SettingsMain';
import Header from 'reusables/Header'


const Navigator = createStackNavigator(
  {
    SettingsMain,
    ProfilePicScreen,
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