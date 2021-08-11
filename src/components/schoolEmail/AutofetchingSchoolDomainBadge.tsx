import React from 'react';
import { default as SchoolDomainBadge, SchoolDomainBadgeProps } from './SchoolDomainBadge';
import firestore from '@react-native-firebase/firestore';
import { logError } from 'utils/helpers';
import { getSchoolInfoFromDomain } from 'data/schoolDomains';

interface AutofetchingSchoolDomainBadgeProps {
    uid: string
}

export default class AutofetchingSchoolDomainBadge extends React.PureComponent<SchoolDomainBadgeProps & AutofetchingSchoolDomainBadgeProps> {

    state = {
        domainFromFirebase: null as string | null
    }

    componentDidMount(){
        firestore().collection("extraUserInfo").doc(this.props.uid).get()
            .then(doc => {
                if (doc.exists){
                    this.setState({domainFromFirebase: doc.data()?.lastVerifiedEmailDomain ?? null})
                }
            })
            .catch(err => logError(err))
    }

    render(): React.ReactNode | null {
        if (!this.state.domainFromFirebase) return null
        return (
            <SchoolDomainBadge {...this.props} domainInfo={getSchoolInfoFromDomain(this.state.domainFromFirebase)}/>
        )
    }
}