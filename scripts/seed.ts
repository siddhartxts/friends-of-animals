// Fills a preview or local database with seed data (`pnpm db:seed`): a
// super admin and a few members today, more as modules add seeders
// (src/server/seed/index.ts). Idempotent, so it runs after every migration.
//
// It connects through DIRECT_URL, like the migration, to the same database:
// on a preview, the preview's own. Staging and production are never seeded:
// it exits 0 without connecting, so `vercel-build` can always run it.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { migrationEnvSchema, parseEnv } from "../src/env.schema";
import { directTls } from "../src/server/db/database-url";
import * as schema from "../src/server/db/schema";
import { systemClock } from "../src/server/ports/clock";
import { seedPreview } from "../src/server/seed";
import { seedTarget } from "../src/server/seed/target";
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

let target: ReturnType<typeof seedTarget>;
try {
  target = seedTarget(parseEnv(migrationEnvSchema, process.env));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (!target.seed) {
  console.log(`Not seeding. ${target.reason}`);
  process.exit(0);
}

const { url } = target;
const client = postgres(url, {
  ...directTls(url),
  max: 1,
  prepare: false,
  connect_timeout: 10,
  onnotice: () => {},
});

try {
  console.log(`Seeding ${new URL(url).pathname.slice(1)}...`);
  await seedPreview({ db: drizzle({ client, schema }), clock: systemClock });
  console.log("Seed complete.");
  await client.end();
} catch (error) {
  console.error("Seed failed:", error);
  await client.end({ timeout: 5 });
  process.exit(1);
}
