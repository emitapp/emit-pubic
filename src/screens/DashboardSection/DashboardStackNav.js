import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import ActiveBroadcasts from './ActiveBroadcasts';
import NewBroadcastForm from './NewBroadcastForm2';
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
    defaultNavigationOptions: Header("Dashboard"),
  });

export default class DashboardStackNav extends React.Component {

  //The tab view shouldn't show for certain screens in this section...
  static navigationOptions = ({navigation}) => {
    const routeName = navigation.state ? navigation.state.routes[navigation.state.index].routeName : "default"
    let showTabView = true
    if (routeName == "NewBroadcastForm") showTabView = false
    return {
      tabBarVisible: showTabView, 
    }
  }

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Navigator.router;

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}