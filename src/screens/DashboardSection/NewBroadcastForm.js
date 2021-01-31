import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, CheckBox, Input, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Chip from 'reusables/Chip';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { withNavigation } from 'react-navigation';
import { BannerButton } from 'reusables/ReusableButtons'
import S from 'styling'
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';
import { logError, LONG_TIMEOUT, timedPromise, isOnlyWhitespace } from 'utils/helpers';
import { DefaultLoadingModal } from 'reusables/LoadingComponents';
import { cloudFunctionStatuses, MAX_BROADCAST_NOTE_LENGTH } from 'utils/serverValues'
import ErrorMessageText from 'reusables/ErrorMessageText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProfilePicList } from 'reusables/ProfilePicComponents';


class NewBroadcastForm extends React.Component {

  constructor(props) {
    super(props)
    this.passableBroadcastInfo = { //Information that's directly edited by other screens
      emojiSelected: "",
      activitySelected: "",
      startingTimeText: "In 5 minutes",
      startingTime: 1000 * 60 * 5,
      startingTimeRelative: true,
      location: "",
      geolocation: null,
      allFriends: false,
      recepientFriends: {},
      recepientMasks: {},
      recepientGroups: {},
      duration: null,
      durationText: "1 hour"
    }
    this.state = {
      showingMore: false,
      passableBroadcastInfo: this.passableBroadcastInfo,
      note: "",
      customMaxResponders: false,
      maxResponders: "",
      isModalVisible: false,
      errorMessage: null
    }
  }

  static navigationOptions = ClearHeader("New Broadcast");

  componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.setState({}) //Just call for a rerender
    });
  }

  componentWillUnmount() {
    this.focusListener.remove();
  }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <DefaultLoadingModal isVisible={this.state.isModalVisible} />
            <ScrollView
              style={{ width: "100%", flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}>

              <ErrorMessageText
                message={this.state.errorMessage}
                style={{ color: '#2900BD', fontWeight: "bold" }} />

              <FormSubtitle title="What" />
              <FormInput
                onPress={() => this.props.navigation.navigate("NewBroadcastFormActivity", this.passableBroadcastInfo)}
                placeholder="Select an activity">
                <Text style={{ fontSize: 18 }}>{this.state.passableBroadcastInfo.emojiSelected}</Text>
                {this.state.passableBroadcastInfo.activitySelected && <Text> </Text>}
                <Text style={{ fontSize: 18 }} >{this.state.passableBroadcastInfo.activitySelected}</Text>
              </FormInput>

              <FormSubtitle title="Who" />

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginLeft: 10 }}>
                <View style={{ justifyContent: "center", maxWidth: "85%" }}>
                  <ProfilePicList
                    uids={Object.keys(this.state.passableBroadcastInfo.recepientFriends)}
                    diameter={36}
                    style={{ marginLeft: 0, marginRight: 2 }}
                  />
                </View>
                <TouchableOpacity style={{ justifyContent: "center" }} onPress={() => {
                  return this.props.navigation.navigate("NewBroadcastFormRecepients",
                    { mode: "friends", data: this.state.passableBroadcastInfo })
                }}>
                  <Icon style={{ marginTop: -3 }} size={44} color="white" name="add-circle-outline"></Icon>
                </TouchableOpacity>
              </View>


              <FormSubtitle title="When" />

              <FormInput
                onPress={() => this.props.navigation.navigate("NewBroadcastFormTime", this.passableBroadcastInfo)}
                value={this.state.passableBroadcastInfo.startingTimeText}
                errorMessage={this.state.passableBroadcastInfo.duration ? "" : "By defualt your flares will last 1 hour after they're sent."}
                errorStyle={{ color: "white" }}
              />

              <FormSubtitle title="Notes" />

              <Input
                multiline={true}
                textAlignVertical="top"
                numberOfLines={4}
                inputContainerStyle={{ backgroundColor: "white" }}
                placeholder="Enter any extra information you want in here"
                value={this.state.note}
                onChangeText={(note) => this.setState({ note })}
                errorMessage={this.state.note.length > MAX_BROADCAST_NOTE_LENGTH ? "Too long" : undefined}
              />

              {this.state.showingMore &&
                <>

                  <FormSubtitle title="Duration" />

                  <FormInput
                    onPress={() => this.props.navigation.navigate("NewBroadcastFormDuration", this.passableBroadcastInfo)}
                    value={this.state.passableBroadcastInfo.durationText}
                  />

                  <FormSubtitle title="Place" />

                  <FormInput
                    onPress={() => this.props.navigation.navigate("NewBroadcastFormLocation", this.passableBroadcastInfo)}
                    placeholder="Where are you going?"
                    value={this.state.passableBroadcastInfo.location}
                    icon={this.state.passableBroadcastInfo.geolocation ?
                      <Icon name="location-on" size={20} color="white" />
                      : null}
                  />

                  <FormSubtitle title="Max Responders" />

                  <ScrollView
                    containerStyle={{ flexDirection: "row" }}
                    style={{ flex: 1 }}
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    <Chip
                      mainColor="white"
                      selected={!this.state.customMaxResponders && this.state.maxResponders == ""}
                      onPress={() => this.setPredefinedMaxResponders("")}
                      selectedTextColor="black"
                      style={{ paddingHorizontal: 16 }}>
                      <Text>N/A</Text>
                    </Chip>
                    <Chip
                      selected={!this.state.customMaxResponders && this.state.maxResponders == "2"}
                      mainColor="white"
                      onPress={() => this.setPredefinedMaxResponders("2")}
                      selectedTextColor="black"
                      style={{ paddingHorizontal: 16 }}>
                      <Text>2</Text>
                    </Chip>
                    <Chip
                      selected={!this.state.customMaxResponders && this.state.maxResponders == "5"}
                      mainColor="white"
                      onPress={() => this.setPredefinedMaxResponders("5")}
                      selectedTextColor="black"
                      style={{ paddingHorizontal: 16 }}>
                      <Text>5</Text>
                    </Chip>
                    <Chip
                      selected={!this.state.customMaxResponders && this.state.maxResponders == "10"}
                      mainColor="white"
                      onPress={() => this.setPredefinedMaxResponders("10")}
                      selectedTextColor="black"
                      style={{ paddingHorizontal: 16 }}>
                      <Text>10</Text>
                    </Chip>
                    <Chip
                      selected={this.state.customMaxResponders}
                      mainColor="white"
                      selectedTextColor="black"
                      onPress={() => this.setState({ customMaxResponders: true })}
                      style={{ paddingHorizontal: 16 }}>
                      <Text>Custom</Text>
                    </Chip>

                  </ScrollView>

                  {this.state.customMaxResponders &&
                    <Input
                      value={this.state.maxResponders}
                      containerStyle={{ marginTop: 8 }}
                      inputContainerStyle={{ backgroundColor: "white" }}
                      keyboardType="number-pad"
                      placeholder="Max number of allowed responders"
                      onChangeText={(max) => this.setState({ maxResponders: max })}
                      errorMessage={/^\d+$/.test(this.state.maxResponders) && parseInt(this.state.maxResponders) > 0 ?
                        "" : "Only positive values are valid. If you won't want a max number of responders, choose N/A"
                      }
                      errorStyle={{ color: "white" }}
                    />
                  }
                </>
              }

              <Button
                title={`Show ${this.state.showingMore ? "less" : "more"}`}
                type="clear"
                onPress={() => this.setState({ showingMore: !this.state.showingMore })}
                titleStyle={{ color: "white" }}
              />

            </ScrollView>
            <BannerButton
              color="white"
              onPress={this.sendBroadcast}
              contentColor={theme.colors.primary}
              iconName={S.strings.sendBroadcast}
              title="SEND"
            />
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  sendBroadcast = () => {
    this.createBroadcast()
  }

  setPredefinedMaxResponders = (max) => {
    this.setState({
      maxResponders: max,
      customMaxResponders: false
    })
  }

  createBroadcast = async () => {
    try {
      this.setState({ isModalVisible: true, errorMessage: null })
      const uid = auth().currentUser.uid

      if (isOnlyWhitespace(this.state.passableBroadcastInfo.activitySelected) || 
          isOnlyWhitespace(this.state.passableBroadcastInfo.emojiSelected)) {
        this.setState({ errorMessage: "Invalid activity", isModalVisible: false })
        return
      }

      if (this.state.note.length > MAX_BROADCAST_NOTE_LENGTH) {
        this.setState({ errorMessage: "Broadcast note too long", isModalVisible: false })
        return
      }

      if (this.state.customMaxResponders && !/^\d+$/.test(this.state.maxResponders)) {
        this.setState({ errorMessage: "Invalid max responder limit", isModalVisible: false })
        return
      }

      //Getting the uid's of all my recepients
      const friendRecepients = {}
      const maskRecepients = {}
      const groupRecepients = {}

      for (const key in this.state.passableBroadcastInfo.recepientFriends) {
        friendRecepients[key] = true
      }
      for (const key in this.state.passableBroadcastInfo.recepientMasks) {
        maskRecepients[key] = true
      }
      for (const key in this.state.passableBroadcastInfo.recepientGroups) {
        groupRecepients[key] = true
      }

      if (!this.state.passableBroadcastInfo.allFriends
        && Object.keys(friendRecepients).length == 0
        && Object.keys(maskRecepients).length == 0
        && Object.keys(groupRecepients).length == 0) {
        this.setState({
          errorMessage: "This broadcast has no receivers it can be sent to",
          isModalVisible: false
        })
        return
      }

      const creationFunction = functions().httpsCallable('createActiveBroadcast');
      let params = {
        ownerUid: uid,
        activity: this.state.passableBroadcastInfo.activitySelected,
        emoji: this.state.passableBroadcastInfo.emojiSelected,
        location: this.state.passableBroadcastInfo.location,
        startingTime: this.state.passableBroadcastInfo.startingTime,
        startingTimeRelative: this.state.passableBroadcastInfo.startingTimeRelative,
        duration: this.state.passableBroadcastInfo.duration || 1000 * 60 * 60,
        maxResponders: this.state.maxResponders ? parseInt(this.state.maxResponders) : null,
        allFriends: this.state.passableBroadcastInfo.allFriends,
        friendRecepients,
        groupRecepients,
      }

      if (this.state.passableBroadcastInfo.geolocation)
        params.geolocation = this.state.passableBroadcastInfo.geolocation
      if (this.state.note)
        params.note = this.state.note

      console.log(params)

      const response = await timedPromise(creationFunction(params), LONG_TIMEOUT);
      if (response.data.status === cloudFunctionStatuses.OK) {
        this.props.navigation.state.params.needUserConfirmation = false;
        this.props.navigation.goBack()
      } else {
        this.setState({ errorMessage: response.data.message })
        logError(new Error("Problematic createActiveBroadcast function response: " + response.data.message))
      }
    } catch (err) {
      if (err.name == "timeout") {
        this.setState({ errorMessage: "Timeout!" })
      } else {
        this.setState({ errorMessage: err.message })
        logError(err)
      }
    }
    this.setState({ isModalVisible: false })
  }
}

export default withNavigation(NewBroadcastForm);


class FormInput extends React.PureComponent {
  render() {
    const { onPress, icon, ...otherProps } = this.props
    return (
      <View style={{ flexDirection: "row", width: "100%", height: "auto", alignItems: "center", marginBottom: 8 }}>
        {icon}
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={onPress} style={{ height: "auto", flexDirection: "row" }}>
            <View pointerEvents='none' style={{ width: "100%" }}>
              <Input
                {...otherProps}
                inputContainerStyle={{ backgroundColor: "white" }}
                containerStyle={{ marginBottom: 0 }}
                editable={false}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}



class FormSubtitle extends React.PureComponent {
  render() {
    return (
      <Text style={{
        fontFamily: "NunitoSans-Bold",
        marginBottom: 4,
        marginTop: 8,
        marginLeft: 10,
        fontSize: 22,
        color: "white",
        alignSelf: "flex-start"
      }}>
        {this.props.title}
      </Text>
    )
  }
}