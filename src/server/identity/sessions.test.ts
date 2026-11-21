import { describe, expect, it } from "vitest";

import type { Actor } from "@/server/actor";
import { createHarness, type Harness } from "@/test/harness";

const LAPTOP = { ip: "198.51.100.1", userAgent: "Laptop browser" };
const PHONE = { ip: "198.51.100.2", userAgent: "Phone browser" };

function sessionIdOf(actor: Actor): string {
  if (actor.kind !== "user") throw new Error("not signed in");
  return actor.sessionId;
}

/** A member signed in on a laptop, then a phone; each browser's cookie. */
async function memberOnTwoDevices(h: Harness) {
  const member = await h.seed.member();
  const laptop = await h.signIn(member, LAPTOP);
  const laptopCookie = h.cookies.header();
  h.clock.advance({ hours: 2 });
  h.cookies.clear();
  const phone = await h.signIn(member, PHONE);
  const phoneCookie = h.cookies.header();
  return { member, laptop, laptopCookie, phone, phoneCookie };
}

describe("listSessions", () => {
  it("lists the user's own sessions, newest first, marking this one", async () => {
    const h = await createHarness();
    const { laptop, phone } = await memberOnTwoDevices(h);
    h.cookies.clear();
    await h.signIn(await h.seed.member());

    const sessions = await h.as(phone).listSessions();

    expect(sessions).toEqual([
      {
        id: sessionIdOf(phone),
        current: true,
        startedAt: new Date("2027-01-15T06:30:00.000Z"),
        ipAddress: PHONE.ip,
        userAgent: PHONE.userAgent,
      },
      {
        id: sessionIdOf(laptop),
        current: false,
        startedAt: new Date("2027-01-15T04:30:00.000Z"),
        ipAddress: LAPTOP.ip,
        userAgent: LAPTOP.userAgent,
      },
    ]);
  });

  it("leaves out sessions that have expired", async () => {
    const h = await createHarness();
    const member = await h.seed.member();
    await h.signIn(member, LAPTOP);
    h.clock.advance({ days: 30, seconds: 1 });
    h.cookies.clear();
    const phone = await h.signIn(member, PHONE);

    const sessions = await h.as(phone).listSessions();

    expect(sessions.map((session) => session.id)).toEqual([sessionIdOf(phone)]);
  });

  it("is not for visitors", async () => {
    const h = await createHarness();
    await expect(h.as(h.visitor()).listSessions()).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("signOutSession", () => {
  it("signs another of the user's devices out", async () => {
    const h = await createHarness();
    const { laptop, laptopCookie, phone, phoneCookie } =
      await memberOnTwoDevices(h);

    const result = await h
      .as(phone)
      .signOutSession({ sessionId: sessionIdOf(laptop) });

    expect(result).toEqual({ ok: true, signedOutHere: false });
    expect((await h.currentActor(LAPTOP, laptopCookie)).kind).toBe("visitor");
    expect(await h.currentActor(PHONE, phoneCookie)).toMatchObject({
      kind: "user",
      sessionId: sessionIdOf(phone),
    });
  });

  it("signs this browser out when it names this session", async () => {
    const h = await createHarness();
    const { phone } = await memberOnTwoDevices(h);

    const result = await h
      .as(phone)
      .signOutSession({ sessionId: sessionIdOf(phone) });

    expect(result).toEqual({ ok: true, signedOutHere: true });
    expect((await h.currentActor(PHONE)).kind).toBe("visitor");
  });

  it("refuses another user's session, and leaves it signed in", async () => {
    const h = await createHarness();
    const { phone } = await memberOnTwoDevices(h);
    h.cookies.clear();
    const other = await h.signIn(await h.seed.member());
    const otherCookie = h.cookies.header();

    const result = await h
      .as(phone)
      .signOutSession({ sessionId: sessionIdOf(other) });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(await h.currentActor({}, otherCookie)).toMatchObject({
      kind: "user",
      sessionId: sessionIdOf(other),
    });
  });

  it("refuses something that isn't a session id", async () => {
    const h = await createHarness();
    const { phone } = await memberOnTwoDevices(h);

    expect(
      await h.as(phone).signOutSession({ sessionId: "not-a-session" })
    ).toEqual({ ok: false, error: "not_found" });
  });

  it("is not for visitors", async () => {
    const h = await createHarness();
    const { laptop } = await memberOnTwoDevices(h);
    await expect(
      h.as(h.visitor()).signOutSession({ sessionId: sessionIdOf(laptop) })
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("signOutEverywhere", () => {
  it("signs every one of the user's devices out, and only theirs", async () => {
    const h = await createHarness();
    const { laptopCookie, phone, phoneCookie } = await memberOnTwoDevices(h);
    h.cookies.clear();
    const other = await h.signIn(await h.seed.member());
    const otherCookie = h.cookies.header();

    await h.as(phone).signOutEverywhere();

    expect((await h.currentActor(LAPTOP, laptopCookie)).kind).toBe("visitor");
    expect((await h.currentActor(PHONE, phoneCookie)).kind).toBe("visitor");
    expect(await h.currentActor({}, otherCookie)).toMatchObject({
      sessionId: sessionIdOf(other),
    });
  });

  it("is not for visitors", async () => {
    const h = await createHarness();
    await expect(h.as(h.visitor()).signOutEverywhere()).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});
