import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError } from 'utils/helpers';


export default class FriendMaskSearch extends React.Component {

  state = { 
    errorMessage: null, 
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <Text>Friend Mask Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <SearchableInfiniteScroll
          type = "dynamic"
          queryValidator = {(query) => true}
          queryTypes = {[{name: "Name", value: "name"}]}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/snippets`)}
        />

        <BannerButton
          onPress={() => this.props.navigation.navigate('MaskMemberAdder')}
          title="CREATE NEW MASK"
          iconName = {S.strings.add}
          color = {S.colors.buttonGreen}
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
        onPress = {() => this.props.navigation.navigate('MaskViewer', {mask: item}) }>
            <Text>{item.name}</Text>
            <Text>Member count: {item.memberCount}</Text>
      </TouchableOpacity>
    );
  }
}