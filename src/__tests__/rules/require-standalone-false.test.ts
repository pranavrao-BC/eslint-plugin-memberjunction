import { createTester } from '../setup';
import rule from '../../rules/require-standalone-false';

const tester = createTester();

tester.run('require-standalone-false', rule, {
  valid: [
    // Standalone component — explicit true
    `@Component({ standalone: true, selector: 'app-root', template: '' })
     class AppComponent {}`,
    // Module-declared component — explicit false
    `@Component({ standalone: false, selector: 'app-list', template: '' })
     class ListComponent {}`,
    // Directive with standalone: true
    `@Directive({ standalone: true, selector: '[appHighlight]' })
     class HighlightDirective {}`,
    // Directive with standalone: false
    `@Directive({ standalone: false, selector: '[appTooltip]' })
     class TooltipDirective {}`,
    // Pipe with standalone: true
    `@Pipe({ standalone: true, name: 'format' })
     class FormatPipe {}`,
    // Pipe with standalone: false
    `@Pipe({ standalone: false, name: 'truncate' })
     class TruncatePipe {}`,
    // Non-component decorators are fine without standalone
    `@Injectable({ providedIn: 'root' })
     class UserService {}`,
    // No decorator at all
    'class PlainClass {}',
    // Decorator without call expression (bare)
    `@Component
     class BareComponent {}`,
  ],
  invalid: [
    // Component missing standalone
    {
      code: `@Component({ selector: 'app-foo', template: '<p>hi</p>' })
             class FooComponent {}`,
      errors: [{
        messageId: 'requireStandaloneFalse',
        suggestions: [{
          messageId: 'suggestAddStandaloneFalse',
          output: `@Component({ standalone: false, selector: 'app-foo', template: '<p>hi</p>' })
             class FooComponent {}`,
        }],
      }],
    },
    // Directive missing standalone
    {
      code: `@Directive({ selector: '[appFoo]' })
             class FooDirective {}`,
      errors: [{
        messageId: 'requireStandaloneFalse',
        suggestions: [{
          messageId: 'suggestAddStandaloneFalse',
          output: `@Directive({ standalone: false, selector: '[appFoo]' })
             class FooDirective {}`,
        }],
      }],
    },
    // Pipe missing standalone
    {
      code: `@Pipe({ name: 'myPipe' })
             class MyPipe {}`,
      errors: [{
        messageId: 'requireStandaloneFalse',
        suggestions: [{
          messageId: 'suggestAddStandaloneFalse',
          output: `@Pipe({ standalone: false, name: 'myPipe' })
             class MyPipe {}`,
        }],
      }],
    },
    // Component with other properties but no standalone
    {
      code: `@Component({
               selector: 'app-bar',
               templateUrl: './bar.html',
               styleUrls: ['./bar.css']
             })
             class BarComponent {}`,
      errors: [{
        messageId: 'requireStandaloneFalse',
        suggestions: [{
          messageId: 'suggestAddStandaloneFalse',
          output: `@Component({
               standalone: false, selector: 'app-bar',
               templateUrl: './bar.html',
               styleUrls: ['./bar.css']
             })
             class BarComponent {}`,
        }],
      }],
    },
    // Empty config object
    {
      code: `@Component({})
             class EmptyComponent {}`,
      errors: [{
        messageId: 'requireStandaloneFalse',
        suggestions: [{
          messageId: 'suggestAddStandaloneFalse',
          output: `@Component({ standalone: false })
             class EmptyComponent {}`,
        }],
      }],
    },
  ],
});
