// Seed builders and the preview seed. Builders are server code shared by
// Seam 1 tests (through the harness) and `pnpm db:seed` (scripts/seed.ts);
// they never import Vitest. Loads under plain Node: relative imports only,
// no "server-only".
//
// A module with preview data adds one line to `seeders`, after the modules
// its data depends on.

import type { User } from "../db/schema";
import { ensureAccount, seedIdentity } from "./identity";
import type { SeedDeps, Seeder } from "./types";

export type { SeedDeps, Seeder } from "./types";
export { SEED_ACCOUNTS } from "./accounts";

const seeders: readonly Seeder[] = [
  // One line per module (.gitattributes merges this file with union).
  seedIdentity,
];

/**
 * Fills a preview or local database with the seed data. Idempotent: preview
 * databases live across pushes to a PR, so every push runs it again.
 */
export async function seedPreview(deps: SeedDeps): Promise<void> {
  await deps.db.transaction(async (tx) => {
    for (const seed of seeders) await seed({ db: tx, clock: deps.clock });
  });
}

const MEMBER_NAMES = [
  "Priya Sharma",
  "Arjun Menon",
  "Fatima Shaikh",
  "Rohan Das",
  "Ananya Gupta",
  "Kabir Singh",
];

/** Builders for tests: each call makes a new record unless told otherwise. */
export function createSeedBuilders(deps: SeedDeps) {
  let members = 0;
  return {
    /** A verified account. Pass `email` or `name` to choose them. */
    member(details: { name?: string; email?: string } = {}): Promise<User> {
      members += 1;
      return ensureAccount(deps, {
        name:
          details.name ?? MEMBER_NAMES[(members - 1) % MEMBER_NAMES.length]!,
        email: details.email ?? `test-member-${members}@example.test`,
      });
    },
    /** Everything `pnpm db:seed` puts in a preview database. */
    preview: () => seedPreview(deps),
  };
}

export type SeedBuilders = ReturnType<typeof createSeedBuilders>;
