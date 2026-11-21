// Which database `pnpm db:seed` fills, if any. Loads under plain Node.

import { migrationTarget, type DatabaseEnv } from "../db/database-url";

export type SeedTarget =
  | { seed: true; url: string }
  | { seed: false; reason: string };

/**
 * Previews and local runs are seeded, through DIRECT_URL, in the same
 * database the migration just ran on. Staging and production never are:
 * the command exits without touching them, so `vercel-build` can run it
 * everywhere.
 */
export function seedTarget(
  env: DatabaseEnv & { DIRECT_URL: string }
): SeedTarget {
  const appEnv = env.APP_ENV ?? "local";
  if (appEnv !== "local" && appEnv !== "preview") {
    return {
      seed: false,
      reason: `APP_ENV=${appEnv}: seed data goes only into preview and local databases.`,
    };
  }
  return { seed: true, url: migrationTarget(env).url };
}
