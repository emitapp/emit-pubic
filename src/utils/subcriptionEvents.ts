//This file is used to simulate things like C# events, 
//where components can subscribe to get notified when other's make
//changes they should be made aware of
//Maybe redux will make this irrelevant, ¯\_(ツ)_/¯ 

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type subscriberType = any
type callbackType = () => void
interface subscriptionListElement {
    subscriber: subscriberType,
    callback: callbackType
}

export enum events {
    PROFILE_PIC_CHANGE = "changedProfilePic",
    SPLASH_SCREEN_DISMISSED = "splashScreenDismissed",
    NEW_AUTH = "newAuth"
}

export const subscribers: Record<events, Array<subscriptionListElement>> = {
    [events.PROFILE_PIC_CHANGE]: [],
    [events.SPLASH_SCREEN_DISMISSED]: [],
    [events.NEW_AUTH]: []
}

export const eventCounts: Record<events, number> = {
    [events.PROFILE_PIC_CHANGE]: 0,
    [events.SPLASH_SCREEN_DISMISSED]: 0,
    [events.NEW_AUTH]: 0
}


/**
 * Adds a subscriber to the provided event. The next time the event is emitted via emitEvent, the callback will be called
 * @param eventName 
 * @param subscriber 
 * @param callback 
 */
export const subscribeToEvent = (eventName: events, subscriber: subscriberType, callback: callbackType): void => {
    subscribers[eventName].push({ subscriber: subscriber, callback })
}

/**
 * Adds a subscriber to the provided event. The next time the event is emitted via emitEvent, the callback will be called.
 * Additionally, if the event has already been emitted at least once before the subscription, the callback will be called immediately.
 * @param eventName 
 * @param subscriber 
 * @param callback 
 */
export const subscribeToEventRetroactively = (eventName: events, subscriber: subscriberType, callback: callbackType): void => {
    subscribeToEvent(eventName, subscriber, callback)
    if (eventCounts[eventName]) callback()
}

/**
 * Unsubscribes the subscriber from the event.
 * @param eventName 
 * @param subscriber 
 * @returns 
 */
export const unsubscribeToEvent = (eventName: events, subscriber: subscriberType): void => {
    if (!subscribers[eventName].length) return
    subscribers[eventName] = subscribers[eventName].filter(s => s.subscriber !== subscriber);
}

/**
 * Triggers the callbacks of all the subscribers of this event. Does not unsubscribe them.
 * @param eventName 
 * @returns 
 */
export const emitEvent = (eventName: events): void => {
    eventCounts[eventName] += 1
    if (!subscribers[eventName].length) return
    for (const s of subscribers[eventName]) {
        s.callback()
    }
}