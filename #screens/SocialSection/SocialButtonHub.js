import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, ThemeConsumer, Button, Overlay } from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import UserProfileSummary from 'reusables/UserProfileSummary'
import UserBitecode from 'reusables/UserBitecode'
import {MinorActionButton} from 'reusables/ReusableButtons'

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
                title = "Show Bitecode" 
                containerStyle = {{position: 'absolute', top: 8, left: 8, width: 100}}
                onPress = {() => this.setState({QRVisible: true})}/>

            <View style={styles.rowStyle}>
                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('FriendRequests')}>
                    <FontAwesomeIcon name="inbox" size={36} color= "white" />
                    <Text style = {styles.textStyle}>Friend Requests</Text>  
                </SectionSectionButton>

                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('QRScanner')}>
                    <IoniconsIcon name="md-qr-scanner" size={36} color= "white" />
                    <Text style = {styles.textStyle}>Bitecode Scanner</Text>  
                </SectionSectionButton>
            </View>

            <View style={styles.rowStyle}>
                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('MaskSearch')}>
                    <FontAwesomeIcon name="user-friends" size={32} color= "white" />
                    <Text style = {styles.textStyle}>Friend Masks</Text>  
                </SectionSectionButton>

                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('GroupSearch')}>
                    <FontAwesomeIcon name="user-friends" size={32} color= "white" />
                    <Text style = {styles.textStyle}>FriendGroups</Text>  
                </SectionSectionButton>
            </View>

            <View style={styles.rowStyle}>
                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('FriendSearch')}>
                    <FontAwesomeIcon name="search" size={32} color= "white" />
                    <Text style = {styles.textStyle}>Friend Search</Text>  
                </SectionSectionButton>

                <SectionSectionButton color={theme.colors.secondary}
                onPress={() => this.props.navigation.navigate('UserSearch')}>
                    <FontAwesomeIcon name="search" size={32} color= "white" />
                    <Text style = {styles.textStyle}>User Search</Text>  
                </SectionSectionButton>
            </View>

            </View>
            )}
            </ThemeConsumer>
        )
    }
}

class SectionSectionButton extends React.Component {
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
        height: 100,
        width: 160,
        borderRadius: 10,
    },
    textStyle:{
        fontSize: 18, 
        fontWeight: "bold", 
        color: "white",
        textAlign: "center",
        marginTop: 8
    },
    rowStyle: {
        flexDirection: "row",
        width: "85%",
        justifyContent: 'space-around',
        marginVertical: 8
    },
    QRHolder:{
        borderRadius: 20, 
        padding: 10, 
        justifyContent: "center", 
        alignContent: "center", 
        borderColor: "orange", 
        borderWidth: 8,
        backgroundColor: "white"
      },
    profilePic:{
        position: "absolute",
        top: 65, // = QRHolder + (QRCOde size prop / 2) - radius of profile pic displayer
        left: 65,
      }

})