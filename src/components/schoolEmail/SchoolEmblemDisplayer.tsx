import { domainInfo } from 'data/schoolDomains';
import React from 'react';
import { Image, View, ViewProps } from 'react-native';

interface SchoolEmblemDisplayerProps extends ViewProps {
    domainInfo: domainInfo
}

export default class SchoolEmblemDisplayer extends React.PureComponent<SchoolEmblemDisplayerProps> {
    render(): React.ReactNode | null {
        return (
            <View>
                <Image
                    style={{ height: 25, width: 35}}
                    resizeMode="contain"
                    source={this.props.domainInfo.photo}
                />
            </View>
        )
    }
}
