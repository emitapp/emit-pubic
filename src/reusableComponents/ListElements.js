import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import S from 'styling';
import {Text, ThemeConsumer} from 'react-native-elements'
import Icon from 'react-native-vector-icons/MaterialIcons';
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
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress={this.props.onPress}>
          <ProfilePicDisplayer diameter = {this.props.imageDiameter} uid = {snippet.uid} style = {{marginLeft: 8, marginRight: 8}} />
          <View style = {{flexDirection: "row"}}>
            <Text style = {{fontSize: 18}}>{snippet.displayName}</Text>
            <Text style = {{color: theme.colors.grey2, fontSize: 18, marginLeft: 6}}>@{snippet.username}</Text>
            {this.props.extraComponents}
          </View>
        </TouchableOpacity>
      )}
      </ThemeConsumer>
    )
  }
}
/**
 * Standard ListView element component for viewing user groups.
 * Required props: groupInfo
 */
export class UserGroupListElement extends React.PureComponent {
  render() {
    const {groupInfo, onPress} = this.props
    return (
      <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress = {onPress}>
          <View style = {{marginLeft: 8}}>
            <Text style = {{fontWeight: 'bold', fontSize: 18}} >{groupInfo.name}</Text>
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
    const {locationInfo, onPress} = this.props
    return (
      <ThemeConsumer>
      {({ theme }) => (
      <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress = {onPress}>
          <View style = {{marginLeft: 8, marginVertical: 8, width: "100%", flexDirection: "row"}}>
            <View style = {{width: 40}}>
              {locationInfo.geolocation !== undefined && locationInfo.geolocation !== null && 
                <Icon name="location-on" size={20} color={theme.colors.grey2} style = {{marginHorizontal: 8}}/>
              }
            </View>
            <Text style = {{fontSize: 16}}>
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
 * Optional props: extraComponents, style, imageDiameter
 */
export class RecipientListElement extends React.PureComponent {
  static defaultProps = {
    imageDiameter: 55
  }
  render() {
    const {snippet} = this.props;
    return (
      <ThemeConsumer>
      {({ theme }) => (
        <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress={this.props.onPress}>
          <View style = {{flexDirection: "row", justifyContent: "space-between", width: "100%"}}>
            <View style = {{flexDirection: "row", alignItems: "center"}}>
              {snippet.displayName ? <ProfilePicDisplayer diameter = {this.props.imageDiameter} uid = {snippet.uid} style = {{marginLeft: 8, marginRight: 8}} /> : <></>}
              <Text style = {{fontSize: 18, marginRight: 8}}>{snippet.displayName ? snippet.displayName : snippet.name}</Text>
              {snippet.username && <Text style={{color: theme.colors.grey2}}>@{snippet.username}</Text>}
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
    const {emoji, activityName, onPress} = this.props
    return (
      <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress = {onPress}>
          <View style = {{marginLeft: 8, flexDirection: "row", alignItems: 'center'}}>
            <Text style={{fontSize: 24}}>{emoji}</Text>
            <Text style = {{marginLeft: 6, fontSize: 18}} >{activityName}</Text>
          </View>
      </TouchableOpacity>
    )
  }
}