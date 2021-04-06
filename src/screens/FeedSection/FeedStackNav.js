import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import NavigationService from 'utils/NavigationService'
import {Alert} from 'react-native'

import Feed from './Feed';
import Header from 'reusables/Header'
import BroadcastViewer from './BroadcastViewer';
import SearchHub from 'screens/ExploreSection/SearchHub'
import ResponsesScreen from './ResponsesViewer';
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


//For the Profile section...
import UserFriendSearch from '../SocialSection/UserFriendSearch';
import FriendRequests from '../SocialSection/FriendReqBoxes';
import QRScanner from '../SocialSection/QRFriendAdder';
import GroupMemberAdder from '../SocialSection/UserGroups/GroupMemberAdder';
import GroupSearch from '../SocialSection/UserGroups/GroupSearch';
import GroupViewer from '../SocialSection/UserGroups/GroupViewer';
import SocialButtonHub from '../SocialSection/SocialButtonHub';
import InviteContacts from '../SocialSection/InviteContacts'


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
    ResponsesScreen,
    ChatScreen,
    BroadcastViewer,
    SocialButtonHub,
    FriendRequests,
    QRScanner,
    UserFriendSearch,
    GroupMemberAdder,
    GroupSearch,
    GroupViewer,
    InviteContacts,
    SearchHub
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
        "NewBroadcastFormLocation", "NewBroadcastFormRecepients", "SavedLocations", "NewBroadcastFormDuration"]
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