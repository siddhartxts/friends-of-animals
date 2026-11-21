import "server-only";

import { cookies } from "next/headers";

import type { CookieJar } from "./cookies";

/**
 * Sets cookies on the current response. Works in Server Actions and Route
 * Handlers; a Server Component render can't set cookies, so use cases that
 * set them are only called from actions.
 */
export const nextCookieJar: CookieJar = {
  async set(name, value, options) {
    (await cookies()).set(name, value, options);
  },
};
