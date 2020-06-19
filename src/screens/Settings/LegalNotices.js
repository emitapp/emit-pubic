import React, { Component } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import LicensesListItem from 'reusables/LicensesListElement';
import LicenseData from 'utils/dependencyLicenses'
import S from 'styling';
import {Text, Divider} from 'react-native-elements'
import config from "react-native-ultimate-config"

export default class LegalNotices extends Component {

  state = {data: []}

  componentDidMount(){
    const data = []
    for (const packageName in LicenseData) {
      data.push({packageName, ...LicenseData[packageName]})
    }
    this.setState({data})
  }

  render() {
    return (
      <View style={S.styles.container}>
        <Text style = {{margin: 8, fontWeight: "bold"}}>
          PP and TOS
        </Text>
        <Text style = {{marginHorizontal: 16, marginBottom: 8}}>
          Find our Privacy Policy and Terms of Serivce on our website at 
          <Text style = {{fontWeight: "bold"}}>
            {" " + config.PROJECT_WEBSITE}
          </Text>
        </Text>
        <Divider />
        <Text style = {{margin: 8, fontWeight: "bold"}}>
          Open source packages used
        </Text>
        <Divider />
        <FlatList
          style={{flex: 1, width: "100%"}}
          keyExtractor={( item ) => item.packageName}
          data={this.state.data}
          renderItem={({ item }) => <LicensesListItem item = {item} />}
        />
      </View>
    );
  }
}