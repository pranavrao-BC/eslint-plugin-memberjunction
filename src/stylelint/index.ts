import noHardcodedColors from './no-hardcoded-colors';
import noPrimitiveTokens from './no-primitive-tokens';

export const plugins = [noHardcodedColors, noPrimitiveTokens];

export const recommendedConfig = {
  plugins,
  rules: {
    'mj/no-hardcoded-colors': true,
    'mj/no-primitive-tokens': true,
  },
};
