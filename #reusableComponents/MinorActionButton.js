import React from 'react';
import { Button, withTheme } from 'react-native-elements';

function MinorActionButton(props) {
    const { theme, updateTheme, replaceTheme } = props;
    return <Button titleStyle = {{color: theme.colors.grey2}} type = "clear"  {...props} />;
}

export default withTheme(MinorActionButton);