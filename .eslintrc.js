module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    useJSXTextNode: true,
    project: "./tsconfig.json",
    tsconfigRootDir: "."
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "@react-native-community"
  ],
  rules:{
    "semi": 0,
    "quotes": 0,
    "prettier/prettier": 0, //We get prettier/prettier from @react-native-community
  },
  ignorePatterns: ["**/*.js"] //We're slowly transitioning to TS, lots of JS files will have linting errors
};
