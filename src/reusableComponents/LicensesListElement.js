//Inspired by https://blog.expo.io/licenses-the-best-part-of-your-app-29e7285b544f
import React, { PureComponent } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import {Avatar, Text} from 'react-native-elements'
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

export default class LicensesListItem extends PureComponent {
  constructor(props) {
    super(props)

    this.title = null;
    this.version = null;
    this.creatorUrl = null;
    this.imageSrc = null;
    this.sourceUrl = null;
    this.licenseUrl = null;
    this.licenses = null

    this.parseData(props.item)
  }

  render() {
    const {item} = this.props;

    return (
      <View style={styles.parent}>
        {this.imageSrc &&
          <TouchableOpacity onPress={() => Linking.openURL(this.creatorUrl)}>
            <Avatar rounded source={{ uri: this.imageSrc }} containerStyle={styles.image} />
          </TouchableOpacity>
        }
        <TouchableOpacity
          underlayColor={'#eeeeee'}
          onPress={() => Linking.openURL(this.sourceUrl)}
          style={styles.textParent}>
          <View style={{ maxWidth: '90%' }}>
            <Text style={styles.name}>{this.title}</Text>
            <Text style={styles.minorText} onPress={() => this.licenseUrl && Linking.openURL(this.licenseUrl)}>{this.licenses}</Text>
            <Text style={styles.minorText}>{this.version}</Text>
          </View>
          <FontAwesome
            style={{ alignSelf: 'center' }}
            color={'#34495e'}
            size={16}
            name={'chevron-right'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  parseData = (item) => {
    if (item.custom){
      this.title = item.title;
      this.version = item.version;
      this.creatorUrl = item.creatorUrl;
      this.imageSrc = item.imageSrc;
      this.sourceUrl = item.sourceUrl;
      this.licenseUrl = item.licenseUrl;
      this.licenses = item.licenses
      return;
    }

    if (item.packageName[0] == "@"){
      var [name, version] = item.packageName.substr(1).split('@');
    }else{
      var [name, version] = item.packageName.split('@');
    }

    this.licenses = item.licenses
    this.version = version
    this.licenseUrl = item.licenseUrl
    this.sourceUrl = item.repository

    this.username =
      this.extractNameFromGithubUrl(item.repository) ||
      this.extractNameFromGithubUrl(item.licenseUrl);

    if (this.username) {
      this.username = this.capitalizeFirstLetter(this.username)
      this.imageSrc = `http://github.com/${this.username}.png`;
      this.creatorUrl = `http://github.com/${this.username}`;
    }
    
    this.title = name
    if (this.username && this.title.toLowerCase() != this.username.toLowerCase()) {
      this.title += ` by ${this.username}`;
    }
  }

  extractNameFromGithubUrl = (url) => {
    if (!url) return null;
    const reg = /((https?:\/\/)?(www\.)?github\.com\/)?(@|#!\/)?([A-Za-z0-9_-]{1,100})(\/([-a-z]{1,20}))?/i;
    const components = reg.exec(url);
    if (components && components.length > 5) return components[5];
    return null;
  }

  capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

const styles = StyleSheet.create({
  parent: {
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 6,
  },
  textParent: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  image: {
    aspectRatio: 1,
    width: 40,
  },
  name: {
    fontWeight: 'bold',
  },
  minorText: {
    color: '#34495e',
  },
});
