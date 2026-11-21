// Postgres-backed limits on sign-in codes, per email address and per IP
// (#55: "Postgres-backed rate limits apply per identifier and per IP").
// Fixed windows: each request adds one to its email's and its IP's counter
// for the current window with an atomic upsert; a request that would pass
// either limit is rolled back, so refused requests don't count. Keys are
// HMACs, so the table holds no address or IP.

import { createHmac } from "node:crypto";

import { and, lt, sql } from "drizzle-orm";

import type { AppDb } from "../db/app-db";
import { otpRateLimit } from "../db/schema";
import { CODE_REQUEST_LIMITS } from "./settings";

const WINDOW_MS = CODE_REQUEST_LIMITS.windowMinutes * 60 * 1000;

type Allowance = { ok: true } | { ok: false; retryAfterSeconds: number };

class LimitReached extends Error {}

function keyHash(secret: string, scope: "email" | "ip", value: string) {
  return createHmac("sha256", secret)
    .update(`otp-rate-limit:${scope}:${value}`)
    .digest("base64url");
}

/**
 * Takes one code from the email's and the IP's allowance for this window,
 * or reports when the next window opens.
 */
export async function takeCodeAllowance(
  db: AppDb,
  {
    email,
    ip,
    now,
    secret,
  }: { email: string; ip: string; now: Date; secret: string }
): Promise<Allowance> {
  const windowStart = new Date(
    Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS
  );
  const retryAfterSeconds = Math.ceil(
    (windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000
  );
  const counters = [
    { scope: "email", key: email, limit: CODE_REQUEST_LIMITS.perEmail },
    { scope: "ip", key: ip, limit: CODE_REQUEST_LIMITS.perIp },
  ] as const;

  try {
    await db.transaction(async (tx) => {
      for (const { scope, key, limit } of counters) {
        const [row] = await tx
          .insert(otpRateLimit)
          .values({
            scope,
            keyHash: keyHash(secret, scope, key),
            windowStart,
            count: 1,
          })
          .onConflictDoUpdate({
            target: [
              otpRateLimit.scope,
              otpRateLimit.keyHash,
              otpRateLimit.windowStart,
            ],
            set: { count: sql`${otpRateLimit.count} + 1` },
          })
          .returning({ count: otpRateLimit.count });
        if (!row || row.count > limit) throw new LimitReached();
      }
      // Windows that ended a day ago are of no further use.
      await tx
        .delete(otpRateLimit)
        .where(
          and(
            lt(
              otpRateLimit.windowStart,
              new Date(now.getTime() - 24 * 3600_000)
            )
          )
        );
    });
  } catch (error) {
    if (error instanceof LimitReached) return { ok: false, retryAfterSeconds };
    throw error;
  }
  return { ok: true };
}
