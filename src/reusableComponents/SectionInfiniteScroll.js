import React from 'react';
import { TouchableOpacity, SectionList, FlatList, View, Image, RefreshControl } from 'react-native';
import { MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { TimeoutLoadingComponent } from 'reusables/LoadingComponents'
import { Text } from 'react-native-elements'
import EmptyState from 'reusables/EmptyState'
import { Divider } from "react-native-elements"
import ErrorMessageText from 'reusables/ErrorMessageText';
import { logError } from 'utils/helpers'


/**
 * Use this class if you want to impliment an infinite scroll
 * for multiple refs
 * Currently it doesn't support pagination - since this was made 
 * from StaticInfiniteScroll's and DyanmicInfiniteScroll's code, we've commented out the parts of it
 * that relate to pagination
 * //TODO: add pagination
 */

// Required props:
// dbref: an array of database refs to use in the format {title: "title", ref: ref}
// orderBy: the array of queryTypes to order each section by
// renderItem: same as FLatlist RenderItem

//Optinal props
//additionalData: additional content to display at the bottom per section. of the form {text: <text>, func: <lambda>}
//startingPoint: array of values to be used for .startat in the refs
//endingPoint: array of values to be used for .endat in the refs
//emptyStateComponent: Will be rendered when the list is empty 
// chunkSize: Size of chunks to get from firebase rtdb  (default 10) <--------- currently not used since there's no pagination
// errorHandler: what the component should do upon facing SDK errors (not timeout erros tho, those are handled by the compenent)
// onSectionData : callback called when data is gotten from ref. Gets ref's title and the data received

// generation: used to indicate to the scrollview that it shoudl reset
//Generation is used to prevent api calls that were called for previous
//queries from affecting the list if they resolved too late
//(like maybe the user started searching for something else) 

//Also note that this compenent doesn't store lots of the variables it uses
//in the state because this.setState() wouldn't update them immediately
//For data integrity, it is unsafe for the firebase api calls to be made and not having thier
//resolved promises update the necessary variables immediately.

export default class SectionInfiniteScroll extends React.Component {

    static defaultProps = {
        style: { flex: 1, width: "100%" },
        contentContainerStyle: { flexGrow: 1, marginHorizontal: 8 },
        ItemSeparatorComponent: (() => <Divider />),
        
        // chunkSize: 10
    }

    constructor(props) {
        super(props);

        //FIXME: Pagination comment block
        //this.lastItemProperty = null;
        //this.stopSearching = false; //Once it gets a null snapshot, it'll stop


        this.sections = []; // A list of lists, to allow for section list support
        this.isLoading = true; //For when it's loading for the first time
        this.timedOut = false;
        this.errorMessage = "";
        this.processedRefs = []
        this.refreshing = false;
    }

    componentDidMount = () => {
        this.initialize();
    };

    componentWillUnmount = () => {
        this.removeListeners()
    }

    componentDidUpdate = (prevProps) => {
        if (this.props.generation != prevProps.generation) {
            this.removeListeners()
            this.initialize();
        }
    }

    requestRerender = () => {
        this.setState({})
    }

    initialize = () => {
        this.isLoading = true;
        this.sections = new Array(this.props.dbref.length).fill("uninitialized");
        //FIXME: Pagination comment block
        //this.lastItemProperty = null;
        //this.stopSearching = false;
        this.timedOut = false;
        this.errorMessage = "";
        this.requestRerender();
        this.setListeners()
    }

    refListenerCallback = async (snapshot, refIndex) => {
        try {
            var title = this.props.dbref[refIndex].title;
            var customData = { text: null, func: null }
            if (this.props.additionalData && this.props.additionalData.length > refIndex) {
                customData = this.props.additionalData[refIndex];
            }

            var listData = []
            snapshot.forEach(childSnapshot => {
                if (childSnapshot.exists())
                    listData.push({
                        uid: childSnapshot.key,
                        ...childSnapshot.val()
                    })

            });

            //FIXME: Pagination comment block
            //this.lastItemProperty = listData[listData.length - 1][this.props.orderBy];
            // Do not render sectionlist unless there is neither a custom button nor any list data
            if (listData.length > 0 || customData.text != null) {
                this.sections[refIndex] = ({ 
                    title: title, 
                    data: listData, 
                    customText: customData.text, 
                    customCallback: customData.func 
                });
            }

            this.props.onSectionData && this.props.onSectionData(title, listData)
            this.isLoading = false
            this.requestRerender()

        } catch (error) {
            this.onError(error)
        }

    }

    setListeners = () => {
        try {
            const {startingPoint, endingPoint} = this.props
            for (let i = 0; i < this.props.dbref.length; i++) {
                var ref = this.props.dbref[i].ref.orderByChild(this.props.orderBy[i].value);
                if (startingPoint && startingPoint[i]) ref = ref.startAt(startingPoint[i])
                if (endingPoint && endingPoint[i]) ref = ref.endAt(endingPoint[i])
                ref.on("value", (snap) => this.refListenerCallback(snap, i), this.onError)
                this.processedRefs.push(ref)
            }
        }
        catch (error) {
            this.onError(error)
        }
    };

    removeListeners = () => {
        this.processedRefs.forEach(ref => {
            ref.off()
        });
    }

    onError = (error) => {
        if (error.name == "timeout") {
            this.timedOut = true;
            this.requestRerender();
        } else {
            if (this.props.errorHandler) {
                this.props.errorHandler(error)
            } else {
                logError(error)
                this.errorMessage = error.message;
                this.requestRerender()
            }
        }
    }


    renderSectionHeader=({ section: { title, customText, customCallback} }) => {
        return (
            <View>
                <Text style={{ marginTop: 4, color: "blue", fontSize: 12 }}>{title}</Text>
                {customText &&
                    <View>
                        <TouchableOpacity onPress={customCallback}>
                            <Text style={{ fontSize: 18, marginTop: 8, marginBottom: 8 }}>{customText}</Text>
                        </TouchableOpacity>
                        <Divider />
                    </View> }
            </View> )
    }

    //FIXME: Pagination comment block
    // renderFooter = () => {
    //     if (this.refreshing) {
    //         return (
    //             <TimeoutLoadingComponent
    //                 hasTimedOut={this.timedOut}
    //                 retryFunction={() => {
    //                     this.timedOut = false;
    //                     this.refreshing = false;
    //                     this.retrieveMore(this.props.generation)
    //                 }}
    //             />
    //         )
    //     }
    //     else if (this.stopSearching && this.listData.length != 0) {
    //         return (
    //             <Text style={{width: "100%", textAlign: "center", marginTop: 8}}>
    //             ~That's all folks!~
    //             </Text>);
    //     } else {
    //         return null;
    //     }
    // }

    renderEmptyState = () => {
        if (this.props.emptyStateComponent)
            return this.props.emptyStateComponent
        return (
            <EmptyState
                image={
                    <Image source={require('media/NoSearchResults.png')}
                        style={{ height: 80, marginBottom: 8 }}
                        resizeMode='contain' />
                }
                title="No results."
                message="Looks like we didn't find anything."
            />
        )
    }

    wait = (timeout) => {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }

    onRefresh = () => {
        this.wait(500).then(() => {
            this.removeListeners();
            this.initialize();
        })
    }

    render() {
        if (this.isLoading) {
            if (this.errorMessage) {
                return (
                    <View style={{ ...this.props.style, justifyContent: "center" }}>
                        <ErrorMessageText message={this.errorMessage} />
                    </View>
                )
            } else {
                return (
                    <TimeoutLoadingComponent
                        hasTimedOut={this.timedOut}
                        retryFunction={() => {
                            this.timedOut = false;
                            this.retrieveAllData(this.props.generation)
                        }}
                    />
                )
            }
        } else {
            const { style, ...otherProps } = this.props
            
            return (
                <View style={style}>
                    <ErrorMessageText message={this.errorMessage} />
                    <SectionList
                        stickySectionHeadersEnabled={false}
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 0 }}
                        sections={this.sections.filter((x) => x != "uninitialized")}
                        keyExtractor={item => item.uid}
                        //FIXME: Pagination comment block
                        // ListFooterComponent={this.renderFooter}
                        // onEndReached={() => this.retrieveMore(this.props.generation)}
                        // onEndReachedThreshold={0.1}
                        renderSectionHeader={this.renderSectionHeader}
                        // An optional clickable button to add onto the ends of each sectionlist
                        //refreshing={this.refreshing}
                        refreshControl={
                            <RefreshControl refreshing={this.refreshing} onRefresh={this.onRefresh} />
                        }
                        ListEmptyComponent={this.renderEmptyState}
                        {...otherProps}
                    />
                </View>
            )
        }
    }
}
