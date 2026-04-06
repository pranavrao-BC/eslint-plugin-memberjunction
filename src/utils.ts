import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/MemberJunction/eslint-plugin-memberjunction/blob/main/docs/rules/${name}.md`
);
