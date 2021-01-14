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
          <ProfilePicDisplayer diameter = {this.props.imageDiameter} uid = {snippet.uid} style = {{marginRight: 16}} />
          <View>
            <Text style = {{fontWeight: 'bold', fontSize: 18}}>{snippet.displayName}</Text>
            <Text style = {{color: theme.colors.grey2}}>@{snippet.username}</Text>
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