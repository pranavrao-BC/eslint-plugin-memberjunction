import { rules } from './rules';
import { recommended, strict } from './configs/recommended';

const plugin = {
  meta: {
    name: '@memberjunction/eslint-plugin',
    version: '0.2.0',
  },
  rules,
  configs: {
    recommended,
    strict,
  },
};

export = plugin;
