import { Picker } from 'emoji-mart-native'; //TODO: Not a fan of this, might change it
import React from 'react';
import { Alert, Linking, Pressable, SectionList, View } from 'react-native';
import { Overlay, SearchBar, Text, ThemeConsumer } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { ClearHeader } from 'reusables/Header';
import { ActivityListElement } from 'reusables/ListElements';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { getAllActivities } from 'utils/activitesList';

export default class NewBroadcastFormActivity extends React.Component {

  state = {
    query: "",
    gettingCustom: false
  }


  static navigationOptions = ({ navigationOptions }) => {
    return ClearHeader("New Broadcast")
  };

  saveActivity = (emoji, activityName) => {
    this.props.navigation.state.params.emojiSelected = emoji;
    this.props.navigation.state.params.activitySelected = activityName;
    this.props.navigation.goBack();
  }

  itemRenderer = ({ item }) => {
    return (
      <View style={{ alignItems: "center", width: "100%", flexDirection: "row" }}>
        <ActivityListElement
          style={{ width: "100%" }}
          emoji={item.emoji}
          activityName={item.name}
          onPress={() => { this.saveActivity(item.emoji, item.name) }}
        />
      </View>
    );
  }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>

              <Overlay
                isVisible={this.state.gettingCustom}>
                <>
                  <Picker
                    native={true}
                    onSelect={emoji => this.setState(
                      { gettingCustom: false },
                      () => this.saveActivity(emoji.native, this.state.query.trim()))} />
                  <MinorActionButton
                    title="Close"
                    onPress={() => { this.setState({ gettingCustom: false }) }} />
                </>
              </Overlay>


              <SearchBar
                autoCapitalize="none"
                placeholder="Search for or type in your activity"
                onChangeText={query => this.setState({ query })}
                value={this.state.query}
                containerStyle={{ marginTop: 24 }}
              />
              <SectionList
                sections={this.getFilteredSectionData()}
                keyExtractor={item => item.name + item.emoji}
                renderItem={this.itemRenderer}
                renderSectionHeader={({ section: { sectionName } }) => (
                  <Text style={{ fontWeight: "bold", textAlign: "center", fontSize: 18, marginTop: 16 }}>
                    {sectionName}
                  </Text>
                )}
                ListHeaderComponent={this.state.query.trim() && this.renderHeader()}
              />
              <View />
            </View>
          </MainLinearGradient>
        )
        }
      </ThemeConsumer>
    )
  }

  renderHeader = () => {
    return (
      <View>
        <Pressable
          style={{ alignItems: "center", backgroundColor: "lightgrey", padding: 8, flexDirection: "row", justifyContent: "center" }}
          onPress={() => this.setState({ gettingCustom: true })}>
          <Icon name="plus" size={30} color="black" />
          <Text style={{ fontWeight: "bold" }}> Make custom activity </Text>
        </Pressable>
        <Pressable
          style={{ alignItems: "center", backgroundColor: "white", padding: 8, flexDirection: "row", justifyContent: "center", borderColor: "lightgrey", borderWidth: 1 }}
          onPress={this.goToSuggestionForm}>
          <AwesomeIcon name="lightbulb-o" size={30} color="black" />
          <Text style={{ fontWeight: "bold" }}> Suggest more activites! </Text>
        </Pressable>
      </View>

    )
  }

  getFilteredSectionData = () => {
    let activities = getAllActivities()
    let { query } = this.state
    if (!query) return activities
    query = query.toLowerCase().trim()
    //use the query to find all activites that either have a section or name
    //that fits the query
    for (const section of activities) {
      if (section.sectionName.toLowerCase().includes(query)) continue;
      section.data = section.data.filter(activity => activity.name.toLowerCase().includes(query))
    }
    //Remove sections that now have 0 activities
    activities = activities.filter(section => section.data.length > 0)
    return activities
  }

  goToSuggestionForm = async () => {
    const url = "https://forms.gle/4r75s9CHYDX8s6cGA"
    const supported = await Linking.canOpenURL(url);
    if (supported)  Linking.openURL(url);
    else Alert.alert(`Don't know how to open this URL: ${url}`);
  }
}