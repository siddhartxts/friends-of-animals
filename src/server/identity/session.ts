import type { Actor } from "../actor";
import type { Deps } from "../deps";
import { authFor } from "./auth";
import { requestMeta } from "./request";

/**
 * Who is making a request: the signed-in user if its session cookie is
 * valid and the session hasn't expired or been ended, else a visitor.
 * Edges call it through `currentActor()`; Seam 1 through the harness.
 */
export async function resolveActor(
  deps: Deps,
  headers: Headers
): Promise<Actor> {
  const meta = requestMeta(headers);
  const found = await authFor(deps).api.getSession({
    headers,
    // A Server Component can't set cookies, so never extend a session
    // while rendering: the cookie and the database would disagree.
    query: { disableRefresh: true },
  });
  return found
    ? {
        kind: "user",
        userId: found.user.id,
        sessionId: found.session.id,
        meta,
      }
    : { kind: "visitor", meta };
}
