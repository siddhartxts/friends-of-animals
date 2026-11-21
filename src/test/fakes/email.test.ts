import { describe, expect, it } from "vitest";

import { emailSenderContract } from "@/server/ports/email.contract";

import { FakeClock } from "./clock";
import { FakeEmail } from "./email";

emailSenderContract("FakeEmail", async () => {
  const clock = new FakeClock();
  const email = new FakeEmail(clock);
  return {
    sender: email,
    inbox: async (to) => email.inbox(to),
    clock,
  };
});

describe("FakeEmail", () => {
  it("records every message sent, oldest first", async () => {
    const email = new FakeEmail(new FakeClock());
    await email.send({ to: "a@example.test", subject: "1", text: "1" });
    await email.send({ to: "b@example.test", subject: "2", text: "2" });

    expect(email.sent.map((message) => message.subject)).toEqual(["1", "2"]);
  });

  it("finds the last message to an address", async () => {
    const email = new FakeEmail(new FakeClock());
    await email.send({ to: "a@example.test", subject: "first", text: "1" });
    await email.send({ to: "a@example.test", subject: "second", text: "2" });

    expect(email.lastTo("A@example.test")?.subject).toBe("second");
    expect(email.lastTo("b@example.test")).toBeUndefined();
  });

  it("fails the next sends when told to, then recovers", async () => {
    const email = new FakeEmail(new FakeClock());
    email.failNext(2, new Error("SES is down"));

    const message = { to: "a@example.test", subject: "S", text: "t" };
    await expect(email.send(message)).rejects.toThrow("SES is down");
    await expect(email.send(message)).rejects.toThrow("SES is down");
    await email.send(message);

    expect(email.sent).toHaveLength(1);
  });
});
