import { createTester } from '../setup';
import rule from '../../rules/entity-save-check-result';

const tester = createTester();

tester.run('entity-save-check-result', rule, {
  valid: [
    // Result checked in if condition
    `async function f() {
      if (await entity.Save()) { success(); } else { fail(); }
    }`,
    // Result assigned to variable (assumed checked)
    `async function f() {
      const saved = await entity.Save();
      if (!saved) throw new Error('Save failed');
    }`,
    // Result used in logical expression
    `async function f() {
      const ok = await entity.Save() && await entity2.Save();
    }`,
    // Result returned (caller's responsibility)
    `async function f() {
      return await entity.Save();
    }`,
    // Result returned directly
    `async function f() {
      return entity.Save();
    }`,
    // Load result checked
    `async function f() {
      if (await entity.Load(id)) { process(entity); }
    }`,
    // Load result assigned
    `async function f() {
      const loaded = await entity.Load(id);
      if (!loaded) return null;
    }`,
    // Result used in ternary
    `async function f() {
      const msg = await entity.Save() ? 'ok' : 'fail';
    }`,
    // Delete result checked
    `async function f() {
      if (await entity.Delete()) { success(); }
    }`,
    // Delete result assigned
    `async function f() {
      const deleted = await entity.Delete();
      if (!deleted) throw new Error('Delete failed');
    }`,
    // Not a member expression Save
    `async function f() {
      await Save();
    }`,
    // TransactionGroup — Save/Delete in a transaction group; individual returns are meaningless
    `async function f() {
      entity.TransactionGroup = tg;
      await entity.Save();
    }`,
    // TransactionGroup — Delete in a transaction group
    `async function f() {
      entity.TransactionGroup = tg;
      await entity.Delete();
    }`,
    // TransactionGroup — assignment on this.entity
    `async function f() {
      this.entity.TransactionGroup = tg;
      await this.entity.Save();
    }`,
    // Negated in if
    `async function f() {
      if (!(await entity.Save())) { handleError(); }
    }`,
  ],
  invalid: [
    // Bare expression statement — Save result discarded
    {
      code: `async function f() { await entity.Save(); }`,
      errors: [{ messageId: 'uncheckedSave' }],
    },
    // Bare Load — result discarded
    {
      code: `async function f() { await entity.Load(id); }`,
      errors: [{ messageId: 'uncheckedLoad' }],
    },
    // Save without await — still discarded
    {
      code: `function f() { entity.Save(); }`,
      errors: [{ messageId: 'uncheckedSave' }],
    },
    // Multiple unchecked saves
    {
      code: `async function f() {
        await entity.Save();
        await entity2.Save();
      }`,
      errors: [
        { messageId: 'uncheckedSave' },
        { messageId: 'uncheckedSave' },
      ],
    },
    // this.entity.Save() unchecked
    {
      code: `async function f() { await this.entity.Save(); }`,
      errors: [{ messageId: 'uncheckedSave' }],
    },
    // Load inside a block but still bare expression
    {
      code: `async function f() {
        for (const e of entities) {
          await e.Load(e.ID);
        }
      }`,
      errors: [{ messageId: 'uncheckedLoad' }],
    },
    // Delete result discarded
    {
      code: `async function f() { await entity.Delete(); }`,
      errors: [{ messageId: 'uncheckedDelete' }],
    },
    // Delete without await
    {
      code: `function f() { entity.Delete(); }`,
      errors: [{ messageId: 'uncheckedDelete' }],
    },
  ],
});
