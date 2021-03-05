import { Platform } from 'react-native';
import { check, request, RESULTS } from 'react-native-permissions';
import { logError } from 'utils/helpers';

/**
 * Check the permissions, asks for them if needed.
 * returns either ENOUGH_GRANTED or NOT_ENOUGH_GRANTED
 * This promise rejects if there's not enough permissions
 * arguments of form: {required: [...] optional: [...] }
 * @param {*} androidPermissions 
 * @param {*} iosPermissions 
 * @returns true if enough permissions are granted, else false
 */
export const checkAndGetPermissions = async (androidPermissions, iosPermissions) => {
    try {
        const promises = []
        const permissionStatuses = {}
        let allPermissions = Platform.OS == "android" ? androidPermissions : iosPermissions

        if (!allPermissions) allPermissions = { required: [], optional: [] }
        if (!allPermissions.required) allPermissions.required = []
        if (!allPermissions.optional) allPermissions.optional = []

        allPermissions.required.forEach(perm => {
            promises.push((async () => permissionStatuses[perm] = await requestIfNeeded(perm, await check(perm)))())
        });

        allPermissions.optional.forEach(perm => {
            promises.push((async () => permissionStatuses[perm] = await requestIfNeeded(perm, await check(perm)))())
        });

        await Promise.all(promises)
        for (const permissionName of allPermissions.required) {
            const status = permissionStatuses[permissionName]
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

requestIfNeeded = async (permission, checkResult) => {
    try {
        if (checkResult == RESULTS.GRANTED || checkResult == RESULTS.LIMITED) {
            return checkResult;
        } else if (checkResult == RESULTS.UNAVAILABLE || checkResult == RESULTS.BLOCKED) {
            return checkResult;
        } else {
            let newStatus = await request(permission);
            return newStatus;
        }
    } catch (err) {
        logError(err)
    }
}
