import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import NavigationService from 'utils/NavigationService'
import {Alert} from 'react-native'

import Feed from './Feed';
import Header from 'reusables/Header'

//Flare Management Screens
import FlareViewer from './FlareViewer';
import ChatScreen from '../Chat/ChatScreen'

//Flare Creation Screens
import NewBroadcastForm from './FlareCreation/NewBroadcastForm';
import NewBroadcastFormActivity from './FlareCreation/NewBroadcastFormActivity';
import NewBroadcastFormDuration from './FlareCreation/NewBroadcastFormDuration';
import NewBroadcastFormLocation from './FlareCreation/NewBroadcastFormLocation';
import NewBroadcastFormRecepients from './FlareCreation/NewBroadcastFormRecepients';
import NewBroadcastFormTime from './FlareCreation/NewBroadcastFormTime';
import SavedLocations from './FlareCreation/SavedLocations'
import LocationSelector from './FlareCreation/LocationSelector';
import UserFriendSearch from './UserAndFriendSearch';

//Duplication of a scren from the social section for better .goBack() flow...
import GroupMemberAdder from '../SocialSection/UserGroups/GroupMemberAdder';

const Navigator = createStackNavigator(
  {
    Feed,
    NewBroadcastForm,
    NewBroadcastFormTime,
    LocationSelector,
    NewBroadcastFormActivity,
    NewBroadcastFormLocation,
    NewBroadcastFormRecepients,
    SavedLocations,
    NewBroadcastFormDuration,
    ChatScreen,
    FlareViewer,
    UserFriendSearch,
    GroupMemberAdder,
  },
  {
    initialRouteName: 'Feed',
    defaultNavigationOptions: Header("Flares Feed")
  });

export default class FeedStackNav extends React.Component {

    //The tab view shouldn't show for certain screens in this section...
    static navigationOptions = ({ navigation }) => {
      const routeName = navigation.state ? navigation.state.routes[navigation.state.index].routeName : "default"
      var targetScreens = ["GroupMemberAdder", "NewBroadcastFormActivity", "NewBroadcastFormTime", "NewBroadcastForm", "LocationSelector",
        "NewBroadcastFormLocation", "NewBroadcastFormRecepients", "SavedLocations", "NewBroadcastFormDuration", "UserFriendSearch"]
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
  
        if (action.type == 'Navigation/BACK') {
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
              onPress: () => { },
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