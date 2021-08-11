import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import React from 'react'
import { View } from "react-native"
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents'
import { Text, ThemeConsumer } from 'react-native-elements'
import { logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { SmallLoadingComponent } from 'reusables/ui/LoadingComponents'
import AutofetchingSchoolDomainBadge from 'reusables/schoolEmail/AutofetchingSchoolDomainBadge';

//Optional Props: imageDiameter
export default class Summary extends React.Component {

  static defaultProps = {
    imageDiameter: 150,
  }

  constructor(props) {
    super(props);
    this.state = { snippet: null };
    this._isMounted = false; //Using this is an antipattern, but simple enough for now
  }

  componentDidMount() {
    this._isMounted = true
    this.getSnippet()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <View style={{ justifyContent: "center", alignItems: "center", ...this.props.style }}>
            <ProfilePicDisplayer
              diameter={this.props.imageDiameter}
              uid={auth().currentUser.uid}
              ref={ref => this.pictureComponet = ref} />
            {this.state.snippet &&
              <View>
                <Text h4 h4Style={{ fontFamily: "NunitoSans-Black", marginTop: 8 }}>
                  {this.state.snippet.displayName}
                </Text>
                <View style = {{flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 8}}>
                  <AutofetchingSchoolDomainBadge
                    uid={auth().currentUser.uid}
                    tooltipMessage={(d) => `You have a verified ${d.shortName} email.`}
                    tooltipWidth={200}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ textAlign: "center", color: theme.colors.grey1 }}>
                    @{this.state.snippet.username}
                  </Text>
                </View>

              </View>
            }
            {!this.state.snippet &&
              <SmallLoadingComponent />
            }
          </View>
        )}
      </ThemeConsumer>
    )
  }

  getSnippet = async () => {
    try {
      const uid = auth().currentUser.uid;
      const ref = database().ref(`/userSnippets/${uid}`);
      const snapshot = await timedPromise(ref.once('value'), MEDIUM_TIMEOUT);
      if (snapshot.exists()) {
        if (this._isMounted) this.setState({ snippet: snapshot.val() })
      }
    } catch (err) {
      this.setState({ snippet: { displayName: "-", username: "-" } })
      if (err.name != "timeout") logError(err)
    }
  }

  refresh = () => {
    this.getSnippet()
    if (!this.pictureComponet) return;
    this.pictureComponet.refresh()
  }
}