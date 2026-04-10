import { createTester } from '../setup';
import rule from '../../rules/prefer-simple-result-type';

const tester = createTester();

tester.run('prefer-simple-result-type', rule, {
  valid: [
    // entity_object with .Save() — justified
    `async function update() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      for (const user of result.Results) {
        user.Status = 'active';
        await user.Save();
      }
    }`,

    // entity_object with .Delete() — justified
    `async function cleanup() {
      const result = await rv.RunView({
        EntityName: 'Logs',
        ResultType: 'entity_object',
      });
      for (const log of result.Results) {
        await log.Delete();
      }
    }`,

    // entity_object with .Load() — justified
    `async function reload() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      await result.Results[0].Load();
    }`,

    // entity_object with .Validate() — justified
    `async function check() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      const valid = result.Results[0].Validate();
    }`,

    // ResultType: 'simple' — already correct
    `async function read() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'simple',
      });
      const names = result.Results.map(r => r.Name);
    }`,

    // No ResultType specified — default behavior, don't flag
    `async function read() {
      const result = await rv.RunView({ EntityName: 'Users' });
    }`,

    // Result is returned — mutation may happen in caller
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      return result;
    }`,

    // Result is passed to another function — mutation may happen there
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      processEntities(result);
    }`,

    // Result assigned to a property (escapes scope)
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      this.users = result;
    }`,

    // result.Results returned (entity objects escape)
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      return result.Results || [];
    }`,

    // result.Results[0] returned
    `async function loadOne() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      if (!result.Success) return null;
      return result.Results[0];
    }`,

    // result.Results passed to a function
    `async function process() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      handleEntities(result.Results);
    }`,

    // result assigned to this.property via Results
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      this.entities = result.Results;
    }`,

    // result.Results.map stored on this — conservative escape
    `async function load() {
      const result = await this.rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      this.names = result.Results.map(r => r.Name);
    }`,

    // Entities escape via for-of loop + Map.set — mutation may happen elsewhere
    `async function loadEntities() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      for (const item of result.Results) {
        this.cache.set(item.ID, item);
      }
    }`,

    // Entities escape via for-of loop + function call
    `async function loadEntities() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      for (const item of result.Results) {
        processEntity(item);
      }
    }`,
  ],
  invalid: [
    // Read-only: just mapping over results
    {
      code: `async function getNames() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        const names = result.Results.map(r => r.Name);
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: just accessing .length
    {
      code: `async function count() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        console.log(result.Results.length);
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: extracting IDs
    {
      code: `async function getIds() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        const ids = result.Results.map(r => r.ID);
        return ids;
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: filtering
    {
      code: `async function getActive() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        const active = result.Results.filter(r => r.Status === 'active');
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: forEach without mutation
    {
      code: `async function display() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        result.Results.forEach(r => console.log(r.Name));
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
  ],
});
