import type { CookieJar, CookieOptions } from "@/server/ports/cookies";

import type { FakeClock } from "./clock";

/**
 * A browser's cookie store for Seam 1: it keeps what use cases set, drops
 * expired cookies, and sends the rest back as a Cookie header, so a test can
 * make the "next request" as the same browser.
 */
export class FakeCookieJar implements CookieJar {
  readonly #clock: FakeClock;
  readonly #cookies = new Map<string, { value: string; expiresAt?: Date }>();

  constructor(clock: FakeClock) {
    this.#clock = clock;
  }

  async set(name: string, value: string, options: CookieOptions) {
    const expiresAt =
      options.maxAge === undefined
        ? options.expires
        : new Date(this.#clock.now().getTime() + options.maxAge * 1000);
    if (expiresAt && expiresAt <= this.#clock.now()) {
      this.#cookies.delete(name);
    } else {
      this.#cookies.set(name, { value, expiresAt });
    }
  }

  /** The Cookie header this browser would send now. */
  header(): string {
    const now = this.#clock.now();
    return [...this.#cookies]
      .filter(([, cookie]) => !cookie.expiresAt || cookie.expiresAt > now)
      .map(([name, cookie]) => `${name}=${cookie.value}`)
      .join("; ");
  }

  /** Forgets every cookie, like a new browser. */
  clear(): void {
    this.#cookies.clear();
  }
}
