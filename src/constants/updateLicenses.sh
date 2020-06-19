echo "🕷️    Upating the licenses information using crawler..."
npx npm-license-crawler --onlyDirectDependencies -json src/constants/dependencyLicenses.js
echo "✏️    Adding comment and export command to js file "
echo "//Don't edit this file directly. This file pulls data from package.json - run 'yarn run updateLicenses'\nexport default" | cat - src/constants/dependencyLicenses.js > temp && mv temp src/constants/dependencyLicenses.js