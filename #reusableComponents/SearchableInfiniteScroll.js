import React from 'react'
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import {Text, SearchBar, ThemeConsumer} from 'react-native-elements'
import S from 'styling'
import DynamicInfiniteScroll from './DynamicInfiniteScroll'
import StaticInfiniteScroll from './StaticInfiniteScroll'
import EmptyState from 'reusables/EmptyState'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';


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

  componentDidUpdate(prevProps) {
    if (this.props.dbref.toString() !== prevProps.dbref.toString()) {
      this.setState({
        query: this.props.queryValidator("") ? "" : null, 
        searchGeneration: this.state.searchGeneration + 1
      })
    }
  }

  render() {
    const {type, queryTypes, queryValidator, dbref, ...otherProps } = this.props
    return (
      <ThemeConsumer>
      {({ theme }) => (
      <View style={{...S.styles.containerFlexStart, width: "100%"}}>
      
        <SearchBar
          autoCapitalize="none"
          placeholder="Search"
          onChangeText={searchBarValue => this.setState({ searchBarValue })}
          value={this.state.searchBarValue}
          onSubmitEditing = {this.search}
        />

        <View style = {{flexDirection: "row", alignItems: "center", marginBottom: 16}}>
          <Text style = {{marginHorizontal: 16}}>Search by...</Text>

          <FlatList
            style = {{height: 30}}
            horizontal={true}
            renderItem = {({item}) => this.queryOptionRenerer(item, theme.colors.secondary)}
            data={this.props.queryTypes}
            keyExtractor = {(item, index) => item.value}
          />
        </View>

      {(this.state.query == null) ? (
        <EmptyState 
          style = {{flex: 1}}
          image = {<FontAwesomeIcon name="search" size={50} color = {theme.colors.grey1} />}
          title = "Search for something"
          message="We'll do our best to find it!"
        />
      ) : (
        this.props.type == "static" ? (   
          <StaticInfiniteScroll style = {{width: "100%", flex: 1}}
            generation = {this.state.searchGeneration}
            dbref = {this.props.dbref}
            orderBy = {this.state.currentSorter}
            startingPoint = {this.state.query}
            endingPoint = {`${this.state.query}\uf8ff`}
            {...otherProps}
          />
        ) : (
          <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
            generation = {this.state.searchGeneration}
            dbref = {this.props.dbref.orderByChild(this.state.currentSorter)}
            startingPoint = {this.state.query}
            endingPoint = {`${this.state.query}\uf8ff`}
            {...otherProps}
          />
        )
      )}

      </View>
      )}
      </ThemeConsumer>
    )
  }

  search = () => {
    if (this.props.queryValidator(this.state.searchBarValue)){
      this.setState({
        query: this.state.searchBarValue.toLowerCase(), 
        searchGeneration: this.state.searchGeneration + 1
      })
    }else{
      Alert.alert("Invalid Query!")
    }   
  }

  queryOptionRenerer = (item, mainColor) => {
    var mainTheme, backgroundColor, borderColor, color = null;
    if (item.value === this.state.currentSorter){
      mainTheme = styles.optionStyleSelected
      backgroundColor = mainColor
      borderColor = mainColor
      color = "white"
    }else{
      mainTheme = styles.optionStyleDormant
      backgroundColor = "transparent"
      borderColor = mainColor
      color = mainColor
    }

    return (
      <TouchableOpacity 
        onPress = {() => this.updateSearchOption(item)}
        style = {{...mainTheme, borderColor, backgroundColor}}>
        <Text style = {{color, fontWeight: "bold"}}>{item.name}</Text>
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
  optionStyleDormant: {
    marginRight: 10,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  },
  optionStyleSelected: {
    marginRight: 10,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  }
})