import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import database from '@react-native-firebase/database';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Input, Text, ThemeConsumer, CheckBox } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { withNavigation } from 'react-navigation';
import Chip from 'reusables/ui/Chip';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { ClearHeader } from 'reusables/Header';
import { IosOnlyKeyboardAvoidingView } from "reusables/containers/KeyboardComponents";
import { DefaultLoadingModal } from 'reusables/ui/LoadingComponents';
import MainLinearGradient from 'reusables/containers/MainLinearGradient';
import { ProfilePicList } from 'reusables/profiles/ProfilePicComponents';
import { BannerButton } from 'reusables/ui/ReusableButtons';
import S from 'styling';
import { analyticsLogFlareCreation } from 'utils/analyticsFunctions';
import { epochToDateString, isOnlyWhitespace, logError, LONG_TIMEOUT, objectDifference, showDelayedSnackbar, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses, MAX_BROADCAST_NOTE_LENGTH } from 'utils/serverValues';
import { reverseGeocodeToOSM } from 'utils/geo/OpenStreetMapsApi';


class NewBroadcastForm extends React.Component {

  constructor(props) {
    super(props)

    //This.isEditing and this.broadcastSnippet come hand in hand
    this.isEditing = this.props.navigation.getParam('isEditing');
    this.broadcastSnippet = this.props.navigation.getParam('broadcastSnippet');
    let prechosenActivity = this.props.navigation.getParam('activity');
    const isPublicFlare = this.props.navigation.getParam('isPublicFlare') ?? false;


    this.passableBroadcastInfo = { // All toggleable broadcast information
      emojiSelected: prechosenActivity?.emoji || "",
      activitySelected: prechosenActivity?.name || "",
      startingTimeText: "Now",
      startingTime: 0,
      startingTimeRelative: true,
      location: "",
      geolocation: this.props.navigation.getParam('coordinates'),
      duration: null,
      durationText: "1 hour",
      note: "",
      allFriends: false,
      recepientFriends: {},
      recepientMasks: {},
      recepientGroups: {},

      customMaxResponders: false,
      maxResponders: "",
    }

    this.broadcastInfoPrototype = { ...this.passableBroadcastInfo }

    //Useful info for editing flares (gotten from the server when needed)...
    this.recepientFriendsOriginal = {},
      this.recepientGroupsOriginal = {},

      this.state = {
        showingMore: false,
        passableBroadcastInfo: this.passableBroadcastInfo,
        isModalVisible: false,
        errorMessage: null,
        isPublicFlare: isPublicFlare,

        isRecurring: false,
        recurringDays: [],
      }
  }

  static navigationOptions = ClearHeader("New Flare");

