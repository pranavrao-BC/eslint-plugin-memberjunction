import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const UUID_FIELD_PATTERN = /(?:^ID$|ID$|Id$|_id$|Uuid$|UUID$)/;

function looksLikeUuidField(node: { type: string; name?: string; property?: { name?: string } }): boolean {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return UUID_FIELD_PATTERN.test(node.name ?? '');
  }
  if (node.type === AST_NODE_TYPES.MemberExpression && node.property) {
    return UUID_FIELD_PATTERN.test((node.property as { name?: string }).name ?? '');
  }
  return false;
}

export default createRule({
  name: 'use-uuids-equal',
  meta: {
    type: 'problem',
    docs: {
      description: 'Use UUIDsEqual() instead of === for UUID comparisons (case-insensitive cross-platform)',
    },
    messages: {
      useUUIDsEqual:
        'UUID comparison with {{ operator }} is case-sensitive. Use UUIDsEqual(a, b) from @memberjunction/global.',
      useNegatedUUIDsEqual:
        'UUID comparison with !== is case-sensitive. Use !UUIDsEqual(a, b) from @memberjunction/global.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '===' && node.operator !== '!==') return;

        const leftMatch = looksLikeUuidField(node.left as Parameters<typeof looksLikeUuidField>[0]);
        const rightMatch = looksLikeUuidField(node.right as Parameters<typeof looksLikeUuidField>[0]);

        if (!leftMatch && !rightMatch) return;

        context.report({
          node,
          messageId: node.operator === '!==' ? 'useNegatedUUIDsEqual' : 'useUUIDsEqual',
          data: { operator: node.operator },
        });
      },
    };
  },
});
