import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const ACTION_BASE_CLASSES = ['BaseAction', 'BaseActionImplementation'];
const EXECUTE_METHODS = ['executeAction', 'ExecuteAction', 'RunAction', 'runAction'];

/**
 * Check if a class extends one of the known Action base classes.
 */
function extendsActionBase(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): boolean {
  const superClass = node.superClass;
  if (!superClass) return false;

  // Direct: class Foo extends BaseAction
  if (superClass.type === AST_NODE_TYPES.Identifier) {
    return ACTION_BASE_CLASSES.includes(superClass.name);
  }

  // Namespace: class Foo extends MJ.BaseAction
  if (
    superClass.type === AST_NODE_TYPES.MemberExpression &&
    superClass.property.type === AST_NODE_TYPES.Identifier
  ) {
    return ACTION_BASE_CLASSES.includes(superClass.property.name);
  }

  return false;
}

/**
 * Check if a class name looks like an Action subclass by naming convention.
 */
function looksLikeActionClass(name: string | null | undefined): boolean {
  if (!name) return false;
  return /Action$/i.test(name);
}

/**
 * Walk up the AST to find the enclosing class.
 */
function findEnclosingClass(
  node: TSESTree.Node,
): TSESTree.ClassDeclaration | TSESTree.ClassExpression | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ClassDeclaration ||
      current.type === AST_NODE_TYPES.ClassExpression
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

export default createRule({
  name: 'no-action-call-action',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling executeAction() from within an Action subclass — use the underlying class directly instead',
    },
    messages: {
      noActionCallAction:
        'Do not call `{{method}}()` from within an Action. Import and use the underlying service class directly (e.g., AIPromptRunner, EmailService) for type safety and clarity.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Match this.executeAction(...) or this.RunAction(...)
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;

        const prop = node.callee.property;
        if (prop.type !== AST_NODE_TYPES.Identifier) return;
        if (!EXECUTE_METHODS.includes(prop.name)) return;

        // Must be on `this`
        if (node.callee.object.type !== AST_NODE_TYPES.ThisExpression) return;

        // Must be inside an Action class
        const enclosingClass = findEnclosingClass(node);
        if (!enclosingClass) return;

        // Must extend something — a plain class named FooAction with no superclass isn't an Action
        if (!enclosingClass.superClass) return;

        const isAction =
          extendsActionBase(enclosingClass) ||
          looksLikeActionClass(
            enclosingClass.type === AST_NODE_TYPES.ClassDeclaration
              ? enclosingClass.id?.name
              : null,
          );

        if (!isAction) return;

        context.report({
          node,
          messageId: 'noActionCallAction',
          data: { method: prop.name },
        });
      },
    };
  },
});
