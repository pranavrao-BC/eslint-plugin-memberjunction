import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import type { Scope, Variable } from '@typescript-eslint/scope-manager';

// Known BaseEntity subclass suffixes from MJ codegen
const ENTITY_PATTERN = /Entity$/;

/** Get a human-readable name for the spread argument. */
function getArgName(arg: TSESTree.Expression): string {
  if (arg.type === AST_NODE_TYPES.Identifier) return arg.name;
  if (
    arg.type === AST_NODE_TYPES.MemberExpression &&
    arg.property.type === AST_NODE_TYPES.Identifier
  ) {
    const obj =
      arg.object.type === AST_NODE_TYPES.ThisExpression
        ? 'this'
        : arg.object.type === AST_NODE_TYPES.Identifier
          ? arg.object.name
          : '(...)';
    return `${obj}.${arg.property.name}`;
  }
  return '(expression)';
}

/** Walk up scope chain to resolve a variable by name. */
function resolveVariable(scope: Scope, name: string): Variable | undefined {
  let current: Scope | null = scope;
  while (current) {
    const found = current.set.get(name);
    if (found) return found;
    current = current.upper;
  }
  return undefined;
}

/** Extract the type name from a type annotation node chain. */
function extractTypeName(node: unknown): string | undefined {
  const ta = node as { typeAnnotation?: { typeAnnotation?: { typeName?: { name?: string } } } };
  return ta?.typeAnnotation?.typeAnnotation?.typeName?.name;
}

/** Check if any variable definition has an Entity type annotation or Entity generic type arg. */
function variableMatchesEntity(variable: Variable): boolean {
  for (const def of variable.defs) {
    const defNode = def.node as unknown as Record<string, unknown>;

    // Check type annotation on the declarator's id: `const x: UserEntity = ...`
    // VariableDeclarator stores annotation on node.id.typeAnnotation
    const idAnnotation = extractTypeName(defNode.id);
    if (idAnnotation && ENTITY_PATTERN.test(idAnnotation)) return true;

    // Also check node.typeAnnotation directly (function params, etc.)
    const directAnnotation = extractTypeName(defNode);
    if (directAnnotation && ENTITY_PATTERN.test(directAnnotation)) return true;

    // Check generic type arg on initializer: `md.GetEntityObject<UserEntity>(...)`
    const init = defNode.init as TSESTree.Expression | undefined;
    if (
      init?.type === AST_NODE_TYPES.CallExpression &&
      init.typeArguments?.params?.length
    ) {
      for (const param of init.typeArguments.params) {
        if (
          param.type === AST_NODE_TYPES.TSTypeReference &&
          param.typeName.type === AST_NODE_TYPES.Identifier &&
          ENTITY_PATTERN.test(param.typeName.name)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export default createRule<[], 'useGetAll' | 'suggestGetAll'>({
  name: 'no-entity-spread',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow spread operator on BaseEntity subclasses — use .GetAll() instead',
    },
    hasSuggestions: true,
    messages: {
      useGetAll:
        'Spread on BaseEntity loses getter properties. Use {{ name }}.GetAll() instead.',
      suggestGetAll: 'Replace with ...{{ name }}.GetAll()',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function report(node: TSESTree.SpreadElement, name: string) {
      const argSource = context.sourceCode.getText(node.argument);
      context.report({
        node,
        messageId: 'useGetAll',
        data: { name },
        suggest: [{
          messageId: 'suggestGetAll' as const,
          data: { name },
          fix: (fixer) => fixer.replaceText(node.argument, `${argSource}.GetAll()`),
        }],
      });
    }

    return {
      SpreadElement(node) {
        const arg = node.argument;

        // Handle MemberExpression: { ...this.userEntity } or { ...foo.barEntity }
        if (
          arg.type === AST_NODE_TYPES.MemberExpression &&
          arg.property.type === AST_NODE_TYPES.Identifier &&
          ENTITY_PATTERN.test(arg.property.name)
        ) {
          report(node, getArgName(arg));
          return;
        }

        if (arg.type !== AST_NODE_TYPES.Identifier) return;

        // Heuristic: variable name ends in Entity
        if (ENTITY_PATTERN.test(arg.name)) {
          report(node, arg.name);
          return;
        }

        // Check type annotation / generic type args via scope chain
        const scope = context.sourceCode.getScope(node);
        const variable = resolveVariable(scope, arg.name);
        if (variable && variableMatchesEntity(variable)) {
          report(node, arg.name);
        }
      },
    };
  },
});
