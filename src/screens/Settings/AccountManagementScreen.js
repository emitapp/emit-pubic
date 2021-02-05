
import auth from '@react-native-firebase/auth'
import functions from '@react-native-firebase/functions'
import React from 'react'
import { ScrollView, View, Alert } from 'react-native'
import { Button, Divider, Input, Text } from 'react-native-elements'
import ErrorMessageText from 'reusables/ErrorMessageText'
import { DefaultLoadingModal, DataEmailSendingModal } from 'reusables/LoadingComponents'
import { logError, LONG_TIMEOUT, ShowNotSupportedAlert, timedPromise } from 'utils/helpers'
import Snackbar from 'react-native-snackbar'

export default class AccountManagementScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Manage Your Data and Profile",    
    };
  };

  state = {
    oldEmail1: "",
    oldPass1: "",
    newEmail: "",
    emailChangeError: "",

    oldEmail2: "",
    oldPass2: "",
    newPass: "",
    newPassConfirm: "",
    passwordChangeError: "",

    oldEmail3: "",
    oldPass3: "",
    deleteAccountError: "",

    isModalVisible: false,
    dataRequestModalCondition: "disabled" //Can be disabled, loading, success, error
  }

  render() {
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{justifyContent: 'flex-start', alignItems: 'center'}}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />
        <DataEmailSendingModal condition={this.state.dataRequestModalCondition} />

        <Text h4>Request your Data</Text>
        <Text style = {{marginHorizontal: 8}}>
          You can request for all the data that Biteup has that pertains to you sent to your account's registered  email address.
          It only takes a few minutes. Note that this action doesn't delete this data or alter it in any way in Biteup's databases.
          You can only do this every 72 hours.
        </Text>
        <Button
          title = "Request Data"
          onPress = {this.requestData}
        />

        <Divider style = {{marginVertical: 12}}/>
        <Text h4>Change Email</Text>
        <ErrorMessageText message = {this.state.emailChangeError} />
        <Input
          autoCapitalize="none"
          placeholder="johnDoe@gmail.com"
          label = "Current Email"
          keyboardType = "email-address"
          onChangeText={oldEmail1 => this.setState({ oldEmail1 })}
          value={this.state.oldEmail1}
        />
        <Input
          secureTextEntry
          autoCapitalize="none"
          label = "Current Password"
          placeholder="Password"
          onChangeText={oldPass1 => this.setState({ oldPass1 })}
          value={this.state.oldPass1}
        />
        <Input
          autoCapitalize="none"
          placeholder="johnDoeTheSecond@gmail.com"
          label = "New Email"
          keyboardType = "email-address"
          onChangeText={newEmail => this.setState({ newEmail })}
          value={this.state.newEmail}
        />
        <Button
          title = "Change Email"
          onPress = {this.changeEmail}
        />

        <Divider style = {{marginVertical: 12}}/>
        <Text h4>Change Password</Text>
        <ErrorMessageText message = {this.state.passwordChangeError} />
        <Input
          autoCapitalize="none"
          placeholder="johnDoe@gmail.com"
          label = "Current Email"
          keyboardType = "email-address"
          onChangeText={oldEmail2 => this.setState({ oldEmail2 })}
          value={this.state.oldEmail2}
        />
        <Input
          secureTextEntry
          autoCapitalize="none"
          label = "Current Password"
          placeholder="Password"
          onChangeText={oldPass2 => this.setState({ oldPass2 })}
          value={this.state.oldPass2}
        />
        <Input
          secureTextEntry
          autoCapitalize="none"
          label = "New Password"
          placeholder="Password"
          onChangeText={newPass => this.setState({ newPass })}
          value={this.state.newPass}
        />
        <Input
          secureTextEntry
          autoCapitalize="none"
          label = "Confirm New Password"
          placeholder="Password"
          onChangeText={newPassConfirm => this.setState({ newPassConfirm })}
          value={this.state.newPassConfirm}
        />
        <Button
          title = "Change Password"
          onPress = {this.changePass}
        />


        <View style = {{borderTopWidth: 1, borderBottomWidth: 1, borderColor: "red", backgroundColor: "#FEEDEC", marginTop: 16}}>
          <Text h4>Delete your Account</Text>
          <Text style = {{fontSize: 22, fontWeight: "bold", alignSelf: "center", marginVertical: 8}}>
          ⚠️Danger Zone⚠️
          </Text>
          <Text style = {{marginHorizontal: 8}}>
            Needless to say, deleting your account is very irreversible.
          </Text>
          <ErrorMessageText message = {this.state.deleteAccountError} />
          <Input
            autoCapitalize="none"
            placeholder="johnDoe@gmail.com"
            label = "Current Email"
            keyboardType = "email-address"
            onChangeText={oldEmail3 => this.setState({ oldEmail3 })}
            value={this.state.oldEmail3}
          />
          <Input
            secureTextEntry
            autoCapitalize="none"
            label = "Current Password"
            placeholder="Password"
            onChangeText={oldPass3 => this.setState({ oldPass3 })}
            value={this.state.oldPass3}
          />
          <Button
          containerStyle = {{alignSelf: "center"}}
          buttonStyle = {{backgroundColor: "crimson"}}
          title = "Delete account"
          onPress = {this.confirmDeleteAccount}
          />
        </View>

      </ScrollView>
    )
  }

  requestData = async () => {
    try{
      let error = true;
      this.setState({dataRequestModalCondition: 'loading'})
      setTimeout(() => this.setState({dataRequestModalCondition: error ? "error" : "success"}), 2000)
      setTimeout(() => this.setState({dataRequestModalCondition: 'disabled'}), 4000)

      //TODO: Look at
      ShowNotSupportedAlert()
      //const response = await timedPromise(functions().httpsCallable('requestAllData')(), LONG_TIMEOUT);
    }catch(err){
      if (err.name != 'timeout') logError(err)
    }
  }

  changeEmail = async () => {
    this.setState({isModalVisible: true, emailChangeError: null})
    try{
      if (!this.state.oldEmail1 || !this.state.oldPass1 || !this.state.newEmail){
        this.setState({emailChangeError: "You haven't entered information in all the fields"})
      }else{
        const user = auth().currentUser
        const authCredential = auth.EmailAuthProvider.credential(this.state.oldEmail1, this.state.oldPass1);
        await timedPromise(user.reauthenticateWithCredential(authCredential), LONG_TIMEOUT)
        await timedPromise(user.updateEmail(this.state.newEmail), LONG_TIMEOUT)
        await timedPromise(user.reload(), LONG_TIMEOUT)
        this.setState({oldEmail1: "", oldPass1: "", newEmail: ""})
        this.showDelayedSnackbar("Email change successful")
      }
    }catch(err){
      if (err.name !== 'timeout') logError(err)
      this.setState({emailChangeError: err.message})
    }
    this.setState({isModalVisible: false})
  }

  changePass = async () => {
    this.setState({isModalVisible: true, passwordChangeError: null})
    try{
      const user = auth().currentUser
      if (!this.state.oldPass2 || !this.state.oldEmail2 || !this.state.newPass || !this.state.newPassConfirm){
        this.setState({passwordChangeError: "You haven't entered information in all the fields"})
      }else if (this.state.newPass != this.state.newPassConfirm){
        this.setState({passwordChangeError: "Your passwords don't match!"})
      }else{
        const authCredential = auth.EmailAuthProvider.credential(this.state.oldEmail2, this.state.oldPass2);
        await timedPromise(user.reauthenticateWithCredential(authCredential), LONG_TIMEOUT)
        await timedPromise(user.updatePassword(this.state.newPass), LONG_TIMEOUT)
        await timedPromise(user.reload(), LONG_TIMEOUT)
        this.setState({oldEmail2: "", oldPass2: "", newPass: "", newPassConfirm: ""})
        this.showDelayedSnackbar("Password change successful")
      }
    }catch(err){
      if (err.name !== 'timeout') logError(err)
      this.setState({passwordChangeError: err.message})
    }
    this.setState({isModalVisible: false})
  }

  confirmDeleteAccount = () => {
    Alert.alert(
      "Account Deletion",
      "Are you sure you want to delete your account? This is very permanent!",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete Account", 
          onPress: () => this.deleteAccount(),
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  }


  deleteAccount = async () => {

    //TODO: Ovbiously, this should be looked at
    ShowNotSupportedAlert()
    return;

    this.setState({isModalVisible: true, deleteAccountError: null})
    try{
      if (!this.state.oldEmail3 || !this.state.oldPass3){
        this.setState({deleteAccountError: "You haven't entered information in all the fields"})
      }else{
        const user = auth().currentUser
        const authCredential = auth.EmailAuthProvider.credential(this.state.oldEmail3, this.state.oldPass3);
        await timedPromise(user.reauthenticateWithCredential(authCredential), LONG_TIMEOUT)
        await timedPromise(user.delete(), LONG_TIMEOUT)
        this.setState({oldEmail3: "", oldPass3: ""})
      }
    }catch(err){
      if (err.name !== 'timeout') logError(err)
      this.setState({deleteAccountError: err.message})
    }
    this.setState({isModalVisible: false})
  }

  //There are modals being opened and closed on this screen, and if I close a modal
  //and then show the snackbar, the snackbar might be attached to the modal that was jsut in 
  //the process of being removed, meaning the snackbar will never be displayed. 
  //So, I use a small timeout to give the snackbar a bit of a delay
  //https://github.com/cooperka/react-native-snackbar/issues/67
  showDelayedSnackbar = (message) => {
    setTimeout(
      () => {
        Snackbar.show({
          text: message, 
          duration: Snackbar.LENGTH_SHORT
        });
      },
      200
    )
  }
}