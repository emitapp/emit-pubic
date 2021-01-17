import React from 'react';
import { Button, withTheme, Icon, Text } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import styles from 'styling/styles';

function MinorActionButtonComponent(props) {
    const { theme } = props;
    return <Button titleStyle = {{color: theme.colors.grey2}} type = "clear"  {...props} />;
}

function AdditionalOptionsButtonComponent(props) {
    const { theme } = props;
    return (
    <Icon
        name='ellipsis-h'
        type='font-awesome'
        iconStyle = {{marginHorizontal: 8}}
        color = {theme.colors.grey2}
        {...props}
    />
    )
}

class BannerButtonComponent extends React.PureComponent {

    static defaultProps = {
        contentColor: "white"
    }

    render() {
        const { theme } = this.props;
        const backgroundColor = this.props.color ?? theme.colors.bannerButton
        return (
            <TouchableOpacity 
                style = {[styles.bannerButton, {backgroundColor}, {...this.props.extraStyles}]}
                onPress={this.props.onPress}>
                <AwesomeIcon name={this.props.iconName} size={18} color={this.props.contentColor} style = {{marginRight: 18}} />
                <Text style = {{color: this.props.contentColor, fontWeight: "bold"}}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}

class PillButtonComponent extends React.PureComponent {
    render() {
        const { theme } = this.props;
        const backgroundColor = this.props.color ?? theme.colors.bannerButton
        return (
            <TouchableOpacity
                style = {[styles.pillButton, {backgroundColor}, {...this.props.extraStyles}]}
                onPress={this.props.onPress}>
                <Text style = {{color: this.props.contentColor, fontWeight: "bold"}}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}

const MinorActionButton = withTheme(MinorActionButtonComponent)
const AdditionalOptionsButton = withTheme(AdditionalOptionsButtonComponent)
const BannerButton = withTheme(BannerButtonComponent)
const PillButton = withTheme(PillButtonComponent)
export {MinorActionButton, AdditionalOptionsButton, BannerButton, PillButton}