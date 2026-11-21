// Better Auth, configured for FOA and kept behind the identity module: only
// files in src/server/identity/ import it. It owns sign-in codes (made,
// hashed, expired and counted by its email-OTP plugin) and database
// sessions. FOA adds what it lacks: per-email and per-IP limits on codes
// (./rate-limit.ts), the use cases and can() (./policy.ts).
//
// No /api/auth/* route handler is mounted: every call goes through a use
// case, so Better Auth's own endpoints (which would skip FOA's limits) are
// not reachable over HTTP.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";

import type { AppDb } from "../db/app-db";
import { account, session, user, verification } from "../db/schema";
import type { Deps } from "../deps";
import { uuidv7 } from "../ids";
import { codeEmail } from "./code-email";
import { EMAIL_CODE, SESSION_LIFETIME_DAYS } from "./settings";

const DAY_SECONDS = 24 * 60 * 60;

function createAuth({ db, clock, email, auth: config }: Deps) {
  return betterAuth({
    appName: "Friends of Animals",
    baseURL: config.baseUrl,
    secret: config.secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: SESSION_LIFETIME_DAYS * DAY_SECONDS,
      updateAge: DAY_SECONDS,
    },
    // FOA limits codes per email and per IP in Postgres; Better Auth's own
    // limiter keys on IP and path only, and its default store is memory,
    // which serverless instances don't share.
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
    advanced: {
      cookiePrefix: "foa",
      database: { generateId: () => uuidv7(clock.now()) },
      // Vercel sets x-forwarded-for to the client's address.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    plugins: [
      emailOTP({
        otpLength: EMAIL_CODE.length,
        expiresIn: EMAIL_CODE.lifetimeMinutes * 60,
        allowedAttempts: EMAIL_CODE.attempts,
        storeOTP: "hashed",
        // Straight through the email port, not the outbox (#55 ruling).
        async sendVerificationOTP({ email: to, otp }) {
          await email.send(codeEmail(to, otp, EMAIL_CODE.lifetimeMinutes));
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

// One Better Auth instance per database: production has one; each Seam 1
// harness has its own.
const instances = new WeakMap<AppDb, Auth>();

export function authFor(deps: Deps): Auth {
  let auth = instances.get(deps.db);
  if (!auth) {
    auth = createAuth(deps);
    instances.set(deps.db, auth);
  }
  return auth;
}
