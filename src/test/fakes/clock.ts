import type { Clock } from "@/server/ports/clock";

/** A length of time: milliseconds, or named parts that are added up. */
export type Duration =
  | number
  | {
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
      milliseconds?: number;
    };

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function toMilliseconds(duration: Duration): number {
  if (typeof duration === "number") return duration;
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = duration;
  return (
    days * DAY +
    hours * HOUR +
    minutes * MINUTE +
    seconds * SECOND +
    (duration.milliseconds ?? 0)
  );
}

/** 10:00 IST on a weekday: the instant a test world starts at by default. */
export const DEFAULT_TEST_INSTANT = "2027-01-15T04:30:00.000Z";

/**
 * A clock that stands still until a test moves it, so time-based rules
 * (code expiry, rate-limit windows, deadlines) are tested without sleeping.
 */
export class FakeClock implements Clock {
  #now: number;

  constructor(start: Date | string = DEFAULT_TEST_INSTANT) {
    this.#now = new Date(start).getTime();
  }

  now(): Date {
    return new Date(this.#now);
  }

  /** Jumps to `instant`, in either direction. */
  set(instant: Date | string): void {
    this.#now = new Date(instant).getTime();
  }

  /** Moves time forward by `duration` and returns the new instant. */
  advance(duration: Duration): Date {
    const step = toMilliseconds(duration);
    if (step < 0) {
      throw new RangeError(
        "FakeClock.advance() never moves backwards; use set() to jump to an earlier instant"
      );
    }
    this.#now += step;
    return this.now();
  }
}
