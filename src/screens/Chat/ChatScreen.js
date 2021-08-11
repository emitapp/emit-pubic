import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Bubble, GiftedChat, Message, utils } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import EmptyState from 'reusables/ui/EmptyState';
import Header from 'reusables/Header';
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';
import { logError } from 'utils/helpers';
import Day from "./Day";
import Name from './Name';
import { isSameTime } from './utils';
import FriendReqModal from 'reusables/FriendReqModal';
import { Pressable } from 'react-native';
import { analyticsChatMessageSent } from 'utils/analyticsFunctions';


//The main entry point into the gifted-chat app
export default class ChatScreen extends React.Component {

  static navigationOptions = Header("Chat")

  constructor(props) {
    super(props);
    this.broadcastData = this.props.navigation.getParam('broadcast', { uid: " ", owner: { uid: "xxx" } })
    this.isPublicFlare = this.props.navigation.getParam('isPublicFlare', false)
    this.ownerID = this.broadcastData.owner.uid
    this.chatrefPath =
      this.isPublicFlare ?
        `/publicFlareChats/${this.broadcastData.uid}` :
        `/activeBroadcasts/${this.ownerID}/chats/${this.broadcastData.uid}`


    this.paginationSize = 20
    this.state = {
      loadedUsername: null,
      messages: [],
      lastRetrievedMessageId: 0,
      friendRequestModal: null
    }

    //Manually redefining to allow better fine-tuned time chunking of messages
    utils.isSameDay = isSameTime
  }

  componentDidMount() {
    database().ref(`/userSnippets/${auth().currentUser.uid}/`).once("value")
      .then(snap => this.setState({ loadedUsername: snap.val().displayName }))
      .catch(err => logError(err))

    this.loadInitMessages();
  }

  componentWillUnmount() {
    database().ref(this.chatrefPath).off()
  }


