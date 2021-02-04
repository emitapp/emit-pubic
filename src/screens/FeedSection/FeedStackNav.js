import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import Feed from './Feed';
import Header from 'reusables/Header'
import BroadcastViewer from './BroadcastViewer';


const Navigator = createStackNavigator(
  {
    Feed,
    BroadcastViewer
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