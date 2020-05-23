import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, CheckBox, Input, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Chip from 'reusables/Chip';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { withNavigation } from 'react-navigation';


class NewBroadcastForm extends React.Component {

    constructor(props){
        super(props)
        this.passableBroadcastInfo = { //Information that's directly edited by other screens
            timeText: "In 5 minutes",
            broadcastTTL: 1000 * 60 * 5,
            TTLRelative: true,
            location: "",
            geolocation: null,
            recepientFriends:{},
            recepientMasks:{},
            recepientGroups:{}
        }
        this.state = {
            showingMore: false,
            passableBroadcastInfo: this.passableBroadcastInfo,
            autoConfirm: true,
            notes: ""
        }

    }

    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader(navigationOptions, "New Broadcast")
    };

    componentDidMount() {
        const { navigation } = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
            this.setState({}) //Just call for a rerender
        });
    }
    
    componentWillUnmount() {
        this.focusListener.remove();
    }

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}>  

            <ScrollView 
                style = {{width: "100%", flex: 1}}
                showsVerticalScrollIndicator={false}
                contentContainerStyle = {{paddingHorizontal: 16}}>
            
            <FormSubtitle title = "Time" />

            <FormInput
                onPress = {() => this.props.navigation.navigate("NewBroadcastFormTime", this.passableBroadcastInfo)}
                value = {this.state.passableBroadcastInfo.timeText}
            />

            <FormSubtitle title = "Place" />

            <FormInput
                onPress = {() => this.props.navigation.navigate("NewBroadcastFormLocation", this.passableBroadcastInfo)}
                placeholder = "Where are you going?"
                value = {this.state.passableBroadcastInfo.location}
            />

            <FormSubtitle title = "Recepients" />

            <View style = {{width: "100%", flexDirection: "row"}}>
                <FormBox 
                    onPress = {() => this.props.navigation.navigate("NewBroadcastFormRecepients", 
                        {mode: "friends", data: this.state.passableBroadcastInfo})}
                    amount = {`${Object.keys(this.state.passableBroadcastInfo.recepientFriends).length}`}
                    title = "friends"
                />
                <FormBox 
                    onPress = {() => this.props.navigation.navigate("NewBroadcastFormRecepients", 
                        {mode: "masks", data: this.state.passableBroadcastInfo})}
                    amount = {`${Object.keys(this.state.passableBroadcastInfo.recepientMasks).length}`}
                    title = "masks"
                />
                <FormBox 
                    onPress = {() => this.props.navigation.navigate("NewBroadcastFormRecepients", 
                        {mode: "groups", data: this.state.passableBroadcastInfo})}
                    amount = {`${Object.keys(this.state.passableBroadcastInfo.recepientGroups).length}`}
                    title = "groups"
                />
            </View>

            {this.state.showingMore &&
                <>
                <CheckBox
                    title='Auto-confirm'
                    checkedColor='white'
                    uncheckedColor="white"
                    checked = {this.state.autoConfirm}
                    textStyle = {{color: "white", fontWeight: "bold"}}
                    containerStyle = {{alignSelf: "flex-start", marginLeft: 0, padding: 0, marginTop: 16}}
                    onIconPress = {() => this.setState({autoConfirm: !this.state.autoConfirm})}
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
                    placeholder = "Enter any extra information you want in here"
                    value = {this.state.notes}
                    onChangeText = {(notes) => this.setState({notes})}
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
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }
}

export default withNavigation(NewBroadcastForm);


class FormInput extends React.PureComponent {
    render (){
        const {onPress, ...otherProps} = this.props
        return (
            <TouchableOpacity onPress = {onPress} style = {{height: "auto", width: "100%"}}>
                <View pointerEvents='none'>
                    <Input
                        {...otherProps}                
                        inputContainerStyle = {{backgroundColor: "white"}}
                        editable = {false}
                    />
                </View>
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



