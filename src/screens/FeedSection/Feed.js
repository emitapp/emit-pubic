import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, View } from 'react-native';
import { Button } from 'react-native-elements';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import SectionInfiniteScroll from 'reusables/SectionInfiniteScroll';
import S from 'styling';
import { responderStatuses } from 'utils/serverValues';
import EmittedFlareElement from './EmittedFlareElement';
import FeedElement from './FeedElement';
export default class ActiveBroadcasts extends React.Component {

  constructor(props) {
    super(props)
    this.emittedTitle = "HOSTING"
    this.joinedTitle = "JOINED"
    this.upcomingTitle = "FEED"
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
            { ref: database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`), title: this.emittedTitle, orderBy: this.orderBy },
            { ref: database().ref(`/feeds/${auth().currentUser.uid}`), title: this.upcomingTitle, orderBy: this.orderBy, filter: item => item.status != responderStatuses.CONFIRMED },
            { ref: database().ref(`/feeds/${auth().currentUser.uid}`), title: this.joinedTitle, orderBy: this.orderBy },
          ]}
          startingPoint={[null, "confirmed", null]}
          endingPoint={[null, "confirmed", null]}
          emptyStateComponent={this.renderEmptyState()}
        />
      </View>
    )
  }

  itemRenderer = ({ item, section: { title } }) => {
    if (title == this.emittedTitle) {
      return (<EmittedFlareElement item={item} />)
    } else {
      return (<FeedElement item={item} />)
    }
  }

  renderEmptyState = () => {
    return (
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
          title="Add friends"
          onPress={() => this.props.navigation.navigate('UserFriendSearch')}
          buttonStyle={{ borderWidth: 2, width: 150, height: 36, marginTop: 22 }}
          titleStyle={{ fontSize: 13 }} />
      </EmptyState>
    )
  }
}
