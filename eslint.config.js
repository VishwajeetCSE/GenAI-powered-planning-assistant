/**
 * @file eslint.config.js
 * @description Flat ESLint configuration (ESLint v9+ standard).
 */

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FileReader: 'readonly',
        Intl: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 'args': 'none' }],
      'no-debugger': 'error',
      'no-eval': 'error'
    }
  }
];
