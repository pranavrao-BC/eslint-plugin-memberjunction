import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const ENTITY_PATTERN = /Entity$/;

type Options = [{
  allowedClassNames?: string[];
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
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allowed = new Set(options.allowedClassNames ?? []);

    return {
      NewExpression(node) {
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
