import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { TouchableOpacity, View, Image } from 'react-native';
import { BannerButton } from 'reusables/ReusableButtons';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import S from 'styling';
import { epochToDateString } from 'utils/helpers';
import EmptyState from 'reusables/EmptyState'
import {Badge, Text} from 'react-native-elements'
import CountdownComponent from 'reusables/CountdownComponent'
import ErrorMessageText from 'reusables/ErrorMessageText';
import Icon from 'react-native-vector-icons/FontAwesome'

export default class ActiveBroadcasts extends React.Component {

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

          <ErrorMessageText message = {this.state.errorMessage} />

          <DynamicInfiniteScroll
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`)}
            emptyStateComponent = {
              <EmptyState 
                image =  {
                  <Image source={require('media/NoActiveBroadcasts.png')} 
                  style = {{height: 100, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                title = "Pretty chill day, huh?" 
                message = "You haven't made any broadcasts yet." 
              />
            }
          />

          <BannerButton
            onPress={() => this.props.navigation.navigate('NewBroadcastForm', {needUserConfirmation: true})}
            iconName = {S.strings.add}
            title = "CREATE NEW BROADCAST"
          />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {S.styles.listElement}
        onPress = {() => this.props.navigation.navigate("ResponsesScreen", {broadcast: item})}>
        <View style={{flexDirection:"column", flex: 1}}>
          <Text style = {{fontSize: 18, fontWeight: "bold"}}>{item.location}</Text>
          <Text>{epochToDateString(item.deathTimestamp)}</Text>
          <CountdownComponent
            deadLine = {item.deathTimestamp} 
            renderer = {this.timeLeftRenderer}
          />
          <Text style = {{marginTop: 8}}>{item.totalConfirmations} confirmations</Text>
        </View>
       
       {item.locked && <Icon name="lock" color="grey" size={24} style = {{marginHorizontal: 8}}/>}
       {item.pendingResponses != 0 && <Badge value={item.pendingResponses} status="error"/>}
      </TouchableOpacity>
    );
  }

  timeLeftRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hours, ` : ""
    string += time.m ? `${time.m} minutes, ` : ""
    string += time.s ? `${time.s} seconds` : ""
    return(
      <View>
        <Text>
          {string}
        </Text>
      </View>
    );
  }
}