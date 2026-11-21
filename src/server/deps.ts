// What use cases run against: the database, the clock and the provider
// ports. `productionDeps()` wires the real ones for server actions and route
// handlers; the Seam 1 harness (src/test/harness.ts) wires PGlite, a fake
// clock and in-memory fakes. Later ports (SMS #58, jobs #61, storage #63)
// are appended here and in the harness by the ticket that adds them.

import "server-only";

import { env } from "@/env";
import type { Env } from "@/env.schema";

import { db } from "./db";
import type { DbWithClock } from "./db/app-db";
import { systemClock } from "./ports/clock";
import { unconfiguredEmailSender, type EmailSender } from "./ports/email";
import { captureEmailSender } from "./ports/email-capture";

export interface Deps extends DbWithClock {
  email: EmailSender;
}

/**
 * Production sends real email (SES, once FOA's account exists; until then
 * it refuses). Every other environment captures, so no real email leaves
 * staging, previews or a local run, and codes stay readable.
 */
export function emailSenderFor(
  appEnv: Env["APP_ENV"],
  deps: DbWithClock
): EmailSender {
  return appEnv === "production"
    ? unconfiguredEmailSender
    : captureEmailSender(deps);
}

let production: Deps | undefined;

/** The app's deps, built on first use from `env()`. */
export function productionDeps(): Deps {
  production ??= {
    db,
    clock: systemClock,
    email: emailSenderFor(env().APP_ENV, { db, clock: systemClock }),
  };
  return production;
}
