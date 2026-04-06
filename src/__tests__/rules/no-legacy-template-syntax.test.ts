import { createTester } from '../setup';
import rule from '../../rules/no-legacy-template-syntax';

const tester = createTester();

tester.run('no-legacy-template-syntax', rule, {
  valid: [
    // Modern block syntax is fine
    'const tpl = `@if (condition) { <div>Content</div> }`;',
    'const tpl = `@for (item of items; track item.id) { <div /> }`;',
    // Non-template strings are fine (no asterisk prefix)
    'const name = "ngIf is a directive name";',
    // Without the * prefix, not flagged
    'const x = "ngFor loop";',
  ],
  invalid: [
    {
      code: 'const tpl = `<div *ngIf="condition">Content</div>`;',
      errors: [{ messageId: 'useBlockSyntax' }],
    },
    {
      code: 'const tpl = `<div *ngFor="let item of items">{{ item }}</div>`;',
      errors: [{ messageId: 'useBlockSyntax' }],
    },
    {
      code: 'const tpl = `<div *ngSwitch="value">inner</div>`;',
      errors: [{ messageId: 'useBlockSyntax' }],
    },
    {
      code: 'const tpl = \'<div *ngIf="show">hello</div>\';',
      errors: [{ messageId: 'useBlockSyntax' }],
    },
    // Docs/log strings intentionally flagged — we want to catch ALL *ngIf instances
    {
      code: 'const docs = `prefer @if over *ngIf`;',
      errors: [{ messageId: 'useBlockSyntax' }],
    },
    // Multiple directives in one template → multiple errors
    {
      code: 'const tpl = `<div *ngIf="a"><span *ngFor="let b of c"></span></div>`;',
      errors: [
        { messageId: 'useBlockSyntax' },
        { messageId: 'useBlockSyntax' },
      ],
    },
    // Multiline template with two directives across quasis
    {
      code: `const tpl = \`
  <div *ngIf="show">
    <span *ngFor="let x of items">{{ x }}</span>
  </div>
\`;`,
      errors: [
        { messageId: 'useBlockSyntax' },
        { messageId: 'useBlockSyntax' },
      ],
    },
  ],
});
