import { sql } from "drizzle-orm";
import { existsSync } from "node:fs";
import { describe, expect, inject, it } from "vitest";

import journal from "../../drizzle/meta/_journal.json" with { type: "json" };

import { createTestDb } from "./db";

describe("createTestDb", () => {
  it("starts from a template migrated before any test ran", () => {
    // src/test/global-setup.ts migrates once per `vitest run`, so no test
    // pays for the migrations inside its timeout.
    const template = inject("testDbTemplate");
    expect(template).toBeTypeOf("string");
    expect(existsSync(template)).toBe(true);
  });

  it("applies the migrations, including pg_trgm", async () => {
    const db = await createTestDb();

    const extensions = await db.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname = 'pg_trgm'`
    );
    expect(extensions.rows).toEqual([{ extname: "pg_trgm" }]);

    const result = await db.execute<{ score: number }>(
      sql`select similarity('cat', 'cats') as score`
    );
    expect(result.rows[0]?.score).toBeGreaterThan(0);
  });

  it("records every migration in the journal as applied", async () => {
    const db = await createTestDb();

    const applied = await db.execute<{ created_at: string }>(
      sql`select created_at from drizzle.__drizzle_migrations order by id`
    );
    expect(applied.rows.map((row) => Number(row.created_at))).toEqual(
      journal.entries.map((entry) => entry.when)
    );
  });

  it("gives every call its own database", async () => {
    const first = await createTestDb();
    const second = await createTestDb();

    await first.execute(sql`create table scratch (id int)`);

    const tables = await second.execute<{ count: number }>(
      sql`select count(*)::int as count from pg_tables where tablename = 'scratch'`
    );
    expect(tables.rows[0]?.count).toBe(0);
  });
});
