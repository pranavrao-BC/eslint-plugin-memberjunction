import { createRule } from '../utils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const UUID_FIELD_PATTERN = /(?:^ID$|ID$|Id$|_id$|Uuid$|UUID$)/;

type Options = [{
  additionalPatterns?: string[];
  ignorePatterns?: string[];
}];

function getFieldName(node: TSESTree.Expression): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) return node.name;
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.property.name;
  }
  return null;
}

function looksLikeUuidField(
  node: TSESTree.Expression,
  extraPatterns: RegExp[],
  ignoreSet: Set<string>,
): boolean {
  const name = getFieldName(node);
  if (!name) return false;
  if (ignoreSet.has(name)) return false;
  if (UUID_FIELD_PATTERN.test(name)) return true;
  return extraPatterns.some((p) => p.test(name));
}

function isNullUndefinedOrNumeric(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.Literal) {
    return node.value === null || typeof node.value === 'number';
  }
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name === 'undefined';
  }
  return false;
}

export default createRule<Options, 'useUUIDsEqual' | 'useNegatedUUIDsEqual' | 'suggestUUIDsEqual' | 'suggestNegatedUUIDsEqual'>({
  name: 'use-uuids-equal',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Use UUIDsEqual() instead of === for UUID comparisons (case-insensitive cross-platform)',
    },
    messages: {
      useUUIDsEqual:
        'UUID comparison with {{ operator }} is case-sensitive. Use UUIDsEqual(a, b) from @memberjunction/global.',
      useNegatedUUIDsEqual:
        'UUID comparison with {{ operator }} is case-sensitive. Use !UUIDsEqual(a, b) from @memberjunction/global.',
      suggestUUIDsEqual: 'Replace with UUIDsEqual(a, b)',
      suggestNegatedUUIDsEqual: 'Replace with !UUIDsEqual(a, b)',
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalPatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional regex patterns for UUID field names.',
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Field names to ignore.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const extraPatterns = (options.additionalPatterns ?? []).map((p) => new RegExp(p));
    const ignoreSet = new Set(options.ignorePatterns ?? []);

    return {
      BinaryExpression(node) {
        if (
          node.operator !== '===' && node.operator !== '!==' &&
          node.operator !== '==' && node.operator !== '!='
        ) return;

        // Don't flag null/undefined/numeric comparisons
        if (isNullUndefinedOrNumeric(node.left) || isNullUndefinedOrNumeric(node.right)) return;

        const leftMatch = looksLikeUuidField(node.left, extraPatterns, ignoreSet);
        const rightMatch = looksLikeUuidField(node.right, extraPatterns, ignoreSet);

        if (!leftMatch && !rightMatch) return;

        const isNegated = node.operator === '!==' || node.operator === '!=';
        const leftSource = context.sourceCode.getText(node.left);
        const rightSource = context.sourceCode.getText(node.right);
        const replacement = isNegated
          ? `!UUIDsEqual(${leftSource}, ${rightSource})`
          : `UUIDsEqual(${leftSource}, ${rightSource})`;

        context.report({
          node,
          messageId: isNegated ? 'useNegatedUUIDsEqual' : 'useUUIDsEqual',
          data: { operator: node.operator },
          suggest: [{
            messageId: isNegated ? 'suggestNegatedUUIDsEqual' as const : 'suggestUUIDsEqual' as const,
            fix: (fixer) => fixer.replaceText(node, replacement),
          }],
        });
      },
    };
  },
});
