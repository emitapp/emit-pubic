import axios from "axios"
import { Coordinates } from "utils/geo/GeolocationFunctions"

// https://developers.google.com/maps/documentation/places/web-service/autocomplete#place_autocomplete_responses
export interface GoogleApiResponseBase {
    status: "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST" | "UNKNOWN_ERROR",
    info_messages?: string[],
    error_message?: string,
}

export interface GoogleAutocompleteApiResponse extends GoogleApiResponseBase {
    predictions: Array<GoogleAutocompletePrediction>
}

export interface GoogleAutocompletePrediction {
    description: string,
    distance_meters: number,
    place_id: string,
    terms: Array<{ value: string, offset: number }>,
    types: string[],
    matched_substrings: Array<{ offset: number, length: number }>,
    structured_formatting: {
        main_text: string,
        main_text_matched_substrings: Array<{ offset: number, length: number }>,
        secondary_text: string
    }
}

//https://developers.google.com/maps/documentation/places/web-service/details
//This is just the subset of fields we care about
export interface GoogleDetailsResponse extends GoogleApiResponseBase {
    html_attributions: string[],
    result: {
        geometry?: {
            location?: {
                lat: number,
                lng: number
            }
        }
    }
}


export const requestAutocompleteFromGoogle = async (
    rawQuery: string,
    apiKey: string,
    sessionToken: string,
    coordinates: Coordinates,
    cacheHolder?: Record<string, Array<GoogleAutocompletePrediction>>
): Promise<Array<GoogleAutocompletePrediction>> => {
    const query = rawQuery.trim()
    if (!query) { return [] }
    //Check the cache first
    if (cacheHolder && cacheHolder[query]) {
        return cacheHolder[query]
    }

    let queryUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json?"
    queryUrl += `input=${encodeURI(query)}&`
    queryUrl += `key=${apiKey}&`
    queryUrl += `sessiontoken=${sessionToken}&`
    queryUrl += `origin=${coordinates.latitude},${coordinates.longitude}&`
    queryUrl += `location=${coordinates.latitude},${coordinates.longitude}&`
    queryUrl += `language=en`

    const response = (await axios.get(queryUrl)).data as GoogleAutocompleteApiResponse
    if (response.status === "OK" || "ZERO_RESULTS") {
        // eslint-disable-next-line require-atomic-updates
        if (cacheHolder) { cacheHolder[query] = response.predictions }
        return response.predictions
    }
    else { throw new Error(response.error_message || "Couldn't get Google Autocomplete information.") }
}

export const requestCompletePlaceDataFromGoogle = async (
    placeId: string,
    apiKey: string,
    sessionToken: string
): Promise<GoogleDetailsResponse | null> => {
    let queryUrl = "https://maps.googleapis.com/maps/api/place/details/json?"
    queryUrl += `place_id=${encodeURI(placeId)}&`
    queryUrl += `key=${apiKey}&`
    queryUrl += `sessiontoken=${sessionToken}&`
    queryUrl += `language=en&`
    queryUrl += `fields=geometry`

    const response = (await axios.get(queryUrl)).data as GoogleDetailsResponse
    if (response.status === "OK") {
        return response
    } else {
        throw new Error(response.error_message || "Couldn't get Google Place information.")
    }
}
