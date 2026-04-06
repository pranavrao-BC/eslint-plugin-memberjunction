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

// Allowlisted keyword patterns
const KEYWORD_ALLOWLIST = [
  /currentColor/i,
  /inherit|initial|unset|revert/,
];

/** Strip url(...) portions from a value so hardcoded colors inside data URIs don't cause false positives. */
function stripUrls(value: string): string {
  // Handles nested parens in url() by counting depth
  let result = '';
  let i = 0;
  while (i < value.length) {
    const urlStart = value.toLowerCase().indexOf('url(', i);
    if (urlStart === -1) { result += value.slice(i); break; }
    result += value.slice(i, urlStart);
    // Find matching close paren
    let depth = 1;
    let j = urlStart + 4;
    while (j < value.length && depth > 0) {
      if (value[j] === '(') depth++;
      else if (value[j] === ')') depth--;
      j++;
    }
    i = j;
  }
  return result;
}

function isAllowlisted(value: string): boolean {
  const trimmed = value.trim();
  // If the entire value is just a var(...) expression (possibly with fallback), allow it
  if (/^var\s*\(/.test(trimmed)) return true;
  return KEYWORD_ALLOWLIST.some((pattern) => pattern.test(trimmed));
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
      // Strip url() portions before checking for hardcoded colors
      const stripped = stripUrls(value);
      if (!HARDCODED_COLOR.test(stripped)) return;

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
