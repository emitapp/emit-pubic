import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicon from 'react-native-vector-icons/Ionicons';
import FlareTimeStatus from 'reusables/FlareTimeStatus';
import S from 'styling';
import NavigationService from 'utils/NavigationService';

export default class EmittedFlareElement extends React.PureComponent {
  render() {
    const { item } = this.props
    return (
      <TouchableOpacity
        style={S.styles.listElement}
        onPress={() => NavigationService.navigate("ResponsesScreen", { broadcast: item })}>
        <View style={{ flexDirection: "column", flex: 1 }}>

          <View style={{ flexDirection: "row" }}>
            
            <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 40, marginHorizontal: 8 }}>{item.emoji}</Text>
              <View style={{ justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{item.activity}</Text>
                {item.totalConfirmations != 0 ?
                  <Text style={{ fontSize: 14 }}>{item.totalConfirmations} people are in</Text> :
                  <Text style={{ fontSize: 14 }}>No responders yet</Text>
                }
              </View>
            </View>

            <View>
              <FlareTimeStatus item={item} />
              <Pressable onPress={() => NavigationService.navigate("ChatScreen", { broadcast: item })}>
                <Ionicon name="md-chatbubbles" color="grey" size={35} style={{ marginHorizontal: 8 }} />
              </Pressable>
            </View>

          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.location}</Text>
        {item.locked && <Icon name="lock" color="grey" size={24} style={{ marginHorizontal: 8 }} />}
      </TouchableOpacity>
    )
  }
}