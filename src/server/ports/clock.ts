/**
 * The time source for use cases. They read the time only from here, never
 * from `new Date()` or `Date.now()`, so tests can drive time with a fake
 * clock (src/test/fakes/clock.ts) instead of sleeping.
 */
export interface Clock {
  /** The current instant. Each call returns a new Date. */
  now(): Date;
}

/** The real clock, used everywhere outside tests. */
export const systemClock: Clock = {
  now: () => new Date(),
};
