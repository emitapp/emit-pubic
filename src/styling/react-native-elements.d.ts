//TODO: Figure out why I have to do this to stop getting import errors for react-native-elements in other files
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import dummy from "react-native-elements"

type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };
//https://reactnativeelements.com/docs/customization/#typescript-definitions-extending-the-default-theme
//(v 3.4.2 of the docs)

declare module 'react-native-elements' {

    export interface Colors {

        bannerButton: string,
        bannerButtonGreen: string,
        bannerButtonRed: string,
        bannerButtonBlue: string,

        statusBar: string,

        gradientStart: string,
        gradientEnd: string,

        softRed: string
    }

    export interface FullTheme {
        colors: RecursivePartial<Colors>
    }
}
