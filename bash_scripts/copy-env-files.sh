echo "🤖    Copying over the google-services.jsons for Android Firebase"
cp .env/google-services.dev.json android/app/src/dev/google-services.json
cp .env/google-services.prod.json android/app/src/prod/google-services.json
cp .env/google-services.prod.json android/app/src/qa/google-services.json

echo "🍎    Copying over the GoogleService-Info.plists for iOS Firebase"
mkdir -p ios/Firebase
cp .env/GoogleService-Info.dev.plist ios/Firebase/GoogleService-Info.dev.plist
cp .env/GoogleService-Info.prod.plist ios/Firebase/GoogleService-Info.prod.plist
cp .env/GoogleService-Info.qa.plist ios/Firebase/GoogleService-Info.qa.plist

yarn run env