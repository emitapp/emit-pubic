import { Platform } from 'react-native';
import { checkMultiple, RESULTS } from 'react-native-permissions';
import { logError } from 'utils/helpers';

/**
 * Check the permissions, asks for them if needed.
 * returns either ENOUGH_GRANTED or NOT_ENOUGH_GRANTED
 * arguments of form: {required: [...] optional: [...] }
 * @param {*} androidPermissions 
 * @param {*} iosPermissions 
 * @returns true if enough permissions are granted, else false
 */
export const checkAndGetPermissions = async (androidPermissions, iosPermissions) => {
    try {
        const promises = []
        let allPermissions = Platform.OS == "android" ? androidPermissions : iosPermissions

        if (!allPermissions) allPermissions = { required: [], optional: [] }
        if (!allPermissions.required) allPermissions.required = []
        if (!allPermissions.optional) allPermissions.optional = []

        const statuses = await checkMultiple([...allPermissions.required, ...allPermissions.optional])

        for (const permissionName of allPermissions.required) {
            const status = statuses[permissionName]
            if (status != RESULTS.GRANTED && status != RESULTS.LIMITED) {
                logError(`Essential Permission ${permissionName} not Granted, aborted`, false)
                return false
            }
        }
        return true;
    } catch (err) {
        throw err //Let the caller handle this
    }
}