import { createRule } from '../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export default createRule({
  name: 'no-ng-on-changes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow ngOnChanges/ngDoCheck — use @Input() getter/setters instead',
    },
    messages: {
      noOnChanges: 'Use @Input() getter/setters instead of ngOnChanges for change detection.',
      noDoCheck: 'Use @Input() getter/setters instead of ngDoCheck for change detection.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MethodDefinition(node) {
        if (node.key.type !== AST_NODE_TYPES.Identifier) return;
        if (node.key.name === 'ngOnChanges') {
          context.report({ node: node.key, messageId: 'noOnChanges' });
        }
        if (node.key.name === 'ngDoCheck') {
          context.report({ node: node.key, messageId: 'noDoCheck' });
        }
      },
    };
  },
});
