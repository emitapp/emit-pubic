import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import CountdownComponent from 'reusables/CountdownComponent';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import SectionInfiniteScroll from 'reusables/SectionInfiniteScroll';
import S from 'styling';
import { epochToDateString } from 'utils/helpers';
import FeedElement from '../FeedSection/FeedElement'

export default class ActiveBroadcasts extends React.Component {

  state = {
    errorMessage: null,
  }
  firstSectionTitle = "My Flares"
  secondSectionTitle = "Flares I'm into"

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <ErrorMessageText message={this.state.errorMessage} />

        <SectionInfiniteScroll
          renderItem={this.itemRenderer}
          generation={0}
          dbref={[
            { ref: database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`), title: this.firstSectionTitle },
            { ref: database().ref(`/feeds/${auth().currentUser.uid}`), title: this.secondSectionTitle }
          ]}
          orderBy={[{ value: "deathTimestamp" }, { value: "status" }]}
          startingPoint = {[null, "confirmed"]}
          endingPoint = {[null, "confirmed"]}
          emptyStateComponent={
            <EmptyState
              image={
                <Image source={require('media/NoActiveBroadcasts.png')}
                  style={{ height: 100, marginBottom: 8 }}
                  resizeMode='contain' />
              }
              title="Pretty chill day, huh?"
              message="Flares you've made or are into will apprear here"
            />
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
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.location}</Text>
            <Text>{epochToDateString(item.deathTimestamp)}</Text>
            <CountdownComponent
              deadLine={item.deathTimestamp}
              renderer={this.timeLeftRenderer}
            />
            <Text style={{ marginTop: 8 }}>{item.totalConfirmations} confirmations</Text>
          </View>

          {item.locked && <Icon name="lock" color="grey" size={24} style={{ marginHorizontal: 8 }} />}
        </TouchableOpacity>
      );
    } else {
      return (
        <FeedElement
          navigation={this.props.navigation}
          item={item} />
      )
    }
  }

  timeLeftRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hours, ` : ""
    string += time.m ? `${time.m} minutes, ` : ""
    string += time.s ? `${time.s} seconds` : ""
    return (
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }
}