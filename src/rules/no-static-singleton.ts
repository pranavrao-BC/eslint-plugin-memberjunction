import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export default createRule({
  name: 'no-static-singleton',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow manual static _instance singleton pattern — use BaseSingleton<T> instead',
    },
    messages: {
      useBaseSingleton:
        'Manual singleton pattern detected. Extend BaseSingleton<T> from @memberjunction/global instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      PropertyDefinition(node) {
        if (
          node.static &&
          node.key.type === AST_NODE_TYPES.Identifier &&
          /^_?instance$/i.test(node.key.name)
        ) {
          context.report({ node, messageId: 'useBaseSingleton' });
        }
      },
    };
  },
});
