
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
import Icon from 'react-native-vector-icons/FontAwesome5';



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
      hasSnippets: false, 
      hasTimedOut: false,
      displayNameError: "",
      changingDisplayName: false,
      facebook: null,
      twitter: null,
      instagram: null,
      github: null,
      snapchat: null,
      socialsError: null,
      updatingSocials: false
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
    if (!this.state.hasSnippets){
      return (
        <TimeoutLoadingComponent
        hasTimedOut = {this.state.hasTimedOut}
        retryFunction = {this.state.getSnippet} />
      )
    }
    return (
      <ScrollView 
      style={{flex: 1, marginTop: 8}} 
      contentContainerStyle = {{justifyContent: 'flex-start', alignItems: 'center'}}>
        <Text h4>Edit Profile Picture</Text>
        <ProfilePicChanger/>

        <Divider style = {{marginVertical: 16}}/>

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

          <Divider style = {{marginVertical: 16}}/>

          <Text h4>Edit Social Links</Text>
          <Text style = {{textAlign: "center", marginBottom: 16, marginHorizontal: 8}}>
            People will be able to see these when they check your profile. Exclude the @ in all your handles
          </Text>
          {this.state.socialsError !== null &&
          <Text style={{ color: 'red' }}>
            {this.state.socialsError}
          </Text>}
 
          <Input
            autoCapitalize="none"
            placeholder="Facebook name"
            onChangeText={facebook => this.setState({facebook})}
            value={this.state.facebook}
            leftIcon={<Icon name='facebook-square'size={24}/>}
          />
          <Input
            autoCapitalize="none"
            placeholder="Instagram handle"
            onChangeText={instagram => this.setState({instagram})}
            value={this.state.instagram}
            leftIcon={<Icon name='instagram'size={24}/>}
          />
          <Input
            autoCapitalize="none"
            placeholder="Twitter handle"
            onChangeText={twitter => this.setState({twitter})}
            value={this.state.twitter}
            leftIcon={<Icon name='twitter'size={24}/>}
          />
          <Input
            autoCapitalize="none"
            placeholder="Github handle"
            onChangeText={github => this.setState({github})}
            value={this.state.github}
            leftIcon={<Icon name='github'size={24}/>}
          />
          <Input
            autoCapitalize="none"
            placeholder="Snapchat handle"
            onChangeText={snapchat => this.setState({snapchat})}
            value={this.state.snapchat}
            leftIcon={<Icon name='snapchat'size={24}/>}
          />

          {!this.state.updatingSocials ? (
            <Button title = "Update" onPress = {this.updateSocials} />
          ) : (
            <SmallLoadingComponent />
          )}

      </ScrollView>
    )
  }

  getSnippet = async () => {
    try{
      this.setState({hasTimedOut: false})
      const uid = auth().currentUser.uid; 
      const snippetRef = database().ref(`/userSnippets/${uid}`);
      const extraInfoRef = database().ref(`/userSnippetExtras/${uid}`);
      let snippetSnap = null;
      let extrasSnap = null 
      await Promise.all([
        timedPromise(snippetRef.once('value'), MEDIUM_TIMEOUT).then(snap => snippetSnap = snap),
        timedPromise(extraInfoRef.once('value'), MEDIUM_TIMEOUT).then(snap => extrasSnap = snap)
      ])

      if (!snippetSnap.exists() || !this._isMounted) return;

      this.setState({ 
        displayName: snippetSnap.val().displayName,
        ...(extrasSnap.val() || {}),
        hasSnippets: true
      })
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
        this.setState({displayNameError: "Timeout! Try again"})
      }else{
        this.setState({displayNameError: "Something went wrong."})
        logError(err)        
      }
    }
    this.setState({changingDisplayName: false})
  }

  formatSocial = (input) => {
    if (!input) return null
    const formattedInput = input.trim()
    if (formattedInput) return formattedInput
    return null
  }

  updateSocials = async () => {
    this.setState({updatingSocials: true, socialsError: null})
    try{
      const facebook = this.formatSocial(this.state.facebook)
      const twitter = this.formatSocial(this.state.twitter)
      const instagram = this.formatSocial(this.state.instagram)
      const snapchat = this.formatSocial(this.state.snapchat)
      const github = this.formatSocial(this.state.github)
      const updatedSocials = {facebook, twitter, instagram, snapchat, github}

      await timedPromise(
        database().ref(`/userSnippetExtras/${auth().currentUser.uid}`).update(updatedSocials),
        MEDIUM_TIMEOUT
      )
      Snackbar.show({text: 'Social update change successful', duration: Snackbar.LENGTH_SHORT});
    }catch(err){
      if (err.code == "timeout"){
        this.setState({socialsError: "Timeout! Try again"})
      }else{
        this.setState({socialsError: "Something went wrong."})
        logError(err)        
      }
    }
    this.setState({updatingSocials: false})
  }
}
  