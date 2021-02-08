echo "📋    Copying Dev firebase plist file"
cp -r "ios/Firebase/GoogleService-Info.dev.plist" "ios/GoogleService-Info.plist"
echo "ios/Firebase/GoogleService-Info.dev.plist copied"
echo "📲    Running Dev.Debug configuration on simulation"
react-native run-ios --scheme emitdev --configuration Dev.Debug
echo "🗑️    Deleting copied plist"
rm ios/GoogleService-Info.plist