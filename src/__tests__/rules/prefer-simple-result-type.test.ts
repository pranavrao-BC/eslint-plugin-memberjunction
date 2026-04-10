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

    // --- Suppress: entity escapes (can't prove no downstream mutation) ---

    // Result returned
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      return result;
    }`,

    // Result passed to another function
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      processEntities(result);
    }`,

    // Result assigned to a property
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      this.users = result;
    }`,

    // result.Results returned
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      return result.Results || [];
    }`,

    // result.Results[0] returned (entity escapes)
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

    // result.Results assigned to this.property
    `async function load() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      this.entities = result.Results;
    }`,

    // --- Suppress: for-of binds entities to variable (can't verify safe) ---

    // Entities escape via for-of loop + Map.set
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

    // for-of → Map.set → return (bug report pattern)
    `async function loadVersions(rv, contextUser) {
      const versionsResult = await rv.RunView({
        EntityName: 'Some Entity',
        ResultType: 'entity_object',
      }, contextUser);
      const versionMap = new Map();
      for (const v of versionsResult.Results) {
        versionMap.set(v.ID, v);
      }
      return versionMap;
    }`,

    // for-of variable returned directly
    `async function loadFirst(rv) {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      for (const item of result.Results) {
        if (item.Status === 'active') return item;
      }
      return null;
    }`,

    // for-of + property assignment escape
    `async function loadEntities(rv) {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      for (const item of result.Results || []) {
        this.items.push(item);
      }
    }`,

    // --- Suppress: can't determine variable name ---

    // Destructured result — Results bound to variable
    `async function load() {
      const { Results } = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      return Results;
    }`,

    // --- Suppress: for-of read-only (entities bound to variable, can't verify) ---

    `async function getNames(rv) {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      const names = [];
      for (const item of result.Results) {
        names.push(item.Name);
      }
      return names;
    }`,

    // --- Suppress: mutation on unrelated entity in same function ---
    // (hasMutationCall is broad — any .Save() suppresses even if unrelated)

    `async function mixed() {
      const result = await rv.RunView({
        EntityName: 'Users',
        ResultType: 'entity_object',
      });
      const names = result.Results.map(r => r.Name);
      await otherEntity.Save();
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
    // Read-only: extracting IDs via map
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
    // Read-only: result.Results.map assigned to this (map returns derived values, not entities)
    {
      code: `async function load() {
        const result = await this.rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        this.names = result.Results.map(r => r.Name);
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: only metadata + length
    {
      code: `async function check() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        if (result.Success) {
          console.log(result.Results.length);
        }
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
    // Read-only: result.Results[0].Field (property read on indexed element)
    {
      code: `async function getFirst() {
        const result = await rv.RunView({
          EntityName: 'Users',
          ResultType: 'entity_object',
        });
        if (result.Results.length > 0) {
          console.log(result.Results[0].Name);
        }
      }`,
      errors: [{ messageId: 'preferSimple' }],
    },
  ],
});
