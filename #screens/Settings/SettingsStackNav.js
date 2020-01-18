import React from 'react'
import { createStackNavigator } from 'react-navigation-stack';

import SettingsMain from './SettingsMain'
import ProfilePicScreen from './ProfilePicChangingScreen'

const Navigator = createStackNavigator(
  {
    SettingsMain,
    ProfilePicScreen,
  },
  {
    initialRouteName: 'SettingsMain'
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