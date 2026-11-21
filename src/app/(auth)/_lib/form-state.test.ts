import { describe, expect, it } from "vitest";

import { afterRequest, afterVerify, START } from "./form-state";

const asha = { email: "asha@example.test", name: "Asha Rao" };

describe("afterRequest", () => {
  it("moves on to the code once it is sent", () => {
    expect(afterRequest({ ok: true }, asha)).toEqual({
      step: "code",
      ...asha,
      sent: true,
    });
  });

  it("stays on the email step and marks the fields that were wrong", () => {
    expect(
      afterRequest(
        { ok: false, error: "invalid_input", fields: ["email"] },
        asha
      )
    ).toEqual({ step: "email", ...asha, fieldErrors: { email: true } });
  });

  it("says how many minutes to wait when rate limited, rounded up", () => {
    expect(
      afterRequest(
        { ok: false, error: "rate_limited", retryAfterSeconds: 61 },
        asha
      )
    ).toEqual({
      step: "email",
      ...asha,
      alert: "rate_limited",
      retryAfterMinutes: 2,
    });
  });
});

describe("afterVerify", () => {
  const onCode = { step: "code" as const, ...asha, sent: true };

  it("marks a wrong code on the code field", () => {
    expect(afterVerify({ ok: false, error: "code_invalid" }, onCode)).toEqual({
      step: "code",
      ...asha,
      fieldErrors: { code: true },
    });
  });

  it.each(["code_expired", "too_many_attempts", "no_account"] as const)(
    "explains %s for the whole form",
    (error) => {
      expect(afterVerify({ ok: false, error }, onCode)).toEqual({
        step: "code",
        ...asha,
        alert: error,
      });
    }
  );

  it("marks a missing name or a malformed code", () => {
    expect(
      afterVerify(
        { ok: false, error: "invalid_input", fields: ["name", "code"] },
        onCode
      )
    ).toEqual({
      step: "code",
      ...asha,
      fieldErrors: { name: true, code: true },
    });
  });
});

describe("START", () => {
  it("asks for the email first", () => {
    expect(START).toEqual({ step: "email", email: "", name: "" });
  });
});
