import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React from 'react';
import { View } from 'react-native';
import { Text, ThemeConsumer } from 'react-native-elements';
import FirestoreDymanicInfiniteScroll from 'reusables/lists/FirestoreDynamicInfiniteScroll';
import S from 'styling';
import FriendReqModal from '../FriendReqModal';
import { UserSnippetListElementVertical } from '../ListElements';
import SectionHeaderText from '../ui/SectionHeaderText';

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
          style={{ height: 150, alignSelf: "flex-start" }}
          styleWhenEmpty={{height: 0}}
          showsHorizontalScrollIndicator={false}
          emptyStateComponent={null}
          HeaderForHorizontal={this.headerRenderer}
        />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    const uid = item.uids.filter(x => x != auth().currentUser.uid)[0]
    //Temporary fix for a proble with the code for friend recommendations (some docs aren't getting deleted and 
    //mutualFriends is null)
    if (!item.mutualFriends) return null; 
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <UserSnippetListElementVertical
            uid={uid}
            onPress={(snippet) => this.modal.openUsingSnippet(snippet, item.mutualFriends)}
            imageDiameter={40}
            style={{ marginRight: 8 }}>
            <Text style={{ color: theme.colors.grey2 }} >{item.mutualFriends.length} mutual friends</Text>
          </UserSnippetListElementVertical>
        )}
      </ThemeConsumer>
    );
  }

  headerRenderer = () => {
    return (
      <SectionHeaderText>RECOMMENDED FRIENDS</SectionHeaderText>
    )
  }
}