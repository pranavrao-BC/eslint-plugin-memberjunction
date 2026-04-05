import stylelint, { Rule } from 'stylelint';

const { createPlugin, utils } = stylelint;

const ruleName = 'mj/no-primitive-tokens';
const messages = utils.ruleMessages(ruleName, {
  rejected: (token: string) =>
    `Primitive token "${token}" used directly. Use a semantic --mj-* token instead (e.g., --mj-text-primary, --mj-bg-surface). Primitives don't adapt to dark mode.`,
});

// Primitive token patterns that should never appear in component CSS
const PRIMITIVE_PATTERN = /var\(\s*(--mj-color-(?:neutral|brand|status|accent)-\d+)/g;

const ruleFunction: Rule = (primary) => {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });
    if (!validOptions) return;

    root.walkDecls((decl) => {
      PRIMITIVE_PATTERN.lastIndex = 0;
      let match;
      while ((match = PRIMITIVE_PATTERN.exec(decl.value)) !== null) {
        utils.report({
          message: messages.rejected(match[1]),
          node: decl,
          result,
          ruleName,
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default createPlugin(ruleName, ruleFunction);
