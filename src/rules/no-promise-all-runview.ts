import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Check if a CallExpression is a RunView call (not RunViews plural). */
function isRunViewCall(node: TSESTree.CallExpression): boolean {
  const callee = node.callee;

  // Bare: RunView(...)
  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'RunView') {
    return true;
  }

  // Member: rv.RunView(...), this.rv.RunView(...)
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'RunView'
  ) {
    return true;
  }

  return false;
}

/** Unwrap AwaitExpression if present. */
function unwrapAwait(node: TSESTree.Node): TSESTree.Node {
  if (node.type === AST_NODE_TYPES.AwaitExpression) return (node as TSESTree.AwaitExpression).argument;
  return node;
}

/** Count how many elements in an array are RunView calls (with optional await). */
function countRunViewCalls(elements: TSESTree.Expression[]): number {
  let count = 0;
  for (const el of elements) {
    const unwrapped = unwrapAwait(el);
    if (
      unwrapped.type === AST_NODE_TYPES.CallExpression &&
      isRunViewCall(unwrapped)
    ) {
      count++;
    }
  }
  return count;
}

export default createRule({
  name: 'no-promise-all-runview',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Promise.all() with multiple RunView calls — use RunViews (plural) for server-side batching',
    },
    messages: {
      useRunViews:
        'Use `rv.RunViews([...])` (plural) instead of `Promise.all` with {{count}} separate RunView calls. RunViews batches queries server-side for better performance.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Match Promise.all(...) or Promise.allSettled(...)
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (node.callee.object.type !== AST_NODE_TYPES.Identifier) return;
        if (node.callee.object.name !== 'Promise') return;
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return;

        const method = node.callee.property.name;
        if (method !== 'all' && method !== 'allSettled') return;

        // First argument should be an array expression
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== AST_NODE_TYPES.ArrayExpression) return;

        const rvCount = countRunViewCalls(
          firstArg.elements.filter((el): el is TSESTree.Expression => el !== null),
        );

        // Only flag when 2+ RunView calls are batched via Promise.all
        if (rvCount >= 2) {
          context.report({
            node,
            messageId: 'useRunViews',
            data: { count: String(rvCount) },
          });
        }
      },
    };
  },
});
