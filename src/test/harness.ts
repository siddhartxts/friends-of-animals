// The Seam 1 harness (#55 "Testing Decisions"). A test builds one harness,
// sets up its world with seed builders, calls use cases exactly as server
// actions do, and asserts on what came back, what the fakes received and
// which rows exist:
//
//   const h = await createHarness();
//   const member = await h.seed.member();
//   await h.as(h.visitor()).requestEmailCode({ email: member.email });
//   expect(h.email.codeFor(member.email)).toMatch(/^\d{6}$/);
//
// Each harness has its own PGlite database (real migrations), fake clock and
// fakes, so tests share nothing. Tickets that add a port append its fake
// here and in src/server/deps.ts. See docs/agents/seam-1.md.

import { vi } from "vitest";

import { createApp, type UseCases } from "@/server/app";
import type { Actor, RequestMeta } from "@/server/actor";
import type { Deps } from "@/server/deps";
import { resolveActor } from "@/server/identity";
import { headersFor } from "@/server/identity/request";
import { createSeedBuilders, type SeedBuilders } from "@/server/seed";

import { createTestDb, type TestDb } from "./db";
import { FakeClock } from "./fakes/clock";
import { FakeCookieJar } from "./fakes/cookies";
import { FakeEmail } from "./fakes/email";

export interface Harness {
  /** This test's database. Assert on rows through it. */
  db: TestDb;
  /**
   * Starts at DEFAULT_TEST_INSTANT unless `now` was given. The system clock
   * follows it (Date only), because Better Auth reads `new Date()`.
   */
  clock: FakeClock;
  /** Every email use cases sent. */
  email: FakeEmail;
  /** The browser's cookie store: what use cases set on responses. */
  cookies: FakeCookieJar;
  /** What use cases run against: the fakes above plus test auth config. */
  deps: Deps;
  /** The use cases, acting as `actor`: the same ones server actions call. */
  as(actor: Actor): UseCases;
  /** A signed-out caller. */
  visitor(meta?: Partial<RequestMeta>): Actor;
  /**
   * Who the server sees on the browser's next request: resolved from its
   * cookies the way `currentActor()` does it in production. Pass `cookie`
   * (a Cookie header saved earlier with `cookies.header()`) to ask about
   * another browser.
   */
  currentActor(meta?: Partial<RequestMeta>, cookie?: string): Promise<Actor>;
  /**
   * Signs `user` in through the real email-code flow (from a fresh IP, so
   * it doesn't eat into a test's own limits) and returns the signed-in
   * actor. The browser then holds that session.
   */
  signIn(user: { email: string }, meta?: Partial<RequestMeta>): Promise<Actor>;
  /** Builders that write to this database with this clock. */
  seed: SeedBuilders;
}

/** Documentation addresses (RFC 5737) and an obvious user agent. */
const DEFAULT_META: RequestMeta = {
  ip: "203.0.113.10",
  userAgent: "Seam 1 test",
};

export const TEST_AUTH = {
  secret: "seam-1-test-secret-0123456789abcdef",
  baseUrl: "http://localhost:3000",
};

export async function createHarness(
  options: { now?: Date | string } = {}
): Promise<Harness> {
  const db = await createTestDb();
  vi.useFakeTimers({ toFake: ["Date"] });
  const clock = new FakeClock(options.now, {
    onChange: (now) => vi.setSystemTime(now),
  });
  const email = new FakeEmail(clock);
  const cookies = new FakeCookieJar(clock);
  const deps: Deps = { db, clock, email, cookies, auth: TEST_AUTH };
  const app = createApp(deps);
  const meta = (overrides: Partial<RequestMeta> = {}) => ({
    ...DEFAULT_META,
    ...overrides,
  });
  let signIns = 0;

  const harness: Harness = {
    db,
    clock,
    email,
    cookies,
    deps,
    as: (actor) => app.as(actor),
    visitor: (overrides) => ({ kind: "visitor", meta: meta(overrides) }),
    currentActor: (overrides, cookie = cookies.header()) =>
      resolveActor(deps, headersFor(meta(overrides), cookie)),
    async signIn(user, overrides) {
      signIns += 1;
      const visitor = harness.visitor({
        ip: `198.18.0.${signIns}`,
        ...overrides,
      });
      const requested = await app.as(visitor).requestEmailCode(user);
      const code = email.codeFor(user.email);
      if (!requested.ok || !code) {
        throw new Error(`Could not send a code to ${user.email}`);
      }
      const verified = await app
        .as(visitor)
        .verifyEmailCode({ intent: "sign-in", email: user.email, code });
      if (!verified.ok) {
        throw new Error(`Could not sign ${user.email} in: ${verified.error}`);
      }
      return harness.currentActor(
        visitor.kind === "visitor" ? visitor.meta : {}
      );
    },
    seed: createSeedBuilders(deps),
  };
  return harness;
}
