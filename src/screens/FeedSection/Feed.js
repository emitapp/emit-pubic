import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { geohashQueryBounds } from 'geofire-common';
import React from 'react';
import { View } from 'react-native';
import { PERMISSIONS } from 'react-native-permissions';
import FeedEmptyState from 'reusables/FeedEmptyState';
import MergedSectionInfiniteScroll from 'reusables/lists/MergedSectionInfiniteScroll';
import EmailVerificationBanner from 'reusables/schoolEmail/EmailVerificationBanner';
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents';
import S from 'styling';
import { checkAndGetPermissions } from 'utils/AppPermissions';
import { GetGeolocation, isFalsePositiveNearbyFlare, PUBLIC_FLARE_RADIUS_IN_M, RecordLocationToBackend } from 'utils/geo/GeolocationFunctions';
import { logError } from 'utils/helpers';
import { getOrgoHashAssociatedWithUser } from 'utils/orgosAndDomains';
import { DEFAULT_DOMAIN_HASH, PUBLIC_FLARE_COL_GROUP, responderStatuses, SHORT_PUBLIC_FLARE_COL_GROUP } from 'utils/serverValues';
import EmittedFlareElement from './EmittedFlareElement';
import FeedElement from './FeedElement';

export default class ActiveBroadcasts extends React.Component {

  geolocationTimeoutId = 0
  _isMounted = true

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
        ref: firestore().collectionGroup(PUBLIC_FLARE_COL_GROUP).where('owner.uid', '==', auth().currentUser.uid),
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

  componentWillUnmount(){
    this._isMounted = false
    clearTimeout(this.geolocationTimeoutId)
  }

  render() {
    if (this.state.gettingGeolocation) return (<SmallLoadingComponent />)
    return (
      <View style={S.styles.containerFlexStart}>
        {/* Commented out due to Emit end of life. */}
        {/* <EmailVerificationBanner /> */}
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
      <FeedEmptyState />
    )
  }

  finishSettingUpFeed = async () => {
    //FIXME: //TODO: This is a bandaid for a strange bug where, on first app open,
    //when the user is presented with the permissions dialogue and they grant location permissions,
    //the feed stays on the loading state sometimes. This type of strange behaviour is consistent
    //with some other strange behaviours related to permission asking.
    //No idea why this happens, so this is a quick fix since it really disrupts UX in this case.
    this.geolocationTimeoutId = setTimeout(() => {
      this.geolocationTimeoutId = 0
      this.setState({gettingGeolocation: false})
    }, 7000) 
    
    try {
      const permissionsGranted = await checkAndGetPermissions({ required: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] })
      if (!permissionsGranted) {
        this.setState({
          errorMessage: "Your feed might not be complete; Emit doesn't have location permissions to find nearby flares!",
          gettingGeolocation: false
        })
        return
      }

      GetGeolocation(position => {
        const coords = position.coords
        this.addRefsForPublicFlares(coords)
        RecordLocationToBackend(coords)
      });

    } catch (err) {
      this.setState({
        errorMessage: "Your feed might not be complete; Emit has an error getting your location to find nearby flares!",
        gettingGeolocation: false
      })
      logError(err)
    }
  }

  addRefsForPublicFlares = async (coords) => {
    const { longitude, latitude } = coords
    const center = [latitude, longitude];
    this.geolocation = center
    const bounds = geohashQueryBounds(center, PUBLIC_FLARE_RADIUS_IN_M);
    const hash = await getOrgoHashAssociatedWithUser(auth().currentUser.uid)
    const allDomains = [DEFAULT_DOMAIN_HASH]
    if (hash) allDomains.push(hash)

    for (const b of bounds) {
      for (const domain of allDomains){
        this.dbrefs.push(
          {
            ref: firestore().collection("shortenedPublicFlares").doc(domain).collection(SHORT_PUBLIC_FLARE_COL_GROUP),
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
    }

    if (!this._isMounted) return
    this.setState({ gettingGeolocation: false })
  }

  isValidPublicFlare = (flare) => {
    if (flare.owner.uid == auth().currentUser.uid) return false
    return !isFalsePositiveNearbyFlare(flare, this.geolocation)
  }
}
