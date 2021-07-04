import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import S from 'styling';
import { Text, ThemeConsumer } from 'react-native-elements'
import Icon from 'react-native-vector-icons/MaterialIcons';
import database from '@react-native-firebase/database';
import { logError, MEDIUM_TIMEOUT, LONG_TIMEOUT, timedPromise, truncate } from 'utils/helpers';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import MoreInformationTooltip from 'reusables/MoreInformationTooltip'
import functions from '@react-native-firebase/functions';
import { LoadableButton } from 'reusables/ReusableButtons';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { cloudFunctionStatuses } from 'utils/serverValues';



/**
 * Standard ListView element component for viewing user snippets.
 * Required props: snippet (the snippet to display) and onPress 
 * Optional props: extraComponents, style, imageDiameter
 */
export class UserSnippetListElement extends React.PureComponent {

  static defaultProps = {
    imageDiameter: 55
  }

  render() {
    const snippet = this.props.snippet

    return (
      <ThemeConsumer>
        {({ theme }) => (
          <TouchableOpacity
            style={{ ...S.styles.listElement, ...this.props.style }}
            onPress={this.props.onPress}>
            <ProfilePicDisplayer diameter={this.props.imageDiameter} uid={snippet.uid} style={{ marginLeft: 8, marginRight: 8 }} />
            <View style={{ flexDirection: "column" }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 18 }}>{snippet.displayName}</Text>
                <Text style={{ color: theme.colors.grey2, fontSize: 18, marginLeft: 6 }}>@{snippet.username}</Text>
              </View>
              {this.props.extraComponents}
            </View>
          </TouchableOpacity>
        )}
      </ThemeConsumer>
    )
  }
}


/**
 * Vertical ListView element component for viewing user snippets.
 * Required props: snippet (the snippet to display) (or uid) and onPress 
 * Gives the snipper to the onPress
 * Optional props: style, imageDiameter, children
 */
export class UserSnippetListElementVertical extends React.PureComponent {
  static defaultProps = {
    imageDiameter: 55
  }

  constructor(props) {
    super(props)
    this.state = { snippet: props.snippet }
    if (!this.state.snippet) this.getData()
  }

  render() {
    const snippet = this.state.snippet
    if (!snippet) {
      return (
        <SkeletonPlaceholder>
          <View
            style={{
              ...S.styles.listElement,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              ...this.props.style
            }}>
            <View style={{
              width: this.props.imageDiameter,
              height: this.props.imageDiameter,
              borderRadius: this.props.imageDiameter / 2,
              margin: 8,
              justifyContent: "center"
            }} />
            <View style={{ width: 50, height: 20, borderRadius: 4 }} />
          </View>
        </SkeletonPlaceholder>
      )
    }

    return (
      <ThemeConsumer>
        {({ theme }) => (
          <TouchableOpacity
            style={{
              ...S.styles.listElement,
              flexDirection: "column",
              marginHorizontal: 4,
              ...this.props.style
            }}
            onPress={() => this.props.onPress(this.state.snippet)}>
            <ProfilePicDisplayer diameter={this.props.imageDiameter} uid={snippet.uid} style={{ marginLeft: 8, marginRight: 8 }} />
            <Text style={{ fontSize: 16 }}>{truncate(snippet.displayName, 10)}</Text>
            <Text style={{ color: theme.colors.grey2, fontSize: 16 }}>@{truncate(snippet.username, 10)}</Text>
            {this.props.children}
          </TouchableOpacity>
        )}
      </ThemeConsumer>
    )
  }

  getData = async () => {
    try {
      const snippetRef = database().ref(`/userSnippets/${this.props.uid}`);
      const snippetSnapshot = await timedPromise(snippetRef.once('value'), MEDIUM_TIMEOUT)
      if (snippetSnapshot.exists()) {
        this.setState({ snippet: { ...snippetSnapshot.val(), uid: snippetSnapshot.key } })
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
    }
  }
}

/**
 * Standard ListView element component for viewing user groups.
 * Required props: groupInfo
 * Optional prop: imageDiameter
 */
export class UserGroupListElement extends React.PureComponent {

  static defaultProps = {
    imageDiameter: 30
  }

