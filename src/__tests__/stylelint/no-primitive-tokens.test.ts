import { describe, it, expect } from 'vitest';
import stylelint from 'stylelint';
import plugin from '../../stylelint/no-primitive-tokens';

const ruleName = 'mj/no-primitive-tokens';

async function lint(css: string) {
  const result = await stylelint.lint({
    code: css,
    config: {
      plugins: [plugin],
      rules: { [ruleName]: true },
    },
  });
  return result.results[0].warnings;
}

describe('mj/no-primitive-tokens', () => {
  it('flags primitive neutral tokens', async () => {
    const warnings = await lint('.foo { color: var(--mj-color-neutral-300); }');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].rule).toBe(ruleName);
  });

  it('flags primitive brand tokens', async () => {
    const warnings = await lint('.foo { background: var(--mj-color-brand-500); }');
    expect(warnings).toHaveLength(1);
  });

  it('flags primitive status tokens', async () => {
    const warnings = await lint('.foo { border-color: var(--mj-color-status-100); }');
    expect(warnings).toHaveLength(1);
  });

  it('allows semantic tokens', async () => {
    const warnings = await lint('.foo { color: var(--mj-text-primary); }');
    expect(warnings).toHaveLength(0);
  });

  it('allows semantic bg tokens', async () => {
    const warnings = await lint('.foo { background: var(--mj-bg-surface-card); }');
    expect(warnings).toHaveLength(0);
  });

  it('allows semantic border tokens', async () => {
    const warnings = await lint('.foo { border-color: var(--mj-border-default); }');
    expect(warnings).toHaveLength(0);
  });

  it('allows semantic brand tokens', async () => {
    const warnings = await lint('.foo { color: var(--mj-brand-primary); }');
    expect(warnings).toHaveLength(0);
  });

  it('flags multiple primitives in one value', async () => {
    const warnings = await lint('.foo { background: linear-gradient(var(--mj-color-neutral-100), var(--mj-color-neutral-200)); }');
    expect(warnings).toHaveLength(2);
  });
});
