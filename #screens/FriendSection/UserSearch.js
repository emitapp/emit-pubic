import React from 'react'
import { StyleSheet, Text, View, Button, TextInput } from 'react-native'
import StaticInfiniteScroll from '../../#reusableComponents/StaticInfiniteScroll'
import database from '@react-native-firebase/database';


export default class UserSearch extends React.Component {

  state = { query: '', attemptedQuery: '', errorMessage: null, searchGeneration: 0 }

  render() {
    return (
      <View style={styles.container}>

        <Text>User Search</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="UserEmail"
          onChangeText={query => this.setState({ query })}
          value={this.state.query}
        />

        <Button title="Search" onPress={this.search} />

        {(this.state.attemptedQuery.length < 3) ? (
            <Text>Try to find users with a long enough query</Text>
        ) : (
            <StaticInfiniteScroll
              chunkSize = {10}
              errorHandler = {(err) => console.log(err)}
              renderItem = {this.itemRenderer}
              generation = {this.state.searchGeneration}
              orderBy = "name"
              dbref = {database().ref("/testScrollingData/testScrollingData").orderByChild("name")}
              startingPoint = {this.state.attemptedQuery}
              endingPoint = {`${this.state.attemptedQuery}\uf8ff`}
            />
        )
        }

      </View>
    )
  }

  search = () => {
    this.setState({attemptedQuery: this.state.query, searchGeneration: this.state.searchGeneration + 1})
  }

  itemRenderer = ({ item }) => {
    return (
      <View>
        <Text>{item.name}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  textInput: {
    height: 40,
    width: '90%',
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 8
  }
})