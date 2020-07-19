import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Image} from 'react-native';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import S from 'styling';
import {Text} from 'react-native-elements'
import { epochToDateString } from 'utils/helpers';
import EmptyState from 'reusables/EmptyState'
import CountdownComponent from 'reusables/CountdownComponent'
import { responderStatuses } from 'utils/serverValues';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorMessageText from 'reusables/ErrorMessageText';

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
                title = "It's pretty quiet here" 
                message = "You have no broadcasts in your feed right now." 
              />
            }
          />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {{marginVertical: 8, marginLeft: 8}}
        onPress = {() => this.props.navigation.navigate('BroadcastViewer', {broadcast: item}) }>
          <View style = {{flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 8}}>
            <ProfilePicDisplayer diameter = {48} uid = {item.owner.uid} style = {{marginRight: 10}} />
            <View>
              <Text style = {{fontSize: 18, fontFamily: "NunitoSans-Semibold"}}>
                {item.owner.displayName}
              </Text>
              <Text style = {{color: "dimgrey"}}>@{item.owner.username}</Text>
            </View>
            <CountdownComponent deadLine = {item.deathTimestamp}  renderer = {this.timeLeftRenderer} />
          </View>
          <Text style = {{fontSize: 16, fontFamily: "NunitoSans-Semibold"}}>{item.location}</Text>
          <Text>Will be there at: {epochToDateString(item.deathTimestamp)}</Text>
          {item.groupInfo &&  <Text style = {{fontStyle: "italic"}}>Sent via {item.groupInfo.name} group</Text>}

          {item.note != undefined && item.note != "" &&
            <Text style = {{fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8}}>{item.note}</Text>
          }

          {this.displayStatus(item)}
      </TouchableOpacity>
    );
  }

  timeLeftRenderer = (time) => {
    let string = ""
    let subtitle = ""
    if (time.h){
      subtitle = "hours"
      if (time.m > 30) string = `${time.h}+`
      else string = `${time.h}`
      string = time.h
    }else if (time.m){
      if (time.s > 30) string = `${time.m}+`
      else string = `${time.m}`
      subtitle = "mins"
    }else{
      subtitle = "mins"
      string = "<1"
    }
    return(
    <View style = {{marginLeft: "auto"}}>
      <Text style = {{textAlign: "center", fontSize: 20}}>{string}</Text>
      <Text style = {{textAlign: "center", fontSize: 16}}>{subtitle}</Text>
    </View>      
    );
  }

  displayStatus = (item) => {
    if (!item.status) return
    if (item.status == responderStatuses.PENDING){
      return (
        <View style={{...styles.statusParentStyle, backgroundColor: "dimgrey"}}>
          <MaterialIcons name = "access-time" size = {20} color = "white" />
          <Text style = {{color: "white", fontWeight: "bold"}}> {item.status}</Text>
        </View>
      )
    }else{
      return(
        <View style={{...styles.statusParentStyle, backgroundColor: "green"}}>
          <MaterialCommunityIcons name = "check-bold" size = {20} color = "white" />
          <Text style = {{color: "white", fontWeight: "bold"}}> {item.status}</Text>
        </View>
      )
    }  
  }
}


const styles = StyleSheet.create({
  statusParentStyle: {
    flexDirection: "row", 
    alignItems: "center", 
    alignSelf: "flex-start", 
    padding: 6, 
    borderRadius: 4,
    marginTop: 4
  }
})