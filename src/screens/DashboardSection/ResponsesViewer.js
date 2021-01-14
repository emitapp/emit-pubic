import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-elements';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import AutolinkText from 'reusables/AutolinkText';
import LockNotice from 'reusables/BroadcastLockNotice';
import CountdownComponent from 'reusables/CountdownComponent';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserSnippetListElement } from 'reusables/ListElements';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import S from "styling";
import { epochToDateString } from 'utils/helpers';

export default class ResponsesViewer extends React.Component {

  constructor(props) {
    super(props);
    this.broadcastData = this.props.navigation.getParam('broadcast', { uid: " " })
    this.respondersListPath = `activeBroadcasts/${auth().currentUser.uid}/responders/${this.broadcastData.uid}`

    this.state = {
      errorMessage: null,
      responseStatusDeltas: {},
      isModalVisible: false,
    }
  }

  render() {
    return (
      <View style={{ ...S.styles.containerFlexStart, alignItems: "flex-start" }}>
        <DefaultLoadingModal isVisible={this.state.isModalVisible} />

        <ErrorMessageText message={this.state.errorMessage} />

        <View style={{ marginLeft: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {this.broadcastData.geolocation &&
              <Button
                icon={<EntypoIcon name="location-pin" size={20} color="white" />}
                onPress={this.openLocationOnMap}
                containerStyle={{ marginRight: 8, marginLeft: 0 }}
              />
            }
            <Text style={{ fontSize: 18 }}>{this.broadcastData.location}</Text>
          </View>
          <CountdownComponent deadLine={this.broadcastData.deathTimestamp} renderer={this.timeLeftRenderer} />
          <Text>Death Time: {epochToDateString(this.broadcastData.deathTimestamp)}</Text>

          {this.broadcastData.locked &&
            <LockNotice message={"This broadcast has react the response limit you set. It won't receive any more responses."} />
          }

          {this.broadcastData.note != undefined &&
            <AutolinkText style={styles.noteStyle}>
              {this.broadcastData.note}
            </AutolinkText>
          }
        </View>

        <DynamicInfiniteScroll
          renderItem={this.itemRenderer}
          generation={this.state.searchGeneration}
          dbref={database().ref(this.respondersListPath)}
          emptyStateComponent = {<Text style = {{alignSelf: "center"}}> Nothing to see here </Text>}
        />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserSnippetListElement snippet={item} style={{ flex: 1 }} />
    )
  }



  timeLeftRenderer = (time) => {
    let string = ""
    string += time.h ? `${time.h} hours, ` : ""
    string += time.m ? `${time.m} minutes, ` : ""
    string += time.s ? `${time.s} seconds` : ""
    return (
      <Text style={{ fontSize: 18, marginTop: 8 }}>in {string}</Text>
    );
  }

  openLocationOnMap = () => {
    let geolocation = this.broadcastData.geolocation
    let pinTitle = `Your planned location`
    let url = ""
    if (Platform.OS == "android") {
      url = `geo:${geolocation.latitude},${geolocation.longitude}?q=${geolocation.latitude},${geolocation.longitude}(${pinTitle})`
    }
    else {
      url = `http://maps.apple.com/?ll=${geolocation.latitude},${geolocation.longitude}`
      url += `&q=${encodeURIComponent(pinTitle)}`
    }
    Linking.openURL(url)
  }
}

const styles = StyleSheet.create({
  noteStyle: {
    fontStyle: "italic",
    marginTop: 8,
    fontSize: 18,
    color: "grey",
    marginLeft: 4,
    borderLeftColor: "grey",
    borderLeftWidth: 2,
    paddingLeft: 8
  }
})
