import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BannerButton from 'reusables/BannerButton';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError } from 'utils/helpers';


export default class GroupSearch extends React.Component {

  state = { 
    errorMessage: null, 
    isModalVisible: false,
  }

  render() {
    let userUid = auth().currentUser.uid
    return (
      <View style={S.styles.containerFlexStart}>

        <Text>Group Search</Text>
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
          dbref = {database().ref(`/userGroupMemberships/${userUid}`)}
        />

        <BannerButton
          onPress={() => this.props.navigation.navigate('GroupMemberAdder')}
          title="CREATE NEW GROUP"
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
        onPress = {() => this.props.navigation.navigate('GroupViewer', {group: item}) }>
            <Text>{item.name}</Text>
      </TouchableOpacity>
    );
  }
}