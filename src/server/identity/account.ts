// A signed-in user's own account and session.

import { and, eq } from "drizzle-orm";

import { session, user } from "../db/schema";
import type { UseCaseContext } from "../use-cases";
import { authFor } from "./auth";
import { authorize } from "./policy";

export type Account = { name: string; email: string };

/** The signed-in user; `authorize` has ruled out other actors. */
export function signedInUser(ctx: UseCaseContext) {
  if (ctx.actor.kind !== "user") throw new Error("unreachable");
  return ctx.actor;
}

export async function getAccount(ctx: UseCaseContext): Promise<Account> {
  authorize(ctx.actor, "getAccount");
  const { userId } = signedInUser(ctx);
  const [account] = await ctx.db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId));
  if (!account) throw new Error("The signed-in user has no account row");
  return account;
}

/** Removes the browser's session cookie. */
export async function expireSessionCookie(ctx: UseCaseContext): Promise<void> {
  const { name, attributes } = (await authFor(ctx).$context).authCookies
    .sessionToken;
  await ctx.cookies.set(name, "", {
    path: attributes.path,
    secure: attributes.secure,
    httpOnly: attributes.httpOnly,
    sameSite: attributes.sameSite?.toLowerCase() as
      | "strict"
      | "lax"
      | "none"
      | undefined,
    maxAge: 0,
  });
}

/** Ends the session the user is acting through; other sessions stay. */
export async function signOut(ctx: UseCaseContext): Promise<void> {
  authorize(ctx.actor, "signOut");
  const { userId, sessionId } = signedInUser(ctx);
  await ctx.db
    .delete(session)
    .where(and(eq(session.id, sessionId), eq(session.userId, userId)));
  await expireSessionCookie(ctx);
}
