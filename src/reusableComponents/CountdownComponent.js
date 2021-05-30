
import React from 'react';

//Required Props:
//deadLine : number
//renderer: ({h: number, m: number, s: number}) -> Component
//Optional: onTimeout
export default class CountdownComponent extends React.PureComponent {
  constructor() {
    super();
    this.state = { time: {}, secondsLeft: 0 };
    this.timerID = 0;
  }

  componentDidMount() {
    this.initialize()
  }

  componentWillUnmount() {
    this.stopTimer()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.deadLine != this.props.deadLine) this.initialize()
  }

  render() {
    if (!this.timerID) return null
    return this.props.renderer(this.state.time)
  }

  initialize = () => {
    this.stopTimer()
    const milliDifference = Math.max(this.props.deadLine - Date.now(), 0)
    const secondsLeft = Math.floor(milliDifference / 1000)
    const timeLeftObj = CountdownComponent.secondsToTime(secondsLeft);
    this.setState({ time: timeLeftObj,  secondsLeft});
    if (secondsLeft > 0) {
      this.timerID = setInterval(this.countDown, 1000); //Do it every second
    }
  }

  stopTimer = () => {
    if (this.timerID) clearInterval(this.timerID)
    this.timerID = 0
  }

  countDown = () => {
    // Remove one second, set state so a re-render happens.
    let secondsLeft = this.state.secondsLeft - 1;

    this.setState({
      time: CountdownComponent.secondsToTime(secondsLeft),
      secondsLeft,
    });

    // Check if we're at zero.
    if (secondsLeft <= 0) {
      this.stopTimer()
      if (this.props.onTimeout) this.props.onTimeout()
    }
  }

  //TODO: maybe move this to utils?
  static secondsToTime(secs) {
    let hours = Math.floor(secs / (60 * 60));

    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);

    let obj = {
      "h": hours,
      "m": minutes,
      "s": seconds
    };
    return obj;
  }
}