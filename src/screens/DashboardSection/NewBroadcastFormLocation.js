import React from 'react';
import { View, FlatList } from 'react-native';
import { Button, Input, Text, ThemeConsumer, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Entypo';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import {LocationListElement} from "reusables/ListElements"
import S from 'styling';
import {BannerButton} from 'reusables/ReusableButtons'

export default class NewBroadcastFormLocation extends React.Component {

    constructor(props){
        super(props)
        let navigationParams = props.navigation.state.params
        this.state = {locationName: navigationParams.location, locationPin: {longitude: null, latitude: null}}
        if (navigationParams.geolocation) this.state.locationPin = navigationParams.geolocation

        this.data = [
            {name: "Accra Mall", geolocation: "something"},
            {name: "Somewhere else", geolocation: "something"},
            {name: "Some other place bi"},
            {name: "Hell idk another place this is a really long name jus testing how this workds"},
            {name: "Oga you get the idea", geolocation: "something"},
            {name: "Accra Mall", geolocation: "something"},
            {name: "Somewhere else", geolocation: "something"},
            {name: "Some other place bi"},
            {name: "Hell idk another place"},
            {name: "Oga you get the idea", geolocation: "something"},
        ]
    }

    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader(navigationOptions, "New Broadcast")
    };

    componentDidMount() {
        const { navigation } = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
            this.setState({}) //Just call for a rerender
        });
    }
    
    componentWillUnmount() {
        this.focusListener.remove();
    }

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                <Text h4 h4Style={{marginVertical: 8, fontWeight: "bold"}}>
                    Where will you be?
                </Text>
                <Input
                    label="Location Name"
                    placeholder = "That Super Awesome Place"
                    onChangeText={locationName => this.setState({ locationName })}
                    value={this.state.locationName}
                />
                { this.state.locationPin.latitude == null &&
                    <Button
                        icon={ <Icon name="location-pin" size={30} color="black"/> }
                        titleStyle = {{color: "black"}}
                        type= "clear"
                        title="Add a Map Location"
                        onPress = {() => this.props.navigation.navigate("LocationSelector", this.state.locationPin)}
                    />    
                }
                { this.state.locationPin.latitude != null &&
                    <View style = {{flexDirection: "row", alignItems: "center", width: "100%"}}>
                        <Icon name="location-pin" size={30} color="black" style = {{marginHorizontal: 8}}/>
                        <Text style = {{flex: 1}}>Map Location Added</Text>
                        <Button
                            titleStyle = {{color: "black"}}
                            type= "clear"
                            title="Edit"
                            onPress = {() => this.props.navigation.navigate("LocationSelector", this.state.locationPin)}
                        />   
                        <Button
                            titleStyle = {{color: "red"}}
                            type= "clear"
                            title="Clear"
                            onPress = {() => this.setState({locationPin: {longitude: null, latitude: null}})}
                        />   
                    </View>
                }
                <FlatList
                    data={this.data}
                    renderItem={({ item }) => (<LocationListElement locationInfo = {item}/>)}
                    ListHeaderComponent = {() => this.renderHeader(theme)}
                    style = {{marginHorizontal: 8}}
                    ItemSeparatorComponent = {() => <Divider/>}
                />         
            </View> 
            <BannerButton
                color = {S.colors.buttonGreen}
                iconName = {S.strings.confirm}
                onPress = {this.saveLocation}
                title = "CONFIRM"
            />         
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }  
    
    saveLocation = () => {
        this.props.navigation.state.params.location = this.state.locationName
        if (this.state.locationPin.latitude != null)
            this.props.navigation.state.params.geolocation = this.state.locationPin
        this.props.navigation.goBack()
    }

    renderHeader = (theme) => {
        return (
            <View style = {{
                ...S.styles.listElement, 
                marginVertical: 8, 
                width: "100%", backgroundColor: theme.colors.grey4,
                borderRadius: 8}}>
                <View style = {{width: 40}}>
                    <Icon name="star" size={20} style = {{marginHorizontal: 8}}/>
                </View>
                <Text style = {{fontSize: 16, flex: 1}}>
                Saved Locations
                </Text>
                <Icon name="chevron-right" size={20} style = {{marginHorizontal: 8}}/>
            </View>
        )
    }
    
}