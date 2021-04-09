import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-elements';
import FirestoreDymanicInfiniteScroll from 'reusables/FirestoreDynamicInfiniteScroll';
import S from 'styling';
import FriendReqModal from '../screens/SocialSection/FriendReqModal';
import { UserSnippetListElementVertical } from './ListElements';
import SectionHeaderText from './SectionHeaderText';


export default class MutualFriendsList extends React.Component {

  constructor() {
    super()
    this.state = {
      searchGeneration: 0,
    }
    this.ref = firestore()
      .collection("friendRecommendations")
      .where("uids", 'array-contains', auth().currentUser.uid)
      .orderBy("score", "desc")
  }


  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <FriendReqModal
          ref={modal => this.modal = modal} />

        <FirestoreDymanicInfiniteScroll
          renderItem={this.itemRenderer}
          generation={this.state.searchGeneration}
          dbref={this.ref}
          chunkSize={10}
          horizontal={true}
          ItemSeparatorComponent={null}
          style={{ height: 130, alignSelf: "flex-start" }}
          showsHorizontalScrollIndicator={false}
          emptyStateComponent = {() => null}
          HeaderForHorizontal = {() => <SectionHeaderText>RECOMMENDED FRIENDS</SectionHeaderText>}
        />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    const uid = item.uids.filter(x => x != auth().currentUser.uid)[0]
    return (
      <UserSnippetListElementVertical
        uid={uid}
        onPress = {(snippet) => this.modal.open(snippet)}
        imageDiameter = {40}
      />
    );
  }
}