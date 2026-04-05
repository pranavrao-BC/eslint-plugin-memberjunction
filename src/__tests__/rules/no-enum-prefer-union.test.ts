import { createTester } from '../setup';
import rule from '../../rules/no-enum-prefer-union';

const tester = createTester();

tester.run('no-enum-prefer-union', rule, {
  valid: [
    // Union types are fine
    "type Status = 'active' | 'inactive';",
    "type Direction = 'up' | 'down' | 'left' | 'right';",
    // Const objects are fine
    "const Status = { Active: 'active', Inactive: 'inactive' } as const;",
  ],
  invalid: [
    {
      code: "enum Status { Active, Inactive }",
      errors: [{ messageId: 'preferUnion' }],
    },
    {
      code: "enum Direction { Up = 'UP', Down = 'DOWN' }",
      errors: [{ messageId: 'preferUnion' }],
    },
    {
      code: "const enum HttpMethod { Get, Post }",
      errors: [{ messageId: 'preferUnion' }],
    },
    {
      code: "export enum Color { Red = 0, Green = 1, Blue = 2 }",
      errors: [{ messageId: 'preferUnion' }],
    },
  ],
});
