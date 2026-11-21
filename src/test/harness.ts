// The Seam 1 harness (#55 "Testing Decisions"). A test builds one harness,
// sets up its world with seed builders, calls use cases exactly as server
// actions do, and asserts on what came back, what the fakes received and
// which rows exist:
//
//   const h = await createHarness();
//   const member = await h.seed.member();
//   const result = await h.as(h.visitor()).someUseCase({ email: member.email });
//   expect(h.email.lastTo(member.email)?.subject).toBe("...");
//
// Each harness has its own PGlite database (real migrations), fake clock and
// fakes, so tests share nothing. Tickets that add a port append its fake
// here and in src/server/deps.ts. See docs/agents/seam-1.md.

import { createApp, type UseCases } from "@/server/app";
import type { Actor, RequestMeta } from "@/server/actor";
import type { Deps } from "@/server/deps";
import { createSeedBuilders, type SeedBuilders } from "@/server/seed";

import { createTestDb, type TestDb } from "./db";
import { FakeClock } from "./fakes/clock";
import { FakeEmail } from "./fakes/email";

export interface Harness {
  /** This test's database. Assert on rows through it. */
  db: TestDb;
  /** Starts at DEFAULT_TEST_INSTANT unless `now` was given. */
  clock: FakeClock;
  /** Every email use cases sent. */
  email: FakeEmail;
  /** What use cases run against: the three above. */
  deps: Deps;
  /** The use cases, acting as `actor`: the same ones server actions call. */
  as(actor: Actor): UseCases;
  /** A signed-out caller. */
  visitor(meta?: Partial<RequestMeta>): Actor;
  /** Builders that write to this database with this clock. */
  seed: SeedBuilders;
}

/** Documentation addresses (RFC 5737) and an obvious user agent. */
const DEFAULT_META: RequestMeta = {
  ip: "203.0.113.10",
  userAgent: "Seam 1 test",
};

export async function createHarness(
  options: { now?: Date | string } = {}
): Promise<Harness> {
  const db = await createTestDb();
  const clock = new FakeClock(options.now);
  const email = new FakeEmail(clock);
  const deps: Deps = { db, clock, email };
  const app = createApp(deps);
  return {
    db,
    clock,
    email,
    deps,
    as: (actor) => app.as(actor),
    visitor: (meta = {}) => ({
      kind: "visitor",
      meta: { ...DEFAULT_META, ...meta },
    }),
    seed: createSeedBuilders(deps),
  };
}
