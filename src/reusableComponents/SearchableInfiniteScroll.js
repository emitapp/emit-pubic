import React from 'react'
import { Alert, FlatList, View } from 'react-native'
import { SearchBar, Text, ThemeConsumer } from 'react-native-elements'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5'
import Chip from 'reusables/Chip'
import EmptyState from 'reusables/EmptyState'
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

  componentDidUpdate(prevProps) {
    if (this.props.dbref.toString() !== prevProps.dbref.toString()) {
      this.setState({
        query: this.props.queryValidator("") ? "" : null, 
        searchGeneration: this.state.searchGeneration + 1
      })
    }
  }

  render() {
    const {type, queryTypes, queryValidator, dbref, style, ...otherProps } = this.props
    return (
      <ThemeConsumer>
      {({ theme }) => (
      <View style={{...S.styles.containerFlexStart, width: "100%", ...style}}>
      
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
          image = {<FontAwesomeIcon name="search" size={50} color = {theme.colors.grey1} />}
          title = "Search for something"
          message="We'll do our best to find it!"
        />
      ) : (
        this.props.type == "static" ? (   
          <StaticInfiniteScroll
            generation = {this.state.searchGeneration}
            dbref = {this.props.dbref}
            orderBy = {this.state.currentSorter}
            startingPoint = {this.state.query}
            endingPoint = {`${this.state.query}\uf8ff`}
            {...otherProps}
          />
        ) : (
          <DynamicInfiniteScroll
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
    return (
      <Chip
        onPress = {() => this.updateSearchOption(item)}
        mainColor = {mainColor}
        selected = {item.value === this.state.currentSorter}>
          <Text>{item.name}</Text>
      </Chip>
  )}

  updateSearchOption = (option) => {
    this.setState({
      searchBarValue: "",
      query: null,
      currentSorter: option.value
    })
  }

}