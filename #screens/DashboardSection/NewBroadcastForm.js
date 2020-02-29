// Self explanatory what this does

import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { ActivityIndicator, Button, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import BannerButton from 'reusables/BannerButton';
import ProfilePicDisplayer from 'reusables/ProfilePicDisplayer';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import S from 'styling';
import { logError, LONG_TIMEOUT, MAX_BROADCAST_WINDOW, MIN_BROADCAST_WINDOW, timedPromise } from 'utils/helpers';
import { returnStatuses } from 'utils/serverValues';



export default class NewBroadcastForm extends React.Component {

    constructor(props) {
        super(props)

        this.minDate = null;
        this.maxDate = null;
        this.recalculateDateLimits()

        this.recepientOptions = {friends: "friends", groups: "groups", masks: "masks"}

        //I'm starting them off with a date that should be far enough from the 
        //actual hard cutoff to give them ample time to fill the form
        let startingDate = new Date()
        startingDate.setMilliseconds(0)
        startingDate.setSeconds(0)
        const millisecondsToAdd = (MIN_BROADCAST_WINDOW + 3) * 60 * 1000
        startingDate.setTime(startingDate.getTime() + millisecondsToAdd)

        this.state = {
            showPicker: false,
            pickerMode: "time",
            location: '',
            date: startingDate,
            errorMessage: null,
            isModalVisible: false,

            allFriends: false,
            friendRecipients: {},
            maskRecepients: {},
            groupRecepients: {},

            dispayedRecepient: this.recepientOptions.friends
        }
    }

    render() {
        const {dispayedRecepient} = this.state
        return (
            <View style={S.styles.containerFlexStart}>

                <Modal 
                    isVisible={this.state.isModalVisible}
                    style = {{justifyContent: "center", alignItems: "center"}}
                    animationIn = "fadeInUp"
                    animationOut = 'fadeOutUp'
                    animationOutTiming = {0}>
                    <ActivityIndicator />
                </Modal>

                <Text>Create a New Broadcast</Text>
                {this.state.errorMessage &&
                    <Text style={{ color: 'red' }}>
                        {this.state.errorMessage}
                    </Text>}
                <View style={styles.mainForm}>
                    <TextInput
                        style={S.styles.textInput}
                        autoCapitalize="words"
                        placeholder="Place"
                        onChangeText={location => this.setState({ location })}
                        value={this.state.location}/>

                    <Text> Time and Date</Text>
                    <View style = {{flexDirection: 'row'}}>
                        <Button onPress={() => this.showPicker('date')} title="Choose Date" />
                        <Button onPress={() => this.showPicker('time')} title="Choose Time" />
                    </View>

                    {this.state.showPicker &&
                     <DateTimePicker value={this.state.date}
                        style={{width:'100%'}}
                        mode={this.state.pickerMode}
                        is24Hour={false}
                        display="default"
                        onChange={this.setDate}
                        minimumDate={this.minDate} />
                    }

                    <Text style={{ textAlign: "center" }}> Chosen date: </Text>
                    <Text style={{ textAlign: "center", fontWeight: "bold", margin: 8 }}>
                        {this.state.date.toString()}
                    </Text>

                    <View style = {{width: "100%", height: 30, flexDirection: 'row'}}>
                        <TouchableOpacity 
                            style = {dispayedRecepient == this.recepientOptions.friends
                                 ? styles.selectedTab : styles.dormantTab}
                            onPress={() => this.setState({dispayedRecepient: this.recepientOptions.friends})}>
                            <Text>Friends</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style = {dispayedRecepient == this.recepientOptions.masks
                                 ? styles.selectedTab : styles.dormantTab}
                            onPress={() => this.setState({dispayedRecepient: this.recepientOptions.masks})}>
                            <Text>Masks</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style = {dispayedRecepient == this.recepientOptions.groups
                                 ? styles.selectedTab : styles.dormantTab}
                            onPress={() => this.setState({dispayedRecepient: this.recepientOptions.groups})}>
                            <Text>Groups</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {this.chooseInfiniteScroller()}

                <BannerButton
                    color = {S.colors.buttonGreen}
                    onPress={this.createBroadcast}
                    iconName = {S.strings.add}
                    title = "CREATE"
                />
            </View>
        )
    }


    chooseInfiniteScroller = () => {
        const userUid = auth().currentUser.uid
        if (this.state.dispayedRecepient == this.recepientOptions.friends){
            return(
                <View style = {[S.styles.containerFlexStart, {width: "100%"}]}>
                    <Button onPress={() => this.selectAllFriends()} title="AllFriends" />
                    <Text>All friends selected: {this.state.allFriends ? "yes" : "no"} </Text>
                    <SearchableInfiniteScroll
                    type = "static"
                    queryValidator = {(query) => true}
                    queryTypes = {[{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]}
                    chunkSize = {10}
                    errorHandler = {this.scrollErrorHandler}
                    renderItem = {this.friendRenderer}
                    dbref = {database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}
                    ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
                    />    
                </View>
            )
        }

        if (this.state.dispayedRecepient == this.recepientOptions.groups){
            return(
                <SearchableInfiniteScroll
                type = "dynamic"
                queryValidator = {(query) => true}
                queryTypes = {[{name: "Name", value: "name"}]}
                chunkSize = {10}
                errorHandler = {this.scrollErrorHandler}
                renderItem = {this.groupRenderer}
                dbref = {database().ref(`/userGroupMemberships/${userUid}`)}
                ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
              />      
            )
        }

        return (
            <SearchableInfiniteScroll
            type = "dynamic"
            queryValidator = {(query) => true}
            queryTypes = {[{name: "GName", value: "name"}]}
            chunkSize = {10}
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.maskRenderer}
            dbref = {database().ref(`/userFriendGroupings/${userUid}/custom/snippets`)}
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            />
        )
    }


    friendRenderer = ({ item }) => {
        return (
          <TouchableOpacity 
          onPress = {() => this.toggleSelection(item)}
          style = {[S.styles.listElement, {backgroundColor: this.state.friendRecipients[item.uid] ? "lightgreen" : "white"}]}>
              <ProfilePicDisplayer diameter = {30} uid = {item.uid} style = {{marginRight: 10}} />
              <View>
                <Text>{item.displayName}</Text>
                <Text>@{item.username}</Text>
                <Text>{item.uid}</Text>
              </View>
          </TouchableOpacity>
        );
    }

    groupRenderer = ({ item }) => {
        return (
          <TouchableOpacity 
          onPress = {() => this.toggleSelection(item)}
          style = {[S.styles.listElement, {backgroundColor: this.state.groupRecepients[item.uid] ? "lightgreen" : "white"}]}>
                <Text>{item.name}</Text>
          </TouchableOpacity>
        );
    }

    maskRenderer = ({ item }) => {
        return (
          <TouchableOpacity 
          onPress = {() => this.toggleSelection(item)}
          style = {[S.styles.listElement, {backgroundColor: this.state.maskRecepients[item.uid] ? "lightgreen" : "white"}]}>
                <Text>{item.name}</Text>
                <Text>Member count: {item.memberCount}</Text>
          </TouchableOpacity>
        );
    }
    
    scrollErrorHandler = (err) => {
        logError(err)
        this.setState({errorMessage: err.message})
    }

    toggleSelection = (snippet) => {
        let copiedObj = {}
        switch(this.state.dispayedRecepient){
            case this.recepientOptions.friends:
                copiedObj = {...this.state.friendRecipients}
                break
            case this.recepientOptions.masks:
                copiedObj = {...this.state.maskRecepients}
                break
            default:
                copiedObj = {...this.state.groupRecepients}
                break
        }

        if (copiedObj[snippet.uid]){
          //Then remove the snippet
          delete copiedObj[snippet.uid]
        }else{
          //Add the snippet
          const {uid, ...snippetSansUid} = snippet
          copiedObj[snippet.uid] = snippetSansUid
        }

        switch(this.state.dispayedRecepient){
            case this.recepientOptions.friends:
                this.setState({friendRecipients: copiedObj, allFriends: false});
                break
            case this.recepientOptions.masks:
                this.setState({maskRecepients: copiedObj, allFriends: false});
                break
            default:
                this.setState({groupRecepients: copiedObj});
                break
        }
    }

    selectAllFriends = () =>{
        this.setState({allFriends: true, friendRecipients: {}, maskRecepients: {}})
    }

    setDate = (event, newDate) => {
        newDate = newDate || this.state.date;
        let oldDate = this.state.date;
        oldDate.setMilliseconds(0)
        oldDate.setSeconds(0)

        if (this.state.pickerMode == "time") {
            oldDate.setHours(newDate.getHours(), newDate.getMinutes())
        } else {
            oldDate.setFullYear(newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate())
        }

        this.recalculateDateLimits()
        let errorMessage = this.checkTimeLimits(oldDate);
 
        this.setState({
            showPicker: Platform.OS === 'ios' ? true : false,
            date: oldDate,
            errorMessage
        });
    }

    showPicker = pickerMode => {
        this.setState({
            showPicker: true,
            pickerMode,
        });
    }

    //Returns an error message if there's a problem
    checkTimeLimits = (date) => {
        if (date.getTime() < this.minDate.getTime())
            return`The time of this event should be at least ${MIN_BROADCAST_WINDOW + 1} minutes away`
        else if (date.getTime() > this.maxDate.getTime())
            return `The time of this event should be less than ${Math.ceil(MAX_BROADCAST_WINDOW / 60)} hours away`
    }

    recalculateDateLimits = () => {
        this.minDate = new Date()
        this.minDate.setMilliseconds(0)
        this.minDate.setSeconds(0)
        //I'm adding 1 to the limit becuase I want to round up after removing the seconds
        let millisecondsToAdd = (MIN_BROADCAST_WINDOW + 1) * 60 * 1000
        this.minDate.setTime(this.minDate.getTime() + millisecondsToAdd)

        this.maxDate = new Date()
        millisecondsToAdd = (MAX_BROADCAST_WINDOW) * 60 * 1000
        this.maxDate.setTime(this.maxDate.getTime() + millisecondsToAdd)
    }

    createBroadcast = async () => {
        try{
            this.setState({isModalVisible: true})
            const uid = auth().currentUser.uid

            //First doing checks...
            this.recalculateDateLimits()
            let errorMessage = this.checkTimeLimits(this.state.date);
            if (errorMessage){
                this.setState({isModalVisible: false, errorMessage})
                return;
            }

            //Getting the uid's of all my recepients
            const friendRecepients = {}
            const maskRecepients = {}
            const groupRecepients = {}

            for (const key in this.state.friendRecipients) {
                friendRecepients[key] = true
            }
            for (const key in this.state.maskRecepients) {
                maskRecepients[key] = true
            }
            for (const key in this.state.groupRecepients) {
                groupRecepients[key] = true
            }

            if (!this.state.allFriends 
                && Object.keys(friendRecepients).length == 0
                && Object.keys(maskRecepients).length == 0
                && Object.keys(groupRecepients).length == 0){
                this.setState({errorMessage: "No Recepients"})
            }else{
                const creationFunction = functions().httpsCallable('createActiveBroadcast');
                const response = await timedPromise(creationFunction({
                    ownerUid: uid, 
                    autoConfirm: false,
                    location: this.state.location,
                    deathTimestamp: this.state.date.getTime(),
                    allFriends: this.state.allFriends,
                    friendRecepients,
                    maskRecepients,
                    groupRecepients
                }), LONG_TIMEOUT);
    
                if (response.data.status === returnStatuses.OK){
                    this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
                }else{
                    logError(new Error("Problematic createActiveBroadcast function response: " + response.data.status))
                }
            }
        }catch(err){
            if (err.code == "timeout"){
                this.setState({errorMessage: "Timeout!"})
            }else{
                logError(err)       
            }
        }
        this.setState({isModalVisible: false})
    }
}

const styles = StyleSheet.create({
    mainForm: {
        justifyContent: 'center',
        alignItems: 'center',
        width: "100%",
        margin: 8
    }, 
    selectedTab: {
        flex: 1,
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: "dodgerblue"
    },
    dormantTab: {
        flex: 1,
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: "grey"
    }
})