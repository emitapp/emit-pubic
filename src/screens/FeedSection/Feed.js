import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, View } from 'react-native';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import S from 'styling';
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
            
            dbref = {database().ref(`/feeds/${auth().currentUser.uid}`)}
            emptyStateComponent = {
              <EmptyState 
                image =  { 
                  <Image source={require('media/EmptyFeed.png')} 
                  style = {{height: 80, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                title = "It's pretty quiet here." 
                message = "Flares from your friends and groups show up here" 
              />
            }
          />
      </View>
    )
  }

  itemRenderer = ({item}) => {
    //Don't show flares you've responded to 
    //TODO: Improve this later for flares you entered and later left
    if (item.status) return null; 
    return (
     <FeedElement
       navigation={this.props.navigation}
       item={item}/>
    );
  }
}
