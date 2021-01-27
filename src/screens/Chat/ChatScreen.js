import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import Message from './Message';
import {logError} from 'utils/helpers'
import Header from 'reusables/Header'

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
      messages: [],
      lastRetrievedDate: 0,
    }
  }

  componentDidMount() {
    this.loadInitMessages();
  }

  // Loads the first X messages when the user goes into the chat
  async loadInitMessages() {
    database().ref(this.chatrefPath).limitToLast(this.paginationSize)
      .on('child_added', (el) => {
        const data = el.val();
        const msg = this.fireToMessage(data)
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, [msg]),
        }))
        if (this.state.lastRetrievedDate == 0) {
          this.state.lastRetrievedDate = msg._id
        }

      });
  }

  //I think this removes listeners? 
  componentWillUnmount() {
    database().ref(this.chatrefPath).off()
  }

  //method triggered when user clicks send button in the chat
  async onSend(messages = []) {
    // this is for testing lots of messages, it should stay commented
    // // // let msgs = new Array(10)
    // // // for (let i = 0; i < 10; i++) {
    // // //   const d = (new Date()).getTime()
    // // //   msgs[i] = (this.makeTestMessage(i));
    // // //   msgs[i].id = d
    // // //   const messagePath = this.chatrefPath + '/' + d
    // // //   const dbRef = database().ref(messagePath)
    // // //   await dbRef.set(msgs[i]).then(() => console.log('Message sent'));
    // // // }
    messages[0]._id = messages[0].createdAt.getTime()

    //TODO: consider using firebase.push()?
    //TODO: get the name of the person and change their name to that when they send
    const fireMessage = this.messageToFire(messages[0])
    const messagePath = this.chatrefPath + '/' + fireMessage.id
    const dbRef = database().ref(messagePath)
    dbRef.set(fireMessage).then(() => console.log('Message sent')).catch(err => logError(err));
  }

  //makes test messages (needed for testing pagination and such)
  makeTestMessage(num) {
    const msg = {
      id: num,
      text: "this is a test " + String(num),
      user: { id: '200', name: 'swifty jjones' }
    }
    return msg
  }

  //method to convert UI message to firebase message
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

  //method to convert firebase message to UI
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

  //TODO: some props to investigate:
  //renderAvatar, renderMessage, renderChatEmpty
  //cleaner bubble styling (that doesn't require dubplicating everything. 
  //Examples: FaridSafi/react-native-gifted-chat#672)
  render() {
    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={messages => this.onSend(messages)}
        renderMessage={this.renderMessage}
        user={{
          _id: auth().currentUser.uid,
          name: auth().currentUser.uid
        }}
        data={this.state}
        infiniteScroll
        loadEarlier
        onLoadEarlier={this.onLoadEarlier}
        renderLoadEarlier={this.renderLoadEarlier}
      />
    )
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
  //to hide the load earlier button
  renderLoadEarlier = () => {
    return (null)
  }

  //render the message
  renderMessage = props => {
    return (
      <Message {...props} />
    )
  }

}