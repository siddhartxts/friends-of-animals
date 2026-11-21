import { describe, expect, it } from "vitest";

import { createTestDb } from "@/test/db";
import { FakeClock } from "@/test/fakes/clock";

import { emailSenderFor } from "./deps";
import { EmailNotConfiguredError } from "./ports/email";
import { readCapturedEmail } from "./ports/email-capture";

const message = { to: "asha@example.test", subject: "Code", text: "123456" };

describe("emailSenderFor", () => {
  it.each(["local", "preview", "staging"] as const)(
    "captures email on %s instead of sending it",
    async (appEnv) => {
      const db = await createTestDb();
      const sender = emailSenderFor(appEnv, { db, clock: new FakeClock() });

      await sender.send(message);

      const inbox = await readCapturedEmail(db, { to: message.to });
      expect(inbox.map((received) => received.text)).toEqual(["123456"]);
    }
  );

  it("never captures in production, and refuses while SES is not wired", async () => {
    const db = await createTestDb();
    const sender = emailSenderFor("production", { db, clock: new FakeClock() });

    await expect(sender.send(message)).rejects.toBeInstanceOf(
      EmailNotConfiguredError
    );
    expect(await readCapturedEmail(db, { to: message.to })).toEqual([]);
  });
});
