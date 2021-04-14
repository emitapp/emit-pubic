import React from 'react';
import { FlatList, View, Image, RefreshControl } from 'react-native';
import { MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import {TimeoutLoadingComponent} from 'reusables/LoadingComponents'
import {Text} from 'react-native-elements'
import EmptyState from 'reusables/EmptyState'
import { Divider } from "react-native-elements"
import ErrorMessageText from 'reusables/ErrorMessageText';
import {logError} from 'utils/helpers'


/**
 * Use this class if you want to impliment an infinite scroll
 * for some data that you don't expect to update during the time the
 * user is looking at the app.
 * It will use ref.once() and will also append new sections 
 * instead of re-getting the whole dataset
 */

// Required props:
// dbref: the databse ref to use
//queryTypes: list of objects of the form {name: ..., value: ...} for each value that 
//can be entered into the orderByChild value of a databse ref
// renderItem: same as FLatlist RenderItem

//Optinal props
//startingPoint: the value to be used for .startat in retrieveInitialChunk
//endingPoint: the value to be used for .endat in both retrieveInitialChunk and retrieveMore
//emptyStateComponent: Will be rendered when the list is empty 
// chunkSize: Size of chunks to get from firebase rtdb  (default 10)
// errorHandler: what the component should do upon facing SDK errors (not timeout erros tho, those are handled by the compenent)

// generation: used to indicate to the scrollview that it shoudl reset
//Generation is used to prevent api calls that were called for previous
//queries from affecting the list if they resolved too late
//(like maybe the user started searching for something else) 

//Also note that this compenent doesn't store lots of the variables it uses
//in the state because this.setState() wouldn't update them immediately
//For data integrity, it is unsafe for the firebase api calls to be made and not having thier
//resolved promises update the necessary variables immediately.

export default class StaticInfiniteScroll extends React.Component {

    static defaultProps = {
        style: { flex: 1, width: "100%"},
        contentContainerStyle: { marginHorizontal: 8},
        ItemSeparatorComponent: (() => <Divider />),
        chunkSize: 10
    }

    constructor(props) {
        super(props);

        this.lastItemProperty = {}; //One per querytype
        this.stopSearching = {}; //Once it gets a null snapshot, it'll stop. One per querytype
        this.listData = [];
        this.isRetrievingInitial = true; //For when it's loading for the first time
        this.retrievingMore = false; //For when it's getting more info
        this.timedOut = false;
        this.errorMessage = "";
        this.refreshing = false
    }

    componentDidMount = () => {
        this.initialize();
    };

    componentDidUpdate = (prevProps) => {
        if (this.props.generation != prevProps.generation) {
            this.initialize();
        }
    }

    requestRerender = () => {
        this.setState({})
    }

    initialize = () => {
        this.lastItemProperty = {}; 
        this.stopSearching = {};
        this.isRetrievingInitial = true;
        this.listData = [];
        this.timedOut = false;
        this.errorMessage = "";
        this.refreshing = false
        this.requestRerender();
        this.retrieveInitialChunk(this.props.generation);
    }

    retrieveInitialChunk = async (invocationGen) => {
        try {
            var listData = []
            // Extract data across all query types, ensuring no duplicates are added
            for (let i = 0; i < this.props.queryTypes.length; i++) {
                const queryTypeValue = this.props.queryTypes[i].value

                var currentRef = this.props.dbref.orderByChild(queryTypeValue).limitToFirst(this.props.chunkSize)
                if (this.props.startingPoint) currentRef = currentRef.startAt(this.props.startingPoint)
                if (this.props.endingPoint) currentRef = currentRef.endAt(this.props.endingPoint)
                const initialSnapshot = await timedPromise(currentRef.once("value"), MEDIUM_TIMEOUT);

                // First checking if your snapshot is no longer relevant
                if (this.props.generation != invocationGen) return;

                let snapshotAsArray = []
                initialSnapshot.forEach(childSnapshot =>{
                    if (childSnapshot.exists()) {
                        const data = {
                            uid: childSnapshot.key, 
                            ...childSnapshot.val()
                        }
                        // Don't insert duplicates
                        if (!listData.some(d => d.uid === childSnapshot.key)) {
                            listData.push(data)
                        }
                        snapshotAsArray.push(data)
                    }
                });

                if (snapshotAsArray.length == 0) this.stopSearching[queryTypeValue] = true
                else this.lastItemProperty[queryTypeValue] = snapshotAsArray[snapshotAsArray.length - 1][queryTypeValue];
            }
            
            if (listData.length != 0) this.listData = listData

            this.isRetrievingInitial = false
            this.requestRerender();
        }
        catch (error) {
            this.onError(error)
        }
    };

    retrieveMore = async (invocationGen) => {
        if (this.allStopSearching()) return;
        try {
            if (this.retrievingMore) return;
            this.retrievingMore = true;
            this.requestRerender();

            // Extract data across all query types, ensuring no duplicates are added
            for (let i = 0; i < this.props.queryTypes.length; i++) {
                const queryTypeValue = this.props.queryTypes[i].value
                if (this.stopSearching[queryTypeValue]) return;

                var currentRef = this.props.dbref.orderByChild(queryTypeValue)
                .limitToFirst(this.props.chunkSize)
                .startAt(this.lastItemProperty[queryTypeValue])
                if (this.props.endingPoint) currentRef = currentRef.endAt(this.props.endingPoint)
                const initialSnapshot = await timedPromise(currentRef.once("value"), MEDIUM_TIMEOUT);
                
                // First checking if your snapshot is no longer relevant
                if (this.props.generation != invocationGen) return;

                let snapshotAsArray = []
                initialSnapshot.forEach(childSnapshot =>{
                    
                    if (childSnapshot.exists()) {
                        const data = {
                            uid: childSnapshot.key, 
                            ...childSnapshot.val()
                        }
                        // Don't insert duplicates
                        if (!this.listData.some(d => d.uid === childSnapshot.key)) {
                            this.listData.push(data)
                        }
                        snapshotAsArray.push(data)
                    }
                });

                snapshotAsArray.shift() //Removing the first element since startAt is inclusive
                if (snapshotAsArray.length == 0) this.stopSearching[queryTypeValue] = true
                else this.lastItemProperty[queryTypeValue] = snapshotAsArray[snapshotAsArray.length - 1][queryTypeValue]; 
            }

            this.retrievingMore = false;
            this.requestRerender();
        }
        catch (error) {
            this.onError(error)
        }
    };

    onError = (error) => {
        if (error.name == "timeout") {
            this.timedOut = true;
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


    allStopSearching = () => {
        let exhausted = true;
        for (let i = 0; i < this.props.queryTypes.length; i++) {
            const queryTypeValue = this.props.queryTypes[i].value
            if (!this.stopSearching[queryTypeValue]) exhausted = false;
        }
        return exhausted
    }
    renderFooter = () => {
        if (this.retrievingMore) {
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={this.timedOut}
                    retryFunction={() => {
                        this.timedOut = false;
                        this.retrievingMore = false;
                        this.retrieveMore(this.props.generation)
                    }}
                />
            )
        }
        else if (this.allStopSearching() && this.listData.length != 0) {
            return (
                <Text style={{width: "100%", textAlign: "center", marginTop: 8}}>
                ~That's all folks!~
                </Text>);
        } else {
            return null;
        }
    }

    renderEmptyState = () => {
        if (this.props.emptyStateComponent) 
            return this.props.emptyStateComponent
        return (
            <EmptyState 
                image =  {
                    <Image source={require('media/NoSearchResults.png')} 
                    style = {{height: 80, marginBottom: 8}} 
                    resizeMode = 'contain' />
                }
                title = "No results." 
                message = "Looks like we didn't find anything." 
            />
        )
    }

    wait = (timeout) => {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }

    onRefresh = () => {
        this.refreshing = true
        this.requestRerender()
        this.wait(500).then(() => {
            this.initialize();
        })
    }

    render() {
        if (this.isRetrievingInitial) {
            if (this.errorMessage){
                return (
                    <View style = {{...this.props.style, justifyContent: "center"}}>
                        <ErrorMessageText message = {this.errorMessage} />
                    </View>
                )
            }else{
                return (
                    <TimeoutLoadingComponent
                        hasTimedOut={this.timedOut}
                        retryFunction={() => {
                            this.timedOut = false;
                            this.retrieveInitialChunk(this.props.generation)
                        }}
                    />
                )
            }
        } else {
            let {style, ...otherProps} = this.props

            //The content container can't have a flexgrow of 1 when there's content
            //because it messes with pagination, but it should have it
            //when rendering the empty state so that the empty state occupies all the available space
            if (this.listData.length == 0) otherProps = {
                ...otherProps,
                contentContainerStyle: { ...otherProps.contentContainerStyle, flexGrow: 1 }
            }
              
            return (
                <View style = {style}>
                    <ErrorMessageText message = {this.errorMessage} />
                    <FlatList
                        data={this.listData}
                        keyExtractor={item => item.uid}
                        ListFooterComponent={this.renderFooter}
                        onEndReached={() => this.retrieveMore(this.props.generation)}
                        onEndReachedThreshold={0.1}
                        refreshing={this.refreshing}
                        refreshControl={
                            <RefreshControl refreshing={this.refreshing} onRefresh={this.onRefresh} />
                        }
                        ListEmptyComponent = {this.renderEmptyState}
                        {...otherProps}
                    />
                </View>
            )
        }
    }
}