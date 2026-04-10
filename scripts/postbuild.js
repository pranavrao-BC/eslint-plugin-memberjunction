/**
 * Generate CJS wrappers for stylelint plugins.
 *
 * TypeScript compiles `export default` to `exports.default = ...`
 * but stylelint expects `module.exports` to be the plugin directly.
 * These thin wrappers unwrap the `.default` so stylelint can load them.
 */
const fs = require('fs');
const path = require('path');

const plugins = ['no-hardcoded-colors', 'no-primitive-tokens'];
const dir = path.join(__dirname, '..', 'dist', 'stylelint');

for (const name of plugins) {
  const wrapper = `module.exports = require('./${name}.js').default;\n`;
  fs.writeFileSync(path.join(dir, `${name}.cjs`), wrapper);
}
