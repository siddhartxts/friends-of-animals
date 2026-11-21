// How modules contribute use cases to `as(actor)`. A module is a function
// from the use-case context to an object of named use cases:
//
//   export const identityUseCases = (ctx: UseCaseContext) => ({
//     requestEmailCode: (input: unknown) => requestEmailCode(ctx, input),
//   });
//
// `composeUseCases` merges modules into one flat set, as #55 writes them
// (`as(actor).requestEmailCode(...)`). Two modules naming the same use case
// fail type-checking, and throw if a cast hides it.

import type { Actor } from "./actor";
import type { Deps } from "./deps";

/** What every use case can reach: the deps and who is acting. */
export type UseCaseContext = Deps & { actor: Actor };

// `never[]` accepts a use case with any parameters.
type UseCase = (...input: never[]) => Promise<unknown>;

export type UseCaseModule = (ctx: UseCaseContext) => Record<string, UseCase>;

type UseCasesOf<M> = M extends (ctx: UseCaseContext) => infer R ? R : never;

type Merged<Modules extends readonly unknown[]> = Modules extends readonly [
  infer Head,
  ...infer Tail,
]
  ? UseCasesOf<Head> & Merged<Tail>
  : unknown;

type DuplicateNames<
  Modules extends readonly unknown[],
  Seen = never,
> = Modules extends readonly [infer Head, ...infer Tail]
  ? | (keyof UseCasesOf<Head> & Seen)
    | DuplicateNames<Tail, Seen | keyof UseCasesOf<Head>>
  : never;

/** `Modules` itself, or an impossible type naming the duplicates. */
type WithoutDuplicates<Modules extends readonly unknown[]> = [
  DuplicateNames<Modules>,
] extends [never]
  ? unknown
  : { useCaseDefinedInMoreThanOneModule: DuplicateNames<Modules> };

export function composeUseCases<const Modules extends readonly UseCaseModule[]>(
  ...modules: Modules & WithoutDuplicates<Modules>
): (ctx: UseCaseContext) => Merged<Modules> {
  return (ctx) => {
    const merged: Record<string, UseCase> = {};
    for (const useCaseModule of modules) {
      for (const [name, useCase] of Object.entries(useCaseModule(ctx))) {
        if (name in merged) {
          throw new Error(
            `Use case "${name}" is defined in more than one module`
          );
        }
        merged[name] = useCase;
      }
    }
    return merged as Merged<Modules>;
  };
}
