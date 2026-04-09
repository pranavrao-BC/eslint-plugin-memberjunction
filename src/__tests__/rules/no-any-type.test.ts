import { createTester } from '../setup';
import rule from '../../rules/no-any-type';

const tester = createTester();

tester.run('no-any-type', rule, {
  valid: [
    // Proper types are fine
    'const x: string = "hello";',
    'function greet(name: string): void {}',
    'const arr: number[] = [1, 2, 3];',
    'type Foo = { bar: string };',
    'const map = new Map<string, number>();',
    'interface User { id: string; name: string; }',

    // --- System boundary patterns where unknown is correct ---

    // Index signatures
    'interface JwtClaims { [key: string]: unknown; }',
    'type Dict = { [k: string]: unknown };',

    // Generic type arguments
    'const resolver: GraphQLFieldResolver<unknown, AppContext> = () => {};',
    'type Result = Promise<Array<unknown>>;',

    // as unknown as T double-cast
    'const x = req as unknown as Record<string, string>;',

    // as unknown single cast
    'const x = foo as unknown;',

    // as unknown[] — array type inside assertion
    'const rows = data as unknown[];',
    'const items = result as unknown[][];',

    // Function parameters (system boundary input)
    'function handle(input: unknown): string { return String(input); }',
    'const fn = (data: unknown) => {};',

    // Function return types (part of function contract)
    'function parse(): unknown { return null; }',

    // Class method with unknown return type
    'class Foo { get(): unknown { return this.value; } }',

    // Constructor parameter
    'class Foo { constructor(private data: unknown) {} }',

    // Catch clause parameter
    'try {} catch (err: unknown) { console.error(err); }',

    // Function type parameters (type-level bridging)
    'const fn = connector.method as (ci: unknown, u: unknown) => Promise<string[]>;',
    'type Handler = (data: unknown) => void;',

    // Interface method signatures
    'interface Getter { Get(fieldName: string): unknown; }',
    'interface Setter { Set(fieldName: string, value: unknown): void; }',

    // Rest params with unknown arrays
    'function factory(...args: unknown[]): void {}',

    // Constructor type
    'type Ctor = new (...args: unknown[]) => object;',

    // Generic type parameter defaults
    'function load<T = unknown>(id: string): T { return null as T; }',
    'class Store<T = unknown> { items: T[] = []; }',

    // JSON.parse() return — unknown is the correct type for parsed JSON
    'let parsed: unknown = JSON.parse(rawData);',
    'const data: unknown = JSON.parse(response.body);',

    // Interface/type properties — data contract boundaries
    'interface ToolResult { success: boolean; data: unknown; }',
    'type JsonObject = { value: unknown; metadata: string; };',
  ],
  invalid: [
    // Local variable typed unknown — lazy
    {
      code: 'const x: unknown = getData();',
      errors: [{ messageId: 'noLazyUnknown' }],
    },
    // Class property typed unknown — lazy
    {
      code: 'class Foo { data: unknown; }',
      errors: [{ messageId: 'noLazyUnknown' }],
    },
    // Type alias
    {
      code: 'type Anything = unknown;',
      errors: [{ messageId: 'noLazyUnknown' }],
    },
    // let variable
    {
      code: 'let result: unknown;',
      errors: [{ messageId: 'noLazyUnknown' }],
    },
    // Class property (method return is fine, property is not)
    {
      code: 'class Bad { value: unknown; }',
      errors: [{ messageId: 'noLazyUnknown' }],
    },
  ],
});
