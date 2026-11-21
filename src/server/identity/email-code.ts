// Sign-up and sign-in by email one-time code.
//
//   requestEmailCode({ email })                      → a code by email
//   verifyEmailCode({ intent, email, code, name? })  → signed in
//
// Codes are only ever emailed, whatever the address, so a request never
// reveals whether an account exists; verifying needs the code, so saying
// "no account" there reveals nothing to someone without the mailbox.

import { isAPIError } from "better-auth/api";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { RequestMeta } from "../actor";
import { user } from "../db/schema";
import type { CookieJar } from "../ports/cookies";
import type { UseCaseContext } from "../use-cases";
import { authFor } from "./auth";
import { authorize } from "./policy";
import { takeCodeAllowance } from "./rate-limit";
import { headersFor } from "./request";
import { EMAIL_CODE } from "./settings";

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const code = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${EMAIL_CODE.length}}$`));

const requestEmailCodeInput = z.object({ email });

const verifyEmailCodeInput = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("sign-up"),
    name: z.string().trim().min(1).max(100),
    email,
    code,
  }),
  z.object({ intent: z.literal("sign-in"), email, code }),
]);

export type RequestEmailCodeInput = z.input<typeof requestEmailCodeInput>;
export type VerifyEmailCodeInput = z.input<typeof verifyEmailCodeInput>;

type InvalidInput = { ok: false; error: "invalid_input"; fields: string[] };

export type RequestEmailCodeResult =
  | { ok: true }
  | InvalidInput
  | { ok: false; error: "rate_limited"; retryAfterSeconds: number };

export type VerifyEmailCodeResult =
  | { ok: true; userId: string; isNewAccount: boolean }
  | InvalidInput
  | {
      ok: false;
      error:
        | "code_invalid"
        | "code_expired"
        | "too_many_attempts"
        | "no_account";
    };

function invalidInput(error: z.ZodError): InvalidInput {
  const fields = new Set(error.issues.map((issue) => String(issue.path[0])));
  return { ok: false, error: "invalid_input", fields: [...fields] };
}

/** The visitor's request details; `authorize` has ruled out other actors. */
function visitorMeta(ctx: UseCaseContext): RequestMeta {
  if (ctx.actor.kind !== "visitor") throw new Error("unreachable");
  return ctx.actor.meta;
}

export async function requestEmailCode(
  ctx: UseCaseContext,
  input: RequestEmailCodeInput
): Promise<RequestEmailCodeResult> {
  authorize(ctx.actor, "requestEmailCode");
  const meta = visitorMeta(ctx);
  const parsed = requestEmailCodeInput.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);

  const allowance = await takeCodeAllowance(ctx.db, {
    email: parsed.data.email,
    ip: meta.ip,
    now: ctx.clock.now(),
    secret: ctx.auth.secret,
  });
  if (!allowance.ok) {
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: allowance.retryAfterSeconds,
    };
  }

  await authFor(ctx).api.sendVerificationOTP({
    body: { email: parsed.data.email, type: "sign-in" },
    headers: headersFor(meta),
  });
  return { ok: true };
}

const CODE_ERRORS = {
  INVALID_OTP: "code_invalid",
  OTP_EXPIRED: "code_expired",
  TOO_MANY_ATTEMPTS: "too_many_attempts",
} as const;

/** A wrong, expired or exhausted code, as a result; anything else rethrows. */
function codeError(error: unknown) {
  const reason = isAPIError(error) ? error.body?.code : undefined;
  if (reason && reason in CODE_ERRORS) {
    return {
      ok: false as const,
      error: CODE_ERRORS[reason as keyof typeof CODE_ERRORS],
    };
  }
  throw error;
}

async function storeCookies(jar: CookieJar, headers: Headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return;
  for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
    await jar.set(name, attributes.value, toCookieOptions(attributes));
  }
}

export async function verifyEmailCode(
  ctx: UseCaseContext,
  input: VerifyEmailCodeInput
): Promise<VerifyEmailCodeResult> {
  authorize(ctx.actor, "verifyEmailCode");
  const meta = visitorMeta(ctx);
  const parsed = verifyEmailCodeInput.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error);
  const { data } = parsed;
  const auth = authFor(ctx);

  const [existing] = await ctx.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, data.email));

  if (data.intent === "sign-in" && !existing) {
    // Never create an account from the sign-in page. Better Auth checks the
    // code first (a wrong guess counts) and only then reports that no user
    // has the address, leaving a right code unused.
    try {
      await auth.api.checkVerificationOTP({
        body: { email: data.email, type: "sign-in", otp: data.code },
      });
    } catch (error) {
      if (isAPIError(error) && error.body?.code === "USER_NOT_FOUND") {
        return { ok: false, error: "no_account" };
      }
      return codeError(error);
    }
    // The account appeared meanwhile: sign in to it.
  }

  try {
    const { headers, response } = await auth.api.signInEmailOTP({
      body: {
        email: data.email,
        otp: data.code,
        ...(data.intent === "sign-up" ? { name: data.name } : {}),
      },
      headers: headersFor(meta),
      returnHeaders: true,
    });
    await storeCookies(ctx.cookies, headers);
    return { ok: true, userId: response.user.id, isNewAccount: !existing };
  } catch (error) {
    return codeError(error);
  }
}
