import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { lintFile, lintDirectory } from '../../sql/lint-migrations';

const TMP_DIR = path.join(__dirname, '__tmp_sql__');

beforeAll(() => fs.mkdirSync(TMP_DIR, { recursive: true }));
afterAll(() => fs.rmSync(TMP_DIR, { recursive: true, force: true }));

function writeSQL(name: string, content: string): string {
  const p = path.join(TMP_DIR, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('no-mj-timestamps', () => {
  it('flags __mj_CreatedAt in CREATE TABLE', () => {
    const f = writeSQL('ts1.sql', `
CREATE TABLE \${flyway:defaultSchema}.Foo (
    ID UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(100),
    __mj_CreatedAt DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    __mj_UpdatedAt DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-mj-timestamps')).toHaveLength(2);
  });

  it('does not flag __mj columns outside CREATE TABLE', () => {
    const f = writeSQL('ts2.sql', `
-- updating trigger for __mj_UpdatedAt
ALTER TRIGGER foo ON bar;
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-mj-timestamps')).toHaveLength(0);
  });
});

describe('no-fk-indexes', () => {
  it('flags single-column FK index in CREATE TABLE migration', () => {
    const f = writeSQL('fk1.sql', `
CREATE TABLE \${flyway:defaultSchema}.Bar (
    ID UNIQUEIDENTIFIER NOT NULL,
    FooID UNIQUEIDENTIFIER NOT NULL
);
CREATE INDEX IX_Bar_FooID ON Bar(FooID);
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-fk-indexes')).toHaveLength(1);
  });

  it('does not flag composite indexes', () => {
    const f = writeSQL('fk2.sql', `
CREATE TABLE \${flyway:defaultSchema}.Bar (
    ID UNIQUEIDENTIFIER NOT NULL,
    FooID UNIQUEIDENTIFIER NOT NULL,
    BazID UNIQUEIDENTIFIER NOT NULL
);
CREATE INDEX IX_Bar_Composite ON Bar(FooID, BazID);
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-fk-indexes')).toHaveLength(0);
  });

  it('does not flag indexes in non-CREATE-TABLE migrations', () => {
    const f = writeSQL('fk3.sql', `
-- standalone performance index, no table definition here
CREATE INDEX IX_Perf_UserID ON Users(UserID);
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-fk-indexes')).toHaveLength(0);
  });
});

describe('use-flyway-schema', () => {
  it('flags bare dbo. schema', () => {
    const f = writeSQL('schema1.sql', `
INSERT INTO dbo.Users (ID, Name) VALUES ('abc', 'Test');
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'use-flyway-schema')).toHaveLength(1);
  });

  it('flags bare __mj. schema', () => {
    const f = writeSQL('schema2.sql', `
SELECT * FROM __mj.Entity WHERE ID = 'abc';
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'use-flyway-schema')).toHaveLength(1);
  });

  it('allows ${flyway:defaultSchema}', () => {
    const f = writeSQL('schema3.sql', `
INSERT INTO \${flyway:defaultSchema}.Users (ID, Name) VALUES ('abc', 'Test');
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'use-flyway-schema')).toHaveLength(0);
  });

  it('ignores SQL comments', () => {
    const f = writeSQL('schema4.sql', `
-- This references dbo.OldTable for documentation
SELECT 1;
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'use-flyway-schema')).toHaveLength(0);
  });
});

describe('no-newid', () => {
  it('flags NEWID() in INSERT statements', () => {
    const f = writeSQL('newid1.sql', `
INSERT INTO \${flyway:defaultSchema}.Foo (ID, Name)
VALUES (NEWID(), 'Test');
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-newid')).toHaveLength(1);
  });

  it('allows hardcoded UUIDs', () => {
    const f = writeSQL('newid2.sql', `
INSERT INTO \${flyway:defaultSchema}.Foo (ID, Name)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-EF1234567890', 'Test');
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-newid')).toHaveLength(0);
  });

  it('allows NEWSEQUENTIALID() in DEFAULT constraints', () => {
    const f = writeSQL('newid3.sql', `
CREATE TABLE \${flyway:defaultSchema}.Foo (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
);
`);
    const v = lintFile(f);
    expect(v.filter((x) => x.rule === 'no-newid')).toHaveLength(0);
  });
});

describe('lintDirectory', () => {
  it('lints all .sql files in a directory', () => {
    writeSQL('good.sql', `
INSERT INTO \${flyway:defaultSchema}.Foo (ID) VALUES ('ABC-123');
`);
    writeSQL('bad.sql', `
INSERT INTO dbo.Foo (ID) VALUES (NEWID());
`);
    const v = lintDirectory(TMP_DIR);
    expect(v.length).toBeGreaterThanOrEqual(2);
  });
});
