import { createTester } from '../setup';
import rule from '../../rules/for-requires-track';

const tester = createTester();

tester.run('for-requires-track', rule, {
  valid: [
    // @for with track expression
    'const tpl = `@for (item of items; track item.id) { <div /> }`;',
    // @for with track $index
    'const tpl = `@for (item of items; track $index) { <div /> }`;',
    // No @for at all
    'const tpl = `@if (show) { <div /> }`;',
    // Regular for loop in code (not @for template syntax)
    'for (const item of items) { process(item); }',
    // String that mentions @for but isn't template syntax
    'const docs = "Use @for with track for performance";',
  ],
  invalid: [
    // @for without track
    {
      code: 'const tpl = `@for (item of items) { <div /> }`;',
      errors: [{ messageId: 'missingTrack' }],
    },
    // @for with let syntax but no track
    {
      code: 'const tpl = `@for (let item of items) { <div>{{ item }}</div> }`;',
      errors: [{ messageId: 'missingTrack' }],
    },
    // String literal template
    {
      code: "const tpl = '@for (item of items) { <div /> }';",
      errors: [{ messageId: 'missingTrack' }],
    },
    // Multiple @for blocks, one missing track
    {
      code: 'const tpl = `@for (a of listA; track a.id) { } @for (b of listB) { }`;',
      errors: [{ messageId: 'missingTrack' }],
    },
    // Both @for blocks missing track
    {
      code: 'const tpl = `@for (a of listA) { } @for (b of listB) { }`;',
      errors: [
        { messageId: 'missingTrack' },
        { messageId: 'missingTrack' },
      ],
    },
    // Multiline template
    {
      code: `const tpl = \`
        @for (item of items) {
          <div>{{ item.name }}</div>
        }
      \`;`,
      errors: [{ messageId: 'missingTrack' }],
    },
  ],
});