  async componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.setState({}) //Just call for a rerender
    });

    const geolocation = this.passableBroadcastInfo.geolocation
    if (geolocation) {
      const geoObject = await reverseGeocodeToOSM(geolocation)
      this.passableBroadcastInfo = { ...this.state.passableBroadcastInfo,
          location: geoObject.name}
      this.setState({ passableBroadcastInfo : this.passableBroadcastInfo });
    }

    if (this.isEditing && this.broadcastSnippet) {
      this.getInitialBroadcastInformation()
    }
  }


  componentWillUnmount() {
    this.focusListener.remove();
  }

  componentDidUpdate() {
    if (JSON.stringify(this.broadcastInfoPrototype) !== JSON.stringify(this.state.passableBroadcastInfo)) {
      this.props.navigation.state.params.needUserConfirmation = true;
    }
  }

  render() {
    const { passableBroadcastInfo: flareInfo } = this.state
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>

            <DefaultLoadingModal isVisible={this.state.isModalVisible} />

            <IosOnlyKeyboardAvoidingView
              behavior={"position"}
              contentContainerStyle={{ flex: 1, width: "100%", justifyContent: 'center' }}
              style={{ flex: 1, width: "100%", justifyContent: 'center' }}>

              <ScrollView
                style={{ width: "100%", flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}>

                <ErrorMessageText
                  message={this.state.errorMessage}
                  style={{ color: '#2900BD', fontWeight: "bold" }} />

                {(this.isEditing && this.state.recurringDays?.length > 0) &&
                  <Text style = {{color: "white"}}>
                    We noticed this is a recurring flare! Changes will only affect this occurence.
                  </Text>
                }

                <FormSubtitle title="What" />
                <FormInput
                  onPress={() => this.props.navigation.navigate("NewBroadcastFormActivity", this.passableBroadcastInfo)}
                  placeholder="Select an activity">
                  <Text style={{ fontSize: 18 }}>{flareInfo.emojiSelected}</Text>
                  {flareInfo.activitySelected && <Text> </Text>}
                  <Text style={{ fontSize: 18 }} >{flareInfo.activitySelected}</Text>
                </FormInput>

                {!this.isEditing &&
                  <View style={{ marginLeft: 24, marginBottom: 8 }}>
                    <CheckBox
                      title='Public Flare'
                      fontFamily="NunitoSans-Regular"
                      textStyle={{ fontSize: 16, fontWeight: "bold", color: "white" }}
                      checked={this.state.isPublicFlare}
                      containerStyle={{ alignSelf: "flex-start", padding: 0, marginBottom: 0 }}
                      onPress={() => this.setState({ isPublicFlare: !this.state.isPublicFlare })}
                      checkedColor="white"
                      uncheckedColor="white"
                    />

                    <Text style={{ color: "white" }}>
                      Public flares are visible to all nearby Emit users.
                    </Text>
                  </View>
                }

                {!this.state.isPublicFlare &&
                  <>
                    <FormSubtitle title="Who" />

                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginLeft: 10 }}>
                      <View style={{ justifyContent: "center", maxWidth: "85%" }}>
                        <ProfilePicList
                          uids={Object.keys(flareInfo.recepientFriends)}
                          groupUids={Object.keys(flareInfo.recepientGroups)}
                          diameter={36}
                          style={{ marginLeft: 0, marginRight: 2 }}
                        />
                      </View>
                      <TouchableOpacity style={{ justifyContent: "center" }} onPress={() => {
                        return this.props.navigation.navigate("NewBroadcastFormRecepients",
                          { data: flareInfo })
                      }}>
                        <Icon style={{ marginTop: -3 }} size={44} color="white" name="add-circle-outline"></Icon>
                      </TouchableOpacity>
                    </View>
                  </>
                }


                {this.state.isPublicFlare &&
                  this.displayLocationOption(flareInfo)}


                <FormSubtitle title="When" />

                {this.isEditing &&
                  <Text style={{ color: "white", marginLeft: 8 }}>
                    When editing, start times are relative to the present,
                    not when the flare was created
                  </Text>
                }

                <FormInput
                  onPress={() => this.props.navigation.navigate("NewBroadcastFormTime", this.passableBroadcastInfo)}
                  value={flareInfo.startingTimeText}
                  errorMessage={flareInfo.duration ? "" : "By default your flares will last 1 hour after they're sent."}
                  errorStyle={{ color: "white" }}
                />

                <FormSubtitle title="Notes" />

                <Input
                  multiline={true}
                  textAlignVertical="top"
                  numberOfLines={4}
                  inputContainerStyle={{ backgroundColor: "white" }}
                  placeholder="Enter any extra information you want in here"
                  value={flareInfo.note}
                  onChangeText={(note) => {
                    this.setState({ passableBroadcastInfo: { ...flareInfo, note } })
                  }}
                  errorMessage={flareInfo.note.length > MAX_BROADCAST_NOTE_LENGTH ? "Too long" : undefined}
                />

                {this.state.showingMore &&
                  <>

                    <FormSubtitle title="Duration" />

                    <FormInput
                      onPress={() => this.props.navigation.navigate("NewBroadcastFormDuration", this.passableBroadcastInfo)}
                      value={flareInfo.durationText}
                    />

                    {!this.state.isPublicFlare &&
                      this.displayLocationOption(flareInfo)}

                    {!this.isEditing &&



                      <View style={{ marginTop: -20 }}>
                        <CheckBox
                          title='Recurring Flare'
                          fontFamily="NunitoSans-Regular"
                          textStyle={{ fontSize: 16, fontWeight: "bold", color: "white" }}
                          checked={this.state.isRecurring}
                          containerStyle={{ alignSelf: "flex-start", padding: 0, marginBottom: 0 }}
                          onIconPress={() => this.setState({ isRecurring: !this.state.isRecurring })}
                          checkedColor="white"
                          uncheckedColor="white"
                        />
                        <Text style={{ color: "white", fontSize: 14 }}>
                          Recurring flares will auto repeat at the same time on a custom frequency.
                        </Text>

                        {this.state.isRecurring &&
                          <ScrollView
                            containerStyle={{ flexDirection: "row" }}
                            style={{ flex: 1, marginTop: 6 }}
                            horizontal
                            showsHorizontalScrollIndicator={false}>
                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("M")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("M")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>M</Text>
                            </Chip>
                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("T")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("T")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>T</Text>
                            </Chip>
                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("W")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("W")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>W</Text>
                            </Chip>
                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("Th")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("Th")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>Th</Text>
                            </Chip>
                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("F")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("F")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>Fr</Text>
                            </Chip>

                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("Sat")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("Sat")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>Sat</Text>
                            </Chip>

                            <Chip
                              selected={this.state.isRecurring && this.state.recurringDays.includes("S")}
                              mainColor="white"
                              onPress={() => this.setRecurringFlareDays("S")}
                              selectedTextColor="black"
                              style={{ paddingHorizontal: 16 }}>
                              <Text>S</Text>
                            </Chip>
                          </ScrollView>
                        }
                      </View>
                    }


                    <FormSubtitle title="Max Responders" />

                    {/* //If you add a new button, be sure to change this.isCustomResponderValue */}
                    <ScrollView
                      containerStyle={{ flexDirection: "row" }}
                      style={{ flex: 1 }}
                      horizontal
                      showsHorizontalScrollIndicator={false}>
                      <Chip
                        mainColor="white"
                        selected={!this.state.passableBroadcastInfo.customMaxResponders && this.state.passableBroadcastInfo.maxResponders == ""}
                        onPress={() => this.setPredefinedMaxResponders("")}
                        selectedTextColor="black"
                        style={{ paddingHorizontal: 16 }}>
                        <Text>N/A</Text>
                      </Chip>
                      <Chip
                        selected={!this.state.passableBroadcastInfo.customMaxResponders && this.state.passableBroadcastInfo.maxResponders == "2"}
                        mainColor="white"
                        onPress={() => this.setPredefinedMaxResponders("2")}
                        selectedTextColor="black"
                        style={{ paddingHorizontal: 16 }}>
                        <Text>2</Text>
                      </Chip>
                      <Chip
                        selected={!this.state.passableBroadcastInfo.customMaxResponders && this.state.passableBroadcastInfo.maxResponders == "5"}
                        mainColor="white"
                        onPress={() => this.setPredefinedMaxResponders("5")}
                        selectedTextColor="black"
                        style={{ paddingHorizontal: 16 }}>
                        <Text>5</Text>
                      </Chip>
                      <Chip
                        selected={!this.state.passableBroadcastInfo.customMaxResponders && this.state.passableBroadcastInfo.maxResponders == "10"}
                        mainColor="white"
                        onPress={() => this.setPredefinedMaxResponders("10")}
                        selectedTextColor="black"
                        style={{ paddingHorizontal: 16 }}>
                        <Text>10</Text>
                      </Chip>
                      <Chip
                        selected={this.state.passableBroadcastInfo.customMaxResponders}
                        mainColor="white"
                        selectedTextColor="black"
                        onPress={() => this.setState({ passableBroadcastInfo: { ...this.state.passableBroadcastInfo, customMaxResponders: true } })}
                        style={{ paddingHorizontal: 16 }}>
                        <Text>Custom</Text>
                      </Chip>

                    </ScrollView>

                    {this.state.passableBroadcastInfo.customMaxResponders &&
                      <Input
                        value={this.state.passableBroadcastInfo.maxResponders.toString()}
                        containerStyle={{ marginTop: 8 }}
                        inputContainerStyle={{ backgroundColor: "white" }}
                        keyboardType="number-pad"
                        placeholder="Max number of allowed responders"
                        onChangeText={(max) => this.setState({ passableBroadcastInfo: { ...this.state.passableBroadcastInfo, maxResponders: max } })}
                        errorMessage={/^\d+$/.test(this.state.passableBroadcastInfo.maxResponders) && parseInt(this.state.passableBroadcastInfo.maxResponders) > 0 ?
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
            </IosOnlyKeyboardAvoidingView>

            <BannerButton
              color="white"
              onPress={this.sendFlare}
              contentColor={theme.colors.primary}
              iconName={S.strings.sendBroadcast}
              title={this.isEditing ? "CONFIRM EDIT" : "SEND"} />

          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  displayLocationOption = (flareInfo) => {
    return (
      <>
        <FormSubtitle title="Place" />
        <FormInput
          onPress={() => this.props.navigation.navigate("NewBroadcastFormLocation", {
            bundle: this.passableBroadcastInfo,
            isPublicFlare: this.state.isPublicFlare
          })}
          placeholder="Where are you going?"
          value={flareInfo.location}
          icon={flareInfo.geolocation ?
            <Icon name="location-on" size={20} color="white" />
            : null}
          selection={{start:0}} //for very long location names, this makes the input show the beginning, not the end
        />
      </>
    )
  }

  setPredefinedMaxResponders = (max) => {
    this.setState({
      passableBroadcastInfo: {
        ...this.state.passableBroadcastInfo,
        maxResponders: max,
        customMaxResponders: false
      }
    })
  }


  sendFlare = () => {
    if (!this.checkForBasicFlareValidity()) return
    this.createFlare()
  }

  checkForBasicFlareValidity = () => {
    const { passableBroadcastInfo: flareInfo } = this.state

    if (isOnlyWhitespace(flareInfo.activitySelected) || isOnlyWhitespace(flareInfo.emojiSelected)) {
      this.provideErrorFeedback("Invalid activity")
      return false
    }

    if (flareInfo.note.length > MAX_BROADCAST_NOTE_LENGTH) {
      this.provideErrorFeedback("Broadcast note too long")
      return false
    }

    if (this.state.customMaxResponders && !/^\d+$/.test(this.state.maxResponders)) {
      this.provideErrorFeedback("Invalid max responder limit")
      return false
    }

    if (this.state.isPublicFlare && !flareInfo.geolocation) {
      this.provideErrorFeedback("Public flares need geolocation!")
      return false
    }

    return true
  }

  //Assumes checkForBasicFlareValidity has been run
  createFlare = async () => {
    try {
      this.setState({ isModalVisible: true, errorMessage: null })
      const uid = auth().currentUser.uid
      const { isPublicFlare, passableBroadcastInfo: flareInfo } = this.state

      //Note that changing the strucutre of params has consequences for analyticsLogFlareCreation
      //TODO: we should change this file to TS very soon!
      let params = {
        ownerUid: uid,
        emoji: flareInfo.emojiSelected,
        activity: flareInfo.activitySelected,
        startingTime: flareInfo.startingTime,
        startingTimeRelative: flareInfo.startingTimeRelative,
        location: flareInfo.location,
        duration: flareInfo.duration || 1000 * 60 * 60,
        maxResponders: flareInfo.maxResponders ? parseInt(flareInfo.maxResponders) : null,
        recurringDays: this.state.recurringDays,
      }

      if (!isPublicFlare && !this.addRecepientInformation(params)) return;
      if (flareInfo.geolocation) params.geolocation = flareInfo.geolocation
      if (flareInfo.note) params.note = flareInfo.note

      if (!isPublicFlare && this.isEditing) {
        params.broadcastUid = this.broadcastSnippet.uid;
        params.friendsToRemove = Array.from(objectDifference(this.recepientFriendsOriginal, flareInfo.recepientFriends))
        params.groupsToRemove = Array.from(objectDifference(this.recepientGroupsOriginal, flareInfo.recepientGroups))
      }

      if (this.isEditing && isPublicFlare) params.originalFlareUid = this.broadcastSnippet.uid
 
      let methodName = ""
      if (this.isEditing) methodName = isPublicFlare ? "editPublicFlare" : "modifyActiveBroadcast"
      else methodName = isPublicFlare ? "createPublicFlare" : 'createActiveBroadcast'
      const response = await timedPromise(functions().httpsCallable(methodName)(params), LONG_TIMEOUT);

      if (response.data.status === cloudFunctionStatuses.OK) {
        if (response.data.message) analyticsLogFlareCreation({ ...params, flareUid: response.data.message.flareUid }, isPublicFlare)
        this.props.navigation.state.params.needUserConfirmation = false;
        this.props.navigation.navigate("Feed")
      } else {
        this.provideErrorFeedback(response.data.message)
        logError(new Error(`Problematic ${methodName} function response: ` + response.data.message))
      }

    } catch (err) {
      if (err.name == "timeout") {
        this.provideErrorFeedback("Timeout!")
      } else {
        this.provideErrorFeedback(err.message)
        logError(err)
      }
    }

    this.setState({ isModalVisible: false })
  }

  getInitialBroadcastInformation = async () => {
    try {
      this.passableBroadcastInfo = {
        emojiSelected: this.broadcastSnippet.emoji,
        activitySelected: this.broadcastSnippet.activity,
        startingTime: this.broadcastSnippet.startingTime,
        startingTimeText: epochToDateString(this.broadcastSnippet.startingTime),
        location: this.broadcastSnippet.location ? this.broadcastSnippet.location : "",
        geolocation: this.broadcastSnippet.geolocation,
        duration: this.broadcastSnippet.duration,
        durationText: this.getDurationText(this.broadcastSnippet.duration),
        note: this.broadcastSnippet.note ? this.broadcastSnippet.note : ""
      }

      if (this.state.isPublicFlare) {
        const maxRes = this.broadcastSnippet.maxResponders
        this.passableBroadcastInfo = {
          ...this.passableBroadcastInfo,
          customMaxResponders: this.isCustomResponderValue(maxRes),
          maxResponders: maxRes ? maxRes : "",
          startingTimeRelative: false
        }
      } else {
        let ref = database().ref(`/activeBroadcasts/${auth().currentUser.uid}/additionalParams/${this.broadcastSnippet.uid}`)
        const snapshot = await ref.once('value')
        
        if (!snapshot.exists()) {
          logError(new Error("Snapshot of flare parameters not found"))
          return;
        }

        let broadcastAdditionalData = snapshot.val();
        const maxRes = broadcastAdditionalData.maxResponders
        this.passableBroadcastInfo = {
          ...this.passableBroadcastInfo,
          startingTimeRelative: false,
          allFriends: broadcastAdditionalData.allFriends,
          recepientFriends: broadcastAdditionalData.friendRecepients ? broadcastAdditionalData.friendRecepients : {},
          recepientGroups: broadcastAdditionalData.groupRecepients ? broadcastAdditionalData.groupRecepients : {},
          customMaxResponders: this.isCustomResponderValue(maxRes),
          maxResponders: maxRes ? maxRes : ""
        }

        this.recepientFriendsOriginal = this.passableBroadcastInfo.recepientFriends
        this.recepientGroupsOriginal = this.passableBroadcastInfo.recepientGroups
      }


      this.state.recurringDays = this.broadcastSnippet.recurringDays || [];

      this.broadcastInfoPrototype = { ...this.passableBroadcastInfo }
      this.setState({ passableBroadcastInfo: this.passableBroadcastInfo })

    } catch (e) {
      logError(e)
    }
  }

  /**
   * Adds recepient information to the flare args
   * @param {*} params The object containing the args for the cloud function
   * @returns Returns false if there was an error in doing this...
   */
  addRecepientInformation = (params) => {
    const { passableBroadcastInfo: flareInfo } = this.state

    //Getting the uid's of all my recepients
    const friendRecepients = {}
    const groupRecepients = {}
    //const maskRecepients = {}

    for (const key in flareInfo.recepientFriends) friendRecepients[key] = true
    for (const key in flareInfo.recepientGroups) groupRecepients[key] = true
    // for (const key in flareInfo.recepientMasks) maskRecepients[key] = true

    if (!flareInfo.allFriends
      && Object.keys(friendRecepients).length == 0
      //&& Object.keys(maskRecepients).length == 0
      && Object.keys(groupRecepients).length == 0) {
      this.provideErrorFeedback("This broadcast has no receivers it can be sent to")
      this.setState({ isModalVisible: false })
      return false
    }

    params.allFriends = flareInfo.allFriends
    params.friendRecepients = friendRecepients
    params.groupRecepients = groupRecepients

    return true
  }

  getDurationText = (duration) => {
    const MILLI_PER_MIN = 1000 * 60
    const minutes = Math.round(duration / MILLI_PER_MIN)
    let durationText = ""
    if (minutes < 60) {
      durationText = `${minutes} mins`
    } else {
      durationText = `${minutes / 60} hours`
    }
    return durationText
  }

  setRecurringFlareDays = (day) => {
    const indexOfDayInArray = this.state.recurringDays.indexOf(day)
    let updatedRecurringDaysArray = this.state.recurringDays
    if (indexOfDayInArray > -1) {
      this.state.recurringDays.splice(indexOfDayInArray, 1)
    } else {
      updatedRecurringDaysArray = [...this.state.recurringDays, day]
    }
    this.setState({
      recurringDays: updatedRecurringDaysArray
    })
  }

  provideErrorFeedback = (errorMessage) => {
    this.setState({ errorMessage })
    showDelayedSnackbar(errorMessage)
  }

  isCustomResponderValue = (maxRes) => {
    return !(!maxRes || maxRes == "2" || maxRes == "5" || maxRes == "10")
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
        marginTop: 4,
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