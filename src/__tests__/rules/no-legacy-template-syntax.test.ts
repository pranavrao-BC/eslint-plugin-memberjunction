import { createTester } from '../setup';
import rule from '../../rules/no-legacy-template-syntax';

const tester = createTester();

tester.run('no-legacy-template-syntax', rule, {
  valid: [
    // Modern block syntax is fine
    'const tpl = `@if (condition) { <div>Content</div> }`;',
    'const tpl = `@for (item of items; track item.id) { <div /> }`;',
    // Non-template strings are fine
    'const name = "ngIf is a directive name";',
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
  ],
});
