import React from 'react';
import { FlatList, View } from 'react-native';
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
// orderBy: the name of the key you're ordering by.
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
        contentContainerStyle: {flexGrow: 1, marginHorizontal: 8},
        ItemSeparatorComponent: (() => <Divider />),
        chunkSize: 10
    }

    constructor(props) {
        super(props);

        this.lastItemProperty = null;
        this.stopSearching = false; //Once it gets a null snapshot, it'll stop
        this.listData = [];
        this.isLoading = true; //For when it's loading for the first time
        this.refreshing = false; //For when it's getting more info
        this.timedOut = false;
        this.errorMessage = "";
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
        this.isLoading = true;
        this.listData = [];
        this.lastItemProperty = null;
        this.stopSearching = false;
        this.timedOut = false;
        this.errorMessage = "";
        this.requestRerender();
        this.retrieveInitialChunk(this.props.generation);
    }


    retrieveInitialChunk = async (invocationGen) => {
        try {
            var ref = this.props.dbref.orderByChild(this.props.orderBy).limitToFirst(this.props.chunkSize)
            if (this.props.startingPoint) ref = ref.startAt(this.props.startingPoint)
            if (this.props.endingPoint) ref = ref.endAt(this.props.endingPoint)

            const initialSnapshot = await timedPromise(ref.once("value"), MEDIUM_TIMEOUT);

            //Checking if your snapshot is no longer relevant
            if (this.props.generation != invocationGen) return;

            var listData = []
            initialSnapshot.forEach(childSnapshot =>{
                if (childSnapshot.exists())
                    listData.push({
                        uid: childSnapshot.key, 
                        ...childSnapshot.val()
                    })
                    
            });

            if (listData.length == 0) {
                this.stopSearching = true;
                this.refreshing = false,
                    this.isLoading = false
                this.requestRerender();
            } else {
                this.lastItemProperty =
                    listData[listData.length - 1][this.props.orderBy];

                this.listData = listData
                this.isLoading = false
                this.requestRerender()
            }
        }
        catch (error) {
            this.onError(error)
        }
    };

    retrieveMore = async (invocationGen) => {
        try {
            if (this.stopSearching || this.refreshing) return;
            this.refreshing = true;
            this.requestRerender();

            var ref = this.props.dbref
                .orderByChild(this.props.orderBy)
                .limitToFirst(this.props.chunkSize)
                .startAt(this.lastItemProperty)
            if (this.props.endingPoint) ref = ref.endAt(this.props.endingPoint)

            const additionalSnapshot = await timedPromise(ref.once("value"), MEDIUM_TIMEOUT);

            //Checking if your snapshot is no longer relevant
            if (this.props.generation != invocationGen) return;

            var additionaListData = []
            additionalSnapshot.forEach(childSnapshot =>{
                if (childSnapshot.exists())
                    additionaListData.push({
                        key: childSnapshot.key, 
                        ...childSnapshot.val()
                    })
            });

            //Removing the first element since startAt is inclusive
            additionaListData.shift();

            if (additionaListData.length == 0) {
                this.stopSearching = true;
                this.refreshing = false;
                this.requestRerender();
            } else {
                this.lastItemProperty =
                    additionaListData[additionaListData.length - 1][this.props.orderBy];

                this.listData = [...this.listData, ...additionaListData]
                this.refreshing = false;
                this.requestRerender();
            }
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

    renderFooter = () => {
        if (this.refreshing) {
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={this.timedOut}
                    retryFunction={() => {
                        this.timedOut = false;
                        this.refreshing = false;
                        this.retrieveMore(this.props.generation)
                    }}
                />
            )
        }
        else if (this.stopSearching && this.listData.length != 0) {
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
                title = "Here's a lot of empty space!" 
                message = "Looks like we didn't find anything" 
            />
        )
    }

    render() {
        if (this.isLoading) {
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
            const {style, ...otherProps} = this.props
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
                        ListEmptyComponent = {this.renderEmptyState}
                        {...otherProps}
                    />
                </View>
            )
        }
    }
}