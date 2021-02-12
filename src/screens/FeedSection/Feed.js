import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, View } from 'react-native';
import { Button } from 'react-native-elements';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import S from 'styling';
import { responderStatuses } from 'utils/serverValues';
import FeedElement from "./FeedElement";
export default class Feed extends React.Component {

  state = {
    errorMessage: null,
  }

  render() {
    return (
      <View style={S.styles.container}>
          <ErrorMessageText message = {this.state.errorMessage} />
          <DynamicInfiniteScroll
            renderItem = {this.itemRenderer}
            generation = {0}
            filter = {item => item.status != responderStatuses.CONFIRMED}
            dbref = {database().ref(`/feeds/${auth().currentUser.uid}`)}
            emptyStateComponent = {
              <EmptyState 
                image =  { 
                  <Image source={require('media/NoFriendReqs.png')} 
                  style = {{height: 80, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                title = "Want to see more flares?" 
                message = "Flares your friends & groups send will show up here!" 
              >
                <Button
                title="Add friends"
                onPress={() => this.props.navigation.navigate('SocialButtonHub')}
                buttonStyle={{ borderWidth: 2, width: 150, height: 36, marginTop: 22 }}
                titleStyle={{ fontSize: 13 }} />
              </EmptyState>
            }
            
          />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <FeedElement
        navigation={this.props.navigation}
        item={item} />
    );
  }
}
