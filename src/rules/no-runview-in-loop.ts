import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Loop AST node types. */
const LOOP_TYPES = new Set([
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
]);

/** Array methods whose callbacks constitute loops. */
const ARRAY_LOOP_METHODS = new Set([
  'forEach', 'map', 'filter', 'reduce', 'some', 'every',
  'find', 'findIndex', 'flatMap',
]);

/** Check if a CallExpression is an array iterator method (e.g., items.map(...)). */
function isArrayLoopCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    ARRAY_LOOP_METHODS.has(node.callee.property.name)
  );
}

/** Check if a node is a RunView call (not RunViews). */
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

/** Walk ancestors to check if any parent is a loop body or array method callback. */
function isInsideLoop(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    // Direct loop construct
    if (LOOP_TYPES.has(current.type as AST_NODE_TYPES)) return true;

    // Function boundary — stop unless this function is an array method callback
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      const parent = current.parent;
      // If this function is a callback to .map/.forEach/etc, that IS a loop
      if (parent && parent.type === AST_NODE_TYPES.CallExpression && isArrayLoopCall(parent)) {
        return true;
      }
      // Otherwise, we've left the loop body into a separate function scope — stop
      return false;
    }

    current = current.parent;
  }
  return false;
}

export default createRule({
  name: 'no-runview-in-loop',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow RunView calls inside loops — use RunViews (plural) to batch, or load data before the loop',
    },
    messages: {
      noRunViewInLoop:
        'RunView inside a loop causes N+1 queries. Use `RunViews` (plural) to batch, or load all data before the loop and filter in memory.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isRunViewCall(node)) return;
        if (isInsideLoop(node)) {
          context.report({ node, messageId: 'noRunViewInLoop' });
        }
      },
    };
  },
});
