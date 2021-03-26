echo "📋    Copying QA firebase plist file"
cp -r "ios/Firebase/GoogleService-Info.qa.plist" "ios/GoogleService-Info.plist"
echo "ios/Firebase/GoogleService-Info.qa.plist copied"
echo "📲    Running QA.Debug configuration on simulation"
react-native run-ios --scheme emit --configuration QA.Debug
echo "🗑️    Deleting copied plist"
rm ios/GoogleService-Info.plist