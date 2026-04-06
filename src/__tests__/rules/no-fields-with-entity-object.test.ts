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
    // Spread may contain Fields but we can't statically analyze that
    `rv.RunView({ ...baseParams, ResultType: 'entity_object' });`,
    // Variable reference for ResultType — can't resolve, don't flag
    `rv.RunView({ Fields: ['ID'], ResultType: resultTypeVar });`,
  ],
  invalid: [
    {
      code: `rv.RunView({ EntityName: 'Users', Fields: ['ID', 'Name'], ResultType: 'entity_object' });`,
      errors: [{ messageId: 'fieldsIgnored' }],
    },
    // String literal keys
    {
      code: `rv.RunView({ 'EntityName': 'Users', 'Fields': ['ID'], 'ResultType': 'entity_object' });`,
      errors: [{ messageId: 'fieldsIgnored' }],
    },
    // Template literal ResultType value
    {
      code: "rv.RunView({ Fields: ['ID'], ResultType: `entity_object` });",
      errors: [{ messageId: 'fieldsIgnored' }],
    },
  ],
});
