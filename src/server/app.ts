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

import { headers } from "next/headers";

import type { Actor } from "./actor";
import { productionDeps, type Deps } from "./deps";
import { identityUseCases, resolveActor } from "./identity";
import { composeUseCases } from "./use-cases";

const useCases = composeUseCases(identityUseCases);

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

/**
 * Who is making the current request: the signed-in user or a visitor.
 * Reads the request's cookies, so a Server Component calls it under
 * <Suspense>, never at a layout's top level.
 */
export async function currentActor(): Promise<Actor> {
  // headers() first: while prerendering it postpones the render here,
  // before productionDeps() reads the runtime config, which a build lacks.
  const requestHeaders = await headers();
  return resolveActor(productionDeps(), requestHeaders);
}
