import { createRule } from '../utils';
import { TSESTree } from '@typescript-eslint/utils';

const LEGACY_DIRECTIVES = [
  { pattern: /\*ngIf\b/, directive: '*ngIf', replacement: '@if' },
  { pattern: /\*ngFor\b/, directive: '*ngFor', replacement: '@for' },
  { pattern: /\*ngSwitch\b/, directive: '*ngSwitch', replacement: '@switch' },
];

export default createRule({
  name: 'no-legacy-template-syntax',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow *ngIf/*ngFor/*ngSwitch — use @if/@for/@switch block syntax instead',
    },
    messages: {
      useBlockSyntax:
        'Replace "{{ directive }}" with "{{ replacement }}" block syntax. @for has 90% better runtime performance.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkString(value: string, node: TSESTree.Node) {
      for (const { pattern, directive, replacement } of LEGACY_DIRECTIVES) {
        if (pattern.test(value)) {
          context.report({
            node,
            messageId: 'useBlockSyntax',
            data: { directive, replacement },
          });
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
