# Planned Rules

All planned rules have been implemented.

## ~~High Priority~~ — Done

### ~~`no-direct-entity-new`~~ — Added
Detects `new XyzEntity()` — entities must be created via `md.GetEntityObject<T>('Entity Name')`. Includes IDE suggestion fix. Configurable `allowedClassNames` option.

### ~~`no-runview-in-loop`~~ — Added
Detects `RunView` calls inside `for`, `while`, `do...while`, `for...of`, `for...in`, `.forEach()`, `.map()`, `.filter()`, `.reduce()`, `.some()`, `.every()`, `.find()`, `.findIndex()`, `.flatMap()`. Covers `rv.RunView(...)`, `this.rv.RunView(...)`, and bare `RunView(...)`.

### ~~`runview-check-success`~~ — Added
Detects `RunView` calls where `.Success` is never checked. Handles: variable assignment, destructuring, expression statements, return statements, and results passed to helper functions.

## ~~Medium Priority~~ — Done

### ~~`prefer-inject-function`~~ — Added
Detects constructor parameter injection in Angular components (`constructor(private foo: FooService)`). Recommends `inject()` function instead. Scoped to classes with Angular decorators (@Component, @Directive, @Injectable, @Pipe).

### ~~`@for-requires-track`~~ — Added
Detects `@for` blocks in inline templates missing the `track` expression. Required by Angular and important for performance.

## Other Completed Rules

### ~~`entity-save-check-result`~~ — Added
Detects unchecked return values from `entity.Save()`, `entity.Load()`, and `entity.Delete()`. These methods return boolean on failure instead of throwing.

### ~~`max-function-length`~~ — Removed
Was configured as built-in `max-lines-per-function` at 40 lines. Removed from configs because it generated 2,163 noise warnings (69% of total output) that buried real findings.
