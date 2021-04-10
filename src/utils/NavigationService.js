//https://reactnavigation.org/docs/4.x/navigating-without-navigation-prop/
//For use when tyring to navigatw without access to a navigation prop
import { StackActions, NavigationActions } from 'react-navigation';

let _navigator;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function navigate(routeName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params
    })
  );
}

/**
 * 
 * First navigates to a specified StackNavigator routeName, and replaces the navigation state with a
 * new set of navigationActions related to that stack.
 * 
 * @param {Top level stack to reference with StackActions} routeName
 * @param {Index of active screen} index 
 * @param {Array of {routeName, params}} navigationActions 
 */
function reset(routeName, index, navigationActions) {
  if (!navigationActions) return
  const actions = navigationActions.map(x => NavigationActions.navigate(x))
  const resetAction = StackActions.reset({
    index: index,
    actions: actions
  })

  const navigationAction = NavigationActions.navigate({
    routeName: routeName,
    params: {},
    action: resetAction
  })
  _navigator.dispatch(navigationAction)
}

function dispatch(...args) {
  _navigator.dispatch(...args);
}

export default {
  navigate,
  setTopLevelNavigator,
  dispatch,
  reset
};