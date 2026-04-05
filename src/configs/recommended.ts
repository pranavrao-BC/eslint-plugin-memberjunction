/**
 * Recommended config — all rules as warnings.
 * Non-intrusive: won't block builds, won't red-squiggle existing code.
 * Devs opt in by adding this config to their eslint.config.
 */
export const recommended = {
  rules: {
    '@memberjunction/no-entity-get-set': 'warn',
    '@memberjunction/no-static-singleton': 'warn',
    '@memberjunction/no-entity-spread': 'warn',
    '@memberjunction/use-uuids-equal': 'warn',
    '@memberjunction/member-naming-convention': 'warn',
    '@memberjunction/no-ng-on-changes': 'warn',
    '@memberjunction/no-cross-package-reexport': 'warn',
    '@memberjunction/no-router-in-generic': 'warn',
    '@memberjunction/no-fields-with-entity-object': 'warn',
    '@memberjunction/no-enum-prefer-union': 'warn',
    '@memberjunction/no-kendo-icons': 'warn',
    '@memberjunction/no-legacy-template-syntax': 'warn',
  },
} as const;

/**
 * Strict config — all rules as errors.
 * For CI enforcement on new code (e.g., via diff-aware linting).
 */
export const strict = {
  rules: {
    '@memberjunction/no-entity-get-set': 'error',
    '@memberjunction/no-static-singleton': 'error',
    '@memberjunction/no-entity-spread': 'error',
    '@memberjunction/use-uuids-equal': 'error',
    '@memberjunction/member-naming-convention': 'error',
    '@memberjunction/no-ng-on-changes': 'error',
    '@memberjunction/no-cross-package-reexport': 'error',
    '@memberjunction/no-router-in-generic': 'error',
    '@memberjunction/no-fields-with-entity-object': 'error',
    '@memberjunction/no-enum-prefer-union': 'error',
    '@memberjunction/no-kendo-icons': 'error',
    '@memberjunction/no-legacy-template-syntax': 'error',
  },
} as const;
