
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import functions from '@react-native-firebase/functions'
import React from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Divider, Input, Text } from 'react-native-elements'
import Snackbar from 'react-native-snackbar'
import { SmallLoadingComponent, TimeoutLoadingComponent } from 'reusables/LoadingComponents'
import ProfilePicChanger from 'reusables/ProfilePicChanger'
import { isOnlyWhitespace, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers'
import { returnStatuses } from 'utils/serverValues'


export default class AccountManagementScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Manage Your Data",    
    };
  };

  render() {
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{justifyContent: 'flex-start', alignItems: 'center'}}>
        <Text style = {{marginHorizontal: 8}}>
          You can request for all the data that Biteup has that pertains to you sent to your account's registered  email address.
          It only takes a few minutes. Note that this action doesn't delete this data or alter it in any way in Biteup's databases.
          You can only do this every 72 hours.
        </Text>
        <Button
          title = "Request Data"
          onPress = {this.requestData}
        />
        <View style = {{borderTopWidth: 1, borderBottomWidth: 1, borderColor: "red", backgroundColor: "#FEEDEC", marginTop: 16}}>
          <Text style = {{fontSize: 22, fontWeight: "bold", alignSelf: "center", marginVertical: 8}}>
          ⚠️Danger Zone⚠️
          </Text>
          <Text style = {{marginHorizontal: 8}}>
            Needless to say, deleting your account is very irreversible.
          </Text>
          <Button
          containerStyle = {{alignSelf: "center"}}
          buttonStyle = {{backgroundColor: "crimson"}}
          title = "Delete account"
          />
        </View>
      </ScrollView>
    )
  }

  requestData = async () => {
    try{
      const response = await timedPromise(functions().httpsCallable('requestAllData')(), LONG_TIMEOUT);
      console.log(response.data)
    }catch(err){
      if (err.message != 'timeout') logError(err)
    }
  }

}
  