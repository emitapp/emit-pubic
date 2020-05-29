echo "📋    Copying Prod firebase plist file"
cp -r "ios/Firebase/GoogleService-Info.prod.plist" "ios/GoogleService-Info.plist"
echo "ios/Firebase/GoogleService-Info.prod.plist copied"
echo "📲    Running Dev.Debug configuration on simulation"
react-native run-ios --scheme biteup --configuration Prod.Debug
echo "🗑️    Deleting copied plist"
rm ios/GoogleService-Info.plist