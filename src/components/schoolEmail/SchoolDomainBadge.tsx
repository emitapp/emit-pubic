import { domainInfo } from 'data/schoolDomains';
import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { Text, Tooltip } from 'react-native-elements';
import { isSchoolDomain } from 'utils/emailHelpers';
import SchoolEmblemDisplayer from './SchoolEmblemDisplayer';

export interface SchoolDomainBadgeProps extends ViewProps {
    domainInfo: domainInfo
    tooltipMessage: (d: domainInfo) => string
    tooltipWidth?: number
    tooltipHeight?: number,
    style: ViewStyle
}

export default class SchoolDomainBadge extends React.PureComponent<SchoolDomainBadgeProps> {
    render(): React.ReactNode | null {
        const { domainInfo: info, tooltipMessage, tooltipHeight, tooltipWidth } = this.props
       if (!isSchoolDomain(info.domain)) return null;

        return (
            <Tooltip
                popover={<Text>{tooltipMessage(info)}</Text>}
                height={tooltipHeight}
                width={tooltipWidth}
                skipAndroidStatusBar={true}
            >
                <View style={{...styles.mainBadgeStyle, ...this.props.style }}>
                    <SchoolEmblemDisplayer domainInfo={info} />
                    <Text>{info.shortName}</Text>
                </View>

            </Tooltip>
        )
    }
}


const styles = StyleSheet.create({
    mainBadgeStyle: {
        backgroundColor: "lightgrey", 
        flexDirection: "row", 
        justifyContent: "center", 
        alignItems: "center", 
        padding: 4, 
        borderRadius: 8
    },
  });