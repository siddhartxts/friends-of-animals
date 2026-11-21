// Who is acting. Every use case receives the actor through `as(actor)`;
// server actions and route handlers resolve it from the session and the
// request, tests build it with the harness. Roles (#59) and the second
// factor (#60) become fields on the user actor when those tickets land.

/** What the request tells us about the caller. Never logged. */
export type RequestMeta = {
  /** The client IP, from x-forwarded-for as Vercel sets it. */
  ip: string;
  userAgent: string;
};

export type Actor =
  /** Not signed in. */
  | { kind: "visitor"; meta: RequestMeta }
  /** Signed in, through one session. */
  | { kind: "user"; userId: string; sessionId: string; meta: RequestMeta }
  /** The platform itself: the seed command, the worker (#61), a CLI. */
  | { kind: "system"; process: "seed" | "worker" | "cli" };
