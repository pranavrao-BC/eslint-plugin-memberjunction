import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/**
 * Check if a class has an @NgModule decorator — indicating it's module-declared.
 * We look for components in a module's `declarations` array, but that's hard to
 * trace statically. Instead, this rule checks @Component/@Directive decorators
 * that DON'T have `standalone: true` — if they also don't have `standalone: false`,
 * Angular 21 will default them to standalone, breaking NgModule declarations.
 */

const COMPONENT_DECORATORS = ['Component', 'Directive', 'Pipe'];

/**
 * Find a decorator by name, returning its call expression arguments if it's a call.
 */
function findDecoratorConfig(
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
  decoratorName: string,
): TSESTree.ObjectExpression | null {
  if (!node.decorators?.length) return null;

  for (const dec of node.decorators) {
    const expr = dec.expression;
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.type === AST_NODE_TYPES.Identifier &&
      expr.callee.name === decoratorName &&
      expr.arguments.length > 0 &&
      expr.arguments[0].type === AST_NODE_TYPES.ObjectExpression
    ) {
      return expr.arguments[0];
    }
  }
  return null;
}

/**
 * Check if an object expression has a `standalone` property set to a specific value.
 */
function getStandaloneValue(
  config: TSESTree.ObjectExpression,
): 'true' | 'false' | 'missing' {
  for (const prop of config.properties) {
    if (
      prop.type === AST_NODE_TYPES.Property &&
      prop.key.type === AST_NODE_TYPES.Identifier &&
      prop.key.name === 'standalone'
    ) {
      if (
        prop.value.type === AST_NODE_TYPES.Literal &&
        prop.value.value === false
      ) {
        return 'false';
      }
      if (
        prop.value.type === AST_NODE_TYPES.Literal &&
        prop.value.value === true
      ) {
        return 'true';
      }
      // Any other expression — treat as explicitly set
      return 'true';
    }
  }
  return 'missing';
}

export default createRule({
  name: 'require-standalone-false',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description:
        'Require explicit `standalone: false` on @Component/@Directive/@Pipe when not standalone — Angular 19+ defaults to standalone: true',
    },
    messages: {
      requireStandaloneFalse:
        'Add `standalone: false` to this @{{decorator}} decorator. Angular 19+ defaults to `standalone: true`, which will break NgModule declarations.',
      suggestAddStandaloneFalse: 'Add `standalone: false`',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkClass(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) {
      for (const decoratorName of COMPONENT_DECORATORS) {
        const config = findDecoratorConfig(node, decoratorName);
        if (!config) continue;

        const standaloneValue = getStandaloneValue(config);

        // standalone: true or standalone: false — both are explicit, fine
        if (standaloneValue !== 'missing') continue;

        // No standalone property — needs explicit standalone: false if module-declared
        // Since we can't know statically if it's in a module, we flag any missing standalone
        // so devs explicitly choose. Standalone components should add `standalone: true`.
        context.report({
          node: config,
          messageId: 'requireStandaloneFalse',
          data: { decorator: decoratorName },
          suggest: [{
            messageId: 'suggestAddStandaloneFalse' as const,
            fix: (fixer) => {
              // Insert standalone: false as the first property
              const firstProp = config.properties[0];
              if (firstProp) {
                return fixer.insertTextBefore(firstProp, 'standalone: false, ');
              }
              // Empty config object — insert inside braces
              return fixer.replaceText(config, '{ standalone: false }');
            },
          }],
        });
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    };
  },
});
