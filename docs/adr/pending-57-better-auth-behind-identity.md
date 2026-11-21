---
Status: proposed
---

# Better Auth sits behind the identity module, with no HTTP handler

Sign-in uses Better Auth 1.7 (the locked stack) for one-time codes and
database sessions, but only the identity module calls it, always through
`as(actor)` use cases, and no `/api/auth/*` route is mounted. Better Auth's
own endpoints would let anyone request codes past FOA's per-email and per-IP
limits, which Better Auth doesn't have (its limiter keys on IP and path, in
memory by default). FOA owns those limits in Postgres, the decision of who may
act (`can()`), and the rule that the sign-in page never creates an account.
Better Auth owns code generation, hashed storage, expiry, attempt counting and
session cookies.

## Consequences

- A feature that needs a Better Auth endpoint (passkeys, OAuth callbacks)
  mounts only that path, behind its own use case or a matcher, never the
  catch-all.
- Better Auth reads the system clock for code and session expiry, so the Seam
  1 harness fakes `Date` in step with its fake clock.
- Better Auth requires an `account` table, which email codes never write to.
