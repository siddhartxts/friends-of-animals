import { afterEach, vi } from "vitest";

// The harness fakes the system clock (Date only) so Better Auth's own
// expiry checks follow the test's fake clock. Undo it after every test.
afterEach(() => {
  vi.useRealTimers();
});
