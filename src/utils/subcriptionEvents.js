//This file is used to simulate things like C# events, 
//where components can subcribe to get notifified when other's make
//chanegs they should be made aware of
//Maybe redux will make this irrelevant, ¯\_(ツ)_/¯ s

const subscribers = {}

export const events = {
    PROFILE_PIC_CHANGE: "changedProfilePic"
}

export const subscribeToEvent = (eventName, subscriber, callback) => {
    if (!subscribers[eventName]) subscribers[eventName] = []
    subscribers[eventName].push({subscriber: subscriber, callback})
}

export const unsubscribeToEvent = (eventName, subscriber) => {
    if (!subscribers[eventName]) return
    subscribers[eventName] = subscribers[eventName].filter(s => s.subscriber !== subscriber);
}

export const emitEvent = (eventName) => {
    if (!subscribers[eventName]) return
    for (let s of subscribers[eventName]){
        s.callback()
    }
}