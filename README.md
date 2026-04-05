# @memberjunction/eslint-plugin

Linter for MemberJunction coding conventions. ESLint (12 rules), Stylelint (2 rules), SQL migration checks (4 rules). 119 tests.

## Quick Start

```bash
# Clone and build
git clone https://github.com/pranavrao-BC/eslint-plugin-memberjunction.git
cd eslint-plugin-memberjunction
npm install && npm run build

# Run against the MJ repo (from the MJ repo root)
ESLINT_USE_FLAT_CONFIG=true ./node_modules/.bin/eslint \
  --config /path/to/eslint-plugin-memberjunction/mj-lint.config.mjs \
  --flag v10_config_lookup_from_file \
  "packages/**/src/**/*.ts" \
  --no-error-on-unmatched-pattern
```

## Try It on a Single File

```bash
# Lint one file
ESLINT_USE_FLAT_CONFIG=true /path/to/eslint-plugin-memberjunction/node_modules/.bin/eslint \
  --config /path/to/eslint-plugin-memberjunction/mj-lint.config.mjs \
  --flag v10_config_lookup_from_file \
  packages/MJCore/src/generic/someFile.ts
```

## Stylelint (CSS)

```bash
cd /path/to/eslint-plugin-memberjunction
npx stylelint "/path/to/MJ/packages/Angular/**/*.css" \
  --config mj-stylelint.config.mjs
```

## SQL Migration Linter

```bash
node /path/to/eslint-plugin-memberjunction/dist/sql/lint-migrations.js /path/to/MJ/migrations/v5/
```

## Rules

### ESLint (12 rules)

| Rule | Default | What It Catches |
|------|---------|----------------|
| `no-entity-get-set` | warn | `.Get('Field')`/`.Set('Field', val)` — use typed properties |
| `no-static-singleton` | warn | Manual `static _instance` — use `BaseSingleton<T>` |
| `no-entity-spread` | warn | `{ ...entity }` — use `.GetAll()` |
| `use-uuids-equal` | warn | `===` on UUID fields — use `UUIDsEqual()` |
| `member-naming-convention` | **off** | Public must be PascalCase, private must be camelCase |
| `no-ng-on-changes` | warn | `ngOnChanges`/`ngDoCheck` — use `@Input()` setters |
| `no-cross-package-reexport` | warn | Re-exports from `@memberjunction/*` in index/public-api |
| `no-router-in-generic` | warn | `@angular/router` in `Angular/Generic/` |
| `no-fields-with-entity-object` | warn | `Fields` + `ResultType: 'entity_object'` (Fields is ignored) |
| `no-enum-prefer-union` | warn | `enum` declarations — use union types |
| `no-kendo-icons` | warn | `k-icon`/`k-i-*` classes — use Font Awesome |
| `no-legacy-template-syntax` | warn | `*ngIf`/`*ngFor` — use `@if`/`@for` |

### Stylelint (2 rules)

| Rule | What It Catches |
|------|----------------|
| `mj/no-hardcoded-colors` | Hex/rgb/rgba in color properties — use `--mj-*` tokens |
| `mj/no-primitive-tokens` | `var(--mj-color-neutral-*)` — use semantic tokens |

### SQL (4 checks)

| Check | What It Catches |
|-------|----------------|
| `no-mj-timestamps` | `__mj_CreatedAt`/`__mj_UpdatedAt` in CREATE TABLE |
| `no-fk-indexes` | Single-column FK indexes (CodeGen handles these) |
| `use-flyway-schema` | Bare `dbo.`/`__mj.` — use `${flyway:defaultSchema}` |
| `no-newid` | `NEWID()` in INSERT — use hardcoded UUIDs |

## Configs

- **`recommended`** — all rules warn, naming off. For local dev.
- **`strict`** — all rules error, naming on (with external-convention packages excluded). For CI.

## Tests

```bash
npm test        # run all 119 tests
npm run test:watch  # watch mode
```
