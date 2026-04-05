import { createTester } from '../setup';
import rule from '../../rules/use-uuids-equal';

const tester = createTester();

tester.run('use-uuids-equal', rule, {
  valid: [
    // UUIDsEqual is correct
    'UUIDsEqual(a.ID, b.ID);',
    // Non-ID comparisons are fine
    "name === 'hello';",
    'count === 5;',
    "status !== 'active';",
  ],
  invalid: [
    {
      code: "item.ID === targetId;",
      errors: [{ messageId: 'useUUIDsEqual' }],
    },
    {
      code: "item.ID !== excludeId;",
      errors: [{ messageId: 'useNegatedUUIDsEqual' }],
    },
    {
      code: "record.UserID === userId;",
      errors: [{ messageId: 'useUUIDsEqual' }],
    },
    {
      code: "a.ConversationID === b.ConversationID;",
      errors: [{ messageId: 'useUUIDsEqual' }],
    },
  ],
});
