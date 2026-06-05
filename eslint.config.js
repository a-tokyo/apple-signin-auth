const js = require('@eslint/js');
const ftFlow = require('eslint-plugin-ft-flow');
const babelParser = require('@babel/eslint-parser');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  { ignores: ['lib/', 'flow-typed/', 'typescript/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: { requireConfigFile: true },
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: { 'ft-flow': ftFlow },
    rules: {
      ...ftFlow.configs.recommended.rules,
      'no-underscore-dangle': 'off',
      // Prettier owns formatting — disable ft-flow stylistic rules that conflict with it.
      'ft-flow/space-after-type-colon': 'off',
      'ft-flow/space-before-type-colon': 'off',
      'ft-flow/union-intersection-spacing': 'off',
      'ft-flow/object-type-delimiter': 'off',
      'ft-flow/generic-spacing': 'off',
    },
  },
  prettier,
];
