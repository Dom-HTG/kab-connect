import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules, // disables ESLint rules that conflict with Prettier
      'prettier/prettier': 'error', // enforce Prettier formatting
    },
  }),
];
