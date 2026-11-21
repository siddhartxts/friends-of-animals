// What use cases run against: the database, the clock and the provider
// ports. `productionDeps()` wires the real ones for server actions and route
// handlers; the Seam 1 harness (src/test/harness.ts) wires PGlite, a fake
// clock and in-memory fakes. Later ports (SMS #58, jobs #61, storage #63)
// are appended here and in the harness by the ticket that adds them.

import "server-only";

import { env } from "@/env";
import type { Env } from "@/env.schema";

import { db } from "./db";
import type { AppDb } from "./db/app-db";
import { systemClock, type Clock } from "./ports/clock";
import type { CookieJar } from "./ports/cookies";
import { nextCookieJar } from "./ports/cookies-next";
import { unconfiguredEmailSender, type EmailSender } from "./ports/email";
import { captureEmailSender } from "./ports/email-capture";

export interface Deps {
  db: AppDb;
  clock: Clock;
  email: EmailSender;
  /** The response's cookies (the session cookie). */
  cookies: CookieJar;
  /** Better Auth's secret and the site's base URL. */
  auth: { secret: string; baseUrl: string };
}

/**
 * A local run or a preview without BETTER_AUTH_SECRET signs with this. It is
 * public, so it protects nothing; staging and production must set their own
 * (src/env.schema.ts refuses to start without it).
 */
export const DEVELOPMENT_AUTH_SECRET =
  "foa-development-secret-not-for-staging-or-production";

/**
 * Production sends real email (SES, once FOA's account exists; until then
 * it refuses). Every other environment captures, so no real email leaves
 * staging, previews or a local run, and codes stay readable.
 */
export function emailSenderFor(
  appEnv: Env["APP_ENV"],
  deps: { db: AppDb; clock: Clock }
): EmailSender {
  return appEnv === "production"
    ? unconfiguredEmailSender
    : captureEmailSender(deps);
}

let production: Deps | undefined;

/** The app's deps, built on first use from `env()`. */
export function productionDeps(): Deps {
  if (!production) {
    const config = env();
    production = {
      db,
      clock: systemClock,
      email: emailSenderFor(config.APP_ENV, { db, clock: systemClock }),
      cookies: nextCookieJar,
      auth: {
        secret: config.BETTER_AUTH_SECRET ?? DEVELOPMENT_AUTH_SECRET,
        baseUrl: config.APP_URL,
      },
    };
  }
  return production;
}
