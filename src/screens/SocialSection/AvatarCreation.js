import multiavatar from '@emitapp/multiavatar';
import React from 'react';
import { Pressable, ScrollView, View, Dimensions } from 'react-native';
import { Button, Overlay, Text } from 'react-native-elements';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import CommMaterianIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from 'reusables/Header';
import S from 'styling';
import Avatar from 'reusables/Avatar'
class AvatarCreation extends React.PureComponent {

  static navigationOptions = Header("Avatar Creation")

  state = {
    partArray: new Array(6).fill("00"),
    svgSeed: "000000000000",
    offset: 0
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>

        <Avatar seed = {this.state.svgSeed} style = {{height: 120, width: "100%"}} />

        <View style={{ display: "flex", justifyContent: "space-around", marginHorizontal: 20, marginVertical: 8, flexDirection: "row" }}>
          {this.avatarSectionButton(0, 30, MaterialIcons, "colorize", "Color")}
          {this.avatarSectionButton(4, 30, MaterialIcons, "color-lens", "Skin")}
          {this.avatarSectionButton(2, 30, AwesomeIcon, "tshirt", "Clothes")}
          {this.avatarSectionButton(10, 30, AwesomeIcon, "hat-wizard", "Hat")}
          {this.avatarSectionButton(6, 30, AwesomeIcon, "smile", "Mouth")}
          {this.avatarSectionButton(8, 30, CommMaterianIcons, "sunglasses", "Eyes")}
        </View>

        <View flexDirection="row" style={{ marginBottom: 8 }}>
          <Button onPress={() => this.randomize()} title="Random" />
          <Button onPress={() => this.props.onSubmit(this.state.svgSeed)} title="Confirm" />
        </View>

        <ScrollView
          style={{ flex: 1, width: "100%", alignContent: "center", }}
          contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", backgroundColor: "lightgrey", borderTopRightRadius: 16, borderTopLeftRadius: 16 }}>
          {[...Array(47).keys()].map(i => this.avatarVariantButton(i))}
        </ScrollView>
      </View>
    );
  }

  randomize = () => {
    let { partArray, svgSeed } = this.state

    for (let i = 0; i < partArray.length; i++) {
      partArray[i] = Math.floor(Math.random() * 48).toString().padStart(2, "0");
    }

    svgSeed = partArray.reduce((a, b) => a + b, "")
    this.setState({ partArray, svgSeed });
  }

  replaceBetween = (str, start, end, what) => {
    return str.substring(0, start) + what + str.substring(end);
  }

  avatarVariantButton = (index) => {
    const { offset } = this.state
    const diameter = 80
    const target = index.toString().padStart(2, "0")
    const newSeed = this.replaceBetween(this.state.svgSeed, offset, offset + 2, target)
    const isSelected = this.state.svgSeed.substr(offset, 2) == target;

    return (
      <Pressable
        style={{
          margin: 4, borderWidth: isSelected ? 2 : 0,
          borderColor: "black", borderRadius: diameter / 2,
        }}
        key={index}
        onPress={() => this.setState({svgSeed: newSeed })}>
        <Avatar seed = {newSeed} style = {{height: diameter, width: diameter}} hideBackground = {this.state.offset != 0} />
      </Pressable>
    )
  }

  avatarSectionButton = (offset, size, IconLibrary, iconName, title) => {
    const isSelected = this.state.offset == offset;

    return (
      <Pressable
        style={{ marginHorizontal: 8, justifyContent: "center", alignItems: "center" }}
        onPress={() => this.setState({ offset })}>
        <IconLibrary name={iconName} size={size} color={isSelected ? "orange" : "grey"} />
        <Text style={{ fontSize: 12 }}>{title}</Text>
      </Pressable>
    )
  }
}
export default class AvatarCreationModal extends React.Component {

  constructor() {
    super()
    this.state = {
      isModalVisible: false,
    }
  }

  render() {
    return (
      <Overlay
        isVisible={this.state.isModalVisible}
        style={{ justifyContent: "center", alignItems: "center" }}
        onRequestClose={this.close}
        onBackdropPress={this.close}
        overlayStyle={{ width: ModalWidth, height: ModalHeight }}
      >
        <AvatarCreation
          onSubmit={this.onSubmit}
        />
      </Overlay>
    )
  }

  close = () => {
    this.setState({ isModalVisible: false })
  }

  onSubmit = (seed) => {
    this.props.onSubmit(seed)
    this.setState({ isModalVisible: false })
  }

  open = () => {
    this.setState({ isModalVisible: true })
  }
}

const ModalWidth = Dimensions.get('window').width * 0.75
const ModalHeight = Dimensions.get('window').height * 0.8


