/**
 * Packages that follow external conventions (React, oclif CLI, A2A protocol)
 * where MJ's PascalCase naming doesn't apply.
 */
const EXTERNAL_CONVENTION_PATHS = [
  'React/',
  'AICLI/',
  'A2AServer/',
  'ComponentRegistryClientSDK/',
];

/**
 * Recommended config — all rules as warnings, naming rule off by default.
 * Non-intrusive: won't block builds, won't red-squiggle existing code.
 * Devs opt in by adding this config to their eslint.config.
 */
export const recommended = {
  rules: {
    'memberjunction/no-entity-get-set': 'warn',
    'memberjunction/no-static-singleton': 'warn',
    'memberjunction/no-entity-spread': 'warn',
    'memberjunction/use-uuids-equal': 'warn',
    'memberjunction/member-naming-convention': 'off',
    'memberjunction/no-ng-on-changes': 'warn',
    'memberjunction/no-cross-package-reexport': 'warn',
    'memberjunction/no-router-in-generic': 'warn',
    'memberjunction/no-fields-with-entity-object': 'warn',
    'memberjunction/no-enum-prefer-union': 'warn',
    'memberjunction/no-kendo-icons': 'warn',
    'memberjunction/no-legacy-template-syntax': 'warn',
    'memberjunction/no-direct-entity-new': 'warn',
    'memberjunction/no-runview-in-loop': 'warn',
    'memberjunction/runview-check-success': 'warn',
    'memberjunction/entity-save-check-result': 'warn',
    'memberjunction/prefer-inject-function': 'warn',
    'memberjunction/for-requires-track': 'warn',
    'memberjunction/no-any-type': 'warn',
    'memberjunction/no-action-call-action': 'warn',
    'memberjunction/require-standalone-false': 'warn',
    'memberjunction/no-promise-all-runview': 'warn',
    'memberjunction/prefer-simple-result-type': 'warn',
    'memberjunction/no-global-provider-on-server': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
} as const;

/**
 * Strict config — all rules as errors, with external-convention packages excluded
 * from the naming rule. For CI enforcement on new code (diff-aware).
 */
export const strict = {
  rules: {
    'memberjunction/no-entity-get-set': 'error',
    'memberjunction/no-static-singleton': 'error',
    'memberjunction/no-entity-spread': 'error',
    'memberjunction/use-uuids-equal': 'error',
    'memberjunction/member-naming-convention': ['error', { excludePaths: EXTERNAL_CONVENTION_PATHS }],
    'memberjunction/no-ng-on-changes': 'error',
    'memberjunction/no-cross-package-reexport': 'error',
    'memberjunction/no-router-in-generic': 'error',
    'memberjunction/no-fields-with-entity-object': 'error',
    'memberjunction/no-enum-prefer-union': 'error',
    'memberjunction/no-kendo-icons': 'error',
    'memberjunction/no-legacy-template-syntax': 'error',
    'memberjunction/no-direct-entity-new': 'error',
    'memberjunction/no-runview-in-loop': 'error',
    'memberjunction/runview-check-success': 'error',
    'memberjunction/entity-save-check-result': 'error',
    'memberjunction/prefer-inject-function': 'error',
    'memberjunction/for-requires-track': 'error',
    'memberjunction/no-any-type': 'error',
    'memberjunction/no-action-call-action': 'error',
    'memberjunction/require-standalone-false': 'error',
    'memberjunction/no-promise-all-runview': 'error',
    'memberjunction/prefer-simple-result-type': 'error',
    'memberjunction/no-global-provider-on-server': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
} as const;
