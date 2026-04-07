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
      noOnChanges:
        'Replace `ngOnChanges` with `@Input() set` getter/setters for each input you need to react to. Example: `@Input() set userId(value: string) { this.loadUser(value); }` — this is more explicit and avoids the untyped `SimpleChanges` map.',
      noDoCheck:
        'Replace `ngDoCheck` with `@Input() set` getter/setters for change detection. `ngDoCheck` runs on every change detection cycle and is a performance concern — `@Input()` setters only fire when the value actually changes.',
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
