import React from 'react';
import { View } from 'react-native';
import { Text, withTheme } from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {TimeoutLoadingComponent} from 'reusables/LoadingComponents'
import ErrorMessageText from 'reusables/ErrorMessageText';
import {UserSnippetListElement} from 'reusables/ListElements';


class FriendRequestPreviewer extends React.Component {

    constructor(props){
        super(props)
        this.ref = database().ref(`/friendRequests/${auth().currentUser.uid}/inbox`).limitToFirst(3)
        this.state = {
            listData: [],
            gettingFirstLoad: true,
            errorText: null
        }
    }

    componentDidMount(){
        this.ref.on("value", this.refListenerCallback, this.onError)
    }

    componentWillUnmount(){
        this.ref.off();
    }

    render() {
        console.log(this.state.listData)
        if (this.state.gettingFirstLoad){
            return(
                <TimeoutLoadingComponent
                    hasTimedOut={false}
                    retryFunction={() => null}
                />
            )
        }
        return (
            <View style = {{...this.props.style, alignItems: "center", justifyContent: "center"}}>
                <ErrorMessageText message = {this.state.errorMessage} />
                {this.state.listData.map(item => this.itemRenderer(item))}
            </View>
        )
    }

    //TODO: work on this
    onError = (error) => {
        if (error.name == "timeout") {
            this.props.timedOut = true;
            this.requestRerender();
        } else {
            if (this.props.errorHandler){
                this.props.errorHandler(error)
            } 
            else{
                logError(error)
                this.errorMessage = error.message;
                this.requestRerender()
            }
        }
    }

    refListenerCallback = (snap) => {
        this.listData = this.transformSnapshotData(snap)
        this.setState({gettingFirstLoad: false})
    }

    transformSnapshotData = (snap) => {
        var listData = []
        snap.forEach(childSnapshot =>{
            if (childSnapshot.exists())
                listData.push({
                    uid: childSnapshot.key, 
                    key: childSnapshot.key,
                    ...childSnapshot.val(),
                })           
        });
        this.setState({listData})
    }

    itemRenderer = (item) => {
        return (
          <UserSnippetListElement 
          snippet={item}/>
        );
      }
    
}

export default withTheme(FriendRequestPreviewer)