import React from 'react'
import { StyleSheet, Platform, Image, Text, View, Button } from 'react-native'

export default class ActiveBroadcasts extends React.Component {

    render() {
      return (
        <View style={styles.container}>
          <Text>
            Active Broadcasts 
          </Text>
        </View>
      )
    }
}
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })