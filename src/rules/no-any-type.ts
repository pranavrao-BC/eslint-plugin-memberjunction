import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/**
 * Complements @typescript-eslint/no-explicit-any (which handles `any`).
 *
 * This rule flags `unknown` only in positions where it's likely being used as
 * a lazy substitute for proper typing — NOT at system boundaries where it's
 * the correct type-safe choice.
 *
 * Allowed (not flagged):
 *  - Index signatures: `[key: string]: unknown`
 *  - Generic type arguments: `Foo<unknown>`
 *  - `as unknown as T` double-cast / `as unknown` single cast
 *  - Catch clause variables: `catch (err: unknown)`
 *  - Function/method parameters: `fn(x: unknown)`, `method(x: unknown)`
 *  - Function/method return types (these are part of the function's contract)
 *  - Function type / constructor type signatures: `as (x: unknown) => T`
 *  - Interface/type method signatures: `Get(key: string): unknown`
 *  - Interface/type properties: `{ data: unknown }` (data contract boundaries)
 *  - Variables initialized with JSON.parse(): `let parsed: unknown = JSON.parse(...)`
 *
 * Flagged:
 *  - `const x: unknown = expr` (local variable, unless initialized with JSON.parse)
 *  - Class property typed `unknown`
 *  - Type alias `type X = unknown`
 */

const FUNCTION_LIKE = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
]);

const TYPE_SIGNATURE = new Set([
  AST_NODE_TYPES.TSFunctionType,
  AST_NODE_TYPES.TSConstructorType,
  AST_NODE_TYPES.TSMethodSignature,
  AST_NODE_TYPES.TSCallSignatureDeclaration,
  AST_NODE_TYPES.TSConstructSignatureDeclaration,
]);

/** Nodes that are structural type-system wrappers — walk through them. */
function isTypeWrapper(type: AST_NODE_TYPES): boolean {
  switch (type) {
    case AST_NODE_TYPES.TSTypeAnnotation:
    case AST_NODE_TYPES.TSArrayType:
    case AST_NODE_TYPES.TSTupleType:
    case AST_NODE_TYPES.TSUnionType:
    case AST_NODE_TYPES.TSIntersectionType:
    case AST_NODE_TYPES.TSTypeReference:
    case AST_NODE_TYPES.TSRestType:
    case AST_NODE_TYPES.TSOptionalType:
    case AST_NODE_TYPES.TSTypeOperator:
    case AST_NODE_TYPES.TSMappedType:
    case AST_NODE_TYPES.TSConditionalType:
    case AST_NODE_TYPES.TSIndexedAccessType:
    case AST_NODE_TYPES.TSTypeParameterInstantiation:
      return true;
    default:
      return false;
  }
}

/** Nodes that represent identifiers/patterns in parameter positions. */
function isParamWrapper(type: AST_NODE_TYPES): boolean {
  switch (type) {
    case AST_NODE_TYPES.Identifier:
    case AST_NODE_TYPES.RestElement:
    case AST_NODE_TYPES.AssignmentPattern:
    case AST_NODE_TYPES.TSParameterProperty:
    case AST_NODE_TYPES.ObjectPattern:
    case AST_NODE_TYPES.ArrayPattern:
    case AST_NODE_TYPES.Property:
      return true;
    default:
      return false;
  }
}

/**
 * Walk parents to determine the context of this `unknown` keyword.
 * Returns true if the unknown is in an allowed position.
 */
function isAllowedContext(node: TSESTree.TSUnknownKeyword): boolean {
  // 1. Direct parent checks (fast path)
  const parent = node.parent;
  if (!parent) return false;

  // Generic type argument: Foo<unknown>
  if (parent.type === AST_NODE_TYPES.TSTypeParameterInstantiation) return true;

  // Type assertion: as unknown / as unknown as T
  if (parent.type === AST_NODE_TYPES.TSAsExpression) return true;

  // Generic type parameter default: <T = unknown>
  if (parent.type === AST_NODE_TYPES.TSTypeParameter) return true;

  // 2. Walk up through type wrappers and param wrappers to find the real context
  let current: TSESTree.Node | undefined = node.parent;
  let walkedThroughArray = false;
  while (current) {
    const p: TSESTree.Node = current;

    // Index signature — always allowed
    if (p.type === AST_NODE_TYPES.TSIndexSignature) return true;

    // Catch clause — always allowed
    if (p.type === AST_NODE_TYPES.CatchClause) return true;

    // Type-level signature (function type, constructor type, method signature)
    // unknown is always appropriate in these positions
    if (TYPE_SIGNATURE.has(p.type)) return true;

    // Function-like node — only allow if we're in a parameter or return type position
    // (both are part of the function's contract / system boundary)
    if (FUNCTION_LIKE.has(p.type)) return true;

    // Method definition — unknown in a method context is fine
    if (p.type === AST_NODE_TYPES.MethodDefinition) return true;

    // Type assertion reached via wrapper: `as unknown[]`, `as unknown as T`
    if (p.type === AST_NODE_TYPES.TSAsExpression) return true;

    // Interface/type property — these define data contracts where unknown
    // is appropriate for arbitrary JSON values, tool results, etc.
    if (p.type === AST_NODE_TYPES.TSPropertySignature) return true;

    // Variable declarations — allow unknown in specific safe patterns
    if (p.type === AST_NODE_TYPES.VariableDeclarator) {
      // unknown[] on variables — arrays of arbitrary data (SQL params, parsed rows)
      if (walkedThroughArray) return true;

      // JSON.parse() init — parsed shape is genuinely unknowable
      const decl = p as TSESTree.VariableDeclarator;
      if (
        decl.init?.type === AST_NODE_TYPES.CallExpression &&
        decl.init.callee.type === AST_NODE_TYPES.MemberExpression &&
        decl.init.callee.object.type === AST_NODE_TYPES.Identifier &&
        decl.init.callee.object.name === 'JSON' &&
        decl.init.callee.property.type === AST_NODE_TYPES.Identifier &&
        decl.init.callee.property.name === 'parse'
      ) {
        return true;
      }
      break;
    }

    // Keep walking through transparent type/param wrappers
    if (isTypeWrapper(p.type) || isParamWrapper(p.type)) {
      if (p.type === AST_NODE_TYPES.TSArrayType) walkedThroughArray = true;
      current = p.parent;
      continue;
    }

    // Hit a non-transparent node — stop
    break;
  }

  return false;
}

export default createRule({
  name: 'no-any-type',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow `unknown` as a lazy alternative to proper typing — allows unknown at system boundaries',
    },
    messages: {
      noLazyUnknown:
        'Do not use `unknown` here. Replace with the actual type — check the entity class, interface, or function return type.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSUnknownKeyword(node) {
        if (isAllowedContext(node)) return;

        context.report({
          node,
          messageId: 'noLazyUnknown',
        });
      },
    };
  },
});
