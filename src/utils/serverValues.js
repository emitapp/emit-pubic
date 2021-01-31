//This file contains all the values that this client app uses that mirror
//values used on the server in either Cloud Functions or Security Rules

export const cloudFunctionStatuses = {
    OK: "successful",
    INVALID: "invalid state",
    LEASE_TAKEN: "lease taken"
}

export const responderStatuses = {
    CANCELLED: "cancelled",
    CONFIRMED: "confirmed",
}

export const groupRanks = {
    STANDARD: "standard",
    ADMIN: "admin"
}

import { isOnlyWhitespace } from 'utils/helpers'
export const validUsername = (username, considerLength = true) => {
    const regexTest = RegExp(/^[a-z0-9_-]+$/) //This also takes care of strings that are just whitespace
    const normalizedUsername = username.normalize("NFKC").toLowerCase()
    if (considerLength){
        if (normalizedUsername.length > MAX_USERNAME_LENGTH) return false
    }
    return regexTest.test(normalizedUsername)
}

export const validDisplayName = (displayName, considerLength = true) => {
    if (!considerLength) return !isOnlyWhitespace(displayName)
    return !isOnlyWhitespace(displayName) && displayName.length <= MAX_DISPLAY_NAME_LENGTH
}

export const isValidDBPath = (path) => {
    if (path === "") return false
    const forbiddenChars = [".", "#", "$", "[", "]"]
    let valid = true
    forbiddenChars.forEach(char => {
        if (path.includes(char)) valid = false
    });
    return valid
}

export const MAX_BROADCAST_WINDOW = 2879 //48 hours - 1 minute

export const MAX_TWITTER_HANDLE_LENGTH = 15
export const MAX_FACEBOOK_HANDLE_LENGTH = 100
export const MAX_INSTAGRAM_HANDLE_LENGTH = 30
export const MAX_SNAPCHAT_HANDLE_LENGTH = 30
export const MAX_GITHUB_HANDLE_LENGTH = 39

export const MAX_USERNAME_LENGTH = 30
export const MAX_DISPLAY_NAME_LENGTH = 35
export const MAX_LOCATION_NAME_LENGTH = 100
export const MAX_BROADCAST_NOTE_LENGTH = 500
export const MAX_GROUP_NAME_LENGTH = 40