import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import S from 'styling';
import { epochToDateString, logError } from 'utils/helpers';

export default class ActiveBroadcasts extends React.Component {

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

          <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
            chunkSize = {10}
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`)}
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
          />

          <BannerButton
            color = {S.colors.buttonGreen}
            onPress={() => this.props.navigation.navigate('NewBroadcastForm')}
            iconName = {S.strings.add}
            title = "CREATE NEW BROADCAST"
          />
      </View>
    )
  }


  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {S.styles.listElement}
        onPress = {() => this.props.navigation.navigate("ResponsesScreen", {broadcast: item})}>
        <Text>TTL: {epochToDateString(item.deathTimestamp)}</Text>
        <Text>{item.ownerUid}</Text>
        <Text>{item.uid}</Text>
      </TouchableOpacity>
    );
  }

}