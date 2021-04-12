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

          <View style={{ marginHorizontal: 8 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>{item.location}</Text>
            {item.locked &&
              <View style={{
                flexDirection: "row", alignItems: "center", borderColor: "grey",
                borderWidth: 1, alignSelf: "flex-start", padding: 6, borderRadius: 8
              }}>
                <Icon name="lock" color="grey" size={24} style={{ marginHorizontal: 8 }} />
                <Text>Max responders reached</Text>
              </View>
            }
          </View>
        </View>
      </TouchableOpacity>
    )
  }
}