import {ImageSourcePropType} from 'react-native'

export interface domainInfo {
    domain: string
    name: string,
    shortName: string,
    photo: ImageSourcePropType
}

const domains : Record<string, Omit<domainInfo, "domain">>  = {
    "brown.edu": {
        name: "Brown University",
        shortName: "Brown",
        photo: require("media/schoolEmblems/brown.png")
    },
    "risd.edu": {
        name: "RISD",
        shortName: "RISD",
        photo: require("media/schoolEmblems/risd.png")
    }
}

export const getSchoolInfoFromDomain = (domain: string) : domainInfo => {
    if (domains[domain]) {
        return {...domains[domain], domain}
    }
    else {
        return {
            domain,
            name: domain,
            shortName: domain,
            photo: require("media/schoolEmblems/default.png")
        }
    }
}