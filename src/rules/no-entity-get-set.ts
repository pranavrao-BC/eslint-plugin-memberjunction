import { createRule } from '../utils';

export default createRule({
  name: 'no-entity-get-set',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow .Get()/.Set() on BaseEntity — use strongly-typed properties instead',
    },
    messages: {
      noGet: 'Use strongly-typed property instead of .Get(\'{{field}}\'). Run CodeGen if types are missing.',
      noSet: 'Use strongly-typed property instead of .Set(\'{{field}}\', value). Run CodeGen if types are missing.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier'
        ) return;

        const methodName = node.callee.property.name;
        if (methodName !== 'Get' && methodName !== 'Set') return;

        // Must have a string literal first argument
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') return;

        context.report({
          node,
          messageId: methodName === 'Get' ? 'noGet' : 'noSet',
          data: { field: firstArg.value },
        });
      },
    };
  },
});
