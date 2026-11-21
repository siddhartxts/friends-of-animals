import { describe, expect, it } from "vitest";

import { bypassSecretFor } from "./vercel-bypass";

const env = {
  VERCEL_AUTOMATION_BYPASS_SECRET: "abcdefghijklmnopqrstuvwxyz012345",
};

describe("bypassSecretFor", () => {
  it.each([
    [
      "a preview deployment",
      "https://friends-of-animals-4u0381uwy-bitacu1.vercel.app",
    ],
    [
      "a branch URL",
      "https://friends-of-animals-git-ticket29-bitacu1.vercel.app",
    ],
  ])("gives the secret to %s of this project", (_, url) => {
    expect(bypassSecretFor(url, env)).toBe(env.VERCEL_AUTOMATION_BYPASS_SECRET);
  });

  it.each([
    ["a local server", "http://localhost:3000"],
    ["staging", "https://shipped-it.dev"],
    ["plain http", "http://friends-of-animals-4u0381uwy-bitacu1.vercel.app"],
    [
      "another Vercel project",
      "https://someone-else-abc123-bitacu1.vercel.app",
    ],
    [
      "another Vercel team",
      "https://friends-of-animals-abc123-other-team.vercel.app",
    ],
    [
      "a look-alike host",
      "https://friends-of-animals-x-bitacu1.vercel.app.example.com",
    ],
  ])("never gives the secret to %s", (_, url) => {
    expect(bypassSecretFor(url, env)).toBeUndefined();
  });

  it("has nothing to give when no secret is set", () => {
    expect(
      bypassSecretFor(
        "https://friends-of-animals-4u0381uwy-bitacu1.vercel.app",
        {}
      )
    ).toBeUndefined();
  });
});
