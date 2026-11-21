# Seam 1: use-case tests

Almost every test calls use cases the way server actions and route handlers do,
`as(actor).<useCase>(input)`, through the harness in `src/test/harness.ts`. It
runs on PGlite with the real migrations, a fake clock and in-memory fakes at the
provider ports. Never mock an internal module.

## The template

```ts
import { describe, expect, it } from "vitest";

import { createHarness } from "@/test/harness";

describe("someUseCase", () => {
  it("does what the actor expects", async () => {
    const h = await createHarness();
    const member = await h.seed.member();

    const result = await h.as(h.visitor()).someUseCase({ email: member.email });

    expect(result).toEqual({ ok: true });
    expect(h.email.lastTo(member.email)?.subject).toBe("Your sign-in code");
  });
});
```

## What the harness gives a test

| Field              | What it is                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `h.as(actor)`      | The app's use cases, acting as `actor`, over the harness deps (`createApp(deps)` from `src/server/app.ts`) |
| `h.visitor(meta?)` | A signed-out actor with documentation IP `203.0.113.10`; pass `{ ip }` to vary it                          |
| `h.seed`           | Builders from `src/server/seed/` (`member()`, `preview()`), writing with this database and clock           |
| `h.clock`          | `FakeClock`: `now()`, `advance({ minutes: 10 })`, `set(instant)`. Starts at `DEFAULT_TEST_INSTANT`         |
| `h.email`          | `FakeEmail`: `sent`, `lastTo(address)`, `failNext(n, error)`                                               |
| `h.db`             | This test's database, for asserting on rows (audit rows count as behaviour)                                |
| `h.deps`           | `{ db, clock, email }`: what `productionDeps()` wires for real in `src/server/deps.ts`                     |

Each `createHarness()` builds a fresh database (a copy of a template that
`src/test/global-setup.ts` migrates once per `vitest run`, before any test, about
0.3 s) and fresh fakes, so tests share nothing and no test pays for the
migrations. In watch mode, restart Vitest after changing a migration.

## Rules

- Use cases read time only from `ctx.clock` and ids from `uuidv7(ctx.clock.now())`.
  Never `new Date()`, `Date.now()` or `process.env` in a use case.
- Assert on what the actor sees: return values, what another use case can then
  read, what the fakes received, and the rows a compliance rule cares about.
- A new module adds one facade to `composeUseCases(...)` in `src/server/app.ts`.
  Two modules naming the same use case fail type-checking.
- A new provider port gets a port file in `src/server/ports/`, a production
  adapter, an in-memory fake in `src/test/fakes/`, and a shared
  `<port>.contract.ts` that both pass. Add the port to `Deps`, `productionDeps()`
  and `createHarness()`.
- A new module with preview data adds one seeder to `seeders` in
  `src/server/seed/index.ts`. Seeders must be safe to run again.
