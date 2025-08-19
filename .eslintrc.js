module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },
  rules: {
    // Add any specific rules you want here
    'no-console': 'off', // Allow console logs in this project
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
  },
};