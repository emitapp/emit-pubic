import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable } from 'react-native';


/**
 * This component is a KeyboardAvoidng component that's enabled only for Ios (android doesn't need it)
 */
export class IosOnlyKeyboardAvoidingView extends React.Component {
  render() {
    const { style, ...otherProps } = this.props
    return (
      <KeyboardAvoidingView
        behavior={"padding"}
        style={{ flex: 1, justifyContent: 'center', ...style }}
        enabled={Platform.OS === "ios" ? true : false}
        {...otherProps} />
    )
  }
}


/**
 * This component is a combines a IosOnlyKeyboardAvoidingView with a Pressable that dismisses the keyboard
 * Only use this if a ScrollableView isn't being used - scrollableViews already handle keyboard dismissals
 * and Large Pressables and Scrollviews don't play well together as they fight for touch events
 */
export class KeyboardAvoidingAndDismissingView extends React.Component {
  render() {
    const { style, keyboardAvoidProps, children, ...otherProps } = this.props
    return (
      <Pressable onPress={Keyboard.dismiss}
        style={{ flex: 1, justifyContent: 'center', ...style }} {...otherProps}>
        <IosOnlyKeyboardAvoidingView {...keyboardAvoidProps}>
          {children}
        </IosOnlyKeyboardAvoidingView>
      </Pressable>
    )
  }
}

