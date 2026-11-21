// A signed-in user's sessions: see where they are signed in, and sign out
// of one device or all of them (#57).

import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { session } from "../db/schema";
import type { UseCaseContext } from "../use-cases";
import { expireSessionCookie, signedInUser } from "./account";
import { authorize } from "./policy";

export type SessionSummary = {
  id: string;
  /** The session this request is acting through. */
  current: boolean;
  startedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export async function listSessions(
  ctx: UseCaseContext
): Promise<SessionSummary[]> {
  authorize(ctx.actor, "listSessions");
  const { userId, sessionId } = signedInUser(ctx);
  const rows = await ctx.db
    .select({
      id: session.id,
      startedAt: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(
      and(eq(session.userId, userId), gt(session.expiresAt, ctx.clock.now()))
    )
    .orderBy(desc(session.createdAt), desc(session.id));
  return rows.map((row) => ({ ...row, current: row.id === sessionId }));
}

const signOutSessionInput = z.object({ sessionId: z.uuid() });

export type SignOutSessionInput = z.input<typeof signOutSessionInput>;

export type SignOutSessionResult =
  | { ok: true; /** It was this browser's session. */ signedOutHere: boolean }
  | { ok: false; error: "not_found" };

/**
 * Signs one of the user's sessions out. Another user's session, or an id
 * that isn't a session, is "not found": the answer never says which.
 */
export async function signOutSession(
  ctx: UseCaseContext,
  input: SignOutSessionInput
): Promise<SignOutSessionResult> {
  authorize(ctx.actor, "signOutSession");
  const { userId, sessionId: currentId } = signedInUser(ctx);
  const parsed = signOutSessionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "not_found" };

  const deleted = await ctx.db
    .delete(session)
    .where(
      and(eq(session.id, parsed.data.sessionId), eq(session.userId, userId))
    )
    .returning({ id: session.id });
  if (deleted.length === 0) return { ok: false, error: "not_found" };

  const signedOutHere = parsed.data.sessionId === currentId;
  if (signedOutHere) await expireSessionCookie(ctx);
  return { ok: true, signedOutHere };
}

/** Signs every one of the user's sessions out, this one included. */
export async function signOutEverywhere(ctx: UseCaseContext): Promise<void> {
  authorize(ctx.actor, "signOutEverywhere");
  const { userId } = signedInUser(ctx);
  await ctx.db.delete(session).where(eq(session.userId, userId));
  await expireSessionCookie(ctx);
}
