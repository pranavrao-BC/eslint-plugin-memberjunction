import { createTester } from '../setup';
import rule from '../../rules/no-ng-on-changes';

const tester = createTester();

tester.run('no-ng-on-changes', rule, {
  valid: [
    // Normal methods are fine
    'class Foo { ngOnInit() {} }',
    'class Foo { ngOnDestroy() {} }',
    // Setter pattern is fine
    `class Foo {
      set myInput(val: string) { this._myInput = val; }
    }`,
  ],
  invalid: [
    {
      code: 'class Foo { ngOnChanges(changes: any) {} }',
      errors: [{ messageId: 'noOnChanges' }],
    },
    {
      code: 'class Foo { ngDoCheck() {} }',
      errors: [{ messageId: 'noDoCheck' }],
    },
  ],
});
