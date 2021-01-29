import React from 'react';
import { Alert } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import Header from 'reusables/Header';
import NavigationService from 'utils/NavigationService';
import ActiveBroadcasts from './ActiveBroadcasts';
import LocationSelector from './LocationSelector';
import NewBroadcastForm from './NewBroadcastForm';
import NewBroadcastFormLocation from './NewBroadcastFormLocation';
import NewBroadcastFormRecepients from './NewBroadcastFormRecepients';
import NewBroadcastFormActivity from './NewBroadcastFormActivity';
import NewBroadcastFormTime from './NewBroadcastFormTime';
import ResponsesScreen from './ResponsesViewer';
import SavedLocations from './SavedLocations'
import ChatScreen from '../Chat/ChatScreen'
import GroupMemberAdder from '../SocialSection/UserGroups/GroupMemberAdder'
import UserFriendSearch from '../SocialSection/UserFriendSearch'

const Navigator = createStackNavigator(
  {
    ActiveBroadcasts,
    NewBroadcastForm,
    NewBroadcastFormTime,
    ResponsesScreen,
    LocationSelector,
    NewBroadcastFormActivity,
    NewBroadcastFormLocation,
    NewBroadcastFormRecepients,
    SavedLocations,
    GroupMemberAdder,
    UserFriendSearch,
  },
  {
    initialRouteName: 'ActiveBroadcasts',
    defaultNavigationOptions: Header("My Flares"),
  });

export default class DashboardStackNav extends React.Component {

  //The tab view shouldn't show for certain screens in this section...
  static navigationOptions = ({navigation}) => {
    const routeName = navigation.state ? navigation.state.routes[navigation.state.index].routeName : "default"
    var targetScreens = ["GroupMemberAdder","NewBroadcastFormActivity","NewBroadcastFormTime", "NewBroadcastForm", "LocationSelector", "NewBroadcastFormLocation", "NewBroadcastFormRecepients", "SavedLocations"]
    let showTabView = !targetScreens.includes(routeName)
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
      if (!currentRoute.params?.needUserConfirmation) return Navigator.router.getStateForAction(action, lastState);
    
      if (action.type == 'Navigation/BACK' ){
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