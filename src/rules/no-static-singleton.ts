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
        'Manual singleton pattern detected. Extend `BaseSingleton<T>` from `@memberjunction/global` instead — it uses a global object store that survives bundler code splitting. Change to: `class {{className}} extends BaseSingleton<{{className}}> { protected constructor() { super(); } static get Instance(): {{className}} { return {{className}}.getInstance<{{className}}>(); } }`',
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
          // Walk up to find the class name
          const classNode = node.parent?.parent;
          const className =
            classNode?.type === AST_NODE_TYPES.ClassDeclaration && classNode.id
              ? classNode.id.name
              : 'MyClass';
          context.report({ node, messageId: 'useBaseSingleton', data: { className } });
        }
      },
    };
  },
});
