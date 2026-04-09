import { createTester } from '../setup';
import rule from '../../rules/no-global-provider-on-server';

const tester = createTester();

tester.run('no-global-provider-on-server', rule, {
  valid: [
    // --- RunView with provider ---
    'new RunView(provider);',
    'const rv = new RunView(provider as IRunViewProvider);',
    'const rv = new RunView(ctx.provider);',

    // --- Metadata.Provider / RunView.Provider assignment (initialization) ---
    'Metadata.Provider = new SQLProvider();',
    'RunView.Provider = new RunViewProvider();',
    'Metadata.Provider ??= fallbackProvider;',

    // --- Non-Provider static members are fine ---
    'const name = Metadata.name;',
    'const x = RunView.prototype;',
    'Metadata.SomethingElse;',

    // --- GetEntityObject with provider (3+ args) ---
    'md.GetEntityObject("Foo", user, provider);',
    'this.md.GetEntityObject("Foo", user, ctx.provider);',
    'metadata.GetEntityObject("Entity", contextUser, params.provider);',

    // --- Other methods not checked ---
    'md.SomeOtherMethod();',
    'md.GetEntity("Foo");',

    // --- Other class constructors not checked ---
    'new SomeOtherClass();',
    'new Metadata();',
  ],
  invalid: [
    // --- new RunView() with no args ---
    {
      code: 'new RunView();',
      errors: [{ messageId: 'noProviderRunView' }],
    },
    {
      code: 'const rv = new RunView();',
      errors: [{ messageId: 'noProviderRunView' }],
    },

    // --- Reading Metadata.Provider ---
    {
      code: 'const p = Metadata.Provider;',
      errors: [{ messageId: 'noGlobalProviderAccess' }],
    },
    {
      code: 'doSomething(Metadata.Provider);',
      errors: [{ messageId: 'noGlobalProviderAccess' }],
    },
    {
      code: 'Metadata.Provider.RunSQL(sql);',
      errors: [{ messageId: 'noGlobalProviderAccess' }],
    },

    // --- Reading RunView.Provider ---
    {
      code: 'const p = RunView.Provider;',
      errors: [{ messageId: 'noGlobalProviderAccess' }],
    },

    // --- GetEntityObject without provider ---
    {
      code: 'md.GetEntityObject("Foo", user);',
      errors: [{ messageId: 'missingProviderArg' }],
    },
    {
      code: 'this.md.GetEntityObject("Foo", user);',
      errors: [{ messageId: 'missingProviderArg' }],
    },
    {
      code: 'md.GetEntityObject("Foo");',
      errors: [{ messageId: 'missingProviderArg' }],
    },
  ],
});
