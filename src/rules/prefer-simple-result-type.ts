import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Entity mutation methods that justify using entity_object. */
const MUTATION_METHODS = new Set(['Save', 'Delete', 'Load', 'Validate', 'SetMany']);

/**
 * Array methods on Results that constitute safe inline consumption.
 * These either return non-entity values (map → derived array, some → boolean)
 * or are standard iteration patterns that don't require full BaseEntity instances.
 */
const SAFE_ARRAY_METHODS = new Set([
  'map', 'filter', 'find', 'findIndex', 'some', 'every', 'reduce',
  'forEach', 'flatMap', 'slice', 'includes', 'indexOf', 'join',
]);

/** Properties on the RunView result that are metadata, not entity data. */
const RESULT_METADATA_PROPS = new Set([
  'Success', 'ErrorMessage', 'RowCount', 'UserViewRunID', 'LogStatus',
]);

/**
 * Check if a RunView params object has ResultType: 'entity_object'.
 * Returns the Property node for the ResultType if found, null otherwise.
 */
function getEntityObjectResultType(
  node: TSESTree.CallExpression,
): TSESTree.Property | null {
  // RunView typically takes a single object argument
  const arg = node.arguments[0];
  if (!arg || arg.type !== AST_NODE_TYPES.ObjectExpression) return null;

  for (const prop of arg.properties) {
    if (
      prop.type === AST_NODE_TYPES.Property &&
      prop.key.type === AST_NODE_TYPES.Identifier &&
      prop.key.name === 'ResultType' &&
      prop.value.type === AST_NODE_TYPES.Literal &&
      prop.value.value === 'entity_object'
    ) {
      return prop;
    }
  }
  return null;
}

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

/** Get the enclosing function body for a node. */
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

/** Recursively walk AST nodes, calling visitor on each. */
function walkNodes(nodes: TSESTree.Node[], visitor: (node: TSESTree.Node) => boolean | void): void {
  for (const node of nodes) {
    if (visitor(node) === true) return; // short-circuit
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          const childNodes = child.filter(
            (item): item is TSESTree.Node => item && typeof item === 'object' && 'type' in item,
          );
          if (childNodes.length) walkNodes(childNodes, visitor);
        } else if ('type' in (child as object)) {
          walkNodes([child as TSESTree.Node], visitor);
        }
      }
    }
  }
}

/**
 * Check if any mutation method (.Save(), .Delete(), .Load(), .Validate())
 * is called anywhere in the given statements.
 *
 * We use a broad check: if ANY mutation call exists in the function,
 * we assume the entity_object might be justified. This avoids false positives
 * at the cost of missing some true positives (acceptable for a suggestion rule).
 */
function hasMutationCall(statements: TSESTree.Statement[]): boolean {
  let found = false;
  walkNodes(statements, (node) => {
    if (found) return true;
    if (
      node.type === AST_NODE_TYPES.CallExpression &&
      node.callee.type === AST_NODE_TYPES.MemberExpression &&
      node.callee.property.type === AST_NODE_TYPES.Identifier &&
      MUTATION_METHODS.has(node.callee.property.name)
    ) {
      found = true;
      return true;
    }
  });
  return found;
}

/**
 * Check if a `result.Results` member expression is consumed via a safe
 * inline pattern that doesn't require full BaseEntity instances.
 *
 * Safe patterns:
 * - result.Results.length
 * - result.Results.map/filter/forEach/...(callback)
 * - result.Results[i].Field (property read, not mutation or assignment)
 */
function isResultsAccessSafe(resultsNode: TSESTree.MemberExpression): boolean {
  const parent = resultsNode.parent;
  if (!parent) return false;

  // result.Results.length
  if (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === resultsNode &&
    !parent.computed &&
    parent.property.type === AST_NODE_TYPES.Identifier &&
    parent.property.name === 'length'
  ) {
    return true;
  }

  // result.Results.map(...), .forEach(...), etc. — must be called
  if (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === resultsNode &&
    !parent.computed &&
    parent.property.type === AST_NODE_TYPES.Identifier &&
    SAFE_ARRAY_METHODS.has(parent.property.name) &&
    parent.parent?.type === AST_NODE_TYPES.CallExpression &&
    parent.parent.callee === parent
  ) {
    return true;
  }

  // result.Results[i].Field — indexed access + property read
  if (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === resultsNode &&
    parent.computed
  ) {
    const grandparent = parent.parent;
    if (
      grandparent?.type === AST_NODE_TYPES.MemberExpression &&
      grandparent.object === parent &&
      !grandparent.computed &&
      grandparent.property.type === AST_NODE_TYPES.Identifier
    ) {
      const fieldName = grandparent.property.name;
      // Not a mutation method call: result.Results[0].Save()
      if (
        MUTATION_METHODS.has(fieldName) &&
        grandparent.parent?.type === AST_NODE_TYPES.CallExpression &&
        grandparent.parent.callee === grandparent
      ) {
        return false;
      }
      // Not a property assignment: result.Results[0].Name = 'x'
      if (
        grandparent.parent?.type === AST_NODE_TYPES.AssignmentExpression &&
        grandparent.parent.left === grandparent
      ) {
        return false;
      }
      return true;
    }
    // result.Results[i] alone without property access — entity escapes
    return false;
  }

  // Anything else (return, assignment, function arg, for-of, spread, etc.)
  return false;
}

