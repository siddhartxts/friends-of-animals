// Shared contract for every EmailSender adapter. The in-memory fake and the
// capture adapter both run it, so the fake stays faithful: a fake that passes
// a check the capture adapter fails is wrong. Only imported by *.test.ts.

import { describe, expect, it } from "vitest";

import type { FakeClock } from "@/test/fakes/clock";

import type { EmailSender, ReceivedEmail } from "./email";

export type EmailContractSetup = () => Promise<{
  sender: EmailSender;
  /** The recipient's messages as the adapter stores them, newest first. */
  inbox: (to: string) => Promise<ReceivedEmail[]>;
  clock: FakeClock;
}>;

export function emailSenderContract(name: string, setup: EmailContractSetup) {
  describe(`${name} (EmailSender contract)`, () => {
    it("delivers a message to its recipient's inbox", async () => {
      const { sender, inbox, clock } = await setup();
      await sender.send({
        to: "asha@example.test",
        subject: "Your sign-in code",
        text: "Your code is 123456.",
        html: "<p>Your code is <b>123456</b>.</p>",
      });

      expect(await inbox("asha@example.test")).toEqual([
        {
          to: "asha@example.test",
          subject: "Your sign-in code",
          text: "Your code is 123456.",
          html: "<p>Your code is <b>123456</b>.</p>",
          sentAt: clock.now(),
        },
      ]);
    });

    it("keeps each recipient's messages apart", async () => {
      const { sender, inbox } = await setup();
      await sender.send({ to: "asha@example.test", subject: "A", text: "a" });
      await sender.send({ to: "ravi@example.test", subject: "R", text: "r" });

      const subjects = (await inbox("ravi@example.test")).map(
        (message) => message.subject
      );
      expect(subjects).toEqual(["R"]);
      expect(await inbox("nobody@example.test")).toEqual([]);
    });

    it("lists the newest message first", async () => {
      const { sender, inbox, clock } = await setup();
      await sender.send({ to: "asha@example.test", subject: "1", text: "1" });
      clock.advance({ seconds: 30 });
      await sender.send({ to: "asha@example.test", subject: "2", text: "2" });

      const subjects = (await inbox("asha@example.test")).map(
        (message) => message.subject
      );
      expect(subjects).toEqual(["2", "1"]);
    });

    it("lists messages sent at the same instant newest first", async () => {
      // A code sent again within one millisecond of the first, as a test
      // that never advances the clock does.
      const { sender, inbox } = await setup();
      const sent = Array.from({ length: 10 }, (_, n) => String(n));
      for (const subject of sent) {
        await sender.send({ to: "asha@example.test", subject, text: subject });
      }

      const subjects = (await inbox("asha@example.test")).map(
        (message) => message.subject
      );
      expect(subjects).toEqual(sent.toReversed());
    });

    it("matches the recipient's address whatever its case", async () => {
      const { sender, inbox } = await setup();
      await sender.send({ to: " Asha@Example.TEST ", subject: "S", text: "t" });

      const [message] = await inbox("ASHA@example.test");
      expect(message?.to).toBe("asha@example.test");
    });

    it("leaves out the HTML part when the message has none", async () => {
      const { sender, inbox } = await setup();
      await sender.send({ to: "asha@example.test", subject: "S", text: "t" });

      const [message] = await inbox("asha@example.test");
      expect(message).toBeDefined();
      expect(message?.html).toBeUndefined();
    });
  });
}
