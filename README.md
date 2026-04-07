# @memberjunction/eslint-plugin

Linter suite for MemberJunction conventions — **23 ESLint rules**, 2 Stylelint rules, 4 SQL migration checks. Enforces the [MJ CLAUDE.md](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md) critical rules automatically.

Validated against the full MJ monorepo (2,381 files) with zero false positives.

## Installation

```bash
npm install --save-dev @memberjunction/eslint-plugin @typescript-eslint/parser
```

Or, for development against the repo directly:

```bash
git clone https://github.com/pranavrao-BC/eslint-plugin-memberjunction.git
cd eslint-plugin-memberjunction
npm install && npm run build
```

## Setup

### ESLint 9+ (Flat Config)

Create or update `eslint.config.mjs` in your project root:

```js
import tsParser from '@typescript-eslint/parser';
import mjPlugin from '@memberjunction/eslint-plugin';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/generated/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: { '@memberjunction': mjPlugin },
    rules: mjPlugin.configs.recommended.rules,  // or .strict.rules for CI
  },
];
```

### ESLint 8 (Legacy Config)

Add to `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@memberjunction"],
  "extends": [],
  "rules": {
    "@memberjunction/no-entity-get-set": "warn",
    "@memberjunction/no-static-singleton": "warn",
    "@memberjunction/no-entity-spread": "warn",
    "@memberjunction/use-uuids-equal": "warn",
    "@memberjunction/no-direct-entity-new": "warn",
    "@memberjunction/no-runview-in-loop": "warn",
    "@memberjunction/runview-check-success": "warn",
    "@memberjunction/entity-save-check-result": "warn",
    "@memberjunction/no-promise-all-runview": "warn",
    "@memberjunction/prefer-simple-result-type": "warn",
    "@memberjunction/no-any-type": "warn",
    "@memberjunction/no-action-call-action": "warn",
    "@memberjunction/require-standalone-false": "warn",
    "@memberjunction/prefer-inject-function": "warn",
    "@memberjunction/for-requires-track": "warn",
    "@memberjunction/no-ng-on-changes": "warn",
    "@memberjunction/no-cross-package-reexport": "warn",
    "@memberjunction/no-router-in-generic": "warn",
    "@memberjunction/no-fields-with-entity-object": "warn",
    "@memberjunction/no-enum-prefer-union": "warn",
    "@memberjunction/no-kendo-icons": "warn",
    "@memberjunction/no-legacy-template-syntax": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Running Against the MJ Monorepo (Standalone)

If you haven't added the plugin to MJ's `package.json` yet, you can run it standalone using the bundled config:

```bash
cd /path/to/MJ
ESLINT_USE_FLAT_CONFIG=true /path/to/eslint-plugin-memberjunction/node_modules/.bin/eslint \
  --config /path/to/eslint-plugin-memberjunction/mj-lint.config.mjs \
  "packages/**/src/**/*.ts" \
  --no-error-on-unmatched-pattern
```

### Stylelint (CSS Design Tokens)

```bash
npx stylelint "packages/Angular/**/*.css" \
  --config /path/to/eslint-plugin-memberjunction/mj-stylelint.config.mjs
```

### SQL Migration Linter

```bash
node /path/to/eslint-plugin-memberjunction/dist/sql/lint-migrations.js /path/to/MJ/migrations/v5/
```

## Configs

| Config | Severity | Naming Rule | Use Case |
|--------|----------|-------------|----------|
| **`recommended`** | `warn` | off | Local development — non-blocking, IDE hints |
| **`strict`** | `error` | on (with exclusions) | CI pipeline — blocks PRs with violations |

Both configs also enable `@typescript-eslint/no-explicit-any` to ban all `any` usage.

The strict config excludes external-convention packages (`React/`, `AICLI/`, `A2AServer/`, `ComponentRegistryClientSDK/`) from the naming rule since they follow React/oclif/A2A conventions rather than MJ PascalCase.

## Rules

### Entity / Data Access (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-entity-get-set` | warn | `.Get('Field')`/`.Set('Field', val)` — use strongly-typed properties |
| `no-entity-spread` | warn | `{ ...entity }` — use `.GetAll()` instead |
| `no-direct-entity-new` | warn | `new XyzEntity()` — use `md.GetEntityObject<T>()` class factory |
| `use-uuids-equal` | warn | `===` on UUID fields — use `UUIDsEqual()` for case-insensitive comparison |
| `no-fields-with-entity-object` | warn | `Fields` param with `ResultType: 'entity_object'` — Fields is silently ignored |

### Performance / Correctness (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-runview-in-loop` | warn | `RunView` inside for/while/forEach/map — causes N+1 queries |
| `runview-check-success` | warn | Unchecked `.Success` on RunView results — RunView doesn't throw on failure |
| `entity-save-check-result` | warn | Unchecked `.Save()`/`.Load()`/`.Delete()` return — returns false instead of throwing |
| `no-promise-all-runview` | warn | `Promise.all([rv.RunView(), rv.RunView()])` — use `rv.RunViews([...])` for server-side batching |
| `prefer-simple-result-type` | warn | `ResultType: 'entity_object'` when results aren't mutated — use `'simple'` for read-only |

