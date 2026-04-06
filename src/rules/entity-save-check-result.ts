import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const CHECKED_METHODS = new Set(['Save', 'Load']);

/** Check if a CallExpression is entity.Save() or entity.Load(). */
function isEntitySaveOrLoad(node: TSESTree.CallExpression): string | null {
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    CHECKED_METHODS.has(node.callee.property.name)
  ) {
    return node.callee.property.name;
  }
  return null;
}

export default createRule<[], 'uncheckedSave' | 'uncheckedLoad'>({
  name: 'entity-save-check-result',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require checking the return value of entity.Save() and entity.Load() — they return boolean, not throw",
    },
    messages: {
      uncheckedSave:
        'entity.Save() return value was not checked. Save returns false on failure instead of throwing — check the result or handle the error.',
      uncheckedLoad:
        'entity.Load() return value was not checked. Load returns false on failure instead of throwing — check the result or handle the error.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const method = isEntitySaveOrLoad(node);
        if (!method) return;

        // Walk up past AwaitExpression if present
        let current: TSESTree.Node = node;
        if (current.parent?.type === AST_NODE_TYPES.AwaitExpression) {
          current = current.parent;
        }

        const parent = current.parent;
        if (!parent) return;

        // ExpressionStatement: `await entity.Save();` — result discarded
        if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
          context.report({
            node,
            messageId: method === 'Save' ? 'uncheckedSave' : 'uncheckedLoad',
          });
          return;
        }

        // If the result is used in any way (variable assignment, if condition,
        // return, logical expression, etc.) — assume it's being checked.
        // The key anti-pattern is the bare expression statement where the
        // boolean return is completely discarded.
      },
    };
  },
});
