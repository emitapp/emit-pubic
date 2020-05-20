//https://reactnavigation.org/docs/4.x/navigating-without-navigation-prop/
//For use when tyring to navigatw without access to a navigation prop
import { NavigationActions } from 'react-navigation';

let _navigator;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function navigate(routeName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
    })
  );
}

function dispatch(...args) {
  _navigator.dispatch(...args);
}

export default {
  navigate,
  setTopLevelNavigator,
  dispatch
};