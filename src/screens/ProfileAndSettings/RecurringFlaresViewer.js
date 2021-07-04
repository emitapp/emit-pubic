//TODO: remove this screen once Search hub gets filtering
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import S from 'styling';
import ErrorMessageText from 'reusables/ErrorMessageText';
import DymanicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import Icon from 'react-native-vector-icons/Ionicons';
import { RecurringFlareElement } from 'reusables/ListElements';


export default class RecurringFlaresViewer extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Recurring Flares",
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

        <ErrorMessageText message={this.state.errorMessage} />

        <DymanicInfiniteScroll
            renderItem={this.itemRenderer}
            dbref={database().ref(`/recurringFlares/${userUid}`)}
            emptyStateComponent={
            <EmptyState
                image =  {
                <Icon name="ios-time" size={50} color="grey" />
                }
                title="Recurring flares will show up here!"
            />
            }
        />
      </View>
    )
  }

  itemRenderer = ({ item }) => {
    return (
      <RecurringFlareElement
        item={item} />
    );
  }
}