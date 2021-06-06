import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { geohashQueryBounds } from 'geofire-common';
import React from 'react';
import { Image, View } from 'react-native';
import { Button } from 'react-native-elements';
import { PERMISSIONS } from 'react-native-permissions';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { SmallLoadingComponent } from 'reusables/LoadingComponents';
import MergedSectionInfiniteScroll from 'reusables/MergedSectionInfiniteScroll';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { GetGeolocation, PUBLIC_FLARE_RADIUS_IN_M, isFalsePositiveNearbyFlare } from 'utils/GeolocationFunctions';
import { logError } from 'utils/helpers';
import { responderStatuses } from 'utils/serverValues';
import EmittedFlareElement from './EmittedFlareElement';
import FeedElement from './FeedElement';

export default class ActiveBroadcasts extends React.Component {

  constructor(props) {
    super(props)
    this.emittedTitle = "HOSTING"
    this.joinedTitle = "JOINED"
    this.upcomingTitle = "FEED"

    this.dbrefs = [
      //Flares you've emitted
      {
        ref: database().ref(`/activeBroadcasts/${auth().currentUser.uid}/public`),
        title: this.emittedTitle,
        orderBy: ["deathTimestamp"],
        isFirestore: false,
        startingPoint: null,
        endingPoint: null
      },
      {
        ref: firestore().collection("publicFlares").where('owner.uid', '==', auth().currentUser.uid),
        whereConditionProvided: true,
        title: this.emittedTitle,
        isFirestore: true,
        limit: 10,
        tag: "public"
      },

      //Flares you've responded to
      {
        ref: database().ref(`/feeds/${auth().currentUser.uid}`),
        title: this.joinedTitle,
        orderBy: ["status"],
        filter: (item) => item.status == responderStatuses.CONFIRMED,
        startingPoint: "confirmed",
        endingPoint: "confirmed",
        isFirestore: false
      },
      {
        //FIXME: This isn't implimented yet. Currently part of this.finishSettingUpFeed()
        ref: database().ref('/joinedPublicFlares/'),
        title: this.joinedTitle,
        orderBy: ["startingTime"],
        startingPoint: auth().currentUser.uid,
        endingPoint: auth().currentUser.uid,
        isFirestore: false,
        tag: "public"
      },

      //Flares you haven't responded to
      {
        ref: database().ref(`/feeds/${auth().currentUser.uid}`),
        title: this.upcomingTitle,
        orderBy: ["deathTimestamp"],
        filter: (item) => item.status != responderStatuses.CONFIRMED,
        isFirestore: false,
        staringPoint: null,
        endingPoint: null
      },
      //The public flare version of this is added in  this.finishSettingUpFeed()
    ]

    this.generation = 0;
    this.state = {
      rerender: 0,
      errorMessage: null,
      gettingGeolocation: true,
    }
    this.geolocation = null //[latitude, longitude]
  }

  componentDidMount() {
    this.finishSettingUpFeed()
  }

  render() {
    if (this.state.gettingGeolocation) return (<SmallLoadingComponent />)
    return (
      <View style={S.styles.containerFlexStart}>
        <ErrorMessageText message={this.state.errorMessage} />
        <MergedSectionInfiniteScroll
          refs={this.dbrefs}
          renderItem={this.itemRenderer}
          generation={this.state.rerender}
          emptyStateComponent={this.renderEmptyState()}
          ItemSeparatorComponent={() => null}
        />
      </View>
    )
  }

  itemRenderer = ({ item, section: { title } }) => {
    if (title == this.emittedTitle) {
      return (<EmittedFlareElement item={item} isPublicFlare={item.tag == "public"} />)
    } else {
      return (<FeedElement item={item} isPublicFlare={item.tag == "public"} />)
    }
  }

  renderEmptyState = () => {
    return (
      <EmptyState
        image={
          <Image source={require('media/NoActiveBroadcasts.png')}
            style={{ height: 100, marginBottom: 8 }}
            resizeMode='contain' />
        }
        title="Pretty chill day, huh?"
        message="Flares you make and flares visible to you and join will appear here"
      >
        <Button
          title="Add friends"
          onPress={() => this.props.navigation.navigate('UserFriendSearch')}
          buttonStyle={{ borderWidth: 2, width: 150, height: 36, marginTop: 22 }}
          titleStyle={{ fontSize: 13 }} />
      </EmptyState>
    )
  }

  finishSettingUpFeed = async () => {
    //FIXME: //TODO: This is a bandaid for a strange bug where, on first app open,
    //when the user is presented with the permissions dialogue and they grant location permissions,
    //the feed stays on the loading state sometimes. This type of strange behaviour is consistent
    //with some other strange behaviours related to permission asking.
    //No idea why this happens, so this is a quick fix since it really disrupts UX in this case.
    setTimeout(() => this.setState({gettingGeolocation: false}), 7000) 
    
    try {
      const permissionsGranted = await checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] })
      if (!permissionsGranted) {
        this.setState({
          errorMessage: "Your feed might not be complete; Emit doesn't have location permissions to find nearby flares!",
          gettingGeolocation: false
        })
        return
      }

      GetGeolocation(this.addRefsForPublicFlares);

    } catch (err) {
      this.setState({
        errorMessage: "Your feed might not be complete; Emit has an error getting your location to find nearby flares!",
        gettingGeolocation: false
      })
      logError(err)
    }
  }

  addRefsForPublicFlares = (position) => {
    const { longitude, latitude } = position.coords
    const center = [latitude, longitude];
    this.geolocation = center
    const bounds = geohashQueryBounds(center, PUBLIC_FLARE_RADIUS_IN_M);

    for (const b of bounds) {
      this.dbrefs.push(
        {
          ref: firestore().collection("shortenedPublicFlares"),
          orderBy: ["geoHash"],
          title: this.upcomingTitle,
          isFirestore: true,
          filter: this.isValidPublicFlare,
          tag: "public",
          startingPoint: b[0],
          endingPoint: b[1],
          limit: 10
        },
      )
    }

    this.setState({ gettingGeolocation: false })
  }

  isValidPublicFlare = (flare) => {
    if (flare.owner.uid == auth().currentUser.uid) return false
    return !isFalsePositiveNearbyFlare(flare, this.geolocation)
  }
}
