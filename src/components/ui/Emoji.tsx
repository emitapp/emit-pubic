import React, { ReactNode } from 'react';
import { Image, Platform, Text, ViewProps } from 'react-native';
import { AssetType, parse } from 'twemoji-parser';

/**
 * The standard way to show flare emojis. Twemojis are supported but currently disabled
 */
//TODO: Doesn't have a proper way to make sure that the input is just one emoji due to unicode dark magic
//TODO: Consider using svgs instead of pngs (for twemoji)
//TODO: ios emojis a bit smaller...

type Platforms = "ios" | "android" | "windows" | "macos" | "web"

interface EmojiProps {
  emoji: string,
  _platform: Platforms, //This is only for testing purposes
  size: number
}

interface EmojiState {
  twemojiUrl: string,
  twemojiEmoji: string, //This is only for testing purposes
}

const DEFAULT_EMOJI = "🔥"

export default class Emoji extends React.PureComponent<EmojiProps & ViewProps, EmojiState> {
  static defaultProps: EmojiProps = {
    emoji: DEFAULT_EMOJI,
    _platform: Platform.OS,
    size: 30
  }

  state = {
    twemojiUrl: "",
    twemojiEmoji: ""
  }

  initialize = (): void => {
    const assetType: AssetType = 'png'
    const options = { assetType }
    let entities = parse(this.props.emoji, options);
    if (!entities.length || !entities[0].url) entities = parse(DEFAULT_EMOJI, options);
    this.setState({ twemojiUrl: entities[0].url, twemojiEmoji: entities[0].text })
  }

  componentDidUpdate(): void {
    this.initialize()
  }

  componentDidMount(): void {
    this.initialize()
  }


  render(): ReactNode {
    if (!this.state) return null
    const { emoji, style, size, ...otherProps } = this.props
    if (this.shouldUseTwemojis() && this.state.twemojiUrl) {
      return (
        <Image
          source={{ uri: this.state.twemojiUrl }}
          style={{ height: size, width: size, ...(style as Record<string, string | number>) }}
          resizeMode="contain"
          {...otherProps} />
      )
    } else {
      return (
        //Chose these props to truncate emojis that aren't 
        //supported by the device and are hence represented as more than 1 emoji
        <Text
          style={{ fontSize: size, width: size * 1.4, ...(style as Record<string, string | number>) }}
          numberOfLines={1}
          ellipsizeMode="clip"
          {...otherProps}>
          {emoji}
        </Text>
      )
    }
  }

  shouldUseTwemojis = (): boolean => {
    return false
    //   if (__DEV__ && this.props._platform) return this.props._platform == "android"
    //   return false
  }
}