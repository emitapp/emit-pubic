import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import ActiveBroadcasts from './ActiveBroadcasts';
import NewBroadcastForm from './NewBroadcastForm2';
import ResponsesScreen from './ResponsesViewer';
import Header from 'reusables/Header'
import {Alert} from 'react-native'
import NavigationService from 'utils/NavigationService';


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

  //Show an alert if the user is navigating out of a screen with a "needUserConfirmation" 
  //navigation param
  static router = {
    ...Navigator.router,
    getStateForAction: (action, lastState) => {
      if (!lastState) return Navigator.router.getStateForAction(action, lastState);
      const currentRoute = lastState.routes[lastState.index]
      if (!currentRoute.params) return Navigator.router.getStateForAction(action, lastState);

      const leavingActions = ['Navigation/BACK', 'Navigation/NAVIGATE']
      const leavingCurrentScreen = leavingActions.includes(action.type)
      if (leavingCurrentScreen && currentRoute.params.needUserConfirmation){
        Alert.alert('Are you sure?', "If you go back your broadcast data will be erased", [
          {
            text: 'Confirm',
            onPress: () => {
              delete currentRoute.params.needUserConfirmation;
              NavigationService.dispatch(action);
            },
          },
          {
            text: 'Cancel',
            onPress: () => {},
          }
        ]);
        return null;
      }
      return Navigator.router.getStateForAction(action, lastState);
    },
  };

  render() {
    return (
      <Navigator navigation={this.props.navigation} />
    )
  }
}
