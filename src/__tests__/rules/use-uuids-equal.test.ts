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
    // Null/undefined comparisons should not be flagged
    'entity.ID === null;',
    'entity.ID !== null;',
    'entity.ID === undefined;',
    'entity.ID !== undefined;',
    'entity.UserID == null;',
    // Numeric comparison — not a UUID
    'entity.ID === 0;',
    // ignorePatterns suppresses specific fields
    {
      code: 'a.WidgetId === b.WidgetId;',
      options: [{ ignorePatterns: ['WidgetId'] }],
    },
  ],
  invalid: [
    // Strict equality with suggestion
    {
      code: "item.ID === targetId;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(item.ID, targetId);" }],
      }],
    },
    {
      code: "item.ID !== excludeId;",
      errors: [{
        messageId: 'useNegatedUUIDsEqual',
        suggestions: [{ messageId: 'suggestNegatedUUIDsEqual', output: "!UUIDsEqual(item.ID, excludeId);" }],
      }],
    },
    {
      code: "record.UserID === userId;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(record.UserID, userId);" }],
      }],
    },
    {
      code: "a.ConversationID === b.ConversationID;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(a.ConversationID, b.ConversationID);" }],
      }],
    },
    // Loose equality — also flagged with suggestion
    {
      code: "a.ID == b.ID;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(a.ID, b.ID);" }],
      }],
    },
    {
      code: "a.ID != b.ID;",
      errors: [{
        messageId: 'useNegatedUUIDsEqual',
        suggestions: [{ messageId: 'suggestNegatedUUIDsEqual', output: "!UUIDsEqual(a.ID, b.ID);" }],
      }],
    },
    // additionalPatterns matches custom fields
    {
      code: "a.recordKey === b.recordKey;",
      options: [{ additionalPatterns: ['Key$'] }],
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(a.recordKey, b.recordKey);" }],
      }],
    },
  ],
});
