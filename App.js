import { StyleSheet, Platform, Image, Text, View } from 'react-native'
import { createSwitchNavigator, createAppContainer} from 'react-navigation'
import AuthDecisionLander from './#screens/Authentication/AuthDecisionLanding'
import SignUp from './#screens/Authentication/SignUp'
import Login from './#screens/Authentication/Login'
import Main from './#screens/Main'


const App = createAppContainer(
    createSwitchNavigator(
    {
      AuthDecisionLander,
      SignUp,
      Login,
      Main
    },
    {
      initialRouteName: 'AuthDecisionLander'
    }
  )
)

export default App