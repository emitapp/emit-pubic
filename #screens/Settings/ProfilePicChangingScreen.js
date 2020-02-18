
import React from 'react'
import { View } from 'react-native'
import ProfilePicChanger from 'reusables/ProfilePicChanger'
import S from 'styling'

export default class ProfilePicChangingScreen extends React.Component {

    render() {
      return (
        <View style={S.styles.container}>
          <ProfilePicChanger/>
        </View>
      )
    }
  }
  