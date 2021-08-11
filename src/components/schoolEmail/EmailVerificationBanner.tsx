import auth from '@react-native-firebase/auth';
import { getSchoolInfoFromDomain } from 'data/schoolDomains';
import React, { PureComponent, ReactNode } from 'react';
import { Dimensions, Pressable, StyleSheet, Text } from 'react-native';
import theme from 'styling/mainTheme';
import { getDomainFromEmail, isSchoolDomain } from 'utils/emailHelpers';
import NavigationService from 'utils/NavigationService';
import { events, subscribeToEvent, unsubscribeToEvent } from 'utils/subcriptionEvents';
const { width } = Dimensions.get('window');

export default class EmailVerificationBanner extends PureComponent {

  componentDidMount() : void {
    //Re-render whenever the current user's info has changed
    subscribeToEvent(events.NEW_AUTH, this, () => this.setState({}))
  }

  componentWillUnmount() : void {
    unsubscribeToEvent(events.NEW_AUTH, this)
  }

  render() : ReactNode | null {
    if (!this.shouldShowBanner()) return null;
    const shortName = getSchoolInfoFromDomain(this.getDomain()).shortName
    return (
      <Pressable style={{ ...styles.banner }} onPress={() => NavigationService.navigate("SettingsMain")}>
        <Text style = {styles.text} adjustsFontSizeToFit={true} numberOfLines={1}>
          Verify your {shortName} email to see {shortName}-only flares (coming soon).
        </Text>
      </Pressable>
    );
  }

  shouldShowBanner = (): boolean => {
    const email = auth().currentUser?.email
    if (!email) return false
    if (!isSchoolDomain(getDomainFromEmail(email))) return false
    if (auth().currentUser?.emailVerified) return false
    return true
  }

  getDomain = (): string => {
    const email = auth().currentUser?.email
    if (!email) return ""
    return getDomainFromEmail(email)
  }
}


const styles = StyleSheet.create({
  banner: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width,
    backgroundColor: theme.colors?.softRed
  },
  text: {
    marginHorizontal: 8,
    color: "white"
  }
});