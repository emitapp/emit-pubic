import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import ProfilePicDisplayer from 'reusables/ProfilePicComponents';
import S from 'styling';
import {Text, ThemeConsumer} from 'react-native-elements'

/**
 * Standard ListView element component for viewing user snippets.
 * Required props: snippet (the snippet to display) and onPress 
 * Optional props: extraComponents, style
 */
export class UserSnippetListElement extends React.PureComponent {

  render() {
    const snippet = this.props.snippet
    return (
      <ThemeConsumer>
      {({ theme }) => (
        <TouchableOpacity 
        style = {{...S.styles.listElement, ...this.props.style}}
        onPress={this.props.onPress}>
          <ProfilePicDisplayer diameter = {55} uid = {snippet.uid} style = {{marginRight: 16}} />
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