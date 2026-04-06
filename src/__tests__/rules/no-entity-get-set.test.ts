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
    // Lowercase get/set (Map, FormGroup, etc.) — not matched
    "map.get('key');",
    "headers.set('Content-Type', 'json');",
    // allowedReceivers suppresses the report
    {
      code: "cache.Get('key');",
      options: [{ allowedReceivers: ['cache'] }],
    },
    {
      code: "registry.Get('service');",
      options: [{ allowedReceivers: ['registry', 'cache'] }],
    },
  ],
  invalid: [
    // Entity in receiver chain → high confidence, with suggestion
    {
      code: "userEntity.Get('Name');",
      errors: [{
        messageId: 'noGet',
        suggestions: [{ messageId: 'suggestProperty', output: "userEntity.Name;" }],
      }],
    },
    {
      code: "userEntity.Set('Name', value);",
      errors: [{
        messageId: 'noSet',
        suggestions: [{ messageId: 'suggestAssignment', output: "userEntity.Name = value;" }],
      }],
    },
    {
      code: "this.entity.Get('Status');",
      errors: [{
        messageId: 'noGet',
        suggestions: [{ messageId: 'suggestProperty', output: "this.entity.Status;" }],
      }],
    },
    {
      code: "this.promptEntity.Set('Content', val);",
      errors: [{
        messageId: 'noSet',
        suggestions: [{ messageId: 'suggestAssignment', output: "this.promptEntity.Content = val;" }],
      }],
    },
    // No entity hint in receiver → lower confidence (probable), still has suggestions
    {
      code: "const val = record.Get('FieldName');",
      errors: [{
        messageId: 'probableGet',
        suggestions: [{ messageId: 'suggestProperty', output: "const val = record.FieldName;" }],
      }],
    },
    {
      code: "record.Set('FieldName', value);",
      errors: [{
        messageId: 'probableSet',
        suggestions: [{ messageId: 'suggestAssignment', output: "record.FieldName = value;" }],
      }],
    },
    // allowedReceivers doesn't suppress a different receiver
    {
      code: "record.Get('Name');",
      options: [{ allowedReceivers: ['cache'] }],
      errors: [{
        messageId: 'probableGet',
        suggestions: [{ messageId: 'suggestProperty', output: "record.Name;" }],
      }],
    },
  ],
});
