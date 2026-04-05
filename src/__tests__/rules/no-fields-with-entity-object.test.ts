import { createTester } from '../setup';
import rule from '../../rules/no-fields-with-entity-object';

const tester = createTester();

tester.run('no-fields-with-entity-object', rule, {
  valid: [
    // Fields with simple is fine
    `rv.RunView({ EntityName: 'Users', Fields: ['ID', 'Name'], ResultType: 'simple' });`,
    // entity_object without Fields is fine
    `rv.RunView({ EntityName: 'Users', ResultType: 'entity_object' });`,
    // Fields alone without ResultType is fine
    `rv.RunView({ EntityName: 'Users', Fields: ['ID'] });`,
  ],
  invalid: [
    {
      code: `rv.RunView({ EntityName: 'Users', Fields: ['ID', 'Name'], ResultType: 'entity_object' });`,
      errors: [{ messageId: 'fieldsIgnored' }],
    },
  ],
});
