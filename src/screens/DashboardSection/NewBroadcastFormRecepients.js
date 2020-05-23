import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { CheckBox, Text, ThemeConsumer } from 'react-native-elements';
import { ClearHeader } from 'reusables/Header';
import { UserSnippetListElement, FriendMaskListElement, UserGroupListElement } from 'reusables/ListElements';
import MainLinearGradient from 'reusables/MainLinearGradient';
import SearchableInfiniteScroll from 'reusables/SearchableInfiniteScroll';
import {BannerButton} from 'reusables/ReusableButtons'
import S from 'styling'


export default class NewBroadcastFormRecepients extends React.Component {

    //Throughout this class, I used JSON.stringify instead of spead to copy
    //snippets just in case snippets contain nested objects
    constructor(props){
        super(props)
        let navigationParams = props.navigation.state.params
        this.mode = navigationParams.mode
        let userUid = auth().currentUser.uid

        if (this.mode == "friends"){
            this.state = {selectedSnippets: JSON.parse(JSON.stringify(navigationParams.data.recepientFriends))}
            this.rendererType = UserSnippetListElement
            this.dbRef = database().ref(`/userFriendGroupings/${userUid}/_masterSnippets`)
            this.queryTypes = [{name: "Display Name", value: "displayNameQuery"}, {name: "Username", value: "usernameQuery"}]    
            this.mapper = ({username}) => `@${username} `
        }else if (this.mode == "masks"){
            this.state = {selectedSnippets: JSON.parse(JSON.stringify(navigationParams.data.recepientMasks))}
            this.rendererType = FriendMaskListElement
            this.dbRef = database().ref(`/userFriendGroupings/${userUid}/custom/snippets`)
            this.queryTypes = [{name: "Name", value: "name"}]
            this.mapper = ({name}) => `* ${name} `
        }else{ //Default to user groups
            this.state = {selectedSnippets: JSON.parse(JSON.stringify(navigationParams.data.recepientGroups))}
            this.rendererType = UserGroupListElement
            this.dbRef = database().ref(`/userGroupMemberships/${userUid}`)
            this.queryTypes = [{name: "Name", value: "name"}]
            this.mapper = ({name}) => `* ${name} `
        }
    }

    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader(navigationOptions, "New Broadcast")
    };

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                <Text h4 h4Style={{marginTop: 8, marginHorizontal: 18, fontWeight: "bold"}}>
                    Who can see this broadcast?
                </Text>

                <ScrollView 
                style = {{maxHeight: 55, width: "100%"}}>
                {Object.keys(this.state.selectedSnippets).length != 0 && 
                    <Text style = {{textAlign: "center", marginTop: 8}}>
                    {Object.values(this.state.selectedSnippets).map(this.mapper)}
                    </Text>
                }
                </ScrollView>

                <SearchableInfiniteScroll
                type = "static"
                queryValidator = {(query) => true}
                queryTypes = {this.queryTypes}
                errorHandler = {this.scrollErrorHandler}
                renderItem = {this.itemRenderer}
                dbref = {this.dbRef}
                />
                <BannerButton
                color = {S.colors.buttonGreen}
                iconName = {S.strings.confirm}
                onPress = {this.saveRecepients}
                title = "CONFIRM"
                /> 
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }

    saveRecepients = () => {
        if (this.mode == "friends"){
            this.props.navigation.state.params.data.recepientFriends = this.state.selectedSnippets
        }else if (this.mode == "masks"){
            this.props.navigation.state.params.data.recepientMasks = this.state.selectedSnippets
        }else{ //Default to user groups
            this.props.navigation.state.params.data.recepientGroups = this.state.selectedSnippets
        }
        this.props.navigation.goBack()
    }

    scrollErrorHandler = (err) => {
        logError(err)
        this.setState({errorMessage: err.message})
    }

    itemRenderer = ({ item }) => {
        return (
          <View style = {{alignItems: "center", width: "100%", flexDirection: "row"}}>
            <this.rendererType
              style = {{flex: 1}}
              snippet={item} 
              maskInfo = {item}
              groupInfo = {item}
              onPress={() => this.toggleSelection(item)}
              imageDiameter = {45}
            />
            {this.state.selectedSnippets[item.uid] && <CheckBox checked = {true} /> }
          </View>
        );
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
    this.setState({selectedSnippets: copiedObj});
    }
}