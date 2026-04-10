import { createTester } from '../setup';
import rule from '../../rules/no-promise-all-runview';

const tester = createTester();

tester.run('no-promise-all-runview', rule, {
  valid: [
    // Single RunView in Promise.all — fine
    `const results = await Promise.all([
      rv.RunView({ EntityName: 'Users' }),
      fetchOtherData(),
    ]);`,

    // RunViews (plural) — correct pattern
    `const [users, orders] = await rv.RunViews([
      { EntityName: 'Users' },
      { EntityName: 'Orders' },
    ]);`,

    // No RunView calls at all
    `const results = await Promise.all([fetchA(), fetchB()]);`,

    // Promise.all with no array argument
    `const result = await Promise.all(someArray);`,

    // Test files are ignored by default
    {
      code: `const [a, b] = await Promise.all([
        rv.RunView({ EntityName: 'A' }),
        rv.RunView({ EntityName: 'B' }),
      ]);`,
      filename: 'src/__tests__/providerBase.dedup.test.ts',
    },

    // Single RunView call (no Promise.all)
    `const result = await rv.RunView({ EntityName: 'Users' });`,

    // Zero RunView calls in the array
    `const results = await Promise.all([
      fetch('/api/a'),
      fetch('/api/b'),
    ]);`,
  ],
  invalid: [
    // Two RunView calls via Promise.all
    {
      code: `const [users, orders] = await Promise.all([
        rv.RunView({ EntityName: 'Users' }),
        rv.RunView({ EntityName: 'Orders' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // Three RunView calls
    {
      code: `const results = await Promise.all([
        rv.RunView({ EntityName: 'Users' }),
        rv.RunView({ EntityName: 'Orders' }),
        rv.RunView({ EntityName: 'Products' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // new RunView() per call
    {
      code: `const [a, b] = await Promise.all([
        new RunView().RunView({ EntityName: 'A' }),
        new RunView().RunView({ EntityName: 'B' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // this.rv.RunView pattern
    {
      code: `const [a, b] = await Promise.all([
        this.rv.RunView({ EntityName: 'A' }),
        this.rv.RunView({ EntityName: 'B' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // Promise.allSettled with RunViews
    {
      code: `const results = await Promise.allSettled([
        rv.RunView({ EntityName: 'Users' }),
        rv.RunView({ EntityName: 'Orders' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // Mixed: RunView calls + other calls (still flagged if 2+ RunViews)
    {
      code: `const [users, data, orders] = await Promise.all([
        rv.RunView({ EntityName: 'Users' }),
        fetchSomething(),
        rv.RunView({ EntityName: 'Orders' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
    // Bare RunView function calls
    {
      code: `const [a, b] = await Promise.all([
        RunView({ EntityName: 'A' }),
        RunView({ EntityName: 'B' }),
      ]);`,
      errors: [{ messageId: 'useRunViews' }],
    },
  ],
});
