const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/renderer/dist/**'],
  },
  js.configs.recommended,
  {
    files: ['src/main/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        URL: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
