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
  ],
  invalid: [
    {
      code: 'const data = { ...promptEntity };',
      errors: [{ messageId: 'useGetAll' }],
    },
    {
      code: 'const data = { ...aiModelEntity, extra: true };',
      errors: [{ messageId: 'useGetAll' }],
    },
  ],
});
