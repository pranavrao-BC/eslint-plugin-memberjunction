import { createTester } from '../setup';
import rule from '../../rules/no-entity-spread';

const tester = createTester();

tester.run('no-entity-spread', rule, {
  valid: [
    // Spreading non-entity objects is fine
    'const merged = { ...options, extra: true };',
    'const copy = { ...data };',
    // Using GetAll is fine
    'const plain = { ...userEntity.GetAll() };',
    // MemberExpression where property doesn't end with Entity
    'const copy = { ...this.config };',
    'const copy = { ...foo.data };',
  ],
  invalid: [
    // Identifier name ends with Entity, with suggestion
    {
      code: 'const data = { ...promptEntity };',
      errors: [{
        messageId: 'useGetAll',
        suggestions: [{ messageId: 'suggestGetAll', output: 'const data = { ...promptEntity.GetAll() };' }],
      }],
    },
    {
      code: 'const data = { ...aiModelEntity, extra: true };',
      errors: [{
        messageId: 'useGetAll',
        suggestions: [{ messageId: 'suggestGetAll', output: 'const data = { ...aiModelEntity.GetAll(), extra: true };' }],
      }],
    },
    // MemberExpression: this.xyzEntity
    {
      code: 'const copy = { ...this.userEntity };',
      errors: [{
        messageId: 'useGetAll',
        suggestions: [{ messageId: 'suggestGetAll', output: 'const copy = { ...this.userEntity.GetAll() };' }],
      }],
    },
    // MemberExpression: obj.xyzEntity
    {
      code: 'const copy = { ...foo.barEntity };',
      errors: [{
        messageId: 'useGetAll',
        suggestions: [{ messageId: 'suggestGetAll', output: 'const copy = { ...foo.barEntity.GetAll() };' }],
      }],
    },
    // Type annotation on variable resolves to Entity
    {
      code: 'const record: UserEntity = getUser(); const copy = { ...record };',
      errors: [{
        messageId: 'useGetAll',
        suggestions: [{ messageId: 'suggestGetAll', output: 'const record: UserEntity = getUser(); const copy = { ...record.GetAll() };' }],
      }],
    },
  ],
});
