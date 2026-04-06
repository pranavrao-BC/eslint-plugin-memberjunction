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
    // Local type re-export in index is fine
    { code: "export type { Foo } from './local-types';", filename: 'index.ts' },
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
    // Type re-exports from MJ packages are also flagged
    {
      code: "export type { Metadata } from '@memberjunction/core';",
      filename: 'index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
    // .mts extension coverage
    {
      code: "export * from '@memberjunction/global';",
      filename: 'index.mts',
      errors: [{ messageId: 'noReexport' }],
    },
  ],
});
