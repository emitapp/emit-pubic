import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, Pressable, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicon from 'react-native-vector-icons/Ionicons';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import FlareTimeStatus from 'reusables/FlareTimeStatus';
import SectionInfiniteScroll from 'reusables/SectionInfiniteScroll';
import S from 'styling';
import FeedElement from '../FeedSection/FeedElement';


export default class ActiveBroadcasts extends React.Component {

  constructor(props) {
    super(props)
    this.firstSectionTitle = "EMITTED"
    this.secondSectionTitle = "JOINED"
    this.generation = 0;
    this.orderBy = ["deathTimestamp", "status"]
    this.state = {
      rerender: 0,
      errorMessage: null,
    }
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <ErrorMessageText message={this.state.errorMessage} />

        <SectionInfiniteScroll
          renderItem={this.itemRenderer}
          generation={this.state.rerender}
          dbref={[
            { ref: database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`), title: this.firstSectionTitle, orderBy: this.orderBy },
            { ref: database().ref(`/feeds/${auth().currentUser.uid}`), title: this.secondSectionTitle, orderBy: this.orderBy }
          ]}
          startingPoint={[null, "confirmed"]}
          endingPoint={[null, "confirmed"]}
          emptyStateComponent={
            <EmptyState
              image={
                <Image source={require('media/NoActiveBroadcasts.png')}
                  style={{ height: 100, marginBottom: 8 }}
                  resizeMode='contain' />
              }
              title="Pretty chill day, huh?"
              message="Flares you make and join will appear here"
            >
              <Button
                title="Emit New Flare"
                onPress={() => this.props.navigation.navigate('NewBroadcastForm', { needUserConfirmation: false })}
                buttonStyle={{ borderWidth: 2, width: 150, height: 36, marginTop: 22 }}
                titleStyle={{ fontSize: 13 }} />
            </EmptyState>
          }
        />
      </View>
    )
  }

  itemRenderer = ({ item, section: { title } }) => {
    if (title == this.firstSectionTitle) {
      return (
        <TouchableOpacity
          style={S.styles.listElement}
          onPress={() => this.props.navigation.navigate("ResponsesScreen", { broadcast: item })}>
          <View style={{ flexDirection: "column", flex: 1 }}>

            <View style={{ flexDirection: "row" }}>
              <View style={{ flexDirection: "row", flex: 1 }}>
                <Text style={{ fontSize: 50, marginHorizontal: 8 }}>{item.emoji}</Text>
                <View style={{ justifyContent: "center" }}>
                  <Text style={{ fontSize: 20 }}>{item.activity}</Text>
                  {item.totalConfirmations != 0 ?
                    <Text style={{ fontSize: 18 }}>{item.totalConfirmations} people are in</Text> :
                    <Text style={{ fontSize: 18 }}>No responders yet</Text>
                  }
                </View>
              </View>

              <View>
                <FlareTimeStatus item={item} />
                <Pressable onPress={() => this.props.navigation.navigate("ChatScreen", { broadcast: item })}>
                  <Ionicon name="md-chatbubbles" color="grey" size={40} style={{ marginHorizontal: 8 }} />
                </Pressable>
              </View>

            </View>
          </View>

          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.location}</Text>
          {item.locked && <Icon name="lock" color="grey" size={24} style={{ marginHorizontal: 8 }} />}
        </TouchableOpacity>
      );
    } else {
      return (
        <FeedElement
          navigation={this.props.navigation}
          item={item}
          // Triggers a rerender by incrementing generation
          // TODO: Switch this to redux eventually
          rerenderCallback={() => this.setState({ rerender: this.state.rerender + 1 })} />
      )
    }
  }
}