### Angular (6 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-legacy-template-syntax` | warn | `*ngIf`/`*ngFor`/`*ngSwitch` — use `@if`/`@for`/`@switch` (90% perf improvement) |
| `for-requires-track` | warn | `@for` blocks missing `track` expression — required by Angular |
| `prefer-inject-function` | warn | Constructor DI in Angular components — use `inject()` function |
| `no-ng-on-changes` | warn | `ngOnChanges`/`ngDoCheck` — use `@Input()` getter/setters |
| `no-router-in-generic` | warn | `@angular/router` imports in `Generic/` components — pass via `@Input()` |
| `require-standalone-false` | warn | Missing explicit `standalone` on @Component/@Directive/@Pipe — Angular 19+ defaults to true |

### Type Safety (3 rules + 1 external)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-any-type` | warn | Lazy `unknown` usage — exempts system boundaries (params, returns, catch, generics, type sigs) |
| `no-action-call-action` | warn | `this.executeAction()` inside Action subclasses — use underlying services directly |
| *`@typescript-eslint/no-explicit-any`* | warn | All `any` usage (`: any`, `as any`, `<any>`) — external rule, enabled in both configs |

### Architecture / Code Style (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-static-singleton` | warn | Manual `static _instance` — use `BaseSingleton<T>` from `@memberjunction/global` |
| `no-cross-package-reexport` | warn | Re-exporting from `@memberjunction/*` in index/public-api files |
| `no-enum-prefer-union` | warn | `enum` declarations — use union types for better tree-shaking |
| `no-kendo-icons` | warn | `k-icon`/`k-i-*` CSS classes — use Font Awesome |
| `member-naming-convention` | **off** | PascalCase for public members, camelCase for private (on in strict) |

### Stylelint (2 rules)

| Rule | What It Catches |
|------|----------------|
| `mj/no-hardcoded-colors` | Hex/rgb/rgba in color properties — use `--mj-*` design tokens |
| `mj/no-primitive-tokens` | `var(--mj-color-neutral-*)` — use semantic tokens instead |

### SQL Migration Checks (4 rules)

| Check | What It Catches |
|-------|----------------|
| `no-mj-timestamps` | `__mj_CreatedAt`/`__mj_UpdatedAt` in CREATE TABLE — CodeGen handles these |
| `no-fk-indexes` | Single-column FK indexes — CodeGen creates these automatically |
| `use-flyway-schema` | Bare `dbo.`/`__mj.` — use `${flyway:defaultSchema}` placeholder |
| `no-newid` | `NEWID()` in INSERT — use hardcoded UUIDs for reproducibility |

## CLAUDE.md Coverage

Every lintable critical rule from the [MJ CLAUDE.md](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md) is enforced:

| CLAUDE.md Rule | ESLint Rule |
|---------------|-------------|
| No `any` types (Critical #2) | `@typescript-eslint/no-explicit-any` + `no-any-type` |
| No `.Get()`/`.Set()` (Critical #2b) | `no-entity-get-set` |
| Modern template syntax (Critical #4) | `no-legacy-template-syntax` |
| `inject()` over constructor DI (Critical #4) | `prefer-inject-function` |
| `@for` requires `track` (Critical #4) | `for-requires-track` |
| No `ngOnChanges` (Critical #4) | `no-ng-on-changes` |
| Explicit `standalone` on components (Critical #4) | `require-standalone-false` |
| No re-exports between packages (Critical #5) | `no-cross-package-reexport` |
| Use `BaseSingleton` (Critical #7) | `no-static-singleton` |
| No Action calling Action | `no-action-call-action` |
| Use `UUIDsEqual()` for comparisons | `use-uuids-equal` |
| No `new XyzEntity()` | `no-direct-entity-new` |
| No RunView in loops | `no-runview-in-loop` |
| Use `RunViews` (plural) for batching | `no-promise-all-runview` |
| Check RunView `.Success` | `runview-check-success` |
| Check `.Save()`/`.Load()`/`.Delete()` results | `entity-save-check-result` |
| Use `'simple'` for read-only queries | `prefer-simple-result-type` |

## CI Integration

### GitHub Actions

```yaml
- name: Lint TypeScript
  run: npx eslint --config eslint.config.mjs "packages/**/src/**/*.ts" --no-error-on-unmatched-pattern

- name: Lint CSS
  run: npx stylelint "packages/Angular/**/*.css" --config mj-stylelint.config.mjs

- name: Lint SQL Migrations
  run: node node_modules/@memberjunction/eslint-plugin/dist/sql/lint-migrations.js migrations/v5/
```

### Diff-Aware Linting (New Code Only)

To lint only files changed in a PR (avoids noise from existing code):

```bash
# Get changed .ts files relative to main branch
CHANGED=$(git diff --name-only origin/next...HEAD -- '*.ts' | tr '\n' ' ')
[ -n "$CHANGED" ] && npx eslint $CHANGED
```

## Tests

```bash
npm test            # run all 364 tests
npm run test:watch  # watch mode
```

## Development

```bash
npm run build       # compile TypeScript
npm test            # run vitest
npm run clean       # remove dist/
```

### Adding a New Rule

1. Create `src/rules/my-rule.ts` using `createRule()` from `src/utils.ts`
2. Create `src/__tests__/rules/my-rule.test.ts`
3. Register in `src/rules/index.ts`
4. Add to both configs in `src/configs/recommended.ts`
5. Run `npm run build && npm test`
6. Validate against the MJ repo for false positives
