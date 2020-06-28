import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Button, Divider, Input, Text, ThemeConsumer } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/Entypo';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { ClearHeader } from 'reusables/Header';
import { LocationListElement } from "reusables/ListElements";
import { SmallLoadingComponent } from 'reusables/LoadingComponents';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import S from 'styling';
import { isOnlyWhitespace, logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import * as recentLocFuncs from 'utils/RecentLocationsFunctions';
import {MAX_LOCATION_NAME_LENGTH} from 'utils/serverValues'
import uuid from 'uuid/v4';


export default class NewBroadcastFormLocation extends React.Component {

    constructor(props){
        super(props)
        let navigationParams = props.navigation.state.params
        this.state = {
            locationName: navigationParams.location, //Default: ""
            locationPin: {longitude: null, latitude: null},
            locationCleared: false,
            recentLocations: [],
            errorMessage: null,
            savingLocation: false
        }
        if (navigationParams.geolocation) this.state.locationPin = navigationParams.geolocation
    }

    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader(navigationOptions, "New Broadcast")
    };

    componentDidMount() {
        const { navigation } = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
            this.setState({locationCleared: false}) //Just call for a rerender (this is used when we come back from the location picker map)
        });
        recentLocFuncs.getRecentLocations()
            .then(recentLocations => this.setState({recentLocations}))
            .catch(err => {
                logError(err)
                this.setState({errorMessage: "Couldn't retrieve recent locations"})
            })
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
                <ErrorMessageText message = {this.state.errorMessage} />
                <Input
                    label="Location Name"
                    placeholder = "That Super Awesome Place"
                    onChangeText={locationName => this.setState({ locationName })}
                    value={this.state.locationName}
                    errorMessage = {this.state.locationName.length > MAX_LOCATION_NAME_LENGTH ? "Too long" : undefined}
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
                            onPress = {() => this.setState({locationPin: {longitude: null, latitude: null}, locationCleared: true})}
                        />   
                    </View>
                }

                {!this.state.savingLocation ? (
                    <MinorActionButton title = "Save Current Location" onPress = {this.saveLocation} />
                ) : (
                    <View style = {{alignSelf: "center"}}>
                        <SmallLoadingComponent />
                    </View>
                )}

                <FlatList
                    data={this.state.recentLocations}
                    renderItem={({ item, index }) => this.renderRecentLocation(item, index)}
                    ListHeaderComponent = {() => this.renderHeader(theme)}
                    ListFooterComponent = {() => this.renderFooter()}
                    style = {{marginHorizontal: 8}}
                    ItemSeparatorComponent = {() => <Divider/>}
                    keyExtractor={item => item.uid}
                />         
            </View> 
            <BannerButton
                color = {S.colors.buttonGreen}
                iconName = {S.strings.confirm}
                onPress = {this.confirmLocation}
                title = "CONFIRM"
            />         
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }  
    
    confirmLocation = (addToRecents = true) => {
        if (isOnlyWhitespace(this.state.locationName)){
            Snackbar.show({text: 'Enter a name for your location.', duration: Snackbar.LENGTH_SHORT});
            return
        }
        if (this.state.locationName.length > MAX_LOCATION_NAME_LENGTH){
            Snackbar.show({text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT});
            return
        }
        this.props.navigation.state.params.location = this.state.locationName
        const locationToSave = {name: this.state.locationName, uid: uuid()} 
        if (this.state.locationPin.latitude != null){
            this.props.navigation.state.params.geolocation = this.state.locationPin
            locationToSave.geolocation = this.state.locationPin
        }
        if (this.state.locationCleared){
            this.props.navigation.state.params.geolocation = null
        }
        if (addToRecents) recentLocFuncs.addNewLocation(locationToSave)   
        this.props.navigation.goBack()
    }

    saveLocation = async () => {
        if (isOnlyWhitespace(this.state.locationName)){
            Snackbar.show({text: 'Enter a name for your location.', duration: Snackbar.LENGTH_SHORT});
            return
        }
        if (this.state.locationName.length > MAX_LOCATION_NAME_LENGTH){
            Snackbar.show({text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT});
            return
        }
        this.setState({savingLocation: true, errorMessage: null})
        let location = {name: this.state.locationName}
        if (this.state.locationPin.latitude !== null) location.geolocation = this.state.locationPin
        try{
            await timedPromise(
                database().ref(`/savedLocations/${auth().currentUser.uid}`).push(location),
                MEDIUM_TIMEOUT
            )
            Snackbar.show({text: 'Saved location', duration: Snackbar.LENGTH_SHORT});
        }catch(err){
            if (err.code == "timeout"){
                Snackbar.show({text: 'Timeout', duration: Snackbar.LENGTH_SHORT});
            }else{
                this.setState({errorMessage: "Something went wrong."})
                logError(err)        
            }
        }
        this.setState({savingLocation: false})
    }

    renderHeader = (theme) => {
        return (
            <TouchableOpacity 
                style = {{
                    ...S.styles.listElement, 
                    marginVertical: 8, 
                    width: "100%", backgroundColor: theme.colors.grey4,
                    borderRadius: 8}}
                onPress = {() => this.props.navigation.navigate("SavedLocations", this.props.navigation.state.params)}
            >
                <View style = {{width: 40}}>
                    <Icon name="star" size={20} style = {{marginHorizontal: 8}}/>
                </View>
                <Text style = {{fontSize: 16, flex: 1}}>
                Saved Locations
                </Text>
                <Icon name="chevron-right" size={20} style = {{marginHorizontal: 8}}/>
            </TouchableOpacity>
        )
    }

    renderRecentLocation = (item, index) => {
        return (
            <LocationListElement 
                locationInfo = {item}
                onPress = {() => {
                    const newState = {locationName: item.name}
                    if (item.geolocation) newState.locationPin = item.geolocation
                    recentLocFuncs.bubbleToTop(index)
                    this.setState(newState, () => this.confirmLocation(false))
                }}
            />
        )
    }

    renderFooter = () => {
        if (this.state.recentLocations.length == 0) return null
        return (
            <MinorActionButton 
                title = "Clear Recent List"
                onPress = {() => {
                    recentLocFuncs.clearRecentLocations()
                        .then(() => this.setState({recentLocations: []}))
                        .catch(err => {
                            logError(err)
                            this.setState({errorMessage: "Couldn't clear recent locations"})
                        })
                }}
            />
        )
    }
    
}