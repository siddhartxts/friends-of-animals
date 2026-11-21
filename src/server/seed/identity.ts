// Identity seed data (#57): accounts. Loads under plain Node (the seed
// script): relative imports only, no "server-only".

import { eq } from "drizzle-orm";

import { user, type User } from "../db/schema";
import { uuidv7 } from "../ids";
import { normaliseEmailAddress } from "../ports/email";
import { SEED_ACCOUNTS } from "./accounts";
import type { SeedDeps } from "./types";

export type AccountInput = { id?: string; name: string; email: string };

/**
 * Creates a verified account, or returns the one that already has this
 * address untouched, so seeding again (or after someone signed up with a
 * seeded address) changes nothing.
 */
export async function ensureAccount(
  { db, clock }: SeedDeps,
  input: AccountInput
): Promise<User> {
  const now = clock.now();
  const email = normaliseEmailAddress(input.email);
  const [created] = await db
    .insert(user)
    .values({
      id: input.id ?? uuidv7(now),
      name: input.name,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: user.email })
    .returning();
  if (created) return created;
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (!existing) throw new Error(`Could not create or find ${email}`);
  return existing;
}

/** The super admin and the members from SEED_ACCOUNTS. */
export async function seedIdentity(deps: SeedDeps): Promise<void> {
  await ensureAccount(deps, SEED_ACCOUNTS.superAdmin);
  for (const member of SEED_ACCOUNTS.members) {
    await ensureAccount(deps, member);
  }
}
