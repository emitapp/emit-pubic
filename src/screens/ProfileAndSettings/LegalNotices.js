import React, { Component } from 'react';
import { FlatList, Linking, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-elements';
import LicensesListItem from 'reusables/LicensesListElement';
import S from 'styling';
import CustomLicenseData from 'data/depencencyLicensesCustom';
import LicenseData from 'data/dependencyLicenses';
import * as links from "data/LinksAndUris";

export default class LegalNotices extends Component {

  state = {data: []}

  componentDidMount(){
    const data = []
    for (const packageName in LicenseData) {
      data.push({packageName, ...LicenseData[packageName]})
    }
    data.push.apply(data, CustomLicenseData)
    this.setState({data})
  }

  render() {
    return (
      <View style={S.styles.container}>

          <Button
            title = "Terms of Service"
            onPress={() => Linking.openURL(links.TERM_OF_SERVICE) }
          />
          <Button
            title = "Privacy Policy"
            onPress={() => Linking.openURL(links.PRIVACY_POLICY) }
          />

        <Divider />
        <Text style = {{margin: 8, fontWeight: "bold"}}>
          Open source packages used
        </Text>
        <Divider />
        <FlatList
          style={{flex: 1, width: "100%"}}
          keyExtractor={( item ) => item.packageName || item.title}
          data={this.state.data}
          renderItem={({ item }) => <LicensesListItem item = {item} />}
        />
      </View>
    );
  }
}