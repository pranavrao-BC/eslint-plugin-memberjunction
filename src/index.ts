import { rules } from './rules';
import { recommended, strict } from './configs/recommended';

const plugin = {
  meta: {
    name: 'eslint-plugin-memberjunction',
    version: '0.3.5',
  },
  rules,
  configs: {} as Record<string, unknown>,
};

// Self-contained flat configs — users can spread directly:
//   import mj from 'eslint-plugin-memberjunction';
//   export default [mj.configs.recommended];
plugin.configs = {
  recommended: { plugins: { memberjunction: plugin }, ...recommended },
  strict: { plugins: { memberjunction: plugin }, ...strict },
};

export = plugin;
