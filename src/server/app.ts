// The Seam 1 entry point. Server actions and route handlers call
//
//   await as(actor).someUseCase(input)
//
// and Seam 1 tests call the same use cases through the harness
// (src/test/harness.ts), which builds the app over PGlite, a fake clock and
// in-memory fakes with `createApp(deps)`.
//
// Each module adds one entry to `useCases` below.

import "server-only";

import type { Actor } from "./actor";
import { productionDeps, type Deps } from "./deps";
import { composeUseCases } from "./use-cases";

const useCases = composeUseCases();

/** Every use case, by name, bound to one actor. */
export type UseCases = ReturnType<typeof useCases>;

export type App = {
  /** The use cases, acting as `actor`. */
  as(actor: Actor): UseCases;
};

export function createApp(deps: Deps): App {
  return { as: (actor) => useCases({ ...deps, actor }) };
}

/** The production app's use cases, acting as `actor`. */
export function as(actor: Actor): UseCases {
  return createApp(productionDeps()).as(actor);
}
