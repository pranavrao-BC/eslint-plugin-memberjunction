import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

// Known BaseEntity subclass suffixes from MJ codegen
const ENTITY_PATTERN = /Entity$/;

export default createRule({
  name: 'no-entity-spread',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow spread operator on BaseEntity subclasses — use .GetAll() instead',
    },
    messages: {
      useGetAll:
        'Spread on BaseEntity loses getter properties. Use {{ name }}.GetAll() instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      SpreadElement(node) {
        // Check if the spread argument is an identifier whose type annotation or variable name looks like an entity
        const arg = node.argument;
        if (arg.type !== AST_NODE_TYPES.Identifier) return;

        // Heuristic: variable name ends in Entity, or its type annotation does
        if (ENTITY_PATTERN.test(arg.name)) {
          context.report({
            node,
            messageId: 'useGetAll',
            data: { name: arg.name },
          });
          return;
        }

        // Check type annotation if available (e.g., from a parameter or variable declaration)
        const scope = context.sourceCode.getScope(node);
        const variable = scope.references.find(
          (ref) => ref.identifier.name === arg.name
        )?.resolved;

        if (!variable) return;

        for (const def of variable.defs) {
          const typeAnnotation =
            (def.node as { typeAnnotation?: { typeAnnotation?: { typeName?: { name?: string } } } })
              .typeAnnotation?.typeAnnotation?.typeName?.name;
          if (typeAnnotation && ENTITY_PATTERN.test(typeAnnotation)) {
            context.report({
              node,
              messageId: 'useGetAll',
              data: { name: arg.name },
            });
            return;
          }
        }
      },
    };
  },
});
