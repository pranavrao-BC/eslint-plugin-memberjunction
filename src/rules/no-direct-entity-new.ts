import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const ENTITY_PATTERN = /Entity$/;

// Known MJ entity base class names — classes must extend one of these to be
// detected via the generated subclass naming convention (*Entity).
// Non-MJ classes that happen to end in "Entity" (e.g., AutotagEntity) are
// excluded via the allowedClassNames option.
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[tj]sx?$/;

type Options = [{
  allowedClassNames?: string[];
  ignoreTestFiles?: boolean;
}];

/** Extract class name from a NewExpression callee. */
function getClassName(callee: TSESTree.Expression): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name;
  // Handle namespace access: new MJ.UserEntity()
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return callee.property.name;
  }
  return null;
}

/** Strip the "Entity" suffix to produce the probable catalog entity name. */
function toEntityName(className: string): string {
  return className.replace(/Entity$/, '') || className;
}

export default createRule<Options, 'noDirectNew' | 'suggestFactory'>({
  name: 'no-direct-entity-new',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description:
        'Disallow `new XyzEntity()` — use md.GetEntityObject<T>() to go through the MJ class factory',
    },
    messages: {
      noDirectNew:
        "Don't use `new {{className}}()`. Use `md.GetEntityObject<{{className}}>('{{entityName}}')` to go through the class factory.",
      suggestFactory:
        "Replace with await md.GetEntityObject<{{className}}>('{{entityName}}')",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedClassNames: {
            type: 'array',
            items: { type: 'string' },
            description: 'Entity class names to allow direct instantiation (e.g., ["MockEntity"]).',
          },
          ignoreTestFiles: {
            type: 'boolean',
            description: 'Skip test files (*.test.ts, *.spec.ts). Defaults to true.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allowed = new Set(options.allowedClassNames ?? []);
    const ignoreTests = options.ignoreTestFiles !== false; // default true

    return {
      NewExpression(node) {
        if (ignoreTests && TEST_FILE_PATTERN.test(context.filename)) return;
        const className = getClassName(node.callee);
        if (!className) return;
        if (!ENTITY_PATTERN.test(className)) return;
        if (allowed.has(className)) return;

        const entityName = toEntityName(className);

        context.report({
          node,
          messageId: 'noDirectNew',
          data: { className, entityName },
          suggest: [{
            messageId: 'suggestFactory' as const,
            data: { className, entityName },
            fix: (fixer) =>
              fixer.replaceText(
                node,
                `await md.GetEntityObject<${className}>('${entityName}')`,
              ),
          }],
        });
      },
    };
  },
});
