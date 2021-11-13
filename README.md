#  <img src="./readme_media/EmitLogo.png" height= 50 align="left" /> Emit
![My Motivations](https://img.shields.io/badge/Powered%20by-passion-brightgreen?style=for-the-badge)

A mobile app for making it easier to catch up with friends spontaneously.

Oh and also, if you're using VS Code (I hope you are, haha!), take a look at the recommended extensions in the `.vscode` folder.


-   The Android and iOS config files for the Biteup Firebase backend have been

.gitignored and hence aren't part of this repo. If you want to connect this

code to your own backend, follow these instructions for [Android](https://invertase.io/oss/react-native-firebase/quick-start/android-firebase-credentials) and [iOS](https://invertase.io/oss/react-native-firebase/quick-start/ios-firebase-credentials). You need 4 (2 for each platform, one for prod and one for dev). The paths:

    -   ios/Firebase/GoogleService-Info.dev.plist

    -   ios/Firebase/GoogleService-Info.prod.plist

    -   ios/Firebase/GoogleService-Info.qa.plist

    -   android/app/src/dev/google-services.json

    -   android/app/src/prod/google-services.json

-   This project uses CocoaPods.

-   App now needs Google Play Services (for the MapView)

-   jsconfig.json is there to allow for [autocomplete of directory aliases](https://github.com/ChristianKohler/PathIntellisense/issues/58).

-   You're gonna have to setup your .env variables for the app. That works using [this package](https://github.com/maxkomarychev/react-native-ultimate-config), so you might have to follow some setup instructions there. Then, follow the template set in env.example (without the comments though) Also, whenever you make native changes, you're gonna have to run `yarn run env` again.

-   If you want to rename the project, maybe use <https://github.com/strdr4605/react-native-rename>. You're also gonna have to do some manual renaming, though.

-   This app uses Android Build Favours and iOS Build Schemes and Configurations to make 3 separate apps: dev, prod and qa (qa is identical to prod but it has a different bundle id so it doesn't pollute our analytics). They all share the same codebase. They mainly just differ in their launch icon and the firebase project they connect to (as well as a couple API keys they use). Instructions on how to do that can be found [on this Github issue](https://github.com/invertase/react-native-firebase/issues/3504), [this issue](https://github.com/invertase/react-native-firebase/issues/452#issuecomment-332921054), [this Medium post](https://medium.com/@ywongcode/building-multiple-versions-of-a-react-native-app-4361252ddde5), and [this Medium post](https://medium.com/bam-tech/setup-firebase-on-ios-android-with-multiple-environments-ad4e7ef35607). Note, however, that copying the plist files using build scripts [never worked for me ](https://stackoverflow.com/questions/62077466/xcode-11-unable-to-copyplistfile-plist-file-that-was-just-copied-using-build-pha)(because Xcode sucks). So, when building dev and prod debug builds, I used bash scripts to do the copying for me. You're gonna have to do that copying manually if you want to make release or app store builds, though.
