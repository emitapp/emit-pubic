import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import S from 'styling';

/**
 * Standard ListView element component for viewing user snippets.
 * Required props: snippet (the snippet to display) and onPress 
 * Optional props: extraComponents, style
 */
export default class UserSnippetListElement extends React.PureComponent {

  render() {
    const snippet = this.props.snippet
    return (
        <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress={this.props.onPress}>
          <ProfilePicDisplayer diameter = {50} uid = {snippet.uid} style = {{marginRight: 18}} />
          <View>
            <Text style = {{fontWeight: 'bold', fontSize: 18}}>{snippet.displayName}</Text>
            <Text style = {{fontStyle: 'italic'}}>@{snippet.username}</Text>
            {this.props.extraComponents}
          </View>
        </TouchableOpacity>
    )
  }
}