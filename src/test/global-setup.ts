// Vitest global setup (vitest.config.ts `globalSetup`): runs once per
// `vitest run`, before any test file, in the main process. It migrates one
// PGlite database and leaves its data directory in a temporary file, which
// `createTestDb()` loads for every test. So the migrations run once, outside
// every test's timeout, and not once per test file.
//
// In watch mode the template is built when Vitest starts: restart it after
// changing a migration.

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";

import { migrateTemplate } from "./db";

declare module "vitest" {
  export interface ProvidedContext {
    /** The migrated data directory, an uncompressed tar file. */
    testDbTemplate: string;
  }
}

export default async function setup(project: TestProject) {
  const dir = await mkdtemp(join(tmpdir(), "foa-test-db-"));
  const file = join(dir, "template.tar");
  const template = await migrateTemplate();
  await writeFile(file, new Uint8Array(await template.arrayBuffer()));
  project.provide("testDbTemplate", file);
  return () => rm(dir, { recursive: true, force: true });
}
