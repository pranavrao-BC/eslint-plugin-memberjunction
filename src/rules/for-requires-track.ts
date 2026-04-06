import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

// Match @for (...) but without a `track` keyword
// @for (item of items; track item.id) { ... } — valid
// @for (item of items) { ... } — invalid (missing track)
const FOR_BLOCK_PATTERN = /@for\s*\([^)]*\)/g;
const TRACK_IN_FOR = /;\s*track\s/;

export default createRule({
  name: 'for-requires-track',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require track expression in @for blocks — required by Angular and important for performance',
    },
    messages: {
      missingTrack:
        '@for block is missing a `track` expression. Add `; track item.id` (or appropriate identity expression) for Angular change detection.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkString(value: string, node: TSESTree.Node) {
      FOR_BLOCK_PATTERN.lastIndex = 0;
      let match;
      while ((match = FOR_BLOCK_PATTERN.exec(value)) !== null) {
        const forBlock = match[0];
        if (!TRACK_IN_FOR.test(forBlock)) {
          context.report({ node, messageId: 'missingTrack' });
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        checkString(node.value, node);
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(quasi.value.raw, quasi);
        }
      },
    };
  },
});
