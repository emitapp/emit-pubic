import { Picker } from 'emoji-mart-native'; //TODO: Not a fan of this, might change it
import React from 'react';
import { Alert, Linking, Pressable, SectionList, View } from 'react-native';
import { Button, Overlay, SearchBar, Text, ThemeConsumer } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { ClearHeader } from 'reusables/Header';
import { ActivityListElement } from 'reusables/ListElements';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { MinorActionButton } from 'reusables/ReusableButtons';
import { getAllActivities } from 'utils/activitesList';
import { analyticsLogSearch } from 'utils/analyticsFunctions';
import {analyticsCustomActivity} from 'utils/analyticsFunctions'

export default class NewBroadcastFormActivity extends React.Component {

  state = {
    query: "",
    gettingCustom: false,
    defaultEmoji: "🔥" //Only for when custom activity is being made
  }


  static navigationOptions = () => {
    return ClearHeader("New Flare")
  };

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>

              <Overlay
                overlayStyle={{ width: "90%" }}
                onBackdropPress={() => { this.setState({ gettingCustom: false }) }}
                onDismiss={() => { this.setState({ gettingCustom: false }) }}
                isVisible={this.state.gettingCustom}>
                <>
                  <Text style={{ textAlign: "center", fontSize: 20, justifyContent: "center", fontWeight: "bold" }}>
                    <Text style={{ fontSize: 40 }}>{this.state.defaultEmoji} </Text>
                    {this.state.query}
                  </Text>

                  <Text style={{ textAlign: "center", marginTop: 16 }}>
                    Choose an emoji to replace the default 🔥 (optional)
                  </Text>
                  <Picker
                    native={true}
                    onSelect={emoji => this.useCustomActivity(emoji)} />

                  <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                    <MinorActionButton
                      title="Close"
                      onPress={() => { this.setState({ gettingCustom: false }) }} />

                    <Button
                      title="Done"
                      onPress={() => this.useCustomActivity(this.state.defaultEmoji)}
                      buttonStyle = {{paddingHorizontal: 25, marginHorizontal: 16}} />
                  </View>
                </>
              </Overlay>


              <SearchBar
                autoCapitalize="none"
                placeholder="Search or Create New Activity"
                onChangeText={query => this.setState({ query })}
                value={this.state.query}
                containerStyle={{ marginTop: 24 }}
                onBlur={() => {
                  if (this.state.query) analyticsLogSearch(this.state.query)
                }}
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

  useCustomActivity = (emoji) => {
    const activityText = this.state.query.trim()
    analyticsCustomActivity(emoji, activityText)
    this.setState(
      { gettingCustom: false },
      () => this.saveActivity(emoji.native, activityText))
  }

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

  renderHeader = () => {
    return (
      <View>
        <Button
          style={{ alignItems: "center", backgroundColor: "lightgrey", padding: 8, flexDirection: "row", justifyContent: "center" }}
          onPress={() => this.setState({ gettingCustom: true })}
          icon={<Icon name="plus" size={30} color="white" />}
          title="Make custom activity"
        />
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
}