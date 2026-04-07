import { createRule } from '../utils';

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
        'Replace Kendo icon class `{{ match }}` with a Font Awesome equivalent. Common mappings: k-i-close → fa-solid fa-xmark, k-i-check → fa-solid fa-check, k-i-plus → fa-solid fa-plus, k-i-edit → fa-solid fa-pen, k-i-delete → fa-solid fa-trash. See https://fontawesome.com/icons for the full catalog.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
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
    };
  },
});