  render() {
    const { groupInfo, onPress } = this.props
    return (
      <TouchableOpacity
        style={{ ...S.styles.listElement, ...this.props.style }}
        onPress={onPress}>
        <View style={{ marginLeft: 8, flexDirection: "row" }}>
          <ProfilePicDisplayer
            diameter={this.props.imageDiameter}
            uid={groupInfo.uid}
            style={{ marginLeft: 8, marginRight: 8 }}
            groupPic={true} />
          <Text style={{ fontWeight: 'bold', fontSize: 18 }} >{groupInfo.name}</Text>
        </View>
      </TouchableOpacity>
    )
  }
}
/**
 * Standard ListView element component for viewing braodcast locations.
 * Required props: groupInfo
 */
export class LocationListElement extends React.PureComponent {
  render() {
    const { locationInfo, onPress } = this.props
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <TouchableOpacity
            style={{ ...S.styles.listElement, ...this.props.style }}
            onPress={onPress}>
            <View style={{ marginLeft: 8, marginVertical: 8, width: "100%", flexDirection: "row" }}>
              <View style={{ width: 40 }}>
                {locationInfo.geolocation !== undefined && locationInfo.geolocation !== null &&
                  <Icon name="location-on" size={20} color={theme.colors.grey2} style={{ marginHorizontal: 8 }} />
                }
              </View>
              <Text style={{ fontSize: 16 }}>
                {locationInfo.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ThemeConsumer>
    )
  }
}
/**
 * Standard ListView element component that can render both groups and friends
 * Required props: snippet
 * Optional props, style, imageDiameter
 */
export class RecipientListElement extends React.PureComponent {
  static defaultProps = {
    imageDiameter: 55
  }
  render() {
    const { snippet } = this.props;
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <TouchableOpacity
            style={{ ...S.styles.listElement, ...this.props.style }}
            onPress={this.props.onPress}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ProfilePicDisplayer
                  diameter={this.props.imageDiameter}
                  uid={snippet.uid}
                  style={{ marginLeft: 8, marginRight: 8 }}
                  groupPic={snippet.displayName ? false : true} />
                <Text style={{ fontSize: 18, marginRight: 8 }}>{snippet.displayName ? snippet.displayName : snippet.name}</Text>
                {snippet.username && <Text style={{ color: theme.colors.grey2 }}>@{snippet.username}</Text>}
              </View>
              {this.props.children}
            </View>
          </TouchableOpacity>
        )}
      </ThemeConsumer>
    )
  }
}
/**
 * Standard ListView element component for activities and emojis
 * Required props: text
 * Optional props: style
 */
export class ActivityListElement extends React.PureComponent {
  render() {
    const { emoji, activityName, onPress, info } = this.props
    return (
      <TouchableOpacity
        style={{ ...S.styles.listElement, ...this.props.style }}
        onPress={onPress}>
        <View style={{ marginLeft: 8, flexDirection: "row", alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
          <Text style={{ marginLeft: 6, fontSize: 18, flex: 1 }} >{activityName}</Text>
          {info && <MoreInformationTooltip message={info} title={activityName}
            style={{ padding: 0, marginTop: 0, marginHorizontal: 8 }} />}
        </View>
      </TouchableOpacity>
    )
  }
}


/**
 * Standard ListView element component for recurring flares
 * Required props: text
 * Optional props: style
 */
 export class RecurringFlareElement extends React.PureComponent {

  constructor(props) {
    super(props)
    this.state = {
      waitingForCloudFunc: false,
      message: null
    }
  }

  cancelRecurringFlare = async (flareUid, ownerUid) => {
    try {
      this.setState({waitingForCloudFunc: true})
      let params = {
        flareUid: flareUid,
        ownerUid: ownerUid
      }
      const deleteFunction = functions().httpsCallable('deleteRecurringFlare');
      const response = await timedPromise(deleteFunction(params), LONG_TIMEOUT);
      if (response.data.status != cloudFunctionStatuses.OK) {
        // this.setState({ message: response.data.message })
        logError(new Error("Problematic deleteRecurringFlare function response: " + response.data.message))
      } 
    } catch (error) {
      this.setState({ message: error.message })
      logError(error)
    } finally {
      this.setState({waitingForCloudFunc: false})
    }
  }
  render() {
    return (
      <View
        style={{ marginVertical: 8, marginLeft: 8 }}>
        <ErrorMessageText message = {this.state.message} />
        <View style={{ flexDirection: "row" }}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Text style={{ fontSize: 36, marginHorizontal: 8 }}>{this.props.item.emoji}</Text>
            <View style={{ justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>{this.props.item.activity}</Text>
              <View style={{ flexDirection: 'row' }}>
                <ProfilePicDisplayer diameter={22} uid={this.props.item.owner.uid} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontFamily: "NunitoSans-Semibold" }}>{this.props.item.owner.displayName}</Text>
              </View>
              <Text style={{ fontSize: 18 }}>{this.props.item.frequency}</Text>
            </View>
          </View>
          <LoadableButton  
                title="Cancel" 
                onPress={() => this.cancelRecurringFlare(this.props.item.originalFlareUid, this.props.item.owner.uid)} 
                isLoading = {this.state.waitingForCloudFunc} />
        </View>
        <View style={{ marginHorizontal: 8, marginTop: 4 }}>
          {this.props.item.groupInfo && <Text style={{ fontStyle: "italic" }}>Sent via {this.props.item.groupInfo.name} group</Text>}
          {this.props.isPublicFlare && <PublicFlareService />}
        </View>
        {this.props.item.note != undefined && this.props.item.note != "" &&
          <Text style={{ fontStyle: "italic", color: "dimgrey", marginLeft: 8, marginVertical: 8 }}>{this.props.item.note}</Text>
        }
      </View>
    )
  }
} 