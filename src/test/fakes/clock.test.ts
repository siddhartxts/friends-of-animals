import { describe, expect, it } from "vitest";

import { FakeClock } from "./clock";

describe("FakeClock", () => {
  it("starts at the instant it is given", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    expect(clock.now().toISOString()).toBe("2027-01-15T04:30:00.000Z");
  });

  it("stands still until it is moved", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    expect(clock.now().getTime()).toBe(clock.now().getTime());
  });

  it("moves forward by a duration", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    clock.advance({ minutes: 10, seconds: 1 });
    expect(clock.now().toISOString()).toBe("2027-01-15T04:40:01.000Z");
    clock.advance({ days: 1, hours: 2 });
    expect(clock.now().toISOString()).toBe("2027-01-16T06:40:01.000Z");
    clock.advance(500);
    expect(clock.now().toISOString()).toBe("2027-01-16T06:40:01.500Z");
  });

  it("jumps to an instant", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    clock.set("2027-03-31T18:29:59.999Z");
    expect(clock.now().toISOString()).toBe("2027-03-31T18:29:59.999Z");
  });

  it("refuses to move backwards", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    expect(() => clock.advance({ minutes: -1 })).toThrow(/backwards/);
    expect(clock.now().toISOString()).toBe("2027-01-15T04:30:00.000Z");
  });

  it("hands out copies, so a caller can't change the time", () => {
    const clock = new FakeClock("2027-01-15T04:30:00.000Z");
    clock.now().setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe("2027-01-15T04:30:00.000Z");
  });
});
