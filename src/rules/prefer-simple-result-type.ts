import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** Entity mutation methods that justify using entity_object. */
const MUTATION_METHODS = new Set(['Save', 'Delete', 'Load', 'Validate', 'SetMany']);

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
 * Check if an expression is the result variable or its .Results property
 * (but NOT a derived value like .Results.map(...) or .Results.length).
 *
 * Matches: `result`, `result.Results`, `result.Results[0]`, `result.Results || []`
 * Does NOT match: `result.Results.map(...)`, `result.Results.length`, `result.Success`
 */
function isEntityReference(node: TSESTree.Node, varName: string): boolean {
  // Direct: result
  if (node.type === AST_NODE_TYPES.Identifier && node.name === varName) return true;

  // result.Results
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === varName &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === 'Results'
  ) return true;

  // result.Results[0] or result.Results[i]
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.computed &&
    node.object.type === AST_NODE_TYPES.MemberExpression &&
    node.object.object.type === AST_NODE_TYPES.Identifier &&
    node.object.object.name === varName &&
    node.object.property.type === AST_NODE_TYPES.Identifier &&
    node.object.property.name === 'Results'
  ) return true;

  // result.Results || [] (LogicalExpression)
  if (
    node.type === AST_NODE_TYPES.LogicalExpression &&
    isEntityReference(node.left, varName)
  ) return true;

  // result.Results ?? [] (same)
  if (
    node.type === AST_NODE_TYPES.LogicalExpression &&
    isEntityReference(node.left, varName)
  ) return true;

  return false;
}

/**
 * Check if an AST subtree contains any reference to the given variable name.
 */
function referencesVar(node: TSESTree.Node, varName: string): boolean {
  let found = false;
  walkNodes([node], (n) => {
    if (found) return true;
    if (n.type === AST_NODE_TYPES.Identifier && n.name === varName) {
      found = true;
      return true;
    }
  });
  return found;
}

/**
 * Check if the RunView result is returned or passed to another function
 * (in which case mutation may happen elsewhere).
 *
 * Uses strict matching for function arguments (only direct entity references)
 * and broad matching for returns and property assignments (any mention of the
 * result variable, since entity objects may escape through chains like .sort()).
 */
function resultMayEscape(statements: TSESTree.Statement[], varName: string): boolean {
  let escapes = false;
  walkNodes(statements, (node) => {
    if (escapes) return true;

    // Returned — broad check: any return mentioning the variable
    // Covers: return result, return result.Results, return result.Results[0],
    // return { companyIntegration } where companyIntegration came from result
    if (
      node.type === AST_NODE_TYPES.ReturnStatement &&
      node.argument &&
      referencesVar(node.argument, varName)
    ) {
      escapes = true;
      return true;
    }

    // Passed as function argument — strict check: only direct entity references
    // Avoids false positives like console.log(result.Results.length)
    if (node.type === AST_NODE_TYPES.CallExpression) {
      for (const arg of node.arguments) {
        if (isEntityReference(arg, varName)) {
          escapes = true;
          return true;
        }
      }
    }

    // Assigned to a property — broad check: any mention of the variable
    // Covers: this.entities = result.Results.sort(...), this.data = result
    if (
      node.type === AST_NODE_TYPES.AssignmentExpression &&
      node.left.type === AST_NODE_TYPES.MemberExpression &&
      referencesVar(node.right, varName)
    ) {
      escapes = true;
      return true;
    }
  });
  return escapes;
}

/**
 * Find variables assigned from result.Results[*] and check if they escape.
 * Catches patterns like: const entity = result.Results[0]; return entity;
 */
function indirectResultEscapes(statements: TSESTree.Statement[], varName: string): boolean {
  const derivedVars: string[] = [];

  // Find variables assigned directly from varName.Results[*] (entity objects),
  // but NOT from varName.Results.map/filter/etc (derived values)
  walkNodes(statements, (node) => {
    if (
      node.type === AST_NODE_TYPES.VariableDeclarator &&
      node.id.type === AST_NODE_TYPES.Identifier &&
      node.init
    ) {
      const init = node.init;
      // Direct: const entity = result.Results[0]
      if (isEntityReference(init, varName)) {
        derivedVars.push(node.id.name);
        return;
      }
      // Conditional: const entity = result.Success ? result.Results[0] : null
      if (init.type === AST_NODE_TYPES.ConditionalExpression) {
        if (isEntityReference(init.consequent, varName) || isEntityReference(init.alternate, varName)) {
          derivedVars.push(node.id.name);
          return;
        }
      }
      // Logical: const entity = result.Success && result.Results[0]
      if (init.type === AST_NODE_TYPES.LogicalExpression && isEntityReference(init.right, varName)) {
        derivedVars.push(node.id.name);
        return;
      }
    }
  });

  // Check if any derived variable escapes
  for (const dVar of derivedVars) {
    let escapes = false;
    walkNodes(statements, (node) => {
      if (escapes) return true;
      // Returned (directly or in an object)
      if (node.type === AST_NODE_TYPES.ReturnStatement && node.argument) {
        if (referencesVar(node.argument, dVar)) {
          escapes = true;
          return true;
        }
      }
      // Passed as function argument
      if (node.type === AST_NODE_TYPES.CallExpression) {
        for (const arg of node.arguments) {
          if (
            arg.type === AST_NODE_TYPES.Identifier && arg.name === dVar
          ) {
            escapes = true;
            return true;
          }
        }
      }
      // Assigned to this.*
      if (
        node.type === AST_NODE_TYPES.AssignmentExpression &&
        node.left.type === AST_NODE_TYPES.MemberExpression &&
        referencesVar(node.right, dVar)
      ) {
        escapes = true;
        return true;
      }
    });
    if (escapes) return true;
  }

  return false;
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

        // If any mutation method is called anywhere in the function, don't flag.
        // Conservative: avoids false positives when mutation happens on a different
        // variable but in the same function scope.
        if (hasMutationCall(fnBody)) return;

        // If the result variable escapes the function (returned, passed as arg),
        // mutation may happen elsewhere — don't flag.
        const varName = getResultVarName(node);
        if (varName && resultMayEscape(fnBody, varName)) return;

        // Check indirect escape: variables assigned from result.Results[*] that then escape
        if (varName && indirectResultEscapes(fnBody, varName)) return;

        // No mutation found — suggest using 'simple'
        context.report({
          node: resultTypeProp,
          messageId: 'preferSimple',
        });
      },
    };
  },
});
