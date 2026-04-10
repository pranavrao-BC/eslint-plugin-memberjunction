#!/usr/bin/env node

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { lintFile as lintSqlFile } from '../sql/lint-migrations';

const PKG_ROOT = path.resolve(__dirname, '..', '..');
const LEGACY_CONFIG_SRC = path.join(PKG_ROOT, 'eslintrc.mj.json');
const FLAT_CONFIG_SRC = path.join(PKG_ROOT, 'eslint.config.mj.cjs');
const STYLELINT_CONFIG = path.join(PKG_ROOT, 'stylelintrc.mj.json');
const REPORT_URL =
  'https://github.com/pranavrao-BC/eslint-plugin-memberjunction/issues/new?template=false-positive.yml';

// Temp config files written to CWD so override paths resolve correctly
const LEGACY_TMP = '.eslintrc.mj-lint-tmp.json';
const FLAT_TMP = '.eslint.config.mj-lint-tmp.cjs';

// ── File categories ────────────────────────────────────────────────

interface ChangedFiles {
  ts: string[];
  css: string[];
  sql: string[];
}

function partitionFiles(files: string[]): ChangedFiles {
  return {
    ts: files.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')),
    css: files.filter((f) => f.endsWith('.css') || f.endsWith('.scss')),
    sql: files.filter((f) => f.endsWith('.sql')),
  };
}

function filterStandard(files: string[]): string[] {
  return files
    .filter((f) => fs.existsSync(f))
    .filter(
      (f) => !f.includes('__tests__') && !f.includes('generated') && !f.includes('__mocks__'),
    );
}

// ── Git helpers ─────────────────────────────────────────────────────

function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function gitRoot(): string {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}

function detectBaseBranch(): string {
  for (const candidate of ['origin/next', 'origin/main', 'main']) {
    try {
      execSync(`git rev-parse --verify ${candidate}`, { stdio: 'ignore' });
      return candidate;
    } catch {
      // try next
    }
  }
  return 'HEAD~1';
}

function isOnBaseBranch(base: string): boolean {
  try {
    const headSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const baseSha = execSync(`git rev-parse ${base}`, { encoding: 'utf-8' }).trim();
    return headSha === baseSha;
  } catch {
    return false;
  }
}

function getChangedFiles(base: string, root: string): string[] {
  const mergeBase = execSync(`git merge-base ${base} HEAD`, {
    encoding: 'utf-8',
  }).trim();

  // Tracked changes (committed + unstaged) vs base
  const diffOutput = execSync(`git diff --name-only ${mergeBase}`, {
    encoding: 'utf-8',
  });
  const tracked = diffOutput.trim().split('\n').filter((f) => f.length > 0);

  // Untracked new files (not yet staged)
  const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
    encoding: 'utf-8',
  });
  const untracked = untrackedOutput.trim().split('\n').filter((f) => f.length > 0);

  // Deduplicate and resolve to absolute paths from git root
  const all = [...new Set([...tracked, ...untracked])];
  return all.map((f) => path.resolve(root, f));
}

// ── ESLint ──────────────────────────────────────────────────────────

function findEslint(): { bin: string; major: number } {
  try {
    const eslintMain = require.resolve('eslint');
    const eslintDir = path.resolve(path.dirname(eslintMain), '..');
    const binPath = path.join(eslintDir, 'bin', 'eslint.js');
    if (!fs.existsSync(binPath)) throw new Error('eslint bin not found');

    const pkgPath = path.join(eslintDir, 'package.json');
    const { version } = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const major = parseInt(version.split('.')[0], 10);
    return { bin: binPath, major };
  } catch {
    console.error('eslint not found. Install it:\n  npm install eslint --save-dev');
    process.exit(1);
  }
}

/**
 * Write a temp config to CWD so that override `files` patterns
 * (e.g. "packages/Angular/**") resolve relative to the project root,
 * not relative to node_modules where the static config lives.
 */
function writeTempConfig(major: number): string {
  if (major >= 9) {
    // Flat config — require the plugin by package name (resolves from CWD's node_modules)
    const src = fs.readFileSync(FLAT_CONFIG_SRC, 'utf-8');
    const patched = src.replace(
      /require\('\.\/dist\/index\.js'\)/,
      "require('eslint-plugin-memberjunction')",
    );
    fs.writeFileSync(FLAT_TMP, patched);
    return FLAT_TMP;
  }
  // Legacy config — just copy; plugin name "memberjunction" resolves from node_modules
  fs.copyFileSync(LEGACY_CONFIG_SRC, LEGACY_TMP);
  return LEGACY_TMP;
}

function cleanupTempConfig(): void {
  try { fs.unlinkSync(LEGACY_TMP); } catch { /* noop */ }
  try { fs.unlinkSync(FLAT_TMP); } catch { /* noop */ }
}

