import LottieView from 'lottie-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-elements';
import CircularView from 'reusables/containers/CircularView';
import EmptyState from 'reusables/ui/EmptyState';
import { Activity, getAllActivities } from 'data/activitesList';
import NavigationService from 'utils/NavigationService';
import Emoji from 'reusables/ui/Emoji'


export default class FeedEmptyState extends React.PureComponent {

	randomActivities: Activity[];

	//I'm in a rush sooo....
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	constructor(props) {
		super(props)

		const randomizedActivities = getAllActivities()
			.map(x => x.data)
			.reduce((acc, curr) => acc.concat(curr), [])

		this.randomActivities = [
			randomizedActivities[Math.floor(Math.random() * randomizedActivities.length)],
			randomizedActivities[Math.floor(Math.random() * randomizedActivities.length)],
			randomizedActivities[Math.floor(Math.random() * randomizedActivities.length)],
		]
	}

	render(): React.ReactNode {
		return (
			<EmptyState
				image={
					<View style={{ height: 250, width: "100%" }}>
						<LottieView source={require('media/animations/people-interacting.json')} autoPlay loop />
					</View>
				}
				title="Let there be light!"
				message="Flares you make and flares visible to you and join will appear here. Go ahead and make one!"
			>
				<View style={{ flexDirection: "row", alignContent: "flex-end", justifyContent: "center", marginTop: 16 }}>
					{this.randomActivities.map((x, index) => {
						return (
							<ActivityButton activity={x} key={x.name + index} />
						)
					})}
				</View>
			</EmptyState>

		)
	}
}


class ActivityButton extends React.PureComponent<{ activity: Activity }> {

	render(): React.ReactNode {
		return (
			<Pressable
				style={{ alignItems: "center", width: "24%" }}
				onPress={() => NavigationService.navigate('NewBroadcastForm', { needUserConfirmation: false, activity: this.props.activity })}
			>
				<CircularView diameter={50} style={{ borderColor: "grey", borderWidth: 1 }}>
					<Emoji size = {20} style={{ marginHorizontal: 8 }} emoji = {this.props.activity.emoji}/>
				</CircularView>
				<Text style={{ textAlign: "center", fontSize: 15, color: "grey" }}>{this.props.activity.name}</Text>
			</Pressable>
		)
	}
}
