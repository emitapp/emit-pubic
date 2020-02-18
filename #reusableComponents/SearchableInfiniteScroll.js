import React from 'react'
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import S from 'styling'
import DynamicInfiniteScroll from './DynamicInfiniteScroll'
import StaticInfiniteScroll from './StaticInfiniteScroll'


/**
 * This class is a wrapper for either a DynamicInifiteScroll or a StaticInfiniteScroll
 * with additional search capabilities
 */
//REQUIRED PROPS:
//type: either "dynamic" or "static"
//queryTypes: list of objects of the form {name: ..., value: ...} for each value that 
//can be entered into the orderByChild value of a databse ref
//queryValidator: a function that determines whether a querty is valid enough to attempt

//Also be sure to give this class all the props necessary for the 
//chosen infinite scrolling component to work, 
//but don't give them a generation, startingPoint or endingPoint
export default class SearchableInfiniteScroll extends React.Component {

  constructor(props){
    super(props)
    this.state = { 
      searchBarValue: '', 
      query: this.props.queryValidator("") ? "" : null, 
      searchGeneration: 0, 
      currentSorter: this.props.queryTypes[0].value
    }
  }

  render() {
    const {type, queryTypes, queryValidator, dbref, ...otherProps } = this.props
    return (
      <View style={styles.container}>

        <Text>Search by...</Text>

        <FlatList
          style = {{maxHeight: 30}}
          horizontal={true}
          renderItem = {this.queryOptionRenerer}
          data={this.props.queryTypes}
          keyExtractor = {(item, index) => item.value}
        />
      
        <TextInput
          style={S.styles.textInput}
          autoCapitalize="none"
          placeholder="Search"
          onChangeText={searchBarValue => this.setState({ searchBarValue })}
          value={this.state.searchBarValue}
        />

        <Button title="Search" onPress={this.search} />

      {(this.state.query == null) ? (
        <Text>Search</Text>
      ) : (
        this.props.type == "static" ? (   
          <StaticInfiniteScroll style = {{width: "100%", flex: 1}}
            generation = {this.state.searchGeneration}
            dbref = {this.props.dbref}
            orderBy = {this.state.currentSorter}
            startingPoint = {this.state.query}
            endingPoint = {`${this.state.query}\uf8ff`}
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            {...otherProps}
          />
        ) : (
          <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
            generation = {this.state.searchGeneration}
            dbref = {this.props.dbref.orderByChild(this.state.currentSorter)}
            startingPoint = {this.state.query}
            endingPoint = {`${this.state.query}\uf8ff`}
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
            {...otherProps}
          />
        )
      )}

      </View>
    )
  }

  search = () => {
    if (this.props.queryValidator(this.state.searchBarValue)){
      this.setState({
        query: this.state.searchBarValue, 
        searchGeneration: this.state.searchGeneration + 1
      })
    }else{
      Alert.alert("Invalid Query!")
    }   
  }

  queryOptionRenerer = ({item}) => {
    return (
      <TouchableOpacity 
        onPress = {() => this.updateSearchOption(item)}
        style = {item.value === this.state.currentSorter ? styles.optionStyleSelected : styles.optionStyleDormant}>
        <Text style = {{color: "blue"}}>{item.name}</Text>
      </TouchableOpacity>
  )}

  updateSearchOption = (option) => {
    this.setState({
      searchBarValue: "",
      query: null,
      currentSorter: option.value
    })
  }

}

const styles = StyleSheet.create({
  container: {
    ...S.styles.container,
    width: "100%",
    justifyContent: 'flex-start',
  },
  optionStyleDormant: {
    backgroundColor: 'white',
    marginRight: 10,
    borderColor: "blue",
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  },
  optionStyleSelected: {
    backgroundColor: 'skyblue',
    marginRight: 10,
    borderColor: "blue",
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  }
})