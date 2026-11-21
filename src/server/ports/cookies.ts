// The cookie port: how a use case sets cookies on the response it runs
// for. Only the identity module uses it, to store the session cookie Better
// Auth issues. Adapters: Next's cookies() (src/server/ports/cookies-next.ts)
// in server actions and route handlers, and a browser-like fake for Seam 1
// (src/test/fakes/cookies.ts).

export type CookieOptions = {
  maxAge?: number | undefined;
  expires?: Date | undefined;
  domain?: string | undefined;
  path?: string | undefined;
  secure?: boolean | undefined;
  httpOnly?: boolean | undefined;
  sameSite?: "strict" | "lax" | "none" | undefined;
};

export interface CookieJar {
  /** Sets (or, with maxAge 0 or a past expiry, removes) a cookie. */
  set(name: string, value: string, options: CookieOptions): Promise<void>;
}
