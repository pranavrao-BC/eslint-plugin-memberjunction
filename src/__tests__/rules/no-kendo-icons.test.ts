import { createTester } from '../setup';
import rule from '../../rules/no-kendo-icons';

const tester = createTester();

tester.run('no-kendo-icons', rule, {
  valid: [
    // Font Awesome is fine
    'const icon = "fa-solid fa-times";',
    'const cls = `fa-solid fa-${name}`;',
    // Non-icon strings are fine
    'const key = "k-value";',
    'const data = "ok-icon-like-but-not";',
  ],
  invalid: [
    {
      code: 'const icon = "k-icon k-i-close";',
      errors: [{ messageId: 'useFA' }],
    },
    {
      code: 'const cls = "k-i-search";',
      errors: [{ messageId: 'useFA' }],
    },
    {
      code: 'const tpl = `<span class="k-icon k-i-gear"></span>`;',
      errors: [{ messageId: 'useFA' }],
    },
    // Class field with Kendo icon — exactly 1 error (no double-report)
    {
      code: 'class Foo { template = "k-icon k-i-close"; }',
      errors: [{ messageId: 'useFA' }],
    },
    // Decorator object property — caught by Literal handler
    {
      code: `
        class Foo {
          render() { return '<span class="k-icon k-i-gear"></span>'; }
        }
      `,
      errors: [{ messageId: 'useFA' }],
    },
  ],
});
