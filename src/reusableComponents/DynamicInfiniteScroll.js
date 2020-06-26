import React from 'react';
import { FlatList, View } from 'react-native';
import {TimeoutLoadingComponent} from 'reusables/LoadingComponents'
import EmptyState from 'reusables/EmptyState'
import {Divider} from 'react-native-elements'
import ErrorMessageText from 'reusables/ErrorMessageText';
import {logError} from 'utils/helpers'

/**
 * Use this class if you want to impliment an infinite scroll
 * for some data that has a resonable chance of updating during the time the
 * user is looking at the app.
 * It will use ref.on() and ref.off to manage the listeners 
 */

// Required props:
// dbref: the databse ref to use
// renderItem: same as FLatlist RenderItem

//Optinal props
//startingPoint: the value to be used for .startat in retrieveInitialChunk
//endingPoint: the value to be used for .endat in both retrieveInitialChunk and retrieveMore
//generation: used to indicate to the scrollview that it shouldd reset
//emptyStateComponent: Will be rendered when the list is empty 
// chunkSize: Size of chunks to get from firebase rtdb (default 10)
// errorHandler: what the component should do upon facing SDK errors (not timeout erros tho, those are handled by the compenent)

//Also note that this compenent doesn't store lots of the variables it uses
//in the state because this.setState() wouldn't update them immediately
//For data integrity, it is unsafe for the firebase api calls to be made and not having thier
//resolved promises update the necessary variables immediately.

export default class DymanicInfiniteScroll extends React.Component {

    static defaultProps = {
        style: { flex: 1, width: "100%"},
        contentContainerStyle: {flexGrow: 1, marginHorizontal: 8},
        ItemSeparatorComponent: (() => <Divider />),
        chunkSize: 10
    }

    constructor(props) {
        super(props);

        this.listData = [];
        this.gettingFirstLoad = true; //For when it's loading for the first time
        this.gettingMoreData = false; //For when it's getting more info
        this.currentChunkSize = this.props.chunkSize;
        this.lastUsedRef;
        this.errorMessage = "";
    }

    componentDidMount = () => {
        this.initialize();
    }

    componentDidUpdate = (prevProps) => {
        if (this.props.generation != prevProps.generation) {
            this.lastUsedRef.off();
            this.initialize();
        }
    }

    componentWillUnmount = () => {
        if (this.lastUsedRef) this.lastUsedRef.off()
    }

    requestRerender = () => {
        this.setState({})
    }

    initialize = () => {
        this.gettingFirstLoad = true;
        this.gettingMoreData = false;
        this.listData = [];
        this.timedOut = false;
        this.currentChunkSize = this.props.chunkSize;
        this.errorMessage = "";
        this.requestRerender();
        this.setListener();
        //console.log("Dynamic Scoller [re]initialized")
    }

    refListenerCallback = (snap) => {
        this.listData = this.transformSnapshotData(snap)
        //changing gettingFirstLoad only matters if this is the first call
        // for this generation
        this.gettingFirstLoad = false; 
        this.gettingMoreData = false;
        this.requestRerender();
    }

    retrieveMoreData = () => {
        if (!this.gettingMoreData){
            this.currentChunkSize += this.props.chunkSize;
            this.lastUsedRef.off();
            this.gettingMoreData = true;
            this.setListener();
        }
        //console.log("retrieveMoreData called")
    }

    setListener = () => {
        try {
            var ref = this.props.dbref.limitToFirst(this.currentChunkSize)
            if (this.props.startingPoint) ref = ref.startAt(this.props.startingPoint)
            if (this.props.endingPoint) ref = ref.endAt(this.props.endingPoint)

            this.lastUsedRef = ref;
            ref.on("value", this.refListenerCallback)
        }
        catch (error) {
            this.onError(error)
        }
    };

    transformSnapshotData = (snap) => {
        var listData = []
        snap.forEach(childSnapshot =>{
            if (childSnapshot.exists())
                listData.push({
                    uid: childSnapshot.key, 
                    ...childSnapshot.val()
                })           
        });
        return listData;
    }
    
    onError = (error) => {
        if (error.code == "timeout") {
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

    renderFooter = () => {
        if (this.gettingMoreData) {
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={false}
                    retryFunction={() => null}
                />
            )
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
        if (this.gettingFirstLoad) {
            if (this.errorMessage){
                return (
                    <View style = {{...this.props.style, justifyContent: "center"}}>
                        <ErrorMessageText message = {this.errorMessage} />
                    </View>
                )
            }else{
                return (
                    <TimeoutLoadingComponent
                        hasTimedOut={false}
                        retryFunction={() => null}
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
                        onEndReached={this.retrieveMoreData}
                        onEndReachedThreshold={0.1}
                        refreshing={this.refreshing}
                        contentContainerStyle = {{flex: 1}}
                        ListEmptyComponent = {this.renderEmptyState}
                        {...otherProps}
                    />
                </View>
            )
        }
    }
}
