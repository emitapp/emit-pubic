
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import functions from '@react-native-firebase/functions'
import React from 'react'
import { ScrollView } from 'react-native'
import { Button, Divider, Input, Text } from 'react-native-elements'
import Snackbar from 'react-native-snackbar'
import { SmallLoadingComponent, TimeoutLoadingComponent } from 'reusables/LoadingComponents'
import ProfilePicChanger from 'reusables/ProfilePicChanger'
import { isOnlyWhitespace, logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers'
import { returnStatuses } from 'utils/serverValues'


export default class EditProfileScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Edit Profile",    
    };
  };
  
  constructor(props) {
    super(props);
    this.state = {
      displayName: "", 
      hasSnippet: false, 
      hasTimedOut: false,
      displayNameError: "",
      changingDisplayName: false
    }
    this._isMounted = false; //Using this is an antipattern, but simple enough for now
  }

  componentDidMount(){
    this._isMounted = true
    this.getSnippet()
  }

  componentWillUnmount(){
      this._isMounted = false
  }

  render() {
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{justifyContent: 'flex-start', alignItems: 'center'}}>
        <Text h4>Edit Profile Picture</Text>
        <ProfilePicChanger/>

        <Divider style = {{marginVertical: 16}}/>

        {this.state.hasSnippet ? (
          <>
          <Text h4>Edit Display Name</Text>
          <Text style = {{textAlign: "center", marginBottom: 16, marginHorizontal: 8}}>
          Note that even though you can change your display name as many times as you want,
          certain parts of the app will still show your old display name to you and other users.
          This is why Biteup also associates a unique unchangeable hander (eg @john_doe) 
          to make sure everyone is still easily identifiable.
          </Text>
          <Input
            autoCapitalize="none"
            label = "Display Name"
            placeholder="What's your new display name?"
            onChangeText={displayName => this.setState({displayName})}
            value={this.state.displayName}
            errorMessage={this.state.displayNameError}
          />
          {!this.state.changingDisplayName ? (
            <Button title = "Update" onPress = {this.updateDisplayName} />
          ) : (
            <SmallLoadingComponent />
          )}
          
          </>
        ) : (
          <TimeoutLoadingComponent
          hasTimedOut = {this.state.hasTimedOut}
          retryFunction = {this.state.getSnippet} />
        )}
      </ScrollView>
    )
  }

  getSnippet = async () => {
    try{
      this.setState({hasTimedOut: false})
      const uid = auth().currentUser.uid; 
      const ref = database().ref(`/userSnippets/${uid}`);
      const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
      if (snapshot.exists()){
        if (this._isMounted) this.setState({ 
          displayName: snapshot.val().displayName,
          hasSnippet: true
        })
      }
    }catch(err){
        if (err.code != "timeout") logError(err)
        else this.setState({hasTimedOut: true})
    }
  }

  updateDisplayName = async () => {
    if (isOnlyWhitespace(this.state.displayName)){
      this.setState({displayNameError: "Your display name is invalid!"})
      return
    }else{
      this.setState({displayNameError: ""})
    }
    this.setState({changingDisplayName: true})
    try{
      const changeFunction = functions().httpsCallable('updateDisplayName');
      const response = await timedPromise(changeFunction(this.state.displayName), MEDIUM_TIMEOUT);

      if (response.data.status === returnStatuses.OK){
        Snackbar.show({text: 'Display name change successful', duration: Snackbar.LENGTH_SHORT});
      }else{
        logError(new Error("Problematic updateDisplayName fucntion response: " + response.data.status))
      }
    }catch(err){
      if (err.code == "timeout"){
        this.setState({displayNameError: "Timeout! Try"})
      }else{
        this.setState({displayNameError: "Something went wrong."})
        logError(err)        
      }
    }
    this.setState({changingDisplayName: false})
  }
}
  