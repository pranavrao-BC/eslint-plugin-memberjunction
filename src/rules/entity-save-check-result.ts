import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const CHECKED_METHODS = new Set(['Save', 'Load', 'Delete']);

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

/** Find the nearest enclosing function body. */
function getEnclosingFunctionBody(node: TSESTree.Node): TSESTree.Statement[] | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      const body = current.body;
      if (body.type === AST_NODE_TYPES.BlockStatement) {
        return body.body;
      }
      return null;
    }
    if (current.type === AST_NODE_TYPES.Program) {
      return current.body as TSESTree.Statement[];
    }
    current = current.parent;
  }
  return null;
}

/**
 * Check if an object has .TransactionGroup assigned in the same function body.
 * When TransactionGroup is set, Save/Delete/Load queue rather than execute,
 * so individual return values are meaningless.
 */
function hasTransactionGroupAssignment(
  statements: TSESTree.Statement[],
  objectText: string,
  sourceCode: { getText(node: TSESTree.Node): string },
): boolean {
  let found = false;

  function walk(node: TSESTree.Node): void {
    if (found) return;

    // Look for: <object>.TransactionGroup = ...
    if (
      node.type === AST_NODE_TYPES.AssignmentExpression &&
      node.left.type === AST_NODE_TYPES.MemberExpression &&
      node.left.property.type === AST_NODE_TYPES.Identifier &&
      node.left.property.name === 'TransactionGroup' &&
      sourceCode.getText(node.left.object) === objectText
    ) {
      found = true;
      return;
    }

    // Don't descend into nested function scopes
    if (
      node.type === AST_NODE_TYPES.FunctionDeclaration ||
      node.type === AST_NODE_TYPES.FunctionExpression ||
      node.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              walk(item as TSESTree.Node);
            }
          }
        } else if ('type' in child) {
          walk(child as TSESTree.Node);
        }
      }
    }
  }

  for (const stmt of statements) {
    walk(stmt);
    if (found) break;
  }
  return found;
}

export default createRule<[], 'uncheckedSave' | 'uncheckedLoad' | 'uncheckedDelete'>({
  name: 'entity-save-check-result',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require checking the return value of entity.Save(), .Load(), and .Delete() — they return boolean, not throw",
    },
    messages: {
      uncheckedSave:
        'entity.Save() return value was not checked. Save returns false on failure instead of throwing — check the result or handle the error.',
      uncheckedLoad:
        'entity.Load() return value was not checked. Load returns false on failure instead of throwing — check the result or handle the error.',
      uncheckedDelete:
        'entity.Delete() return value was not checked. Delete returns false on failure instead of throwing — check the result or handle the error.',
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
          // Suppress if the entity has .TransactionGroup assigned in this scope.
          // When TransactionGroup is set, individual Save/Delete/Load return values
          // are meaningless — the transaction group's .Submit() is what matters.
          if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
            const objectText = context.sourceCode.getText(node.callee.object);
            const fnBody = getEnclosingFunctionBody(node);
            if (fnBody && hasTransactionGroupAssignment(fnBody, objectText, context.sourceCode)) {
              return;
            }
          }

          const messageId = method === 'Save' ? 'uncheckedSave' : method === 'Load' ? 'uncheckedLoad' : 'uncheckedDelete';
          context.report({ node, messageId });
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
