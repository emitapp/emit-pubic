import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import ActiveBroadcasts from './ActiveBroadcasts';
import NewBroadcastForm from './NewBroadcastForm';
import ResponsesScreen from './ResponsesViewer';
import Header from 'reusables/Header'


const Navigator = createStackNavigator(
  {
    ActiveBroadcasts,
    NewBroadcastForm,
    ResponsesScreen
  },
  {
    initialRouteName: 'ActiveBroadcasts',
    defaultNavigationOptions: Header("Dashboard")
  });

export default class DashboardStackNav extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}