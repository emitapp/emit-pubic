import React from 'react';
import { Button, withTheme, Icon } from 'react-native-elements';

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

const MinorActionButton = withTheme(MinorActionButtonComponent)
const AdditionalOptionsButton = withTheme(AdditionalOptionsButtonComponent)
export {MinorActionButton, AdditionalOptionsButton}