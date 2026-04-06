import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

type Options = [{
  allowedReceivers?: string[];
}];

/** Walk the MemberExpression chain and return the receiver names (e.g. ['this', 'entity']). */
function getReceiverChain(node: TSESTree.MemberExpression): string[] {
  const names: string[] = [];
  let current: TSESTree.Expression = node.object;
  while (current.type === AST_NODE_TYPES.MemberExpression) {
    if (current.property.type === AST_NODE_TYPES.Identifier) names.unshift(current.property.name);
    current = current.object;
  }
  if (current.type === AST_NODE_TYPES.Identifier) names.unshift(current.name);
  if (current.type === AST_NODE_TYPES.ThisExpression) names.unshift('this');
  return names;
}

function looksLikeEntity(chain: string[]): boolean {
  return chain.some((name) => /entity/i.test(name));
}

export default createRule<Options, 'noGet' | 'noSet' | 'probableGet' | 'probableSet' | 'suggestProperty' | 'suggestAssignment'>({
  name: 'no-entity-get-set',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Disallow .Get()/.Set() on BaseEntity — use strongly-typed properties instead',
    },
    messages: {
      noGet: 'Use strongly-typed property instead of .Get(\'{{field}}\'). Run CodeGen if types are missing.',
      noSet: 'Use strongly-typed property instead of .Set(\'{{field}}\', value). Run CodeGen if types are missing.',
      probableGet: 'If this is a BaseEntity, use a strongly-typed property instead of .Get(\'{{field}}\').',
      probableSet: 'If this is a BaseEntity, use a strongly-typed property instead of .Set(\'{{field}}\', value).',
      suggestProperty: 'Replace with .{{field}}',
      suggestAssignment: 'Replace with .{{field}} = value',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedReceivers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Receiver names to ignore (e.g., ["cache", "registry"]).',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allowed = new Set((options.allowedReceivers ?? []).map((r) => r.toLowerCase()));

    return {
      CallExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier
        ) return;

        const methodName = node.callee.property.name;
        if (methodName !== 'Get' && methodName !== 'Set') return;

        // Must have a string literal first argument
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== AST_NODE_TYPES.Literal || typeof firstArg.value !== 'string') return;

        const chain = getReceiverChain(node.callee);
        const immediateReceiver = chain[chain.length - 1]?.toLowerCase();
        if (immediateReceiver && allowed.has(immediateReceiver)) return;

        const isEntity = looksLikeEntity(chain);
        const isGet = methodName === 'Get';

        const receiverSource = context.sourceCode.getText(node.callee.object);
        const field = firstArg.value;

        context.report({
          node,
          messageId: isEntity
            ? (isGet ? 'noGet' : 'noSet')
            : (isGet ? 'probableGet' : 'probableSet'),
          data: { field },
          suggest: isGet
            ? [{
                messageId: 'suggestProperty' as const,
                data: { field },
                fix: (fixer) => fixer.replaceText(node, `${receiverSource}.${field}`),
              }]
            : node.arguments.length >= 2
              ? [{
                  messageId: 'suggestAssignment' as const,
                  data: { field },
                  fix: (fixer) => {
                    const valueSource = context.sourceCode.getText(node.arguments[1]);
                    return fixer.replaceText(node, `${receiverSource}.${field} = ${valueSource}`);
                  },
                }]
              : [],
        });
      },
    };
  },
});
