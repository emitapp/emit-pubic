import React from 'react';
import { View } from 'react-native';
import { Text, withTheme } from 'react-native-elements';

class EmptyState extends React.Component {
    static defaultProps = {
        style: { flex: 1, width: "100%" }  
    }

    render() {
        return (
            <View style = {{...this.props.style, alignItems: "center", justifyContent: "center"}}>
                {this.props.image}
                <Text h4 h4Style={{fontWeight: "bold"}}>{this.props.title}</Text>
                <Text style={{color: this.props.theme.colors.grey1, textAlign: "center"}}>{this.props.message}</Text>
            </View>
        )
    }
}

export default withTheme(EmptyState)