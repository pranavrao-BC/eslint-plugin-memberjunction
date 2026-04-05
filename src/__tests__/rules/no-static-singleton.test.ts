import { createTester } from '../setup';
import rule from '../../rules/no-static-singleton';

const tester = createTester();

tester.run('no-static-singleton', rule, {
  valid: [
    // BaseSingleton pattern is fine
    `class MyService extends BaseSingleton<MyService> {
      protected constructor() { super(); }
      public static get Instance() { return MyService.getInstance<MyService>(); }
    }`,
    // Regular static properties are fine
    'class Foo { static defaultValue = 42; }',
  ],
  invalid: [
    {
      code: 'class MySingleton { private static _instance: MySingleton; }',
      errors: [{ messageId: 'useBaseSingleton' }],
    },
    {
      code: 'class MySingleton { static instance: MySingleton; }',
      errors: [{ messageId: 'useBaseSingleton' }],
    },
    {
      code: 'class Cache { private static _Instance: Cache; }',
      errors: [{ messageId: 'useBaseSingleton' }],
    },
  ],
});
