import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export default createRule({
  name: 'no-enum-prefer-union',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer union types over enums for better tree-shaking and package exports',
    },
    messages: {
      preferUnion:
        "Use a union type instead of enum (e.g., `type {{ name }} = 'a' | 'b'`). Enums don't tree-shake well and cause issues with package exports.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSEnumDeclaration(node) {
        const name =
          node.id?.type === AST_NODE_TYPES.Identifier ? node.id.name : 'Status';
        context.report({ node, messageId: 'preferUnion', data: { name } });
      },
    };
  },
});
