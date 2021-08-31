import firestore from '@react-native-firebase/firestore';

export const getOrgoAssociatedWithUser = async (uid: string) : Promise<string | null> => {
    const doc = await firestore().collection("publicExtraUserInfo").doc(uid).get()
    if (!doc.data()) return null
    return doc.data()?.lastVerifiedEmailDomain ?? null
}

export const getOrgoHashAssociatedWithUser = async (uid: string) : Promise<string | null> => {
    const doc = await firestore().collection("publicExtraUserInfo").doc(uid).get()
    if (!doc.data()) return null
    return doc.data()?.hashedDomain ?? null
}