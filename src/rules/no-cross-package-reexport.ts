import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import path from 'path';

const INDEX_FILES = new Set([
  'index.ts', 'index.js', 'index.mts', 'index.mjs', 'index.cts', 'index.cjs',
  'public-api.ts', 'public-api.js', 'public-api.mts', 'public-api.mjs', 'public-api.cts', 'public-api.cjs',
]);

export default createRule({
  name: 'no-cross-package-reexport',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow re-exporting from other @memberjunction packages in index/public-api files',
    },
    messages: {
      noReexport:
        'Do not re-export from "{{ source }}". Consumers should import directly from that package.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = path.basename(context.filename);
    if (!INDEX_FILES.has(filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        if (
          node.source?.type === AST_NODE_TYPES.Literal &&
          typeof node.source.value === 'string' &&
          node.source.value.startsWith('@memberjunction/')
        ) {
          context.report({
            node,
            messageId: 'noReexport',
            data: { source: node.source.value },
          });
        }
      },
      ExportAllDeclaration(node) {
        if (
          node.source.type === AST_NODE_TYPES.Literal &&
          typeof node.source.value === 'string' &&
          node.source.value.startsWith('@memberjunction/')
        ) {
          context.report({
            node,
            messageId: 'noReexport',
            data: { source: node.source.value },
          });
        }
      },
    };
  },
});
