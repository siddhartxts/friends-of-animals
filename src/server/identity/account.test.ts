import { describe, expect, it } from "vitest";

import { createHarness } from "@/test/harness";

describe("getAccount", () => {
  it("shows a signed-in user their own account", async () => {
    const h = await createHarness();
    const member = await h.seed.member({
      name: "Asha Rao",
      email: "asha@example.test",
    });
    const asha = await h.signIn(member);

    expect(await h.as(asha).getAccount()).toEqual({
      name: "Asha Rao",
      email: "asha@example.test",
    });
  });

  it("is not for visitors", async () => {
    const h = await createHarness();
    await expect(h.as(h.visitor()).getAccount()).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("signOut", () => {
  it("ends the session, so the browser is a visitor again", async () => {
    const h = await createHarness();
    const asha = await h.signIn(await h.seed.member());

    await h.as(asha).signOut();

    expect((await h.currentActor()).kind).toBe("visitor");
    expect(h.cookies.header()).toBe("");
  });

  it("leaves the user's other sessions signed in", async () => {
    const h = await createHarness();
    const member = await h.seed.member();
    const laptop = await h.signIn(member);
    const laptopCookie = h.cookies.header();
    h.cookies.clear();
    const phone = await h.signIn(member);

    await h.as(phone).signOut();

    expect(await h.currentActor({}, laptopCookie)).toMatchObject({
      kind: "user",
      sessionId: laptop.kind === "user" ? laptop.sessionId : "",
    });
  });

  it("is not for visitors", async () => {
    const h = await createHarness();
    await expect(h.as(h.visitor()).signOut()).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});
