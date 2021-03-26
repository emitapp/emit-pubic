import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { View } from 'react-native';
import { Button, withTheme } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { UserSnippetListElement } from 'reusables/ListElements';
import { SmallLoadingComponent, TimeoutLoadingComponent } from 'reusables/LoadingComponents';
import { logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { cloudFunctionStatuses } from 'utils/serverValues';
import {friendActionOptions} from 'screens/SocialSection/FriendReqModal'
import { analyticsFriendAction } from 'utils/analyticsFunctions';

//TODO: maybe move this to the file that contains the other list elements?
class FriendRequestPreviewer extends React.Component {


    state = {
        errorText: null,
        waitingForFuncResponse: false
    }

    render() {
        const { item } = this.props
        if (this.state.timedOut) {
            return (
                <TimeoutLoadingComponent
                    hasTimedOut={true}
                    retryFunction={() => this.setState({ timedOut: false })} />
            )
        }

        if (this.state.waitingForFuncResponse) {
            return (
                <SmallLoadingComponent style={{ height: 50, width: 100 }} />
            )
        }

        return (
            <View style={{ ...this.props.style, alignItems: "center", justifyContent: "center"}}>
                <ErrorMessageText message={this.state.errorText} />
                <View
                    style={{ width: "100%", flexDirection: "row", alignItems: "center" }}
                    key={item.uid}>
                    <UserSnippetListElement
                        snippet={item}
                        style={{ flex: 1 }}
                        imageDiameter={32} />
                    <Button
                        icon={<Icon name="check" size={15} color="white" />}
                        buttonStyle={{ backgroundColor: this.props.theme.colors.bannerButtonGreen, width: 30 }}
                        onPress={() => this.performAction(true)}/>
                    <Button
                        icon={<Icon name="close" size={15} color="white" />}
                        buttonStyle={{ backgroundColor: this.props.theme.colors.bannerButtonRed, width: 30 }}
                        onPress={() => this.performAction(false)} />
                </View>
            </View>
        )
    }

    performAction = async (accepted) => {
        this.setState({ waitingForFuncResponse: true })
        var callableFunction;
        var args;
        if (accepted) {
            callableFunction = functions().httpsCallable('acceptFriendRequest');
            args = { from: auth().currentUser.uid, to: this.props.item.uid, subscribeToFlares: true }
        } else {
            callableFunction = functions().httpsCallable('cancelFriendRequest');
            args = { from: auth().currentUser.uid, to: this.props.item.uid, fromInbox: true }
        }

        try {
            const response = await timedPromise(callableFunction(args), LONG_TIMEOUT);
            if (response.data.status === cloudFunctionStatuses.OK) {
                analyticsFriendAction(accepted ? friendActionOptions.ACCEPTREQ : friendActionOptions.REJECTREQ, args)
                this.props.forcedUpdateMethod()                
            } else {
                this.setState({
                    waitingForFuncResponse: false,
                    errorText: response.data.message
                })
                logError(new Error(`Problematic accept/cancelFriendRequest function response: ${response.data.message}`))
            }
        } catch (err) {
            if (err.name == "timeout") {
                this.setState({ timedOut: true, waitingForFuncResponse: false })
            } else {
                this.setState({ waitingForFuncResponse: false, errorText: err.message })
                logError(err)
            }
        }
    }
}

export default withTheme(FriendRequestPreviewer)