import { describe, expect, it } from "vitest";

import { monotonicUuidv7, uuidv7 } from "./ids";

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("is a version 7, RFC 9562 variant UUID", () => {
    expect(uuidv7(new Date("2027-01-15T04:30:00.000Z"))).toMatch(UUID_V7);
  });

  it("starts with the instant in milliseconds", () => {
    // 2027-01-15T04:30:00.000Z is 1799987400000 ms = 0x01a3179c0d40.
    const zeros = () => new Uint8Array(10);
    expect(uuidv7(new Date("2027-01-15T04:30:00.000Z"), zeros)).toBe(
      "01a3179c-0d40-7000-8000-000000000000"
    );
  });

  it("sorts ids made later after earlier ones", () => {
    const earlier = uuidv7(new Date("2027-01-15T04:30:00.000Z"));
    const later = uuidv7(new Date("2027-01-15T04:30:00.001Z"));
    expect([later, earlier].sort()).toEqual([earlier, later]);
  });

  it("differs between ids made in the same millisecond", () => {
    const at = new Date("2027-01-15T04:30:00.000Z");
    expect(uuidv7(at)).not.toBe(uuidv7(at));
  });
});

describe("monotonicUuidv7", () => {
  const at = new Date("2027-01-15T04:30:00.000Z");

  it("makes ids that sort in the order they were made, within one millisecond", () => {
    const next = monotonicUuidv7();
    const ids = Array.from({ length: 50 }, () => next(at));
    expect(new Set(ids).size).toBe(50);
    expect(ids.toSorted()).toEqual(ids);
    for (const id of ids) {
      expect(id).toMatch(UUID_V7);
      expect(id.startsWith("01a3179c-0d40-7")).toBe(true);
    }
  });

  it("adds one to the random bits, across the variant bits", () => {
    // rand_b (the low 62 bits) all ones: the next id carries into rand_a,
    // past the variant bits, and keeps version and variant intact.
    const lowFull = () =>
      new Uint8Array([0, 0, 0x3f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    const next = monotonicUuidv7(lowFull);
    expect(next(at)).toBe("01a3179c-0d40-7000-bfff-ffffffffffff");
    expect(next(at)).toBe("01a3179c-0d40-7001-8000-000000000000");

    const zeros = monotonicUuidv7(() => new Uint8Array(10));
    expect(zeros(at)).toBe("01a3179c-0d40-7000-8000-000000000000");
    expect(zeros(at)).toBe("01a3179c-0d40-7000-8000-000000000001");
  });

  it("starts from fresh randomness in a new millisecond", () => {
    const zeros = () => new Uint8Array(10);
    const next = monotonicUuidv7(zeros);
    next(at);
    next(at);
    const later = new Date("2027-01-15T04:30:00.001Z");
    expect(next(later)).toBe(uuidv7(later, zeros));
  });

  it("keeps each source's ids to itself", () => {
    const zeros = () => new Uint8Array(10);
    const first = monotonicUuidv7(zeros);
    const second = monotonicUuidv7(zeros);
    first(at);
    expect(second(at)).toBe(uuidv7(at, zeros));
  });
});
