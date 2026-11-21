import { describe, expect, it } from "vitest";

import { createTestDb } from "@/test/db";
import { FakeClock } from "@/test/fakes/clock";

import { captureEmailSender, readCapturedEmail } from "./email-capture";
import { emailSenderContract } from "./email.contract";

emailSenderContract("captureEmailSender", async () => {
  const db = await createTestDb();
  const clock = new FakeClock();
  return {
    sender: captureEmailSender({ db, clock }),
    inbox: (to) => readCapturedEmail(db, { to }),
    clock,
  };
});

describe("readCapturedEmail", () => {
  it("returns at most `limit` messages, newest first", async () => {
    const db = await createTestDb();
    const clock = new FakeClock();
    const sender = captureEmailSender({ db, clock });
    for (const subject of ["1", "2", "3"]) {
      await sender.send({ to: "asha@example.test", subject, text: subject });
      clock.advance({ seconds: 1 });
    }

    const latest = await readCapturedEmail(db, {
      to: "asha@example.test",
      limit: 2,
    });
    expect(latest.map((message) => message.subject)).toEqual(["3", "2"]);
  });
});
