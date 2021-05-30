
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View } from 'react-native';
import { ButtonGroup, CheckBox, Divider, Text } from 'react-native-elements';
import CollapsibleView from 'reusables/CollapsibleView';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserGroupListElement, UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal, SmallLoadingComponent } from 'reusables/LoadingComponents';
import { BannerButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from "styling";
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses } from 'utils/serverValues';

export default class NotificationSettings extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Notification Settings",    
    };
  };

  constructor(props) {
    super(props);

    this.unsubscribeFunction = null

    this.FRIENDS_INDEX = 0
    this.GROUPS_INDEX = 1

    this.state = { 
      boxIndex: this.FRIENDS_INDEX,
      errorMessage: null,
      isModalVisible: false,
      onBroadcastFrom: [],
      dataRetrieved: false, 
      onNewBroadcastResponse: true,
      onNewFriend: true,
      onNewFriendRequest: true,
      onAddedToGroup: true,
      onChat: true,
    }

    this.firstCollapsableView = null;
    this.secondCollapsableView = null;
  }

  componentDidMount(){
    this.unsubscribeFunction = firestore()
    .collection('fcmData').doc(auth().currentUser.uid)
    .onSnapshot(this.onDataRetrieved, this.onDataRetrievalError);
  }

  componentWillUnmount(){
    if (this.unsubscribeFunction) this.unsubscribeFunction()
  }
  

  render() {
    const userUid = auth().currentUser.uid
    if (!this.state.dataRetrieved){
      return(
        <View style = {S.styles.container}>
          <ErrorMessageText message = {this.state.errorMessage} />
          <SmallLoadingComponent />
        </View>
      )
    }
    return (
      <View style = {{...S.styles.containerFlexStart}}>
        <View style = {{flex: 1, marginHorizontal: 8}}>
          <DefaultLoadingModal isVisible={this.state.isModalVisible} />
          <ErrorMessageText message = {this.state.errorMessage} />
          <Text style = {{marginHorizontal: 8, marginBottom: 8}}>
            These settings are synced across all devices that are logged into your account.
          </Text>

          <CollapsibleView 
            style = {{ marginHorizontal: 8}}
            title = "Get push notifications when..."
            ref = {r => this.firstCollapsableView = r}
            onOpen = {() => this.secondCollapsableView.close()}>
            <CheckBox
              title='You get a new friend request'
              fontFamily = "NunitoSans-Regular"
              textStyle = {{fontSize: 16}}
              checked = {this.state.onNewFriendRequest}
              containerStyle = {{alignSelf: "flex-start", marginLeft: 24, padding: 0, marginBottom: 16}}
              onIconPress = {() => this.setState({onNewFriendRequest: !this.state.onNewFriendRequest})}
            />
            <CheckBox
              title='You get a new friend'
              fontFamily = "NunitoSans-Regular"
              textStyle = {{fontSize: 16}}
              checked = {this.state.onNewFriend}
              containerStyle = {{alignSelf: "flex-start", marginLeft: 24, padding: 0, marginBottom: 16}}
              onIconPress = {() => this.setState({onNewFriend: !this.state.onNewFriend})}
            />
            <CheckBox
              title='You get added to a group'
              fontFamily = "NunitoSans-Regular"
              textStyle = {{fontSize: 16}}
              checked = {this.state.onAddedToGroup}
              containerStyle = {{alignSelf: "flex-start", marginLeft: 24, padding: 0, marginBottom: 16}}
              onIconPress = {() => this.setState({onAddedToGroup: !this.state.onAddedToGroup})}
            />
            <CheckBox
              title={`Someone responds to one of your ${`\n`} flares`}
              fontFamily = "NunitoSans-Regular"
              textStyle = {{fontSize: 16}}
              checked = {this.state.onNewBroadcastResponse}
              containerStyle = {{alignSelf: "flex-start", marginLeft: 24, padding: 0, marginBottom: 16}}
              onIconPress = {() => this.setState({onNewBroadcastResponse: !this.state.onNewBroadcastResponse})}
            />
            <CheckBox
              title={`When you get a chat message`}
              fontFamily = "NunitoSans-Regular"
              textStyle = {{fontSize: 16}}
              checked = {this.state.onChat}
              containerStyle = {{alignSelf: "flex-start", marginLeft: 24, padding: 0, marginBottom: 16}}
              onIconPress = {() => this.setState({onChat: !this.state.onChat})}
            />
          </CollapsibleView>

          <View><Divider style = {{marginBottom: 8}}/></View>

          <CollapsibleView 
            style = {{ marginHorizontal: 8}}
            title = "Get push notifications if you get flares from..."
            flexOnExpand
            ref = {r => this.secondCollapsableView = r}
            onOpen = {() => this.firstCollapsableView.close()}>

            <Text style = {{marginHorizontal: 8, textAlign: "center"}}>
              ({this.state.onBroadcastFrom.length} sources selected)
            </Text>

            <ButtonGroup
              containerStyle = {{marginTop: 8}}
              onPress={this.toggleBox}
              selectedIndex={this.state.boxIndex}
              buttons={["Friends", "Groups"]}
            />
            {this.state.boxIndex == this.FRIENDS_INDEX ? (
              <SearchableInfiniteScroll
                type = "static"
                key = "friends"
                queryValidator = {(query) => true}
                queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
                renderItem = {this.userSnippetRenderer}
                dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
              />         
            ):(
              <SearchableInfiniteScroll
                type = "dynamic"
                key = "groups"
                queryValidator = {(query) => true}
                queryTypes = {[{name: "Name", value: "name"}]}
                renderItem = {this.groupSnippetRenderer}
                dbref = {database().ref(`/userGroupMemberships/${userUid}`)}
              />
            )}
          </CollapsibleView>
        </View>
        <BannerButton
            onPress={this.saveSettings}
            title="CONFIRM CHANGES"
            iconName = {S.strings.confirm}
        />
      </View>
    )
  }

  onDataRetrieved = (docSnapshot) => {
    if (!docSnapshot.exists){
      this.setState({errorMessage: "Your notification data doesn't exists on our servers", dataRetrieved: false})
    }else{
      const data = docSnapshot.data();
      this.setState({
        errorMessage: null, 
        dataRetrieved: true,
        onBroadcastFrom: data.notificationPrefs.onBroadcastFrom,
        onNewBroadcastResponse: data.notificationPrefs.onNewBroadcastResponse,
        onNewFriend: data.notificationPrefs.onNewFriend,
        onNewFriendRequest: data.notificationPrefs.onNewFriendRequest,
        onAddedToGroup: data.notificationPrefs.onAddedToGroup,
        onChat: data.notificationPrefs.onChat     
      })
    }
  }

  onDataRetrievalError = (error) => {
    this.setState({errorMessage: error.message, dataRetrieved: false})
    logError(error)
  }

  saveSettings = async () => {
    this.setState({isModalVisible: true})
    try{
      const {
        onBroadcastFrom, onNewBroadcastResponse, onNewFriend,
        onNewFriendRequest, onAddedToGroup, onChat
      } = this.state
      const saveFunction = functions().httpsCallable('updateNotificationPrefs');
      const response = await timedPromise(saveFunction({
        onBroadcastFrom, onNewFriend, onNewFriendRequest, onNewBroadcastResponse, onAddedToGroup,
        onChat
      }), LONG_TIMEOUT);

      if (response.data.status !== cloudFunctionStatuses.OK){
          this.setState({errorMessage: response.data.message})
          logError(new Error("Problematic updateNotificationPrefs function response: " + response.data.message))
      }
    }catch(err){
      if (err.name != "timeout") logError(err)  
      this.setState({errorMessage: err.message})
    }
    this.setState({isModalVisible: false, responseStatusDeltas: {}})
  }

  userSnippetRenderer = ({ item }) => {
    return (
      <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
        <UserSnippetListElement 
          style = {{flex: 1}}
          snippet={item} 
          onPress={() => this.toggleSelection(item.uid)}
          imageDiameter = {30}
        />
        {this.state.onBroadcastFrom.includes(item.uid) && <CheckBox checked = {true} /> }
      </View>
    );
  }

  groupSnippetRenderer = ({ item }) => {
    return (
      <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
        <UserGroupListElement 
          style = {{flex: 1}}
          groupInfo={item} 
          onPress={() => this.toggleSelection(item.uid)}
        />
        {this.state.onBroadcastFrom.includes(item.uid) && <CheckBox checked = {true} /> }
      </View>
    );
  }

  toggleBox = (selectedIndex) => {
    if (this.state.boxIndex != selectedIndex){
        this.setState({boxIndex: selectedIndex})
    }
  }

  toggleSelection = (uid) => {
    const copiedArr = [...this.state.onBroadcastFrom]
    const index = copiedArr.indexOf(uid);
    if (index != -1) {
      copiedArr.splice(index, 1);
    }else{
      copiedArr.push(uid)
    }
    this.setState({onBroadcastFrom: copiedArr});
  }
}