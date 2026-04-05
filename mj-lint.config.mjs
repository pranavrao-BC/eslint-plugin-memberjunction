import plugin from './dist/index.js';
import tsParser from './node_modules/@typescript-eslint/parser/dist/index.js';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/generated/**', '**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: { '@memberjunction': plugin },
    rules: plugin.configs.recommended.rules,
  },
];