function runEslint(files: string[]): number {
  if (files.length === 0) return 0;

  const { bin, major } = findEslint();
  const useFlatConfig = major >= 9;
  const configFile = writeTempConfig(major);

  const eslintArgs = useFlatConfig
    ? ['--config', configFile, ...files]
    : ['--no-eslintrc', '-c', configFile, ...files];

  // eslint 8 defaults to eslintrc mode; env var is redundant but explicit
  const env = useFlatConfig
    ? process.env
    : { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' };

  const result = spawnSync(
    process.execPath,
    ['--no-warnings', bin, ...eslintArgs],
    { stdio: 'inherit', cwd: process.cwd(), env },
  );

  return result.status ?? 1;
}

// ── Stylelint ───────────────────────────────────────────────────────

function findStylelint(): string | null {
  try {
    const stylelintMain = require.resolve('stylelint');
    const stylelintDir = path.resolve(path.dirname(stylelintMain), '..');
    const binPath = path.join(stylelintDir, 'bin', 'stylelint.mjs');
    if (fs.existsSync(binPath)) return binPath;
    const altBin = path.join(stylelintDir, 'bin', 'stylelint.js');
    if (fs.existsSync(altBin)) return altBin;
    return null;
  } catch {
    return null;
  }
}

function runStylelint(files: string[]): number {
  if (files.length === 0) return 0;

  const bin = findStylelint();
  if (!bin) {
    console.log('  stylelint not installed — skipping CSS/SCSS checks');
    console.log('  Install it: npm install stylelint --save-dev\n');
    return 0;
  }

  const result = spawnSync(
    process.execPath,
    ['--no-warnings', bin, '--config', STYLELINT_CONFIG, ...files],
    { stdio: 'inherit', cwd: process.cwd() },
  );

  return result.status ?? 0;
}

// ── SQL ─────────────────────────────────────────────────────────────

function runSqlLint(files: string[]): number {
  if (files.length === 0) return 0;

  const lintableFiles = files.filter((f) => {
    const base = path.basename(f);
    return !(/^B\d/.test(base) || base.startsWith('CodeGen_Run'));
  });

  if (lintableFiles.length === 0) return 0;

  const violations = lintableFiles.flatMap((f) => lintSqlFile(f));

  if (violations.length === 0) return 0;

  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}  ${v.rule}  ${v.message}`);
  }
  console.log(`\n  ${violations.length} SQL issue(s)\n`);
  return 1;
}

// ── CLI ─────────────────────────────────────────────────────────────

function printUsage(): void {
  console.log(`Usage: mj-lint [options] [files...]

Lint MemberJunction files — TypeScript, CSS/SCSS, and SQL migrations.
By default, lints only files changed on this branch (committed + uncommitted + untracked).

Linters:
  .ts          ESLint — 25 MJ rules (entity access, RunView, Angular, etc.)
  .css/.scss   Stylelint — design token rules (requires stylelint)
  .sql         SQL migration checks (no-mj-timestamps, flyway schema, etc.)

Options:
  --all             Lint all packages/**/src/**/*.ts + css/scss
  --base <branch>   Diff base branch (default: auto-detect origin/next or origin/main)
  -h, --help        Show this help

Examples:
  mj-lint                                    # changed files only (default)
  mj-lint --all                              # everything
  mj-lint --base origin/main                 # diff against a specific branch
  mj-lint 'packages/MJServer/src/**/*.ts'    # specific files (quote globs)
`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const allMode = args.includes('--all');
  const baseIdx = args.indexOf('--base');
  const customBase = baseIdx !== -1 ? args[baseIdx + 1] : undefined;

  const flagTokens = new Set(['--all', '--base']);
  const fileArgs = args.filter(
    (a, i) => !flagTokens.has(a) && (baseIdx === -1 || i !== baseIdx + 1),
  );

  let grouped: ChangedFiles;

  if (fileArgs.length > 0) {
    grouped = partitionFiles(fileArgs);
  } else if (allMode) {
    grouped = {
      ts: ['packages/**/src/**/*.ts'],
      css: ['packages/**/src/**/*.css', 'packages/**/src/**/*.scss'],
      sql: [],
    };
    console.log('Linting all packages...\n');
  } else {
    if (!isGitRepo()) {
      console.error('Not a git repository. Pass files explicitly:\n  mj-lint "src/**/*.ts"');
      process.exit(1);
    }

    const root = gitRoot();
    const base = customBase ?? detectBaseBranch();

    // Detect when sitting on the base branch itself
    if (isOnBaseBranch(base)) {
      console.log(`You're on ${base} — nothing to diff against.`);
      console.log(`Try: mj-lint --base HEAD~5     (lint recent commits)`);
      console.log(`      mj-lint --all             (lint everything)`);
      console.log(`      mj-lint path/to/file.ts   (lint specific files)`);
      process.exit(0);
    }

    console.log(`Linting files changed vs ${base}...`);

    let allFiles: string[];
    try {
      allFiles = filterStandard(getChangedFiles(base, root));
    } catch {
      console.error(`Could not diff against ${base}. Is that branch available locally?`);
      process.exit(1);
    }

    grouped = partitionFiles(allFiles);

    const total = grouped.ts.length + grouped.css.length + grouped.sql.length;
    if (total === 0) {
      console.log('No lintable files changed. Nothing to do.');
      process.exit(0);
    }

    const parts = [
      grouped.ts.length > 0 ? `${grouped.ts.length} .ts` : '',
      grouped.css.length > 0 ? `${grouped.css.length} .css/.scss` : '',
      grouped.sql.length > 0 ? `${grouped.sql.length} .sql` : '',
    ].filter(Boolean);
    console.log(`Found ${parts.join(', ')} file(s).\n`);
  }

  let failed = false;

  try {
    if (grouped.ts.length > 0) {
      console.log('--- TypeScript ---');
      if (runEslint(grouped.ts) !== 0) failed = true;
      console.log();
    }

    if (grouped.css.length > 0) {
      console.log('--- Styles ---');
      if (runStylelint(grouped.css) !== 0) failed = true;
      console.log();
    }

    if (grouped.sql.length > 0) {
      console.log('--- SQL Migrations ---');
      if (runSqlLint(grouped.sql) !== 0) failed = true;
      console.log();
    }
  } finally {
    cleanupTempConfig();
  }

  if (failed) {
    console.log(`False positive? Report it: ${REPORT_URL}`);
  }

  process.exit(failed ? 1 : 0);
}

main();
