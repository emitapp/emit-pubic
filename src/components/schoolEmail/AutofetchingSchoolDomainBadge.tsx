import { getSchoolInfoFromDomain } from 'data/schoolDomains';
import React from 'react';
import { logError } from 'utils/helpers';
import { getOrgoAssociatedWithUser } from 'utils/orgosAndDomains';
import { default as SchoolDomainBadge, SchoolDomainBadgeProps } from './SchoolDomainBadge';

interface AutofetchingSchoolDomainBadgeProps {
    uid: string
}

export default class AutofetchingSchoolDomainBadge extends React.PureComponent<SchoolDomainBadgeProps & AutofetchingSchoolDomainBadgeProps> {

    state = {
        domainFromFirebase: null as string | null
    }

    componentDidMount() : void{
        getOrgoAssociatedWithUser(this.props.uid)
            .then(domain => this.setState({domainFromFirebase: domain}))
            .catch(err => logError(err))
    }

    render(): React.ReactNode | null {
        if (!this.state.domainFromFirebase) return null
        return (
            <SchoolDomainBadge {...this.props} domainInfo={getSchoolInfoFromDomain(this.state.domainFromFirebase)}/>
        )
    }
}