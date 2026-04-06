# Planned Rules

## High Priority

### `no-direct-entity-new`
Detect `new XyzEntity()` — entities must be created via `md.GetEntityObject<T>('Entity Name')`. Direct instantiation bypasses the MJ class factory and registration system.

### `no-runview-in-loop`
Detect `RunView` / `rv.RunView` calls inside `for`, `while`, `forEach`, or `.map()` bodies. Should batch with `RunViews` (plural) or load once and filter in memory.

### `runview-check-success`
Detect `RunView` calls where the result's `.Success` property is never accessed. `RunView` doesn't throw — unchecked failures are silent bugs.

## Medium Priority

### `prefer-inject-function`
Detect constructor parameter injection in Angular components (`constructor(private foo: FooService)`). New components should use `inject()` function instead.

### `@for-requires-track`
Detect `@for` blocks in inline templates missing the `track` expression. Required by Angular and important for performance.

## Done

### ~~`max-function-length`~~ — Added
Configured built-in `max-lines-per-function` at 40 lines (skips blanks and comments) in both configs. warn in recommended, error in strict.
