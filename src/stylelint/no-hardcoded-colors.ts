import stylelint, { Rule } from 'stylelint';

const { createPlugin, utils } = stylelint;

const ruleName = 'mj/no-hardcoded-colors';
const messages = utils.ruleMessages(ruleName, {
  rejected: (value: string, prop: string) =>
    `Hardcoded color "${value}" in "${prop}". Use a --mj-* design token instead. See CLAUDE.md token mapping table.`,
});

// Properties that hold color values
const COLOR_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'border',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'fill',
  'stroke',
  'box-shadow',
  'text-shadow',
  'text-decoration-color',
  'column-rule-color',
  'caret-color',
  'scrollbar-color',
]);

// Matches #hex (3,4,6,8 digit), rgb(), rgba(), hsl(), hsla()
const HARDCODED_COLOR = /(?:#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\s*\()/;

// Allowlisted patterns: var() fallbacks, data URIs, currentColor
const ALLOWLIST = [
  /url\s*\(/, // data URIs
  /currentColor/i,
  /inherit|initial|unset|revert/,
];

function isAllowlisted(value: string): boolean {
  // If the entire value is just a var(...) expression (possibly with fallback), allow it
  if (/^var\s*\(/.test(value.trim())) return true;
  return ALLOWLIST.some((pattern) => pattern.test(value));
}

const ruleFunction: Rule = (primary) => {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    });
    if (!validOptions) return;

    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      if (!COLOR_PROPERTIES.has(prop)) return;

      const value = decl.value;
      if (isAllowlisted(value)) return;
      if (!HARDCODED_COLOR.test(value)) return;

      utils.report({
        message: messages.rejected(value, prop),
        node: decl,
        result,
        ruleName,
      });
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default createPlugin(ruleName, ruleFunction);
