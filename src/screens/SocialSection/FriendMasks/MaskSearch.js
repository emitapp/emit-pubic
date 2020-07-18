import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { FriendMaskListElement } from 'reusables/ListElements';
import { BannerButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError } from 'utils/helpers';


export default class FriendMaskSearch extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
        title: "Mask Search", 
        headerBackTitle: null, //Because the Mask management screens use ScrollableHeaders   
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
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/snippets`)}
        />

        <BannerButton
          onPress={() => this.props.navigation.navigate('MaskMemberAdder')}
          title="CREATE NEW MASK"
          iconName = {S.strings.add}
        />

      </View>
    )
  }


  itemRenderer = ({ item }) => {
    return (
      <FriendMaskListElement
        maskInfo = {item}
        onPress = {() => this.props.navigation.navigate('MaskViewer', {mask: item}) }
      />

    );
  }
}