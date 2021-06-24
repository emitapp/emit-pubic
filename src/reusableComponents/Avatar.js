import { SvgXml } from 'react-native-svg';
import multiavatar from '@emitapp/multiavatar';
import React from 'react';
import { View } from 'react-native';

/**
 * Required prop: seed, style of at least {width, height}
 * optional prop: hideBackground square
 */
export default class Avatar extends React.PureComponent {
    render() {
        const { style, ...otherProps } = this.props
        if (!this.props.seed) return null
        return (
            <View {...this.props}>
                <SvgXml
                    xml={multiavatar(this.props.seed, this.props.hideBackground, this.props.square)}
                    height={style.height}
                    width={style.width} />
            </View>
        )
    }
}
