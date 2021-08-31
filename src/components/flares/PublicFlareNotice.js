import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Tooltip, withTheme } from 'react-native-elements';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import SchoolDomainBadge from 'reusables/schoolEmail/SchoolDomainBadge';
import { getSchoolInfoFromDomain } from 'data/schoolDomains';

//Required props: flareInfo
class PublicFlareNotice extends React.PureComponent {

  render() {
    const domain = this.props.flareInfo.domain

    if (!domain) {
      return (
        <Tooltip
          popover={<Text>This flare is visible to any nearby Emit users.</Text>}
          height={100}
          withPointer={false}
          skipAndroidStatusBar={true}>
          <View style={{ ...styles.mainStyle, ...this.props.style }}>
            <AwesomeIcon name="globe" color="grey" size={24} style={{ marginRight: 8 }} />
            <Text style={{ color: "grey" }}>Public Flare</Text>
          </View>
        </Tooltip>
      )
    } else {
      return <SchoolDomainBadge
        tooltipMessage = {(domainInfo) => `This flare is only visible to nearby ${domainInfo.shortName} users.`}
        domainInfo={getSchoolInfoFromDomain(domain)}
        tooltipWidth={200}
        style={{...this.props.style }}
      />
    }


  }
}


const styles = StyleSheet.create({
  mainStyle: {
    flexDirection: "row",
    width: "auto",
    alignSelf: "flex-start",
    alignItems: "center"
  }
})

export default withTheme(PublicFlareNotice)