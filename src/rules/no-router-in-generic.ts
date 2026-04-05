import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export default createRule({
  name: 'no-router-in-generic',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow importing @angular/router in Generic/ components — use @Input() instead',
    },
    messages: {
      noRouter:
        'Generic components must not import Router. Pass route-derived state via @Input() from the parent.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          genericPathPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ genericPathPattern: 'Angular/Generic/' }],
  create(context, [options]) {
    const pattern = options.genericPathPattern;
    if (!context.filename.includes(pattern)) return {};

    return {
      ImportDeclaration(node) {
        if (
          node.source.type === AST_NODE_TYPES.Literal &&
          node.source.value === '@angular/router'
        ) {
          context.report({ node, messageId: 'noRouter' });
        }
      },
    };
  },
});
