// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    // Vendored design prototypes (reference only, not shipped). `**` so nested
    // .jsx under these trees is ignored too — `design/*` only matched direct
    // children and let the prototype flood `eslint .`.
    ignores: [
      'dist/**',
      'design/**',
      'design-motion/**',
      'backend-server/**',
      'node_modules/**',
      '.expo/**',
    ],
  },
]);
