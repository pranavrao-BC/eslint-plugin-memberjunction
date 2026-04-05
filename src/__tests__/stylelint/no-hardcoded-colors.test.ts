import { describe, it, expect } from 'vitest';
import stylelint from 'stylelint';
import plugin from '../../stylelint/no-hardcoded-colors';

const ruleName = 'mj/no-hardcoded-colors';

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

describe('mj/no-hardcoded-colors', () => {
  it('flags hex colors in color property', async () => {
    const warnings = await lint('.foo { color: #333; }');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].rule).toBe(ruleName);
  });

  it('flags hex colors in background', async () => {
    const warnings = await lint('.foo { background: #f5f5f5; }');
    expect(warnings).toHaveLength(1);
  });

  it('flags hex colors in border-color', async () => {
    const warnings = await lint('.foo { border-color: #e0e0e0; }');
    expect(warnings).toHaveLength(1);
  });

  it('flags rgb() in color properties', async () => {
    const warnings = await lint('.foo { color: rgb(51, 51, 51); }');
    expect(warnings).toHaveLength(1);
  });

  it('flags rgba() in background', async () => {
    const warnings = await lint('.foo { background: rgba(0, 0, 0, 0.5); }');
    expect(warnings).toHaveLength(1);
  });

  it('flags hex in fill', async () => {
    const warnings = await lint('.icon { fill: #264FAF; }');
    expect(warnings).toHaveLength(1);
  });

  it('flags hex in box-shadow', async () => {
    const warnings = await lint('.card { box-shadow: 0 2px 4px #ccc; }');
    expect(warnings).toHaveLength(1);
  });

  it('allows var() tokens', async () => {
    const warnings = await lint('.foo { color: var(--mj-text-primary); }');
    expect(warnings).toHaveLength(0);
  });

  it('allows var() with fallback', async () => {
    const warnings = await lint('.foo { color: var(--mj-text-inverse, white); }');
    expect(warnings).toHaveLength(0);
  });

  it('allows currentColor', async () => {
    const warnings = await lint('.foo { border-color: currentColor; }');
    expect(warnings).toHaveLength(0);
  });

  it('allows inherit/initial/unset', async () => {
    const warnings = await lint('.foo { color: inherit; }');
    expect(warnings).toHaveLength(0);
  });

  it('ignores non-color properties', async () => {
    const warnings = await lint('.foo { width: 100px; height: #333; }');
    // height is not a color property
    expect(warnings).toHaveLength(0);
  });

  it('ignores url() data URIs', async () => {
    const warnings = await lint('.foo { background: url("data:image/svg+xml,%23fff"); }');
    expect(warnings).toHaveLength(0);
  });
});
