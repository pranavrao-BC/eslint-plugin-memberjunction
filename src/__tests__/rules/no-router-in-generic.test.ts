import { createTester } from '../setup';
import rule from '../../rules/no-router-in-generic';

const tester = createTester();

tester.run('no-router-in-generic', rule, {
  valid: [
    // Router in Explorer is fine
    {
      code: "import { Router } from '@angular/router';",
      filename: 'packages/Angular/Explorer/nav/nav.component.ts',
    },
    // Non-router imports in Generic are fine
    {
      code: "import { Component } from '@angular/core';",
      filename: 'packages/Angular/Generic/shared/my.component.ts',
    },
    // Router outside Angular entirely is fine
    {
      code: "import { Router } from '@angular/router';",
      filename: 'packages/SomeOther/thing.ts',
    },
  ],
  invalid: [
    {
      code: "import { Router } from '@angular/router';",
      filename: 'packages/Angular/Generic/shared/my.component.ts',
      errors: [{ messageId: 'noRouter' }],
    },
    {
      code: "import { ActivatedRoute } from '@angular/router';",
      filename: 'packages/Angular/Generic/data-grid/grid.component.ts',
      errors: [{ messageId: 'noRouter' }],
    },
  ],
});
