import AsyncStorage from '@react-native-community/async-storage';
import React, { ReactNode } from 'react';
import { Image, Platform, Text, ViewProps } from 'react-native';
import { AssetType, parse } from 'twemoji-parser';
import { logError, SHOULD_USE_TWEMOJIS } from 'utils/helpers';
import { events, subscribeToEvent, unsubscribeToEvent } from 'utils/subcriptionEvents';

/**
 * The standard way to show flare emojis. Twemojis are supported but currently disabled
 */
//TODO: Doesn't have a proper way to make sure that the input is just one emoji due to unicode dark magic
//TODO: Consider using svgs instead of pngs (for twemoji)
//TODO: ios emojis a bit smaller...
interface EmojiProps {
  emoji: string,
  size: number
}

interface EmojiState {
  twemojiUrl: string,
  twemojiEmoji: string, //This is only for testing purposes,
  shouldUseTwemoji: boolean
}

const DEFAULT_EMOJI = "🔥"
const DEFAULT_SHOULD_USE_TWEMOJI = false

export default class Emoji extends React.PureComponent<EmojiProps & ViewProps, EmojiState> {
  static defaultProps: EmojiProps = {
    emoji: DEFAULT_EMOJI,
    size: 30
  }

  state: EmojiState = {
    twemojiUrl: "",
    twemojiEmoji: "",
    shouldUseTwemoji: DEFAULT_SHOULD_USE_TWEMOJI
  }

  initialize = (): void => {
    const assetType: AssetType = 'png'
    const options = { assetType }
    let entities = parse(this.props.emoji.trim(), options);
    if (!entities.length || !entities[0].url) entities = parse(DEFAULT_EMOJI, options);
    this.setState({ twemojiUrl: entities[0].url, twemojiEmoji: entities[0].text })
  }

  getTwemojiPreference = (): void => {
    AsyncStorage.getItem(SHOULD_USE_TWEMOJIS)
      .then(pref => this.setState({shouldUseTwemoji: pref !== null}))
      .catch(e => logError(e))
  }

  componentDidUpdate(): void {
    this.initialize()
  }

  componentDidMount(): void {
    this.initialize()
    this.getTwemojiPreference()
    subscribeToEvent(events.EMOJI_SETTINGS_CHANGED, this, this.getTwemojiPreference)
  }

  componentWillUnmount() : void {
    unsubscribeToEvent(events.EMOJI_SETTINGS_CHANGED, this)
  }


  render(): ReactNode {
    if (!this.state) return null
    const { emoji, style, size, ...otherProps } = this.props
    if (this.state.shouldUseTwemoji && this.state.twemojiUrl) {
      const imageSize = size * 1.15 //best guess based on looks; styling dimensions and font size not 1:1
      return (
        <Image
          source={{ uri: this.state.twemojiUrl }}
          style={{ height: imageSize, width: imageSize, ...(style as Record<string, string | number>) }}
          resizeMode="contain"
          {...otherProps} />
      )
    } else {
      const increasedSize = size * ( Platform.OS === "ios" ? 1.2 : 1.4);
      return (
        //Chose these props to also handle emojis that aren't 
        //supported by the device and are hence represented as more than 1 emoji
        <Text
          style={{ 
            fontSize: 100, height: increasedSize, 
            textAlign: "center", ...(style as Record<string, string | number>) 
          }}
          adjustsFontSizeToFit
          numberOfLines={1}
          ellipsizeMode="clip"
          {...otherProps}>
          {emoji}
        </Text>
      )
    }
  }
}