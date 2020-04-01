import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, ThemeConsumer, Button, Overlay } from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import UserProfileSummary from 'reusables/UserProfileSummary'
import UserBitecode from 'reusables/UserBitecode'
import {MinorActionButton} from 'reusables/ReusableButtons'
import AntIcon from 'react-native-vector-icons/AntDesign';

export default class SocialButtonHub extends React.Component {

    state = {QRVisible: false}

    render() {
        return (
            <ThemeConsumer>
            {({ theme }) => (
            <View style={styles.container}>

            <UserProfileSummary style={{marginTop: 8}}/>

            <Overlay 
                isVisible={this.state.QRVisible}
                onBackdropPress = {() => this.setState({QRVisible: false})}>
                <View>
                    <UserBitecode color = {theme.colors.primary}/>
                    <MinorActionButton
                    title="Go Back"
                    onPress={() => this.setState({QRVisible: false})}/>
                </View>
            </Overlay>

            <Button 
                icon={
                    <AntIcon name="qrcode" size={40} color="white"/>
                }
                containerStyle = {{position: 'absolute', top: 16, left: 16}}
                onPress = {() => this.setState({QRVisible: true})}/>

            <View style = {styles.buttonSection}>
            <View style={styles.rowStyle}>
                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('FriendRequests')}>
                    <FontAwesomeIcon name="inbox" size={36} color= "white" />
                    <Text style = {styles.buttonTextStyle}>Friend Requests</Text>  
                </SocialSectionButton>

                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('QRScanner')}>
                    <IoniconsIcon name="md-qr-scanner" size={36} color= "white" />
                    <Text style = {styles.buttonTextStyle}>Bitecode Scanner</Text>  
                </SocialSectionButton>
            </View>

            <View style={styles.rowStyle}>
                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('MaskSearch')}>
                    <FontAwesomeIcon name="user-friends" size={32} color= "white" />
                    <Text style = {styles.buttonTextStyle}>Friend Masks</Text>  
                </SocialSectionButton>

                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('GroupSearch')}>
                    <FontAwesomeIcon name="user-friends" size={32} color= "white" />
                    <Text style = {styles.buttonTextStyle}>Friend Groups</Text>  
                </SocialSectionButton>
            </View>

            <View style={styles.rowStyle}>
                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('FriendSearch')}>
                    <FontAwesomeIcon name="search" size={32} color= "white" />
                    <Text style = {styles.buttonTextStyle}>Friend Search</Text>  
                </SocialSectionButton>

                <SocialSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('UserSearch')}>
                    <FontAwesomeIcon name="search" size={32} color= "white" />
                    <Text style = {styles.buttonTextStyle}>User Search</Text>  
                </SocialSectionButton>
            </View>
            </View>

            </View>
            )}
            </ThemeConsumer>
        )
    }
}

class SocialSectionButton extends React.Component {
    render() {
        return (
            <TouchableOpacity 
                style = {{...styles.socialButton, backgroundColor: this.props.color}}
                onPress = {this.props.onPress}>
                {this.props.children}
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    socialButton:{
        justifyContent: "center", 
        alignItems: "center",
        height: "100%",
        width: "45%",
        borderRadius: 10,
    },
    buttonTextStyle:{
        fontSize: 18, 
        fontWeight: "bold", 
        color: "white",
        textAlign: "center",
        marginTop: 8,
        marginHorizontal: 8
    },
    rowStyle: {
        flex: 1,
        flexDirection: "row",
        width: "85%",
        justifyContent: 'space-around',
        marginVertical: 8
    },
    buttonSection:{
        flex: 1,
        maxHeight: 500,
        maxWidth: 500
    }
})