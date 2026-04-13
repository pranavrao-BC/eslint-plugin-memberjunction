#!/usr/bin/env node

/**
 * SQL migration linter for MemberJunction.
 *
 * Checks migration files for common mistakes that conflict with CodeGen
 * or violate MJ migration conventions.
 *
 * Usage:
 *   npx mj-lint-sql [path]           # defaults to migrations/v5/
 *   npx mj-lint-sql migrations/v5/   # lint all .sql files in directory
 *   npx mj-lint-sql path/to/file.sql # lint a single file
 */

import fs from 'fs';
import path from 'path';

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
}

interface LintRule {
  id: string;
  description: string;
  check(lines: string[], filename: string): Violation[];
}

const rules: LintRule[] = [
  {
    id: 'no-mj-timestamps',
    description: 'CodeGen adds __mj_CreatedAt/__mj_UpdatedAt automatically',
    check(lines, file) {
      const violations: Violation[] = [];
      let inCreateTable = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/CREATE\s+TABLE\b/i.test(line)) inCreateTable = true;
        if (inCreateTable && /\b__mj_(CreatedAt|UpdatedAt)\b/i.test(line)) {
          violations.push({
            file,
            line: i + 1,
            rule: 'no-mj-timestamps',
            message: `Don't add __mj timestamp columns in CREATE TABLE — CodeGen handles this automatically.`,
          });
        }
        // Rough end-of-CREATE detection
        if (inCreateTable && /^\s*\)\s*;/.test(line)) inCreateTable = false;
      }
      return violations;
    },
  },
  {
    id: 'no-fk-indexes',
    description: 'CodeGen creates FK indexes with IDX_AUTO_MJ_FKEY_ prefix',
    check(lines, file) {
      const violations: Violation[] = [];
      // Only flag if file also has CREATE TABLE (i.e., it's a table creation migration)
      const hasCreateTable = lines.some((l) => /CREATE\s+TABLE\b/i.test(l));
      if (!hasCreateTable) return violations;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/CREATE\s+(NONCLUSTERED\s+)?INDEX\b/i.test(line) && /\b\w+ID\b/.test(line)) {
          // Check it's not a unique index or composite — those are intentional
          const nextLines = lines.slice(i, i + 3).join(' ');
          const columnMatch = nextLines.match(/\(([^)]+)\)/);
          if (columnMatch) {
            const columns = columnMatch[1].split(',').map((c) => c.trim());
            // Single-column FK indexes are what CodeGen handles
            if (columns.length === 1 && /ID$/i.test(columns[0])) {
              violations.push({
                file,
                line: i + 1,
                rule: 'no-fk-indexes',
                message: `Single-column FK index on "${columns[0]}" — CodeGen creates these automatically as IDX_AUTO_MJ_FKEY_*.`,
              });
            }
          }
        }
      }
      return violations;
    },
  },
  {
    id: 'use-flyway-schema',
    description: 'Use ${flyway:defaultSchema} instead of hardcoded schema names',
    check(lines, file) {
      const violations: Violation[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments
        if (/^\s*--/.test(line)) continue;
        // Match bare schema prefixes like dbo. or __mj. not inside ${flyway:} or single-quoted strings
        if (/\b(dbo|__mj)\.\w+/i.test(line) && !line.includes('${flyway:') && !/'.*(dbo|__mj)\.\w+.*'/i.test(line)) {
          const match = line.match(/\b(dbo|__mj)\./i);
          violations.push({
            file,
            line: i + 1,
            rule: 'use-flyway-schema',
            message: `Hardcoded schema "${match![1]}." — use \${flyway:defaultSchema} placeholder instead.`,
          });
        }
      }
      return violations;
    },
  },
  {
    id: 'no-newid',
    description: 'Use hardcoded UUIDs instead of NEWID() for reproducible migrations',
    check(lines, file) {
      const violations: Violation[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*--/.test(line)) continue;
        // NEWID() in INSERT statements (not in DEFAULT constraints which use NEWSEQUENTIALID)
        if (/\bNEWID\s*\(\s*\)/i.test(line) && /INSERT\b/i.test(lines.slice(Math.max(0, i - 50), i + 1).join(' '))) {
          violations.push({
            file,
            line: i + 1,
            rule: 'no-newid',
            message: `NEWID() in INSERT — use a hardcoded UUID for reproducible migrations.`,
          });
        }
      }
      return violations;
    },
  },
];

/** Strip block comments from lines, preserving line numbering. */
function stripBlockComments(lines: string[]): string[] {
  const result: string[] = [];
  let inBlock = false;
  for (const line of lines) {
    let out = '';
    let i = 0;
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf('*/', i);
        if (end === -1) { i = line.length; break; }
        i = end + 2;
        inBlock = false;
      } else {
        const start = line.indexOf('/*', i);
        if (start === -1) { out += line.slice(i); break; }
        out += line.slice(i, start);
        i = start + 2;
        inBlock = true;
      }
    }
    result.push(out);
  }
  return result;
}

function lintFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rawLines = content.split('\n');
  const lines = stripBlockComments(rawLines);
  const filename = path.basename(filePath);
  return rules.flatMap((rule) => rule.check(lines, filename));
}

function lintDirectory(dirPath: string): Violation[] {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter((f) => {
    if (!f.endsWith('.sql')) return false;
    // Skip baseline files (B prefix) and CodeGen outputs — rules apply to hand-written migrations only
    if (/^B\d/.test(f) || f.startsWith('CodeGen_Run')) return false;
    return true;
  });
  return files.flatMap((f) => lintFile(path.join(dirPath, f)));
}

// CLI entry point
function main() {
  const target = process.argv[2] || 'migrations/v5/';

  const stat = fs.existsSync(target) ? fs.statSync(target) : null;
  if (!stat) {
    console.error(`Path not found: ${target}`);
    process.exit(1);
  }

  const violations = stat.isFile()
    ? lintFile(target)
    : lintDirectory(target);

  const label = stat.isFile() ? target : `SQL migrations in: ${target}`;
  console.log(`Linting ${label}\n`);

  if (violations.length === 0) {
    console.log('No issues found.');
    process.exit(0);
  }

  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}  ${v.rule}  ${v.message}`);
  }

  console.log(`\n${violations.length} issue(s) found.`);
  process.exit(1);
}

export { lintFile, lintDirectory, rules };

// Run if called directly
if (require.main === module) {
  main();
}
