import { getSessionCookie } from "better-auth/cookies";

/**
 * Whether the request carries a session cookie at all: a cheap, optimistic
 * check for src/proxy.ts. It proves nothing; pages still resolve the actor.
 */
export function hasSessionCookie(headers: Headers): boolean {
  return getSessionCookie(headers, { cookiePrefix: "foa" }) !== null;
}
