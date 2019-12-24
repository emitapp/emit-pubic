import React, { Component } from 'react';
import { ActivityIndicator, Dimensions, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import database from '@react-native-firebase/database';
import { timedPromise } from '../#constants/helpers';

const { height, width } = Dimensions.get('window');

/**
 * Use this class if you want to impliment an infinite scroll
 * for some data that you don't expect to update during the time the
 * user is looking at the app.
 * It will use ref.once() and will also append new sections 
 * instead of re-getting the whole dataset
 */

 // Required props:
 // chunkSize: Size of chunks to get from firebase rtdb 
 // databaseRef: the database ref it should use for data collection 
 //              (include querying modifyers here, like startAt and orderBy)
 // onError: what the component should do upon facing SDK errors
 // orderBy: the name of the key you're ordering by. SHould still be explicitly
 //          mentioned in the ref too
 // renderItem: same as FLatlist RenderItem

export default class StaticInfiniteScroll extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            listData: [],
            loading: false, //For when it's loading for the first time
            refreshing: false, //For when it's getting more info
        };

        this.lastItemProperty = null;
        this.stopSearching = false; //Once it gets a null snapshot, it'll stop
    }

    componentDidMount = () => {
        this.initialize();
    };


    initialize = () => {
        try {
            this.lastItemProperty = null;
            this.stopSearching = false;
            this.retrieveInitialChunk();
        }
        catch (error) {
            this.props.onError(error)
        }
    }


    retrieveInitialChunk = async () => {
        try {
            this.setState({
                loading: true,
            });

            const initialQuery = this.props.ref
                                         .limitToFirst(this.props.chunkSize)
                                         .once('value')
            const initialSnapshot = await timedPromise(initialQuery, 3000);
            var listData = []
            initialSnapshot.forEach(childSnapshot => 
                listData.push(childSnapshot.val()));

            if (listData.length == 0){
                this.stopSearching = true;
                this.setState({
                    refreshing: false,
                    loading: false
                });
            }else{
                this.lastItemProperty = 
                    listData[listData.length - 1][this.props.orderBy];  

                this.setState({
                    listData,
                    loading: false,
                });
            }
        }
        catch (error) {
            this.props.onError(error)
        }
    };

    retrieveMore = async () => {
        try {   
            if (this.stopSearching) return;       
            this.setState({
                refreshing: true,
            });

            const additionalQuery = this.props.ref
                                        .limitToFirst(this.props.chunkSize)
                                        .startAt(this.lastItemProperty)
                                        .once('value')   

            const additionalSnapshot = await timedPromise(additionalQuery, 3000);
            var additionaListData = []
            additionalSnapshot.forEach(childSnapshot => 
                additionaListData.push(childSnapshot.val()));

            //Removing the first element since startAt is inclusive
            additionaListData.shift(); 

            if (additionaListData.length == 0){
                this.stopSearching = true;
                this.setState({
                    refreshing: false,
                });
            }else{
                this.lastItemProperty =
                    additionaListData[additionaListData.length - 1][this.props.orderBy];  
            
                this.setState({
                    listData: [...this.state.listData, ...additionaListData],
                    refreshing: false,
                });
            }
        }
        catch (error) {
            this.props.onError(error)
        }
    }; 

    renderFooter = () => {
        if (this.state.loading) {
            return (<ActivityIndicator/>)
        }
        else {
            return null;
        }
    }

    render() {
        return (
            <FlatList
                data={this.state.documentData}
                keyExtractor={(item, index) => String(index)}
                ListFooterComponent={this.renderFooter}
                onEndReached={this.retrieveMore}
                onEndReachedThreshold={0}
                refreshing={this.state.refreshing}
                {...this.props}
            />
        )
    }
}
