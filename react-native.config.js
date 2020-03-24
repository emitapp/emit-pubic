module.exports = {
  assets: ['./#styling/fonts/'],
  dependencies: {
    'react-native-notifications': {
      platforms: {
        android: null //Added to disable auto-linking for react-native-notifications
      }
    }
  }
}