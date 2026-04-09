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
    // String literal comparisons — case is known at write-time
    "entity.ResourceRecordID === 'DataExplorer';",
    "agentSpec.ID === '';",
    "stepSpec.PromptID !== '';",
    "entity.UserID === '550e8400-e29b-41d4-a716-446655440000';",

    // NormalizeUUID() already applied — already case-safe
    'NormalizeUUID(row.TagAID) === normalizedTagID;',
    'normalizedUserID === NormalizeUUID(perm.UserID);',

    // Lowercase Id fields are NOT UUIDs — these are UI state (tabId, logId, etc.)
    'expandedLogId === logId;',
    'activeTab.resourceRecordId === item.recordId;',
    'wsTab.id === snapshot.tabId;',
    'a.listId === b.listId;',
  ],
  invalid: [
    // Uppercase ID fields — these are MJ entity UUID fields
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
    // Loose equality — also flagged
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
    // EntityID pattern
    {
      code: "a.EntityID === b.EntityID;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(a.EntityID, b.EntityID);" }],
      }],
    },
    // Standalone ID
    {
      code: "ID === otherID;",
      errors: [{
        messageId: 'useUUIDsEqual',
        suggestions: [{ messageId: 'suggestUUIDsEqual', output: "UUIDsEqual(ID, otherID);" }],
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