  //TODO: Add in more features like replying to chats, liking/disliking, etc
  render() {
    if (!this.state.loadedUsername) return (<SmallLoadingComponent />)

    return (
      <View style={{ flex: 1 }}>

        <FriendReqModal
          ref={modal => this.friendRequestModal = modal} />

        <GiftedChat
          user={{
            _id: auth().currentUser.uid,
            name: this.state.loadedUsername
          }}
          renderMessage={this.renderMessage}
          messages={this.state.messages}
          onSend={messages => this.sendNewMessages(messages)}
          renderBubble={this.renderBubble}
          renderTime={() => null} //We'll handle the time ourselves...
          renderAvatar={(props) => this.renderAvatar(props, this)}
          infiniteScroll
          loadEarlier
          onLoadEarlier={this.onLoadEarlier}
          renderChatEmpty={this.renderEmptyState}
          renderLoadEarlier={() => null}   //to hide the load earlier button
          renderDay={this.renderDay}
          //bottomOffset={50}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    )
  }

  // Loads the first X messages when the user goes into the chat
  async loadInitMessages() {
    database().ref(this.chatrefPath).limitToLast(this.paginationSize)
      .on('child_added', (snap) => {
        const msg = this.fireToMessage(snap.val())
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, [msg]),
        }))
        if (!this.state.lastRetrievedMessageId) this.state.lastRetrievedMessageId = msg._id
      });
  }

  //method triggered when user clicks send button in the chat
  sendNewMessages = (messages = []) => {
    const formattedMessage = this.messageToFire(messages[0])
    this.sendToFirebase(formattedMessage)
  }

  // this is for testing lots of messages, it should stay commented
  // sentTestMessages = () => {   
  //   for (let i = 0; i < 10; i++) {
  //     let testMessage = {
  //       text: "this is a test " + i.toString(),
  //       user: { id: '200', name: 'swifty jjones' },
  //     }
  //     testMessage = messagesToFire(msg)
  //     this.sendToFirebase(testMessage)
  //   }
  // }

  //Expects the output to be from messageToFire
  sendToFirebase = (message) => {
    const path = this.chatrefPath + "/" + message._id;
    database().ref(path).set(message)
    .then(() => analyticsChatMessageSent(auth().currentUser.uid, this.broadcastData))
    .catch(err => logError(err));
  }

  //method to convert UI message to firebase object to be stored
  messageToFire(message) {
    const msg = {
      user: { name: null, id: null },
      text: null,
      date: null,
      image: null,
      video: null,
      id: null
    }
    msg.user = { name: message.user.name, _id: message.user._id }
    msg.text = message.text
    msg._id = database().ref(this.chatrefPath).push().key
    msg.createdAt = database.ServerValue.TIMESTAMP
    return msg
  }

  //method to convert firebase object to UI-facing chat message
  fireToMessage(data) {
    const msg = {}
    msg._id = data._id;
    msg.text = data.text;
    msg.createdAt = new Date(data.createdAt);
    msg.user = data.user
    msg.system = data.system
    return msg
  }

  //for pagination
  onLoadEarlier = async () => {
    let self = this
    let newMessages = new Array();
    try {
      const messagesSnapshot = await database().ref(this.chatrefPath).orderByKey()
        .endAt(this.state.lastRetrievedMessageId)
        .limitToLast(this.paginationSize)
        .once('value');

      messagesSnapshot.forEach(data => {
        const msg = self.fireToMessage(data.val());
        //EndAt is inclusive so we have to remove the dubplicated boundary message
        if (msg._id == this.state.lastRetrievedMessageId) return;
        newMessages.unshift(msg)
      })

      if (newMessages.length != 0) {
        this.setState(previousState => ({
          lastRetrievedMessageId: newMessages[newMessages.length - 1]._id,
          messages: GiftedChat.append(newMessages, previousState.messages),
        }))
      }
    } catch (err) {
      logError(err)
    }
  }

  renderName(props) {
    {
      if (!utils.isSameUser(props.currentMessage, props.previousMessage)) {
        return <Name {...props} />;
      }
    }
  }

  renderAvatar(props, parentContext) {
    return (
      <Pressable onPress={() => parentContext.friendRequestModal.openUsingUid(props.currentMessage.user._id)}>
        <ProfilePicDisplayer
          diameter={35}
          uid={props.currentMessage.user._id}
          style={{ marginTop: -3 }}
        />
      </Pressable>

    )
  }

  renderBubble = (props) => {
    return (
      <View>
        {this.renderName(props)}
        <Bubble
          {...props}
          wrapperStyle={{ right: { backgroundColor: '#FA6C13' } }}
        />
      </View>
    );
  }

  //We slightly edit the margins of the message container if we're rendering an
  //avatar so that we can offset some ugly spacing...
  //got to this method by looking into module code and determining when an avatar is rendered
  renderMessage = (props) => {
    const {
      renderAvatarOnTop,
      showAvatarForEveryMessage,
      currentMessage,
      previousMessage,
      nextMessage,
    } = props
    const messageToCompare = renderAvatarOnTop ? previousMessage : nextMessage

    if (
      !showAvatarForEveryMessage &&
      currentMessage &&
      messageToCompare &&
      utils.isSameUser(currentMessage, messageToCompare) &&
      utils.isSameDay(currentMessage, messageToCompare)
    ) {
      return <Message {...props} isSameDay />
    }

    return (
      <Message {...props} containerStyle={{
        left: { marginTop: -5 },
      }} />
    )
  }

  renderDay = (props) => {
    return (<Day {...props} />)
  }

  renderEmptyState = () => {
    return (
      <EmptyState
        style={{ flex: 1, transform: [{ scaleY: -1 }] }}
        image={
          <Icon name={"bubbles"} size={50} color={"grey"} />
        }
        title="Looks pretty quiet here"
        message="Use can use this chat room to speak with other people who have responded to this flare."
      />
    )
  }
}