import axios from "axios";
import { distanceBetween } from 'geofire-common';
import allSettled, { PromiseResolution } from 'promise.allsettled'; //https://github.com/facebook/react-native/issues/30236
import { Coordinates } from "utils/geo/GeolocationFunctions";
import { SHORT_TIMEOUT, timedPromise } from 'utils/helpers';


//https://nominatim.org/release-docs/develop/api/Output/#json
//This is just the subset of fields we care about
export interface NominatimPlace {
    lat: string;
    lon: string;
    display_name: string;
    error?: string
}

//https://photon.komoot.io/
export interface PhotonReverseGeolocationResponse {
    message?: string
    features?: Array<{
        geometry: PhotonReverseGeolocationGeometry
        type: string
        properties: PhotonReverseGeoPlaceProperties
    }>
    type?: string;
}
export interface PhotonReverseGeolocationGeometry {
    coordinates?: [number, number];
    type: string;
}
export interface PhotonReverseGeoPlaceProperties {
    osm_id?: number;
    country?: string;
    city?: string;
    countrycode?: string;
    postcode?: string;
    county?: string;
    type?: string;
    osm_type?: string;
    osm_key?: string;
    street?: string;
    district?: string;
    osm_value?: string;
    name?: string;
    state?: string;
}


//General OSM Result (to standardize the different OSM solutions)
export interface OSMResult {
    name: string,
    coords: Coordinates,
    source: "nominatim" | "photon"
}

export const reverseGeocodeFromNominatim = async (
    coords: Coordinates
): Promise<OSMResult> => {
    let queryUrl = "https://nominatim.openstreetmap.org/reverse?"
    queryUrl += `lat=${coords.latitude}&lon=${coords.longitude}&`
    queryUrl += `format=json`

    const response = (await axios.get(queryUrl)).data as NominatimPlace
    if (!response.error) {
        const osmResult: OSMResult = {
            name: response.display_name,
            coords: {
                latitude: parseFloat(response.lat),
                longitude: parseFloat(response.lon),
            },
            source: "nominatim",
        }
        return osmResult
    }
    else { throw new Error("Error Processing final place information: " + response.error) }
}

export const reverseGeocodeFromPhoton = async (
    coords: Coordinates
): Promise<OSMResult> => {
    let queryUrl = "https://photon.komoot.io/reverse?"
    queryUrl += `lat=${coords.latitude}&lon=${coords.longitude}`

    const response = (await axios.get(queryUrl)).data as PhotonReverseGeolocationResponse
    if (!response.message && response.features && 
        response.features[0] &&
        response.features[0].geometry.coordinates &&
        response.features[0].properties.name) {
        const osmResult: OSMResult = {
            name: response.features[0].properties.name,
            coords: {
                latitude: response.features[0].geometry.coordinates[1],
                longitude: response.features[0].geometry.coordinates[0],
            },
            source: "photon",
        }
        return osmResult
    }
    else { throw new Error("Error Processing final place information! " + response.message) }
}

/**
 * Uses a combination of OSM-based APIs to reverse geocode a location. 
 * Internally uses timedPromise, so it can timeout
 * @param coords 
 */
export const reverseGeocodeToOSM = async (coords: Coordinates) : Promise<OSMResult> => {
    const responses = await allSettled([
      timedPromise(reverseGeocodeFromNominatim(coords), SHORT_TIMEOUT),
      timedPromise(reverseGeocodeFromPhoton(coords), SHORT_TIMEOUT),
    ])

    //Processing to be able to pick the best OSM suggestion
    const sortedSuggestions = responses
      .filter(pr => pr.status === "fulfilled")
      .map(pr => (pr as PromiseResolution<OSMResult>).value)
      .sort((a, b) => osmSuggestionDistanceFromCoords(coords, a) - osmSuggestionDistanceFromCoords(coords, b))

    if (sortedSuggestions.length === 0) {
      throw new Error("We couldn't get the coordinates of this place. Sorry!")
    }
    return sortedSuggestions[0]
}


const osmSuggestionDistanceFromCoords = (userCoords: Coordinates, osmResult: OSMResult): number => {
    return distanceBetween(
      [userCoords.latitude, userCoords.longitude],
      [osmResult.coords.latitude, osmResult.coords.longitude]
    )
  }

