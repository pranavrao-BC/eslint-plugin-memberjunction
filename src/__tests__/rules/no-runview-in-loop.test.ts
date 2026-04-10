import { createTester } from '../setup';
import rule from '../../rules/no-runview-in-loop';

const tester = createTester();

tester.run('no-runview-in-loop', rule, {
  valid: [
    // RunView outside a loop is fine
    `const result = await rv.RunView({ EntityName: 'Users' });`,
    // RunViews (plural) inside a loop is fine — it's the batched alternative
    `for (const id of ids) { await rv.RunViews([{ EntityName: 'Users' }]); }`,
    // RunView before the loop, result used inside
    `
      const result = await rv.RunView({ EntityName: 'Users' });
      for (const item of result.Results) { process(item); }
    `,
    // Standalone async function containing RunView (not inside a loop body)
    `
      async function loadUser(id: string) {
        return await rv.RunView({ EntityName: 'Users', ExtraFilter: 'ID=' + id });
      }
    `,
    // RunView in a non-loop callback (e.g., event handler)
    `button.addEventListener('click', async () => { await rv.RunView({ EntityName: 'Users' }); });`,
    // Named function with RunView called from a loop — function boundary stops the walk
    `
      async function loadUser(id: string) {
        return await rv.RunView({ EntityName: 'Users' });
      }
      for (const id of ids) { await loadUser(id); }
    `,
  ],
  invalid: [
    // for loop
    {
      code: `for (let i = 0; i < ids.length; i++) { await rv.RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // for...of
    {
      code: `for (const id of ids) { await rv.RunView({ EntityName: 'Users', ExtraFilter: id }); }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // for...in
    {
      code: `for (const key in obj) { await rv.RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // while
    {
      code: `while (hasMore) { const r = await rv.RunView({ EntityName: 'Users' }); hasMore = false; }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // do...while
    {
      code: `do { await rv.RunView({ EntityName: 'Users' }); } while (retry);`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .forEach
    {
      code: `ids.forEach(async (id) => { await rv.RunView({ EntityName: 'Users' }); });`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .map
    {
      code: `const results = ids.map(async (id) => rv.RunView({ EntityName: 'Users' }));`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .filter
    {
      code: `ids.filter(async (id) => { const r = await rv.RunView({ EntityName: 'Users' }); return r.Success; });`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .some
    {
      code: `ids.some(async (id) => { const r = await rv.RunView({ EntityName: 'Users' }); return r.Success; });`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .find
    {
      code: `ids.find(async (id) => { const r = await rv.RunView({ EntityName: 'Users' }); return r.Success; });`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // .reduce
    {
      code: `ids.reduce(async (acc, id) => { await rv.RunView({ EntityName: 'Users' }); return acc; }, []);`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // Promise.all with .map — still a loop pattern
    {
      code: `await Promise.all(ids.map(async (id) => rv.RunView({ EntityName: 'Users' })));`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // Bare RunView function call in loop
    {
      code: `for (const id of ids) { await RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // this.rv.RunView in loop
    {
      code: `for (const id of ids) { await this.rv.RunView({ EntityName: 'Users' }); }`,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
    // Nested loop — one error per RunView call
    {
      code: `
        for (const a of listA) {
          for (const b of listB) {
            await rv.RunView({ EntityName: 'Users' });
          }
        }
      `,
      errors: [{ messageId: 'noRunViewInLoop' }],
    },
  ],
});
