import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const KENDO_ICON_PATTERN = /\bk-icon\b|\bk-i-\w+/;

export default createRule({
  name: 'no-kendo-icons',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow Kendo icon classes (k-icon, k-i-*) — use Font Awesome instead',
    },
    messages: {
      useFA:
        'Replace Kendo icon class "{{ match }}" with a Font Awesome equivalent (e.g., fa-solid fa-times).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      // Catch in template literals and string literals
      Literal(node) {
        if (typeof node.value !== 'string') return;
        const match = node.value.match(KENDO_ICON_PATTERN);
        if (match) {
          context.report({ node, messageId: 'useFA', data: { match: match[0] } });
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          const match = quasi.value.raw.match(KENDO_ICON_PATTERN);
          if (match) {
            context.report({ node: quasi, messageId: 'useFA', data: { match: match[0] } });
          }
        }
      },
      // Catch in inline template strings used with Angular @Component({ template: '...' })
      PropertyDefinition(node) {
        if (
          node.key.type === AST_NODE_TYPES.Identifier &&
          node.key.name === 'template' &&
          node.value?.type === AST_NODE_TYPES.Literal &&
          typeof node.value.value === 'string'
        ) {
          const match = node.value.value.match(KENDO_ICON_PATTERN);
          if (match) {
            context.report({ node: node.value, messageId: 'useFA', data: { match: match[0] } });
          }
        }
      },
    };
  },
});
