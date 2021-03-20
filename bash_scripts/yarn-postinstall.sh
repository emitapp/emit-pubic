echo "🔨 Patching packages..."
patch-package #https://www.npmjs.com/package/patch-package

echo "🔗 Linking .env to native code..."
yarn run env

yarn run updateLicenses