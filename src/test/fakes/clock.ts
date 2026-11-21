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

  readonly #onChange: ((now: Date) => void) | undefined;

  /**
   * `onChange` hears every move. The harness uses it to keep the system
   * clock (which Better Auth reads) on the same instant.
   */
  constructor(
    start: Date | string = DEFAULT_TEST_INSTANT,
    { onChange }: { onChange?: (now: Date) => void } = {}
  ) {
    this.#now = new Date(start).getTime();
    this.#onChange = onChange;
    onChange?.(this.now());
  }

  now(): Date {
    return new Date(this.#now);
  }

  /** Jumps to `instant`, in either direction. */
  set(instant: Date | string): void {
    this.#now = new Date(instant).getTime();
    this.#onChange?.(this.now());
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
    this.#onChange?.(this.now());
    return this.now();
  }
}
