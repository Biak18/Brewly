// jest.config.js
module.exports = {
  preset: "jest-expo",
  setupFiles: [
    "./node_modules/react-native-gesture-handler/jestSetup.js",
    "./jest.setup.js",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
  // Standard Expo/RN boilerplate: these packages ship untranspiled ESM/JSX
  // that Jest needs to run through Babel — without this, imports of any of
  // these anywhere in the dependency tree throw a syntax error under Jest.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
};
