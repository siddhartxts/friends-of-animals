import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT = fileURLToPath(new URL("./restore-drill.sh", import.meta.url));

/**
 * Sources the drill script (which then only defines its functions) and runs
 * `snippet` in the same shell, with `args` as "$@".
 */
function drill(snippet: string, ...args: string[]) {
  const run = spawnSync(
    "bash",
    ["-c", `source "$1" && shift && ${snippet}`, "bash", SCRIPT, ...args],
    { encoding: "utf8" }
  );
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

describe("restore-drill.sh arguments", () => {
  const target = (...args: string[]) =>
    drill('parse_args "$@" && printf %s "$TARGET"', ...args);

  it("restores to the end of the archived WAL by default", () => {
    expect(target()).toMatchObject({ status: 0, stdout: "latest" });
    expect(target("--target", "latest")).toMatchObject({
      status: 0,
      stdout: "latest",
    });
  });

  it("takes a point in time with a zone and passes it on in UTC", () => {
    expect(target("--target", "2026-11-18 11:34:51+05:30")).toMatchObject({
      status: 0,
      stdout: "2026-11-18 06:04:51.000000+00",
    });
    expect(target("--target=2026-11-18T06:04:51.430802Z")).toMatchObject({
      status: 0,
      stdout: "2026-11-18 06:04:51.430802+00",
    });
  });

  it.each([
    ["a time without a zone", ["--target", "2026-11-18 06:04:51"], /zone/],
    ["a date that does not exist", ["--target", "2026-13-40 06:04Z"], /valid/],
    ["words", ["--target", "yesterday"], /zone/],
    ["a time in the future", ["--target", "2999-01-01 00:00Z"], /future/],
    ["--target without a value", ["--target"], /needs a value/],
    ["an unknown argument", ["--keep"], /unknown argument: --keep/],
  ])("refuses %s", (_, args, message) => {
    const run = target(...args);
    expect(run.status).toBe(2);
    expect(run.stdout).toBe("");
    expect(run.stderr).toMatch(message);
    expect(run.stderr).toMatch(/Usage: /);
  });

  it("prints its usage with --help", () => {
    const run = target("--help");
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/Usage: .*restore-drill\.sh \[--target/);
  });
});

describe("restore-drill.sh result record", () => {
  const record = (...fields: string[]) => drill('drill_record "$@"', ...fields);

  it("is one JSON line: name=string, name:=number, empty means null", () => {
    const run = record(
      "at=2026-11-19T08:00:00Z",
      "target=latest",
      "outcome=pass",
      "duration_s:=8.1",
      "recovery_s:=3",
      "wal=000000010000000000000015",
      "last_xact=",
      "reason="
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/^[^\n]+\n$/);
    expect(Object.entries(JSON.parse(run.stdout))).toEqual([
      ["at", "2026-11-19T08:00:00Z"],
      ["target", "latest"],
      ["outcome", "pass"],
      ["duration_s", 8.1],
      ["recovery_s", 3],
      ["wal", "000000010000000000000015"],
      ["last_xact", null],
      ["reason", null],
    ]);
  });

  it("keeps quotes, backslashes, newlines and ':=' in strings intact", () => {
    const reason = 'restore said "no backup"\\ at C:\\x\nnext line, a:=b';
    const run = record(`reason=${reason}`, "recovery_s:=");
    expect(JSON.parse(run.stdout)).toEqual({ reason, recovery_s: null });
  });

  it("refuses a number field that is not a number", () => {
    const run = record("duration_s:=8.1s");
    expect(run.status).not.toBe(0);
    expect(run.stdout).toBe("");
    expect(run.stderr).toMatch(/duration_s/);
  });
});

describe("restore-drill.sh WAL replay", () => {
  const lastRestored = (log: string) => drill('last_restored_wal <<<"$1"', log);

  it("finds the newest WAL segment Postgres restored from the archive", () => {
    const log = [
      '2026-11-19 08:00:01.100 UTC [43] LOG:  restored log file "00000001000000000000001C" from archive',
      '2026-11-19 08:00:01.300 UTC [43] LOG:  restored log file "00000001000000000000001D" from archive',
      '2026-11-19 08:00:01.200 UTC [43] LOG:  restored log file "00000001000000000000001B" from archive',
      '2026-11-19 08:00:01.400 UTC [43] LOG:  restored log file "00000002.history" from archive',
      "2026-11-19 08:00:01.500 UTC [43] LOG:  redo done at 0/1D0000A0",
      "",
    ].join("\n");
    expect(lastRestored(log)).toMatchObject({
      status: 0,
      stdout: "00000001000000000000001D\n",
    });
  });

  it.each([
    ["00000001000000000000001D", "00000001000000000000001D", 0],
    ["00000001000000000000001E", "00000001000000000000001D", 0],
    ["00000001000000000000001C", "00000001000000000000001D", 1],
    ["000000010000000000000009", "00000001000000000000000A", 1],
    ["", "00000001000000000000001D", 1],
  ])(
    "replay to %s reached the archive's end at %s: exit %i",
    (wal, max, status) => {
      expect(drill('wal_reached "$1" "$2"', wal, max).status).toBe(status);
    }
  );

  it("prints nothing when no segment came from the archive", () => {
    expect(lastRestored("LOG:  database system is ready\n")).toMatchObject({
      status: 0,
      stdout: "",
    });
  });
});

describe("restore-drill.sh expected objects", () => {
  // A drizzle folder as drizzle-kit writes it: three migrations, each with
  // its SQL and a snapshot of the whole schema after it.
  const migrations = [
    {
      when: 1794970969591,
      tag: "0000_enable_pg_trgm",
      sql: "-- Custom SQL migration file\nCREATE EXTENSION IF NOT EXISTS pg_trgm;\n",
      tables: [],
    },
    {
      when: 1795000000000,
      tag: "0001_users",
      sql: [
        'CREATE EXTENSION IF NOT EXISTS "citext";',
        "-- CREATE EXTENSION postgis; (not yet)",
        'CREATE TABLE "users" ("id" uuid PRIMARY KEY);',
        'CREATE TABLE "audit"."log" ("id" bigint PRIMARY KEY);',
      ].join("\n--> statement-breakpoint\n"),
      tables: ["public.users", "audit.log"],
    },
    {
      when: 1795100000000,
      tag: "0002_sessions",
      sql: 'create extension "uuid-ossp";\nCREATE TABLE "sessions" ("id" uuid);',
      tables: ["public.users", "audit.log", "public.sessions"],
    },
  ];
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "restore-drill-test-"));
    mkdirSync(join(dir, "meta"));
    writeFileSync(
      join(dir, "meta", "_journal.json"),
      JSON.stringify({
        version: "7",
        dialect: "postgresql",
        entries: migrations.map(({ when, tag }, idx) => ({
          idx,
          version: "7",
          when,
          tag,
          breakpoints: true,
        })),
      })
    );
    migrations.forEach(({ tag, sql, tables }, idx) => {
      writeFileSync(join(dir, `${tag}.sql`), sql);
      writeFileSync(
        join(dir, "meta", `${String(idx).padStart(4, "0")}_snapshot.json`),
        JSON.stringify({
          version: "7",
          dialect: "postgresql",
          tables: Object.fromEntries(tables.map((t) => [t, { columns: {} }])),
        })
      );
    });
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const expected = (...applied: number[]) =>
    drill('expected_objects "$@"', dir, ...applied.map(String));

  it("lists the tables and extensions the applied migrations created", () => {
    const run = expected(migrations[0].when, migrations[1].when);
    expect(run.status).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.stdout).toBe(
      [
        "extension citext",
        "extension pg_trgm",
        "table audit.log",
        "table public.users",
        "",
      ].join("\n")
    );
  });

  it("warns about migrations the checkout does not know and checks the rest", () => {
    const run = expected(...migrations.map((m) => m.when), 1796000000000);
    expect(run.status).toBe(0);
    expect(run.stderr).toMatch(/1 applied migration.*not in .*_journal\.json/);
    expect(run.stdout).toBe(
      [
        "extension citext",
        "extension pg_trgm",
        "extension uuid-ossp",
        "table audit.log",
        "table public.sessions",
        "table public.users",
        "",
      ].join("\n")
    );
  });
});
