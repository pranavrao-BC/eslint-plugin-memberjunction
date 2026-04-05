import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const noHardcodedColors = require('./dist/stylelint/no-hardcoded-colors.js').default;
const noPrimitiveTokens = require('./dist/stylelint/no-primitive-tokens.js').default;
export default {
  plugins: [noHardcodedColors, noPrimitiveTokens],
  rules: {
    'mj/no-hardcoded-colors': true,
    'mj/no-primitive-tokens': true,
  },
};
