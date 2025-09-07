module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "node_modules"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: {
    react: { version: "18.3" },
  },
  plugins: ["react-refresh"],
  globals: {
    vi: "readonly",
    global: "readonly",
    process: "readonly",
    beforeAll: "readonly",
    afterAll: "readonly",
    afterEach: "readonly",
    beforeEach: "readonly",
    describe: "readonly",
    it: "readonly",
    test: "readonly",
    expect: "readonly",
  },
  rules: {
    // Modern React doesn't require React import for JSX
    "react/react-in-jsx-scope": "off",
    "react/jsx-no-target-blank": "off",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    // Relax some rules for development
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "react/prop-types": "warn", // Change from error to warning
    "no-undef": "error",
    "no-useless-escape": "warn",
    "react/no-unescaped-entities": "warn",
    "react/no-unknown-property": "warn",
  },
};
