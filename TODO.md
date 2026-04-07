# Implemented Rules

23 ESLint rules + 2 Stylelint rules + 4 SQL checks. Configs also enable `@typescript-eslint/no-explicit-any`.

Validated against the full MJ monorepo (2,381 files, 66 packages) — 337 true positive warnings, 0 false positives.

## Entity / Data Access

| Rule | What it catches |
|---|---|
| `no-entity-get-set` | `.Get('field')` / `.Set('field', val)` — use typed properties |
| `no-entity-spread` | `{ ...entity }` — use `.GetAll()` |
| `no-direct-entity-new` | `new XyzEntity()` — use `md.GetEntityObject<T>()` |
| `use-uuids-equal` | `===` on UUIDs — use `UUIDsEqual()` |
| `no-fields-with-entity-object` | `Fields` param with `ResultType: 'entity_object'` (ignored by ProviderBase) |

## Performance / Correctness

| Rule | What it catches |
|---|---|
| `no-runview-in-loop` | RunView inside loops (N+1 queries) |
| `runview-check-success` | Unchecked `.Success` on RunView results |
| `entity-save-check-result` | Unchecked `.Save()` / `.Load()` / `.Delete()` return values |
| `no-promise-all-runview` | `Promise.all` with 2+ RunView calls — use `RunViews` (plural) for server batching |
| `prefer-simple-result-type` | `ResultType: 'entity_object'` when results aren't mutated — use `'simple'` |

## Angular

| Rule | What it catches |
|---|---|
| `no-legacy-template-syntax` | `*ngIf` / `*ngFor` / `*ngSwitch` — use `@if` / `@for` / `@switch` |
| `for-requires-track` | `@for` blocks missing `track` expression |
| `prefer-inject-function` | Constructor DI — use `inject()` function |
| `no-ng-on-changes` | `ngOnChanges` / `ngDoCheck` — use `@Input()` getters/setters |
| `no-router-in-generic` | `@angular/router` imports in Generic/ components |
| `require-standalone-false` | Missing explicit `standalone` on @Component/@Directive/@Pipe (Angular 19+ defaults to true) |

## Architecture / Code Style

| Rule | What it catches |
|---|---|
| `no-static-singleton` | Manual `static _instance` — use `BaseSingleton<T>` |
| `no-cross-package-reexport` | Re-exporting from `@memberjunction/*` in index files |
| `no-enum-prefer-union` | `enum` declarations — prefer union types |
| `no-kendo-icons` | Kendo icon classes — use Font Awesome |
| `member-naming-convention` | PascalCase public / camelCase private (off by default) |

## Type Safety

| Rule | What it catches |
|---|---|
| `no-any-type` | Lazy `unknown` usage (exempts system boundaries: params, returns, catch, generics, type sigs) |
| `no-action-call-action` | `this.executeAction()` inside Action subclasses — use underlying services directly |
| *`@typescript-eslint/no-explicit-any`* | All `any` usage (`: any`, `as any`, `<any>`) — enabled in both configs |

## CLAUDE.md Coverage

Every lintable critical rule from [MJ CLAUDE.md](https://github.com/MemberJunction/MJ/blob/next/CLAUDE.md) is enforced:

- [x] No `any` types (Critical #2)
- [x] No `.Get()`/`.Set()` (Critical #2b)
- [x] Modern template syntax (Critical #4)
- [x] `inject()` over constructor DI (Critical #4)
- [x] `@for` requires `track` (Critical #4)
- [x] No `ngOnChanges` (Critical #4)
- [x] Explicit `standalone` on components (Critical #4)
- [x] No re-exports between packages (Critical #5)
- [x] Use `BaseSingleton` (Critical #7)
- [x] No Action calling Action (Actions design)
- [x] UUID comparisons with `UUIDsEqual()`
- [x] No `new XyzEntity()`
- [x] No RunView in loops
- [x] Use `RunViews` (plural) for batching
- [x] Check RunView `.Success`
- [x] Check `.Save()` / `.Load()` / `.Delete()` results
- [x] Use `'simple'` for read-only queries

## Removed

- ~~`max-lines-per-function`~~ — Generated 2,163 noise warnings (69% of output). Removed.

## Possible Future Rules

- **`no-circular-import-workaround`** — Detect `unknown` used to avoid circular imports (comment pattern `// avoids circular import`). Low priority; most cases are in integration engine infrastructure.
- **`require-register-class`** — Detect entity/action subclasses missing `@RegisterClass` decorator. Would need heuristics for which classes need it.
