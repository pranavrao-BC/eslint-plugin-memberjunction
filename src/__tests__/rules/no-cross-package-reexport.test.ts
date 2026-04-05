import { createTester } from '../setup';
import rule from '../../rules/no-cross-package-reexport';

const tester = createTester();

tester.run('no-cross-package-reexport', rule, {
  valid: [
    // Re-exporting local code is fine
    { code: "export { Foo } from './foo';", filename: 'public-api.ts' },
    { code: "export * from './lib/module';", filename: 'index.ts' },
    // Non-index files can re-export (internal composition)
    { code: "export { Foo } from '@memberjunction/core';", filename: 'my-service.ts' },
  ],
  invalid: [
    {
      code: "export { ExportFormat } from '@memberjunction/export-engine';",
      filename: 'public-api.ts',
      errors: [{ messageId: 'noReexport' }],
    },
    {
      code: "export * from '@memberjunction/core';",
      filename: 'index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
  ],
});
