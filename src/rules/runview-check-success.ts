import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Check if a CallExpression is a RunView call. */
function isRunViewCall(node: TSESTree.CallExpression): boolean {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'RunView') return true;
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'RunView'
  ) return true;
  return false;
}

/** Get the enclosing function body (array of statements) for a node. */
function getEnclosingFunctionBody(node: TSESTree.Node): TSESTree.Statement[] | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      const body = (current as TSESTree.FunctionDeclaration).body;
      if (body?.type === AST_NODE_TYPES.BlockStatement) return body.body;
      return null;
    }
    if (current.type === AST_NODE_TYPES.Program) {
      return (current as TSESTree.Program).body as TSESTree.Statement[];
    }
    current = current.parent;
  }
  return null;
}

/** Recursively check if a variable name has .Success accessed anywhere in a statement list. */
function hasSuccessAccess(statements: TSESTree.Node[], varName: string): boolean {
  let found = false;
  function walk(node: TSESTree.Node) {
    if (found) return;
    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      node.object.type === AST_NODE_TYPES.Identifier &&
      node.object.name === varName &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      node.property.name === 'Success'
    ) {
      found = true;
      return;
    }
    // Check destructuring: const { Success } = result
    if (
      node.type === AST_NODE_TYPES.VariableDeclarator &&
      node.id.type === AST_NODE_TYPES.ObjectPattern &&
      node.init?.type === AST_NODE_TYPES.Identifier &&
      node.init.name === varName
    ) {
      for (const prop of node.id.properties) {
        if (
          prop.type === AST_NODE_TYPES.Property &&
          prop.key.type === AST_NODE_TYPES.Identifier &&
          prop.key.name === 'Success'
        ) {
          found = true;
          return;
        }
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === 'string') walk(item as TSESTree.Node);
          }
        } else if ('type' in (child as object)) {
          walk(child as TSESTree.Node);
        }
      }
    }
  }
  for (const stmt of statements) walk(stmt);
  return found;
}

/** Check if a variable is passed as an argument to any function call. */
function isPassedToFunction(statements: TSESTree.Node[], varName: string): boolean {
  let found = false;
  function walk(node: TSESTree.Node) {
    if (found) return;
    if (node.type === AST_NODE_TYPES.CallExpression) {
      for (const arg of node.arguments) {
        if (arg.type === AST_NODE_TYPES.Identifier && arg.name === varName) {
          found = true;
          return;
        }
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === 'string') walk(item as TSESTree.Node);
          }
        } else if ('type' in (child as object)) {
          walk(child as TSESTree.Node);
        }
      }
    }
  }
  for (const stmt of statements) walk(stmt);
  return found;
}

/** Check if a variable is returned anywhere in the statement list. */
function isReturned(statements: TSESTree.Node[], varName: string): boolean {
  let found = false;
  function walk(node: TSESTree.Node) {
    if (found) return;
    if (
      node.type === AST_NODE_TYPES.ReturnStatement &&
      node.argument?.type === AST_NODE_TYPES.Identifier &&
      node.argument.name === varName
    ) {
      found = true;
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === 'string') walk(item as TSESTree.Node);
          }
        } else if ('type' in (child as object)) {
          walk(child as TSESTree.Node);
        }
      }
    }
  }
  for (const stmt of statements) walk(stmt);
  return found;
}

export default createRule<[], 'uncheckedSuccess' | 'discardedResult'>({
  name: 'runview-check-success',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require checking .Success on RunView results — RunView doesn't throw on failure",
    },
    messages: {
      uncheckedSuccess:
        "RunView result's `.Success` was not checked. RunView doesn't throw on failure — check `result.Success` before using `result.Results`.",
      discardedResult:
        'RunView result was discarded. Assign to a variable and check `.Success` before using `.Results`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isRunViewCall(node)) return;

        // Walk up to find the context of this RunView call
        let current: TSESTree.Node = node;

        // Skip past AwaitExpression if present
        if (current.parent?.type === AST_NODE_TYPES.AwaitExpression) {
          current = current.parent;
        }

        const parent = current.parent;
        if (!parent) return;

        // Case 1: return rv.RunView(...) — caller's responsibility
        if (parent.type === AST_NODE_TYPES.ReturnStatement) return;

        // Case 2: Expression statement — result discarded entirely
        if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
          context.report({ node, messageId: 'discardedResult' });
          return;
        }

        // Case 3: Destructuring — const { Success, Results } = await rv.RunView(...)
        if (
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.ObjectPattern
        ) {
          const hasSuccess = parent.id.properties.some(
            (prop) =>
              prop.type === AST_NODE_TYPES.Property &&
              prop.key.type === AST_NODE_TYPES.Identifier &&
              prop.key.name === 'Success',
          );
          if (hasSuccess) return; // They're destructuring Success — good
          context.report({ node, messageId: 'uncheckedSuccess' });
          return;
        }

        // Case 4: Variable assignment — const result = await rv.RunView(...)
        if (
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.id.type === AST_NODE_TYPES.Identifier
        ) {
          const varName = parent.id.name;
          const fnBody = getEnclosingFunctionBody(node);
          if (!fnBody) return;

          // If .Success is accessed on the variable, it's checked
          if (hasSuccessAccess(fnBody, varName)) return;

          // If passed to a function, assume it handles checking
          if (isPassedToFunction(fnBody, varName)) return;

          // If returned, caller's responsibility
          if (isReturned(fnBody, varName)) return;

          context.report({ node, messageId: 'uncheckedSuccess' });
          return;
        }

        // Case 5: Assignment expression — result = await rv.RunView(...)
        if (
          parent.type === AST_NODE_TYPES.AssignmentExpression &&
          parent.left.type === AST_NODE_TYPES.Identifier
        ) {
          const varName = parent.left.name;
          const fnBody = getEnclosingFunctionBody(node);
          if (!fnBody) return;

          if (hasSuccessAccess(fnBody, varName)) return;
          if (isPassedToFunction(fnBody, varName)) return;
          if (isReturned(fnBody, varName)) return;

          context.report({ node, messageId: 'uncheckedSuccess' });
          return;
        }

        // Other patterns (e.g., passed directly as arg, chained) — don't flag
      },
    };
  },
});
