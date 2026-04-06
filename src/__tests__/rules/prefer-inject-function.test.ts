import { createTester } from '../setup';
import rule from '../../rules/prefer-inject-function';

const tester = createTester();

tester.run('prefer-inject-function', rule, {
  valid: [
    // inject() function is fine
    `@Component({ template: '' })
     class Foo {
       private router = inject(Router);
     }`,
    // No decorator — not an Angular class, skip
    `class Foo {
       constructor(private svc: MyService) {}
     }`,
    // Constructor with no DI params (plain params without accessibility)
    `@Component({ template: '' })
     class Foo {
       constructor(name: string) {}
     }`,
    // No constructor at all
    `@Component({ template: '' })
     class Foo {
       Name = 'test';
     }`,
    // Empty constructor
    `@Component({ template: '' })
     class Foo {
       constructor() { super(); }
     }`,
  ],
  invalid: [
    // Basic constructor injection
    {
      code: `@Component({ template: '' })
             class Foo {
               constructor(private router: Router) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
    // Multiple injected params
    {
      code: `@Component({ template: '' })
             class Foo {
               constructor(private router: Router, private cd: ChangeDetectorRef) {}
             }`,
      errors: [
        { messageId: 'preferInject' },
        { messageId: 'preferInject' },
      ],
    },
    // @Injectable service with injection
    {
      code: `@Injectable()
             class MyService {
               constructor(private http: HttpClient) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
    // @Directive
    {
      code: `@Directive({ selector: '[appFoo]' })
             class FooDirective {
               constructor(private el: ElementRef) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
    // protected injection
    {
      code: `@Component({ template: '' })
             class Foo {
               constructor(protected svc: MyService) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
    // public injection
    {
      code: `@Component({ template: '' })
             class Foo {
               constructor(public svc: MyService) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
    // readonly injection
    {
      code: `@Component({ template: '' })
             class Foo {
               constructor(private readonly svc: MyService) {}
             }`,
      errors: [{ messageId: 'preferInject' }],
    },
  ],
});
