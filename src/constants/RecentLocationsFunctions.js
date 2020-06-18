//Locations are of the format
//{name: string, geolocation?:{latitude: number, longitude: number}, uid?: string}
//Only two functions will be called where the user expects to see the result immediately:
//clearRecentLocations and getRecentLocations
//Those will have to handle promise rejects where they're used
//the other functions will manage promise rejects on their own
import AsyncStorage from '@react-native-community/async-storage';
import { logError } from 'utils/helpers';

const ASYNC_LOCATION_KEY = "recent_locations"
const maxRecentLocations = 30

export const getRecentLocations = async () => {
    const value = await AsyncStorage.getItem(ASYNC_LOCATION_KEY)
    return JSON.parse(value) || []
}

export const clearRecentLocations = async () => {
    await AsyncStorage.removeItem(ASYNC_LOCATION_KEY)
}

export const bubbleToTop = async (locationIndex) => {
    try{
        const locations = await getRecentLocations();
        const targetLocation = locations.splice(locationIndex, 1)[0]
        locations.splice(0, 0, targetLocation);
        await saveCurrentLocationsPromise(locations)
    }catch(err){
        logError(err)
    }
}

export const addNewLocation = async (newLocation) => {
    try{
        const currentList = await getRecentLocations()
        currentList.unshift(newLocation);
        if (currentList.length > maxRecentLocations) currentList.pop()
        await saveCurrentLocationsPromise(currentList)
    }catch(err){
        logError(err)
    }
}

export const bubbleOrAddSavedLocation = async (savedLocation) => {
    try{
        const currentList = await getRecentLocations()
        const index = currentList.findIndex(item => item.uid === savedLocation.uid);
        if (index == -1){
            await addNewLocation(savedLocation)
        }else{
            await bubbleToTop(index)
        }
    }catch(err){
        logError(err)
    }
}

const saveCurrentLocationsPromise = async (newCompleteList) => {
    const jsonValue = JSON.stringify(newCompleteList)
    await AsyncStorage.setItem(ASYNC_LOCATION_KEY, jsonValue)
}