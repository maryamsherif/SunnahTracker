module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "plugin:react-refresh/recommended",
  ],
  ignorePatterns: ["dist", "node_modules"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {},
};
