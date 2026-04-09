import { createTester } from '../setup';
import rule from '../../rules/member-naming-convention';

const tester = createTester();

tester.run('member-naming-convention', rule, {
  valid: [
    // PascalCase public is fine
    'class Foo { public Name: string = ""; }',
    'class Foo { public LoadData() {} }',
    // camelCase private is fine
    'class Foo { private name: string = ""; }',
    // Protected is not checked (too many false positives from base class overrides)
    'class Foo { protected BuildQuery() {} }',
    'class Foo { protected buildQuery() {} }',
    // Underscore-prefixed private is fine (skipped)
    'class Foo { private _internal = 0; }',
    // Angular lifecycle hooks are fine (framework methods)
    'class Foo { ngOnInit() {} }',
    'class Foo { ngOnDestroy() {} }',
    // Constructors are fine
    'class Foo { constructor() {} }',
    // Static members are fine (different convention)
    'class Foo { static myStatic = 0; }',
    // UPPER_SNAKE_CASE constants are fine regardless of visibility
    'class Foo { private MAX_RETRIES = 3; }',
    'class Foo { public LARGE_BINARY_THRESHOLD = 1024; }',
    // Override methods are fine — name dictated by parent
    'class Bar extends Foo { override InternalRunAction() {} }',
    // Excluded paths are skipped entirely
    {
      code: 'class Foo { public run() {} }',
      options: [{ excludePaths: ['AICLI/'] }],
      filename: 'packages/AI/AICLI/src/commands/run.ts',
    },
    {
      code: 'class Foo { public executeAgent() {} }',
      options: [{ excludePaths: ['A2AServer/', 'React/'] }],
      filename: 'packages/AI/A2AServer/src/AgentOps.ts',
    },
    // PascalCase public getters and setters
    'class Foo { get Name() { return ""; } }',
    'class Foo { set Name(v: string) {} }',
    'class Foo { public get FirstName() { return ""; } }',
    'class Foo { public set FirstName(v: string) {} }',
    // Underscore-prefixed private getter (skipped)
    'class Foo { private get _data() { return 0; } }',
    // Computed property keys (skipped — getMemberName returns null)
    'class Foo { [Symbol.iterator]() {} }',
    'class Foo { ["complex"]() {} }',
    // RxJS observable $ suffix is allowed
    'class Foo { public DataChange$: Observable<any> = new Subject(); }',
    'class Foo { public TransactionNotifications$: Subject<string> = new Subject(); }',
  ],
  invalid: [
    {
      code: 'class Foo { public name: string = ""; }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    {
      code: 'class Foo { public loadData() {} }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    {
      code: 'class Foo { private Name: string = ""; }',
      errors: [{ messageId: 'privateShouldBeCamel' }],
    },
    {
      code: 'class Foo { private RunAction() {} }',
      errors: [{ messageId: 'privateShouldBeCamel' }],
    },
    // Non-excluded path still flags
    {
      code: 'class Foo { public loadData() {} }',
      options: [{ excludePaths: ['AICLI/'] }],
      filename: 'packages/MJCore/src/thing.ts',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    // camelCase public getter → flagged
    {
      code: 'class Foo { get name() { return ""; } }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    // camelCase public setter → flagged
    {
      code: 'class Foo { set name(v: string) {} }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    // Explicit public camelCase getter
    {
      code: 'class Foo { public get firstName() { return ""; } }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
    // Explicit public camelCase setter
    {
      code: 'class Foo { public set firstName(v: string) {} }',
      errors: [{ messageId: 'publicShouldBePascal' }],
    },
  ],
});
