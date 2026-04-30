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

    // --- GetEntityObject calls are not checked (provider is the receiver in MJ) ---
    'provider.GetEntityObject("Foo", user);',
    'md.GetEntityObject("Foo", user);',
    'this.md.GetEntityObject("Foo", user, extra);',

    // --- Other class constructors not checked ---
    'new SomeOtherClass();',
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

    // --- new Metadata() always resolves to the global provider ---
    {
      code: 'new Metadata();',
      errors: [{ messageId: 'noNewMetadata' }],
    },
    {
      code: 'const md = new Metadata();',
      errors: [{ messageId: 'noNewMetadata' }],
    },
    {
      code: 'const e = await new Metadata().GetEntityObject("Foo", user);',
      errors: [{ messageId: 'noNewMetadata' }],
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
  ],
});
