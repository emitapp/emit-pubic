'use strict';

//Taken from react-native-gifted-chat code, then modified
export function isSameTime(currentMessage = {}, diffMessage = {}) {
    const currDate = currentMessage.createdAt
    const diffDate = diffMessage.createdAt
    if (diffDate && currDate) {
        return (currDate.getTime() - diffDate.getTime() < 600000)
    }
    return false
}