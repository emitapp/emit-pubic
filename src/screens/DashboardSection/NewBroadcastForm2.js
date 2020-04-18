import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemeConsumer, Button } from 'react-native-elements';
import S from 'styling';
import LinearGradient from 'react-native-linear-gradient';
import {Text, Input, CheckBox} from 'react-native-elements'
import { TouchableOpacity } from 'react-native-gesture-handler';
import Chip from 'reusables/Chip'


export default class NewBroadcastForm extends React.Component {

    constructor(props){
        super(props)
        this.state = {showingMore: false}
    }

    static navigationOptions = ({ navigationOptions }) => {
        return {
            title: "New Broadcast",
            headerStyle: {
                ...navigationOptions.headerStyle,
                elevation: 0,
                shadowOpacity: 0,
            },
            headerTintColor: navigationOptions.headerTintColor,
        };
    };

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <LinearGradient 
            style={{...S.styles.containerFlexStart, paddingHorizontal: 16}}
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{x: 0.2, y: 0.2}} end={{x: 1, y: 1}}>  

            <ScrollView 
                style = {{width: "100%", flex: 1}}
                showsVerticalScrollIndicator={false}>
            
            <FormSubtitle title = "Time" />

            <FormInput
                value = "In 5 minutes"
            />

            <FormSubtitle title = "Place" />

            <FormInput
                placeholder = "Where are you going?"
                value = ""
            />

            <FormSubtitle title = "Recepients" />

            <View style = {{width: "100%", flexDirection: "row"}}>
                <FormBox 
                    amount = "5"
                    title = "friends"
                />
                <FormBox 
                    amount = "0"
                    title = "masks"
                />
                <FormBox 
                    amount = "3"
                    title = "groups"
                />
            </View>

            {this.state.showingMore &&
                <>
                <CheckBox
                    title='Auto-confirm'
                    checkedColor='white'
                    uncheckedColor="white"
                    checked = {true}
                    textStyle = {{color: "white", fontWeight: "bold"}}
                    containerStyle = {{alignSelf: "flex-start", marginLeft: 0, padding: 0, marginTop: 16}}
                />

                <FormSubtitle title = "Max Responders" />

                <ScrollView 
                    containerStyle = {{flexDirection: "row"}} 
                    style = {{flex: 1}} 
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    <Chip
                        mainColor = "white"
                        selected = {true}
                        selectedTextColor = "black"
                        style = {{paddingHorizontal: 16}}>
                            <Text>N/A</Text>
                    </Chip>
                    <Chip
                        mainColor = "white"
                        selected = {false}
                        selectedTextColor = "black"
                        style = {{paddingHorizontal: 16}}>
                            <Text>2</Text>
                    </Chip>
                    <Chip
                        mainColor = "white"
                        selected = {false}
                        selectedTextColor = "black"
                        style = {{paddingHorizontal: 16}}>
                            <Text>5</Text>
                    </Chip>
                    <Chip
                        mainColor = "white"
                        selected = {false}
                        selectedTextColor = "black"
                        style = {{paddingHorizontal: 16}}>
                            <Text>100</Text>
                    </Chip>
                    <Chip
                        mainColor = "white"
                        selected = {false}
                        selectedTextColor = "black"
                        style = {{paddingHorizontal: 16}}>
                            <Text>Custom</Text>
                    </Chip>
                    

                </ScrollView>

                <FormSubtitle title = "Notes" />

                <Input
                    multiline = {true}
                    textAlignVertical = "top"   
                    numberOfLines = {4}           
                    inputContainerStyle = {{backgroundColor: "white"}}
                />
                </>
            }

            <Button 
                title = {`Show ${this.state.showingMore ? "less" : "more"}`}
                type = "clear"
                onPress = {() => this.setState({showingMore: !this.state.showingMore})}
                titleStyle = {{color: "white"}}
                />

        </ScrollView> 
        </LinearGradient>
        )}
        </ThemeConsumer>
      )
    }
  }


class FormInput extends React.PureComponent {
    render (){
        const {onPress, ...otherProps} = this.props
        return (
            <TouchableOpacity onPress = {onPress} style = {{height: "auto", width: "100%"}}>
                <Input
                    {...otherProps}                
                    inputContainerStyle = {{backgroundColor: "white"}}
                    editable = {false}
                />
            </TouchableOpacity>
        )
    }
}

class FormBox extends React.PureComponent {
    render (){
        const {amount, title, ...otherProps} = this.props
        return (
            <View
            style = {{
                alignItems: "center",
                justifyContent: "center", 
                width: "20%",
                aspectRatio: 1,
                backgroundColor: "white",
                borderRadius: 10,
                marginRight: 16}}>
            <TouchableOpacity 
            {...otherProps}
            style = {{alignItems: "center", justifyContent: "center"}}>  
                <Text h4>{this.props.amount}</Text>
                <Text style = {{fontWeight: "bold"}}>{this.props.title}</Text>
            </TouchableOpacity>
            </View>
        )
    }
}


class FormSubtitle extends React.PureComponent {
    render (){
        return (
            <Text style = {{
                fontFamily: "NunitoSans-Bold", 
                marginBottom: 4, 
                marginTop: 8,
                fontSize: 22, 
                color: "white", 
                alignSelf: "flex-start"
            }}>
                {this.props.title}
            </Text>
        )
    }
}



