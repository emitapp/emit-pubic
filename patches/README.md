This readme contains all the info for why each of these patches were added.

**react-native+0.63.4.patch**

This was added because of an ordering issue with how gradle bundles our files.
I suspect this will be fixes in React Native 0.64. More info:

https://github.com/facebook/react-native/issues/29398#issuecomment-711127186

https://github.com/facebook/react-native/pull/30177#issuecomment-713832551

https://github.com/facebook/react-native/pull/30824

