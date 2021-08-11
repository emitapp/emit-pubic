echo "🕷️    Upating the licenses information using crawler..."
npx npm-license-crawler --onlyDirectDependencies -json src/data/dependencyLicenses.js
echo "✏️    Adding comment and export command to js file "
echo "//Don't edit this file directly. This file pulls data from package.json - run 'yarn run updateLicenses'\nexport default" | cat - src/data/dependencyLicenses.js > temp && mv temp src/data/dependencyLicenses.js