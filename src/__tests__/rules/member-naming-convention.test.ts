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
  ],
});
