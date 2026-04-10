import { createTester } from '../setup';
import rule from '../../rules/no-direct-entity-new';

const tester = createTester();

tester.run('no-direct-entity-new', rule, {
  valid: [
    // Non-entity classes are fine
    'const e = new Error("oops");',
    'const m = new Map();',
    'const d = new Date();',
    'new SomeService();',
    'new UserManager();',
    // Factory pattern is fine
    "const entity = await md.GetEntityObject<UserEntity>('Users');",
    // allowedClassNames suppresses
    {
      code: 'new MockEntity();',
      options: [{ allowedClassNames: ['MockEntity'] }],
    },
    {
      code: 'new TestUserEntity();',
      options: [{ allowedClassNames: ['TestUserEntity', 'MockEntity'] }],
    },
    // Test files are ignored by default
    {
      code: 'new UserEntity();',
      filename: 'packages/MJCore/src/__tests__/baseEntity.test.ts',
    },
    {
      code: 'new MJAPIKeyEntity({ ID: "key-id" });',
      filename: 'packages/APIKeys/Engine/src/APIKeyEngine.spec.ts',
    },
    // Explicit ignoreTestFiles: true
    {
      code: 'new UserEntity();',
      filename: 'some.test.ts',
      options: [{ ignoreTestFiles: true }],
    },
  ],
  invalid: [
    // Direct entity instantiation
    {
      code: 'const user = new UserEntity();',
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{
          messageId: 'suggestFactory',
          output: "const user = await md.GetEntityObject<UserEntity>('User');",
        }],
      }],
    },
    // BaseEntity
    {
      code: 'const base = new BaseEntity();',
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{
          messageId: 'suggestFactory',
          output: "const base = await md.GetEntityObject<BaseEntity>('Base');",
        }],
      }],
    },
    // Namespace access
    {
      code: 'const model = new MJ.AIModelEntity();',
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{
          messageId: 'suggestFactory',
          output: "const model = await md.GetEntityObject<AIModelEntity>('AIModel');",
        }],
      }],
    },
    // With constructor arguments (still flagged)
    {
      code: "new PromptEntity('arg1', 'arg2');",
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{
          messageId: 'suggestFactory',
          output: "await md.GetEntityObject<PromptEntity>('Prompt');",
        }],
      }],
    },
    // In assignment
    {
      code: 'let e: any; e = new ConversationEntity();',
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{
          messageId: 'suggestFactory',
          output: "let e: any; e = await md.GetEntityObject<ConversationEntity>('Conversation');",
        }],
      }],
    },
    // allowedClassNames doesn't suppress other entities
    {
      code: 'new UserEntity();',
      options: [{ allowedClassNames: ['MockEntity'] }],
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{ messageId: 'suggestFactory', output: "await md.GetEntityObject<UserEntity>('User');" }],
      }],
    },
    // ignoreTestFiles: false still flags in test files
    {
      code: 'new UserEntity();',
      filename: 'src/__tests__/foo.test.ts',
      options: [{ ignoreTestFiles: false }],
      errors: [{
        messageId: 'noDirectNew',
        suggestions: [{ messageId: 'suggestFactory', output: "await md.GetEntityObject<UserEntity>('User');" }],
      }],
    },
  ],
});
