# eslint-plugin-memberjunction

ESLint plugin for [MemberJunction](https://github.com/MemberJunction/MJ) conventions — **25 rules** for entity access, RunView patterns, Angular best practices, type safety, and architecture. Plus 2 Stylelint rules and 4 SQL migration checks.

394 tests. Validated against the full MJ monorepo (2,383 files) with <0.1% false positive rate.

## Quick Start (MJ repo)

From your MJ repo root:

```bash
# 1. Install (one-time)
npm install eslint-plugin-memberjunction --save-dev

# 2. Lint the files you changed on your branch
npx eslint --no-eslintrc -c node_modules/eslint-plugin-memberjunction/eslintrc.mj.json \
  $(git diff --name-only origin/next...HEAD | grep '\.ts$' | while read f; do [ -f "$f" ] && echo "$f"; done)
```

That's it — the config ships with the package. No files to create, no setup to maintain.

### Other useful commands

```bash
# Shorthand — save as an alias or npm script
MJ_LINT="npx eslint --no-eslintrc -c node_modules/eslint-plugin-memberjunction/eslintrc.mj.json"

# Lint uncommitted changes
$MJ_LINT $(git diff --name-only -- '*.ts' | while read f; do [ -f "$f" ] && echo "$f"; done)

# Lint a specific package
$MJ_LINT 'packages/MJServer/src/**/*.ts'

# Lint a single file
$MJ_LINT packages/MJCore/src/generic/baseEntity.ts

# Lint everything (~30s)
$MJ_LINT 'packages/**/src/**/*.ts'
```

### IDE integration

VS Code picks up the config automatically with the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) — you'll see yellow squiggles inline as you code.

## Setup (non-MJ projects)

```bash
npm install eslint-plugin-memberjunction --save-dev
```

### ESLint flat config

```javascript
// eslint.config.js
import mj from 'eslint-plugin-memberjunction';

export default [
  mj.configs.recommended,  // all rules as warnings
  { files: ['**/*.ts'] },
];
```

Or use `mj.configs.strict` for errors (CI enforcement).

### Cherry-pick rules

```javascript
import mj from 'eslint-plugin-memberjunction';

export default [
  {
    plugins: { memberjunction: mj },
    files: ['**/*.ts'],
    rules: {
      'memberjunction/use-uuids-equal': 'error',
      'memberjunction/no-runview-in-loop': 'error',
      'memberjunction/runview-check-success': 'warn',
    },
  },
];
```

## Configs

| Config | Severity | Naming Rule | Use Case |
|--------|----------|-------------|----------|
| `recommended` | `warn` | warn | Local development — non-blocking IDE hints |
| `strict` | `error` | on (with exclusions) | CI — blocks PRs with violations |

Both configs also enable `@typescript-eslint/no-explicit-any`.

The `strict` config excludes external-convention packages (`React/`, `AICLI/`, `A2AServer/`, `ComponentRegistryClientSDK/`) from the naming rule.

## Rules

### Entity / Data Access (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-entity-get-set` | warn | `.Get('Field')`/`.Set('Field', val)` — bypasses generated type safety |
| `no-entity-spread` | warn | `{ ...entity }` — loses getter properties, use `.GetAll()` |
| `no-direct-entity-new` | warn | `new XyzEntity()` — use `md.GetEntityObject<T>()` class factory |
| `use-uuids-equal` | warn | `===` on UUID fields — use `UUIDsEqual()` for case-insensitive comparison |
| `no-fields-with-entity-object` | warn | `Fields` with `ResultType: 'entity_object'` — Fields is silently ignored |

### Performance / Correctness (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-runview-in-loop` | warn | `RunView` inside loops — causes N+1 queries |
| `runview-check-success` | warn | Unchecked `.Success` on RunView results |
| `entity-save-check-result` | warn | Unchecked `.Save()`/`.Load()`/`.Delete()` return values |
| `no-promise-all-runview` | warn | `Promise.all([rv.RunView(), ...])` — use `rv.RunViews([...])` |
| `prefer-simple-result-type` | warn | `ResultType: 'entity_object'` when results aren't mutated |

### Server Safety (1 rule)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-global-provider-on-server` | warn | `new RunView()` without provider, `Metadata.Provider` reads, `GetEntityObject()` missing provider arg — causes cross-request data leakage |

### Angular (6 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-legacy-template-syntax` | warn | `*ngIf`/`*ngFor`/`*ngSwitch` — use `@if`/`@for`/`@switch` |
| `for-requires-track` | warn | `@for` blocks missing `track` expression |
| `prefer-inject-function` | warn | Constructor DI — use `inject()` function |
| `no-ng-on-changes` | warn | `ngOnChanges`/`ngDoCheck` — use `@Input()` setters |
| `no-router-in-generic` | warn | `@angular/router` imports in `Generic/` components |
| `require-standalone-false` | warn | Missing explicit `standalone` on decorators (Angular 19+ defaults to true) |

### Type Safety (2 rules + 1 external)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-any-type` | warn | Lazy `unknown` usage — allows unknown at system boundaries |
| `no-action-call-action` | warn | `this.executeAction()` inside Action subclasses |
| *`@typescript-eslint/no-explicit-any`* | warn | All `any` usage (external rule, enabled in both configs) |

### Architecture / Code Style (5 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-static-singleton` | warn | Manual `static _instance` — use `BaseSingleton<T>` |
| `no-cross-package-reexport` | warn | Re-exporting from `@memberjunction/*` in index files |
| `no-enum-prefer-union` | warn | `enum` declarations — use union types |
| `no-kendo-icons` | warn | `k-icon`/`k-i-*` CSS classes — use Font Awesome |
| `member-naming-convention` | warn | PascalCase public / camelCase private (allows RxJS `$` suffix) |

### Stylelint (2 rules)

```bash
npm install stylelint --save-dev
```

```javascript
// .stylelintrc.json
{ "plugins": ["eslint-plugin-memberjunction/stylelint"] }
```

| Rule | What It Catches |
|------|----------------|
| `mj/no-hardcoded-colors` | Hex/rgb/rgba — use `--mj-*` design tokens |
| `mj/no-primitive-tokens` | `var(--mj-color-neutral-*)` — use semantic tokens |

### SQL Migration Checks (4 rules)

```bash
npx mj-lint-sql migrations/v5/
```

| Check | What It Catches |
|-------|----------------|
| `no-mj-timestamps` | `__mj_CreatedAt`/`__mj_UpdatedAt` in CREATE TABLE |
| `no-fk-indexes` | Single-column FK indexes (CodeGen handles these) |
| `use-flyway-schema` | Bare `dbo.`/`__mj.` — use `${flyway:defaultSchema}` |
| `no-newid` | `NEWID()` in INSERT — use hardcoded UUIDs |

## CI Integration (diff-aware)

Only lint files changed in the PR:

```yaml
- name: Lint changed TypeScript files
  run: |
    CHANGED=$(git diff --name-only origin/main...HEAD -- '*.ts' | grep -v __tests__ | grep -v generated | tr '\n' ' ')
    [ -n "$CHANGED" ] && npx eslint $CHANGED --max-warnings 0
```

## Development

```bash
npm test            # 394 tests
npm run build       # compile
npm run test:watch  # watch mode
```

### Adding a Rule

1. Create `src/rules/my-rule.ts` using `createRule()` from `src/utils.ts`
2. Create `src/__tests__/rules/my-rule.test.ts`
3. Register in `src/rules/index.ts`
4. Add to both configs in `src/configs/recommended.ts`
5. `npm run build && npm test`

## License

MIT
