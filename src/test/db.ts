import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { inject } from "vitest";

import * as schema from "@/server/db/schema";

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url)
);

/**
 * Extensions the migrations create. PGlite must load them up front, so a
 * migration that adds `CREATE EXTENSION x` adds `x` here too.
 */
const extensions = { pg_trgm };

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/**
 * Applies the real migrations to a fresh PGlite and returns its data
 * directory as an uncompressed tar. src/test/global-setup.ts calls it once
 * per `vitest run`; tests load the result through `createTestDb()`.
 */
export async function migrateTemplate(): Promise<Blob> {
  const client = await PGlite.create({ extensions });
  try {
    await migrate(drizzle({ client }), { migrationsFolder });
    return await client.dumpDataDir("none");
  } finally {
    await client.close();
  }
}

/** The global setup's template, read once per test file. */
let template: Promise<Blob> | undefined;

async function readTemplate(): Promise<Blob> {
  const file: string | undefined = inject("testDbTemplate");
  if (file === undefined) {
    throw new Error(
      "No migrated test database: vitest.config.ts must list " +
        "src/test/global-setup.ts under test.globalSetup."
    );
  }
  return new Blob([await readFile(file)]);
}

/**
 * Creates a fresh in-memory Postgres (PGlite) database for a test with the
 * real migrations from ./drizzle applied, so tests and production share one
 * schema. Every call returns a new, isolated database.
 *
 * The migrations run once per `vitest run`, in src/test/global-setup.ts,
 * before any test starts. Each call loads a copy of that template (about
 * 0.3 s, against 1.7 s and growing to migrate a fresh database), so no test
 * pays for the migrations.
 *
 * Use-case tests should use `createHarness()` from "@/test/harness", which
 * builds on this. Older code that imports `db` from "@/server/db" swaps it
 * with `vi.mock`. The factory is hoisted, so keep the instance in a variable:
 *
 *   import { createTestDb, type TestDb } from "@/test/db";
 *
 *   let testDb: TestDb;
 *   vi.mock("@/server/db", () => ({
 *     get db() {
 *       return testDb;
 *     },
 *   }));
 *
 *   beforeEach(async () => {
 *     testDb = await createTestDb();
 *   });
 */
export async function createTestDb() {
  template ??= readTemplate().catch((error: unknown) => {
    // Let the next test try again rather than fail on a stale rejection.
    template = undefined;
    throw error;
  });
  const client = await PGlite.create({
    loadDataDir: await template,
    extensions,
  });
  return drizzle({ client, schema });
}
