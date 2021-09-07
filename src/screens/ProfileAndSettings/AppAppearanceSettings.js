
import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { CheckBox, Text } from 'react-native-elements'
import Emoji from 'reusables/ui/Emoji'
import { logError, SHOULD_USE_TWEMOJIS } from 'utils/helpers';
import { events, subscribeToEvent, unsubscribeToEvent, emitEvent } from 'utils/subcriptionEvents';
import AsyncStorage from '@react-native-community/async-storage';


const EMOJI_SAMPLE_FONT_SIZE = 25

export default class ContactSupportPage extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: "Appearance Settings",
    };
  };

  state = { shouldUseTwemoji: false }

  componentDidMount() {
    AsyncStorage.getItem(SHOULD_USE_TWEMOJIS)
      .then(pref => this.setState({ shouldUseTwemoji: pref !== null }))
      .catch(e => logError(e))
  }

  render() {
    return (
      <ScrollView
        style={{ flex: 1, marginTop: 8 }}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginHorizontal: 8,
          paddingBottom: 16
        }}>

        <CheckBox
          title='Use Twitter-style emojis'
          fontFamily="NunitoSans-Regular"
          checked={this.state.shouldUseTwemoji}
          containerStyle={{ alignSelf: "flex-start", padding: 0, marginBottom: 0 }}
          onPress={this.setTwemojiPreference}
        />

        <Text style={styles.emojiPreviewHeader}>Current emoji style:</Text>
        <View style={styles.emojiRow}>
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="🥳" />
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="🍟" />
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="🇺🇳" />
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="❤️" />
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="🔥" />
          <Emoji size={EMOJI_SAMPLE_FONT_SIZE} emoji="🏃" />
        </View>

      </ScrollView>
    )
  }

  setTwemojiPreference = () => {
    if (this.state.shouldUseTwemoji) {
      AsyncStorage.removeItem(SHOULD_USE_TWEMOJIS)
        .then(pref => this.setState({ shouldUseTwemoji: false }))
        .catch(e => logError(e))
    } else {
      AsyncStorage.setItem(SHOULD_USE_TWEMOJIS, "yes")
        .then(pref => this.setState({ shouldUseTwemoji: true }))
        .catch(e => logError(e))
    }

    emitEvent(events.EMOJI_SETTINGS_CHANGED)
  }
}

const styles = StyleSheet.create({
  emojiRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  emojiPreviewHeader: {
    marginVertical: 8
  }
});