import React from 'react';
import { Image, RefreshControl, SectionList, View } from 'react-native';
import { Divider } from 'react-native-elements';
import EmptyState from 'reusables/EmptyState';
import { TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { logError } from 'utils/helpers';
import SectionHeaderText from './SectionHeaderText';

/**
 * This is an infinite scroll component that can handle both RTDB and Firestore references.
 * It uses live references, and isn't compatible with pagination or search yet.
 * Regardless, it has the most potential repalce all the other infinite scroll compnents if improved.
 */

//TODO: add pagination, make compatible with search

// Required props:
// refs: an array of database refs to use in the format 
//      General signature (order of importance)
//      ref*
//      title*: string
//      orderBy*: string[] (only not need if whereConditionProvided is true)
//      wherConditionProvided: boolean
//      isFirestore: boolean [false]
//      filter: (item) -> boolean
//      limit: number (will no longer be infite if added, makes pagination a bit more interesting)
//      startingPoint: string[]
//      endingPoint: string[]
//      tag: string (a tag that can be added to each datapoint to aid in conditional rendering)
// renderItem: same as FLatlist RenderItem

// Optinal props
// emptyStateComponent: Will be rendered when the list is empty 
// chunkSize: Size of chunks to get from firebase rtdb  (default 10) <--------- currently not used since there's no pagination
// errorHandler: what the component should do upon facing SDK errors (not timeout erros tho, those are handled by the compenent)

// generation: used to indicate to the scrollview that it shoudl reset
// Generation is used to prevent api calls that were called for previous
// queries from affecting the list if they resolved too late
// (like maybe the user started searching for something else) 

// Also note that this compenent doesn't store lots of the variables it uses
// in the state because this.setState() wouldn't update them immediately
// For data integrity, it is unsafe for the firebase api calls to be made and not having thier
// sresolved promises update the necessary variables immediately.

export default class MergedSectionInfiniteScroll extends React.Component {

    static defaultProps = {
        style: { flex: 1, width: "100%" },
        contentContainerStyle: { marginHorizontal: 8 },
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
        this.refreshing = false;
        this.mergedSections = [];

        this.processedRTDBRefs = []
        this.unsubFuncs = []
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
        this.sections = new Array(this.props.refs.length).fill("uninitialized");
        //FIXME: Pagination comment block
        //this.lastItemProperty = null;
        //this.stopSearching = false;
        this.timedOut = false;
        this.errorMessage = "";
        this.requestRerender();
        this.setListeners()
    }

    setListeners = () => {
        for (let i = 0; i < this.props.refs.length; i++) {
            let currRef = this.props.refs[i]
            let isFirestore = currRef.isFirestore

            //Ugly hack for whereConditionProvided is true
            let orderByList = []
            if (currRef.whereConditionProvided) orderByList = [false]
            else orderByList = currRef.orderBy

            for (let j = 0; j < orderByList.length; j++) {
                let currentOrderBy = orderByList[j]
                let ref = currRef.ref
                if (currentOrderBy) ref = (isFirestore) ? ref.orderBy(currentOrderBy) : ref.orderByChild(currentOrderBy)
                if (currRef.startingPoint) ref = ref.startAt(currRef.startingPoint)
                if (currRef.endingPoint) ref = ref.endAt(currRef.endingPoint)
                if (currRef.limit) ref = (isFirestore) ? ref.limit(currRef.limit) : ref.limitToFirst(currRef.limit)

                if (isFirestore) {
                    const unsub = ref.onSnapshot({
                        next: (snap) => this.refListenerCallback(snap, i, isFirestore),
                        error: this.onError
                    })
                    this.unsubFuncs.push(unsub)
                } else {
                    ref.on("value", (snap) => this.refListenerCallback(snap, i, isFirestore), this.onError)
                    this.processedRTDBRefs.push(ref)
                }
            }
        }
    };

    removeListeners = () => {
        this.processedRTDBRefs.forEach(ref => {
            ref.off()
        });
        this.unsubFuncs.forEach(func => func())
    }

    refListenerCallback = (snapshot, refIndex, isFirestore) => {
        let refInfo = this.props.refs[refIndex]
        let title = refInfo.title;
        let listData = []
        if (isFirestore) {
            snapshot.docs.forEach(doc => {
                listData.push({ uid: doc.id, ...doc.data(), tag: refInfo.tag })
            });
        } else {
            snapshot.forEach(childSnapshot => {
                if (!childSnapshot.exists()) return
                listData.push({ uid: childSnapshot.key, ...childSnapshot.val(), tag: refInfo.tag })
            });
        }


        if (refInfo.filter) {
            listData = listData.filter(refInfo.filter)
        }

        //FIXME: Pagination comment block
        //this.lastItemProperty = listData[listData.length - 1][this.props.orderBy];

        // Do not render sectionlist unless there is neither a custom button nor any list data
        if (listData.length > 0) {
            this.sections[refIndex] = ({
                title: title,
                data: listData,
            });
        } else {
            this.sections[refIndex] = "uninitialized";
        }

        let temp = [...this.sections]
        temp = temp.filter((x) => x != "uninitialized")
        this.mergedSections = {}
        temp.forEach(sec => {
            if (!this.mergedSections[sec.title]) this.mergedSections[sec.title] = sec.data
            else this.mergedSections[sec.title] = this.mergedSections[sec.title].concat(sec.data)
        })
        this.mergedSections = Object.entries(this.mergedSections).map(x => {
            return { title: x[0], data: x[1] }
        })


        this.isLoading = false
        this.requestRerender()
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

    renderSectionHeader = ({ section: { title } }) => {
        return (
            <View>
                <SectionHeaderText>
                    {title}
                </SectionHeaderText>
                <Divider />
            </View >
        )
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
                    />
                )
            }
        } else {
            let { style, ...otherProps } = this.props

            //The content container can't have a flexgrow of 1 when there's content
            //because it messes with pagination, but it should have it
            //when rendering the empty state so that the empty state occupies all the available space
            if (this.mergedSections.length == 0) otherProps = {
                ...otherProps,
                contentContainerStyle: { ...otherProps.contentContainerStyle, flexGrow: 1 }
            }

            return (
                <View style={style}>
                    <ErrorMessageText message={this.errorMessage} />
                    <SectionList
                        stickySectionHeadersEnabled={false}
                        showsVerticalScrollIndicator={false}
                        sections={this.mergedSections}
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
