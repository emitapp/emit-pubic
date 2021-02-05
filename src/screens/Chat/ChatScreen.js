import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import { Bubble, GiftedChat, Message, utils } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import EmptyState from 'reusables/EmptyState';
import Header from 'reusables/Header';
import { SmallLoadingComponent } from 'reusables/LoadingComponents';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import { logError } from 'utils/helpers';
import Day from "./Day";
import Name from './Name';
import { isSameTime } from './utils';


//The main entry point into the gifted-chat app
export default class ChatScreen extends React.Component {

  static navigationOptions = Header("Chat")

  constructor(props) {
    super(props);
    this.broadcastData = this.props.navigation.getParam('broadcast', { uid: " " })
    this.ownerID = auth().currentUser.uid
    if (this.broadcastData.owner) {
      this.ownerID = this.broadcastData.owner.uid
    }
    this.chatrefPath = `/activeBroadcasts/${this.ownerID}/chats/${this.broadcastData.uid}`

    this.paginationSize = 20
    this.state = {
      loadedUsername: null,
      messages: [],
      lastRetrievedDate: 0,
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

  //I think this removes listeners? 
  componentWillUnmount() {
    database().ref(this.chatrefPath).off()
  }


  //TODO: Add in more features like replying to chats, liking/disliking, etc
  render() {
    if (!this.state.loadedUsername) return (<SmallLoadingComponent />)

    return (
      <GiftedChat
        user={{
          _id: auth().currentUser.uid,
          name: this.state.loadedUsername
        }}
        renderMessage={this.renderMessage}
        messages={this.state.messages}
        onSend={messages => this.onSend(messages)}
        renderBubble={this.renderBubble}
        renderTime={() => null} //We'll handle the time ourselves...
        renderAvatar={this.renderAvatar}
        infiniteScroll
        loadEarlier
        onLoadEarlier={this.onLoadEarlier}
        renderChatEmpty={this.renderEmptyState}
        renderLoadEarlier={() => null}   //to hide the load earlier button
        renderDay={this.renderDay}
      />
    )
  }

  // Loads the first X messages when the user goes into the chat
  async loadInitMessages() {
    database().ref(this.chatrefPath).limitToLast(this.paginationSize)
      .on('child_added', (snap) => {
        const data = snap.val();
        const msg = this.fireToMessage(data)
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, [msg]),
        }))
        if (this.state.lastRetrievedDate == 0) {
          this.state.lastRetrievedDate = msg._id
        }

      });
  }

  //method triggered when user clicks send button in the chat
  async onSend(messages = []) {
    // this is for testing lots of messages, it should stay commented
    // let msgs = new Array(10)
    // for (let i = 0; i < 10; i++) {
    //   const d = (new Date()).getTime()
    //   msgs[i] = (this.makeTestMessage(i));
    //   msgs[i].id = d
    //   const messagePath = this.chatrefPath + '/' + d
    //   const dbRef = database().ref(messagePath)
    //   await dbRef.set(msgs[i]).then(() => console.log('Message sent'));
    // }
    messages[0]._id = messages[0].createdAt.getTime()

    //TODO: consider using firebase.push()?
    //TODO: get the name of the person and change their name to that when they send
    const fireMessage = this.messageToFire(messages[0])
    const messagePath = this.chatrefPath + '/' + fireMessage.id
    const dbRef = database().ref(messagePath)
    dbRef.set(fireMessage).catch(err => logError(err));
  }

  //makes test messages (used for testing pagination and such)
  makeTestMessage(num) {
    const msg = {
      id: num,
      text: "this is a test " + String(num),
      user: { id: '200', name: 'swifty jjones' }
    }
    return msg
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
    msg.user = { name: message.user.name, id: message.user._id }
    msg.text = message.text
    msg.id = message._id
    return msg
  }

  //method to convert firebase object to UI-facing chat message
  fireToMessage(data) {
    const msg = {
      _id: null,
      text: null,
      createdAt: null,
      user: { _id: null, name: null }
    }
    msg._id = data.id;
    msg.text = data.text;
    msg.createdAt = new Date(data.id);
    msg.user = { _id: data.user.id, name: data.user.name }
    return msg
  }

  //for pagination
  onLoadEarlier = async () => {
    let self = this

    let msgs = new Array();
    await database().ref(this.chatrefPath).orderByKey()
      .endAt(String(this.state.lastRetrievedDate - 1)).limitToLast(this.paginationSize)
      .once('value').then(snapshot => {
        snapshot.forEach(function (data) {
          if (data) {
            const msg = self.fireToMessage(data.val());
            msgs.unshift(msg)
          }
        })
        if (msgs.length != 0) {
          this.state.lastRetrievedDate = msgs[msgs.length - 1].createdAt - 1
          this.setState(previousState => ({
            messages: GiftedChat.append(msgs, previousState.messages),
          }))
        }
      });

  }

  renderName(props) {
    {
      if (!utils.isSameUser(props.currentMessage, props.previousMessage)) {
        return <Name {...props} />;
      }
    }
  }

  renderAvatar(props) {
    return (
      <ProfilePicDisplayer
        diameter={35}
        uid={props.currentMessage.user._id}
        style={{ marginTop: -3 }}
      />
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