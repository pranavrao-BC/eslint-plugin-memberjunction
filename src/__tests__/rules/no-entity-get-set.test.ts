import { createTester } from '../setup';
import rule from '../../rules/no-entity-get-set';

const tester = createTester();

tester.run('no-entity-get-set', rule, {
  valid: [
    // Direct property access is fine
    'const name = entity.Name;',
    // Non-string arg is fine
    'record.Get(someVariable);',
    // Method on non-entity objects with different signatures
    'map.Get(123);',
    // Not Get/Set
    'entity.Load("something");',
  ],
  invalid: [
    {
      code: "const val = record.Get('FieldName');",
      errors: [{ messageId: 'noGet' }],
    },
    {
      code: "record.Set('FieldName', value);",
      errors: [{ messageId: 'noSet' }],
    },
    {
      code: "this.entity.Get('Status');",
      errors: [{ messageId: 'noGet' }],
    },
  ],
});
