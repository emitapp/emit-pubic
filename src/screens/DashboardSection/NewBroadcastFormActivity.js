import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClearHeader } from 'reusables/Header';
import MainLinearGradient from 'reusables/MainLinearGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MAX_BROADCAST_WINDOW, MIN_BROADCAST_WINDOW, } from 'utils/serverValues';
import { BannerButton } from 'reusables/ReusableButtons';
import S from 'styling'
import {epochToDateString} from 'utils/helpers'
import ErrorMessageText from 'reusables/ErrorMessageText';


export default class NewBroadcastFormActivity extends React.Component {

    constructor(props){
        super(props)

        this.state = {
            // showingCustom: false,
            // errorMessage: null
        }
    }


    static navigationOptions = ({ navigationOptions }) => {
        return ClearHeader("New Broadcast")
    };

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
        <MainLinearGradient theme={theme}> 
            <View style = {{flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50}}>
                <Text h4 h4Style={{marginTop: 8, fontWeight: "bold"}}>
                    Activity
                </Text>
                {/* <View style = {{flexDirection: "row", flex: 1}}>
                <View style = {{flex: 1, marginHorizontal: 16, alignItems: "center"}}>
                    <Text style = {{fontSize: 18, fontWeight: "bold", alignSelf: "flex-start"}}>
                        in...
                    </Text>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(5, "black")}
                        {this.generateTimeButton(10, "black")}
                        {this.generateTimeButton(15, "black")}
                    </View>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(20, "black")}
                        {this.generateTimeButton(25, "black")}
                        {this.generateTimeButton(30, "black")}
                    </View>
                    <View style={styles.rowStyle}>
                        {this.generateTimeButton(45, "black")}
                        {this.generateTimeButton(60, "black")}
                        {this.generateTimeButton(90, "black")}
                    </View>

                    {!this.state.showingCustom && 
                        <Button
                        title = "  Custom  "
                        containerStyle = {{marginTop: 16}}
                        onPress = {() => this.setState({showingCustom: true})}
                        />
                    }

                    {this.state.showingCustom && 
                        <>
                        <View style = {{flexDirection: 'row', marginVertical: 8}}>
                            <Button onPress={() => this.showPicker('date')} title="Choose Date" />
                            <Button onPress={() => this.showPicker('time')} title="Choose Time" />
                        </View>

                        <ErrorMessageText message = {this.state.errorMessage} />

                        <Text style={{ textAlign: "center" }}> Chosen date: </Text>
                        <Text style={{ textAlign: "center", fontWeight: "bold", margin: 8 }}>
                            {epochToDateString(this.state.date.getTime())}
                        </Text>
                        {this.state.showPicker &&
                            <DateTimePicker value={this.state.date}
                                style={{width:'100%'}}
                                mode={this.state.pickerMode}
                                is24Hour={false}
                                display="default"
                                onChange={this.setDate}
                                minimumDate={this.minDate} />
                            }
                        </>
                    }

                </View>
                </View>
                {this.state.showingCustom && 
                    <BannerButton
                    iconName = {S.strings.confirm}
                    onPress = {this.saveCustomTime}
                    title = "CONFIRM"
                    />  
                } */}
            </View>          
        </MainLinearGradient>
        )}
        </ThemeConsumer>
      )
    }
}


const styles = StyleSheet.create({
    timeButton:{
        justifyContent: "center", 
        alignItems: "center",
        height: "100%",
        width: "25%",
        borderRadius: 10,
        borderWidth: 3
    },
    rowStyle: {
        width: "100%",
        flexDirection: "row",
        marginVertical: 8,
        height: 50,
        justifyContent: "space-between",
    },
})