/**
 * Whitelist check: is every reference to the result variable a safe inline
 * consumption that doesn't require entity_object?
 *
 * This is the "whitelist" approach: we enumerate the small set of patterns
 * that are obviously safe, and suppress everything else. If ANY reference
 * doesn't match a known-safe pattern, we return false (suppress the warning).
 *
 * The alternative (blacklist) tries to enumerate every way data can escape
 * and always has gaps. The whitelist is stable — a .map() that returns
 * strings is always safe, regardless of what the rest of the function does.
 */
function isResultConsumedSafely(
  statements: TSESTree.Statement[],
  varName: string,
): boolean {
  let allSafe = true;

  walkNodes(statements, (node) => {
    if (!allSafe) return true;

    if (node.type !== AST_NODE_TYPES.Identifier || node.name !== varName) return;

    const parent = node.parent;
    if (!parent) { allSafe = false; return true; }

    // Skip declaration/assignment target: const result = ..., result = ...
    if (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.id === node) return;
    if (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.left === node) return;

    // Must be used as object of a member expression: result.Something
    if (parent.type !== AST_NODE_TYPES.MemberExpression || parent.object !== node) {
      allSafe = false;
      return true;
    }

    const prop = parent.property;
    if (prop.type !== AST_NODE_TYPES.Identifier) { allSafe = false; return true; }

    // result.Success, result.ErrorMessage, etc. — metadata reads
    if (RESULT_METADATA_PROPS.has(prop.name)) return;

    // result.Results — check downstream consumption
    if (prop.name === 'Results') {
      if (!isResultsAccessSafe(parent)) {
        allSafe = false;
        return true;
      }
      return;
    }

    // Any other property on result — unknown usage, suppress
    allSafe = false;
    return true;
  });

  return allSafe;
}

/**
 * Get the variable name from a RunView call's assignment context.
 * Handles: `const result = await rv.RunView(...)` and `result = await rv.RunView(...)`
 */
function getResultVarName(node: TSESTree.CallExpression): string | null {
  let current: TSESTree.Node = node;

  // Skip past AwaitExpression
  if (current.parent?.type === AST_NODE_TYPES.AwaitExpression) {
    current = current.parent;
  }

  const parent = current.parent;
  if (!parent) return null;

  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }

  if (
    parent.type === AST_NODE_TYPES.AssignmentExpression &&
    parent.left.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.left.name;
  }

  return null;
}

export default createRule({
  name: 'prefer-simple-result-type',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Suggest ResultType: 'simple' when RunView results aren't mutated — entity_object has overhead",
    },
    messages: {
      preferSimple:
        "Consider using `ResultType: 'simple'` instead of `'entity_object'`. No .Save()/.Delete()/.Load() calls were found on these results. entity_object creates full BaseEntity instances with overhead — use 'simple' for read-only data.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isRunViewCall(node)) return;

        const resultTypeProp = getEntityObjectResultType(node);
        if (!resultTypeProp) return;

        const fnBody = getEnclosingFunctionBody(node);
        if (!fnBody) return;

        // Tier 2 gate: if any mutation method exists anywhere in the function,
        // entity_object may be justified. Suppress.
        if (hasMutationCall(fnBody)) return;

        // Need a variable name to analyze usage patterns.
        // If we can't determine it (destructuring, bare expression), suppress.
        const varName = getResultVarName(node);
        if (!varName) return;

        // Whitelist: only flag if EVERY reference to the result is a safe
        // inline consumption. If any reference is unknown, suppress.
        // "Flag what you can see. Suppress what you'd have to infer."
        if (!isResultConsumedSafely(fnBody, varName)) return;

        context.report({
          node: resultTypeProp,
          messageId: 'preferSimple',
        });
      },
    };
  },
});
