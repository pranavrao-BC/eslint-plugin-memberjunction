import { createTester } from '../setup';
import rule from '../../rules/runview-check-success';

const tester = createTester();

tester.run('runview-check-success', rule, {
  valid: [
    // .Success checked via if
    `async function f() {
      const result = await rv.RunView({ EntityName: 'Users' });
      if (result.Success) { doStuff(result.Results); }
    }`,
    // .Success checked via negation
    `async function f() {
      const result = await rv.RunView({ EntityName: 'Users' });
      if (!result.Success) throw new Error(result.ErrorMessage);
      doStuff(result.Results);
    }`,
    // Destructuring with Success
    `async function f() {
      const { Success, Results } = await rv.RunView({ EntityName: 'Users' });
      if (Success) { doStuff(Results); }
    }`,
    // Result returned — caller's responsibility
    `async function f() {
      return await rv.RunView({ EntityName: 'Users' });
    }`,
    // Result returned directly (no await variable)
    `async function f() {
      return rv.RunView({ EntityName: 'Users' });
    }`,
    // Result passed to helper function — assume it checks
    `async function f() {
      const result = await rv.RunView({ EntityName: 'Users' });
      handleResult(result);
    }`,
    // Result assigned then .Success accessed later
    `async function f() {
      const result = await rv.RunView({ EntityName: 'Users' });
      log('fetched');
      const ok = result.Success;
      if (ok) { use(result.Results); }
    }`,
    // Destructured from variable later
    `async function f() {
      const result = await rv.RunView({ EntityName: 'Users' });
      const { Success } = result;
      if (Success) { use(result.Results); }
    }`,
    // RunView not the subject (RunViews plural, different method)
    `async function f() {
      const result = await rv.RunViews([{ EntityName: 'Users' }]);
      use(result);
    }`,
  ],
  invalid: [
    // Result discarded — expression statement
    {
      code: `async function f() { await rv.RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'discardedResult' }],
    },
    // Only .Results accessed, no .Success check
    {
      code: `async function f() {
        const result = await rv.RunView({ EntityName: 'Users' });
        processItems(result.Results);
      }`,
      errors: [{ messageId: 'uncheckedSuccess' }],
    },
    // Destructuring without Success
    {
      code: `async function f() {
        const { Results, ErrorMessage } = await rv.RunView({ EntityName: 'Users' });
        doStuff(Results);
      }`,
      errors: [{ messageId: 'uncheckedSuccess' }],
    },
    // Variable assigned but never checked
    {
      code: `async function f() {
        const result = await rv.RunView({ EntityName: 'Users' });
        return result.Results;
      }`,
      errors: [{ messageId: 'uncheckedSuccess' }],
    },
    // Bare RunView function call, result discarded
    {
      code: `async function f() { await RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'discardedResult' }],
    },
  ],
});
