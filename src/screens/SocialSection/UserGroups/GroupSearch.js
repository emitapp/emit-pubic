import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserGroupListElement } from 'reusables/ListElements';
import { BannerButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';

export default class GroupSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Group Search",  
        headerBackTitle: null, //Because the Group management screens use ScrollableHeaders
    };
  };

  state = { 
    errorMessage: null, 
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <ErrorMessageText message = {this.state.errorMessage} />


        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}]}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userGroupMemberships/${userUid}`)}
        />

        <BannerButton
          onPress={() => this.props.navigation.navigate('GroupMemberAdder')}
          title="CREATE NEW GROUP"
          iconName = {S.strings.add}
        />

      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <UserGroupListElement
        groupInfo = {item}
        onPress = {() => this.props.navigation.navigate('GroupViewer', {group: item}) }
      />
    );
  }
}