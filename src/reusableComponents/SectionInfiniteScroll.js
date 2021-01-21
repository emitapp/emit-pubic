import React from 'react';
import { TouchableOpacity, SectionList, FlatList, View, Image } from 'react-native';
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
 * from StaticInfiniteScroll's code, we've commented out the parts of it
 * that relate to pagination
 * //TODO: add pagination
 */

// Required props:
// dbref: an array of database refs to use in the format {title: "title", ref: ref}
// orderBy: the array of queryTypes to order each section by
// renderItem: same as FLatlist RenderItem

//Optinal props
//additionalData: additional content to display at the bottom per section. of the form {text: <text>, func: <lambda>}
//startingPoint: the value to be used for .startat in the refs
//endingPoint: the value to be used for .endat in the refs
//emptyStateComponent: Will be rendered when the list is empty 
// chunkSize: Size of chunks to get from firebase rtdb  (default 10) <--------- currently not used since there's no pagination
// errorHandler: what the component should do upon facing SDK errors (not timeout erros tho, those are handled by the compenent)

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

        //this.lastItemProperty = null;
        //this.stopSearching = false; //Once it gets a null snapshot, it'll stop
        //this.refreshing = false; //For when it's getting more info


        this.sections = []; // A list of lists, to allow for section list support
        this.isLoading = true; //For when it's loading for the first time
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
        this.sections = [];
        //this.lastItemProperty = null;
        //this.stopSearching = false;
        this.timedOut = false;
        this.errorMessage = "";
        this.requestRerender();
        this.retrieveAllData(this.props.generation);
    }

    retrieveAllData = async (invocationGen) => {
        try {
            for (i = 0; i < this.props.dbref.length; i++) {
                var ref = this.props.dbref[i].ref.orderByChild(this.props.orderBy[i].value);
                var title = this.props.dbref[i].title;
                var footerData = this.props.additionalData[i];

                if (this.props.startingPoint) ref = ref.startAt(this.props.startingPoint)
                if (this.props.endingPoint) ref = ref.endAt(this.props.endingPoint)
                const snapshot = await timedPromise(ref.once("value"), MEDIUM_TIMEOUT);

                if (this.props.generation != invocationGen) return;

                var listData = []
                snapshot.forEach(childSnapshot => {
                    if (childSnapshot.exists())
                        listData.push({
                            uid: childSnapshot.key,
                            ...childSnapshot.val()
                        })

                });

                if (listData.length == 0) {
                    //this.stopSearching = true;
                    //this.refreshing = false,
                    this.isLoading = false
                    this.requestRerender();
                } else {
                    //this.lastItemProperty = listData[listData.length - 1][this.props.orderBy];
                    this.sections.push({ title: title, data: listData, footerText: footerData.text, footerCallback: footerData.func });
                    this.isLoading = false
                    this.requestRerender()
                }
            }
        }
        catch (error) {
            this.onError(error)
        }
    }

    onError = (error) => {
        if (error.name == "timeout") {
            this.timedOut = true;
            this.requestRerender();
        } else {
            if (this.props.errorHandler) {
                this.props.errorHandler(error)
            }
            else {
                logError(error)
                this.errorMessage = error.message;
                this.requestRerender()
            }
        }
    }

    renderSectionFooter = ({ section: { footerText, footerCallback } }) => {
        if (!footerText) return null;
        return (
            <View>
                <Divider />
                <TouchableOpacity onPress={footerCallback}>
                    <Text style={{ fontSize: 18, marginTop: 8, marginBottom: 8 }}>{footerText}</Text>
                </TouchableOpacity>
            </View>
        )
    }

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
                        sections={this.sections}
                        keyExtractor={item => item.uid}
                        // ListFooterComponent={this.renderFooter}
                        // onEndReached={() => this.retrieveMore(this.props.generation)}
                        // onEndReachedThreshold={0.1}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={{ marginTop: 4, color: "blue", fontSize: 12 }}>{title}</Text>
                        )}
                        // An optional clickable button to add onto the ends of each sectionlist
                        renderSectionFooter={this.renderSectionFooter}
                        //refreshing={this.refreshing}
                        ListEmptyComponent={this.renderEmptyState}
                        {...otherProps}
                    />
                </View>
            )
        }
    }
}