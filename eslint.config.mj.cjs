/**
 * Flat config equivalent of eslintrc.mj.json.
 * Used by mj-lint CLI on ESLint 9+.
 */
const mj = require('./dist/index.js');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/generated/**',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/*.d.ts',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    plugins: { memberjunction: mj },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'memberjunction/no-entity-get-set': 'warn',
      'memberjunction/no-entity-spread': 'warn',
      'memberjunction/no-direct-entity-new': 'warn',
      'memberjunction/use-uuids-equal': 'warn',
      'memberjunction/no-fields-with-entity-object': 'warn',
      'memberjunction/no-runview-in-loop': 'warn',
      'memberjunction/runview-check-success': 'warn',
      'memberjunction/entity-save-check-result': 'warn',
      'memberjunction/no-promise-all-runview': 'warn',
      'memberjunction/prefer-simple-result-type': 'warn',
      'memberjunction/no-legacy-template-syntax': 'warn',
      'memberjunction/for-requires-track': 'warn',
      'memberjunction/prefer-inject-function': 'warn',
      'memberjunction/no-ng-on-changes': 'warn',
      'memberjunction/no-router-in-generic': 'warn',
      'memberjunction/require-standalone-false': 'warn',
      'memberjunction/no-any-type': 'warn',
      'memberjunction/no-action-call-action': 'warn',
      'memberjunction/no-static-singleton': 'warn',
      'memberjunction/no-cross-package-reexport': 'off',
      'memberjunction/no-enum-prefer-union': 'warn',
      'memberjunction/no-kendo-icons': 'warn',
      'memberjunction/member-naming-convention': ['warn', {
        excludePaths: ['React/', 'AICLI/', 'A2AServer/', 'ComponentRegistryClientSDK/'],
      }],
      'memberjunction/no-global-provider-on-server': 'warn',
    },
  },
  {
    files: ['packages/Angular/**/*.ts'],
    rules: {
      'memberjunction/no-global-provider-on-server': 'off',
      'memberjunction/member-naming-convention': 'off',
    },
  },
  {
    files: ['packages/Actions/**/*.ts'],
    rules: {
      'memberjunction/no-global-provider-on-server': 'off',
    },
  },
];
