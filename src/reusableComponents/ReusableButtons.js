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

export class BannerButton extends React.PureComponent {

    render() {
        return (
            <TouchableOpacity 
                style = {[styles.bannerButton, {backgroundColor: this.props.color}, {...this.props.extraStyles}]}
                onPress={this.props.onPress}>
                <AwesomeIcon name={this.props.iconName} size={18} color= "white" style = {{marginRight: 18}} />
                <Text style = {{color: "white", fontWeight: "bold"}}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}

const MinorActionButton = withTheme(MinorActionButtonComponent)
const AdditionalOptionsButton = withTheme(AdditionalOptionsButtonComponent)
export {MinorActionButton, AdditionalOptionsButton}