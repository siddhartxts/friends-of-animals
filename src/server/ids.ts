// Internal ids are UUIDv7 (RFC 9562), made in the app from the injected
// clock: PGlite, which the tests run on, has no uuidv7() function, and a
// time-ordered id keeps index inserts local. Human-facing codes are separate.
//
// Loads under plain Node (seed script), so no "server-only" here.

/** Fills 10 bytes with randomness; tests may pass a fixed source. */
type RandomBytes = () => Uint8Array;

const cryptoRandom: RandomBytes = () =>
  crypto.getRandomValues(new Uint8Array(10));

/** A new UUIDv7 whose first 48 bits are `at` in Unix milliseconds. */
export function uuidv7(at: Date, random: RandomBytes = cryptoRandom): string {
  const bytes = new Uint8Array(16);
  const ms = at.getTime();
  // 48-bit big-endian timestamp. Bitwise operators work on 32 bits, so the
  // top 16 bits are split off by division.
  const high = Math.floor(ms / 2 ** 32);
  const low = ms >>> 0;
  bytes[0] = (high >>> 8) & 0xff;
  bytes[1] = high & 0xff;
  bytes[2] = (low >>> 24) & 0xff;
  bytes[3] = (low >>> 16) & 0xff;
  bytes[4] = (low >>> 8) & 0xff;
  bytes[5] = low & 0xff;
  bytes.set(random().subarray(0, 10), 6);
  bytes[6] = 0x70 | (bytes[6]! & 0x0f); // version 7
  bytes[8] = 0x80 | (bytes[8]! & 0x3f); // variant 10
  return formatUuid(
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
}

/** rand_b: the low 62 bits, under the variant bits. */
const RAND_B_BITS = 62n;
const RAND_B = (1n << RAND_B_BITS) - 1n;
/** rand_a: the 12 bits after the version nibble, at bit 64. */
const RAND_A = 0xfffn << 64n;
const RANDOM_BITS = 74n;

/**
 * A UUIDv7 source whose ids grow in the order it makes them while `at`
 * stays in one millisecond (RFC 9562 section 6.2, method 2): the first id
 * of a millisecond is random, and each next one adds 1 to its 74 random
 * bits. `uuidv7()` alone orders ids within a millisecond at random, so use
 * one source where rows made at the same instant must list in order.
 */
export function monotonicUuidv7(
  random: RandomBytes = cryptoRandom
): (at: Date) => string {
  let last: { ms: number; value: bigint } | undefined;
  return (at) => {
    const ms = at.getTime();
    const value =
      (last?.ms === ms ? nextInMillisecond(last.value) : undefined) ??
      BigInt(`0x${uuidv7(at, random).replaceAll("-", "")}`);
    last = { ms, value };
    return formatUuid(value.toString(16).padStart(32, "0"));
  };
}

/**
 * `value` with 1 added to its random bits, or undefined when they are all
 * ones (a chance of one in 2^74 for a random start); then the source starts
 * again from fresh randomness.
 */
function nextInMillisecond(value: bigint): bigint | undefined {
  const random = (((value & RAND_A) >> 64n) << RAND_B_BITS) | (value & RAND_B);
  const next = random + 1n;
  if (next >> RANDOM_BITS !== 0n) return undefined;
  return (
    (value & ~(RAND_A | RAND_B)) |
    ((next >> RAND_B_BITS) << 64n) |
    (next & RAND_B)
  );
}

/** 32 hex digits as 8-4-4-4-12. */
function formatUuid(hex: string): string {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
