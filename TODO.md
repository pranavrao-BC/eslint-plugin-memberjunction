# Planned Rules

## ~~High Priority~~ — Done

### ~~`no-direct-entity-new`~~ — Added
Detects `new XyzEntity()` — entities must be created via `md.GetEntityObject<T>('Entity Name')`. Includes IDE suggestion fix. Configurable `allowedClassNames` option.

### ~~`no-runview-in-loop`~~ — Added
Detects `RunView` calls inside `for`, `while`, `do...while`, `for...of`, `for...in`, `.forEach()`, `.map()`, `.filter()`, `.reduce()`, `.some()`, `.every()`, `.find()`, `.findIndex()`, `.flatMap()`. Covers `rv.RunView(...)`, `this.rv.RunView(...)`, and bare `RunView(...)`.

### ~~`runview-check-success`~~ — Added
Detects `RunView` calls where `.Success` is never checked. Handles: variable assignment, destructuring, expression statements, return statements, and results passed to helper functions.

## Medium Priority

### `prefer-inject-function`
Detect constructor parameter injection in Angular components (`constructor(private foo: FooService)`). New components should use `inject()` function instead.

### `@for-requires-track`
Detect `@for` blocks in inline templates missing the `track` expression. Required by Angular and important for performance.

## Done

### ~~`max-function-length`~~ — Added
Configured built-in `max-lines-per-function` at 40 lines (skips blanks and comments) in both configs. warn in recommended, error in strict.
