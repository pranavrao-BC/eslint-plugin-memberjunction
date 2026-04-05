import { RuleTester } from '@typescript-eslint/rule-tester';
import * as vitest from 'vitest';

RuleTester.afterAll = vitest.afterAll;
RuleTester.describe = vitest.describe;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;

export function createTester() {
  return new RuleTester({
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  });
}
