import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { CheckBox, Text, ThemeConsumer, Icon } from 'react-native-elements';
import { ClearHeader } from 'reusables/Header';
import { RecipientListElement } from 'reusables/ListElements';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { PillButton } from 'reusables/ReusableButtons';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import { ProfilePicList } from 'reusables/ProfilePicComponents';

import { LogBox } from 'react-native';


export default class NewBroadcastFormRecepients extends React.Component {

    //Throughout this class, I used JSON.stringify instead of spead to copy
    //snippets just in case snippets contain nested objects
    constructor(props){
        super(props)

        let navigationParams = props.navigation.state.params
        this.mode = navigationParams.mode
        let userUid = auth().currentUser.uid
        this.dbRef = [{title: "GROUPS", ref: database().ref(`/userGroupMemberships/${userUid}`)},
        {title: "FRIENDS", ref: database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)}]
        this.footerButtons = [{text: "+ New Group", func: () => {this.props.navigation.navigate('GroupMemberAdder')}}, 
        {text: "+ Add Friends", func: () => { this.props.navigation.navigate('UserFriendSearch')}}]
        this.rendererType = RecipientListElement
        // List of UIDs to send back after obtaining from db
        this.friendUids = []

        

        this.state = { selectedSnippets: JSON.parse(JSON.stringify(navigationParams.data.recepientFriends))}
        this.queryTypes = [{name: "Name", value: "nameQuery"}, {name: "Display Name", value: "displayNameQuery"}, { name: "Username", value: "usernameQuery" }]
        this.state.allFriends = navigationParams.data.allFriends
    }

    static navigationOptions = ClearHeader("New Broadcast")

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                
                <View style={{width: "100%", flexDirection: "row"}}>
                    <View style = {{flex: 1}}>
                        <Text h4 h4Style={{marginTop: 8, marginHorizontal: 18, fontWeight: "bold"}}>
                            Who?
                        </Text>
                    </View>
                    
                </View>

                <SearchableInfiniteScroll
                type = "section"
                queryValidator = {(query) => true}
                queryTypes = {this.queryTypes}
                renderItem = {this.itemRenderer}
                dbref = {this.dbRef}
                data = {this.friendUids}
                additionalData = {this.footerButtons}
                >
                    <View style = {{width: "100%", justifyContent: "center", alignItems: "flex-end"}}>
                        <TouchableOpacity onPress={this.selectAllFriends} style = {{flexDirection: "row", marginRight: 12, alignItems: "center"}}>
                            { this.state.allFriends ?
                                <Icon style={{marginRight: 6}} type='font-awesome' name='check-circle' color="blue"/> :
                                <Icon style={{marginRight: 6}} type='font-awesome' name='circle-o' color="blue"/>
                            }
                            <Text style={{color: "blue", textAlign: "center"}}>Select All Friends</Text>
                        </TouchableOpacity>
                    </View> 
                </SearchableInfiniteScroll>
                <View style={styles.bottomBanner}>
                    <View style={{maxWidth: "80%"}}>
                    <ProfilePicList 
                        uids={Object.keys(this.state.selectedSnippets)}
                        diameter={36}
                        style = {{marginLeft: 0, marginRight: 2}}
                    /></View>
                    <PillButton
                        extraStyle={{borderColor:"blue", width: "10%"}}
                        onPress = {this.saveRecepients}
                        title = "Done"
                        contentColor = "white"
                        />
                </View>
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }   
    
    saveRecepients = () => {
        if (this.mode == "friends"){
            const {allFriends} = this.state
            this.props.navigation.state.params.data.allFriends = allFriends
            this.props.navigation.state.params.data.recepientFriends = this.state.selectedSnippets
        }else{ //Default to user groups
            this.props.navigation.state.params.data.recepientGroups = this.state.selectedSnippets
        }
        this.props.navigation.goBack()
    }

    itemRenderer = ({ item }) => {
        return (
          <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
            <RecipientListElement
              style = {{flex: 1}}
              snippet={item} 
              groupInfo = {item}
              onPress={() => this.toggleSelection(item)}
              imageDiameter = {24}
              >
                {this.state.selectedSnippets[item.uid] ?
                    <Icon style={{marginRight: 6}} type='font-awesome' name='check-circle' color="orange"/> :
                    <Icon style={{marginRight: 6}} type='font-awesome' name='circle-o' color="lightgrey"/> }
            </RecipientListElement>
          </View>
        );
    }

    selectAllFriends = () => {
        // TODO: modify to work with pagination once added
        const friendSnippets = this.friendUids[1];
        let copiedObj = {}
        if (!this.state.allFriends) {
            friendSnippets.forEach(snippet => {
                const {uid, ...snippetSansUid} = snippet;
                copiedObj[snippet.uid] = snippetSansUid;
            })
        }
        this.setState({selectedSnippets: copiedObj, allFriends: !this.state.allFriends});

    }

    toggleSelection = (snippet) => {
        const copiedObj = {...this.state.selectedSnippets}
        if (copiedObj[snippet.uid]){
            //Then remove the snipper
            delete copiedObj[snippet.uid]
        }else{
            //Add the snippet
            const {uid, ...snippetSansUid} = snippet
            copiedObj[snippet.uid] = snippetSansUid
        }
        this.setState({selectedSnippets: copiedObj, allFriends: false});
    }
}

const styles = StyleSheet.create({
    bottomBanner:{
        flexDirection: "row",
        justifyContent: "space-between", 
        alignItems: "flex-start",
        height: 64,
        paddingTop: 6,
        paddingHorizontal: 10,
        width: "100%",
        borderTopWidth: 1,
        borderColor: "lightgrey"
    },
})