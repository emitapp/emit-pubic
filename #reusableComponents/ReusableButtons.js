import React from 'react';
import { Button, withTheme } from 'react-native-elements';

function MinorActionButtonComponent(props) {
    const { theme } = props;
    return <Button titleStyle = {{color: theme.colors.grey2}} type = "clear"  {...props} />;
}
const MinorActionButton = withTheme(MinorActionButtonComponent)

export {MinorActionButton}