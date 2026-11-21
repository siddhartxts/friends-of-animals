import { describe, expect, it } from "vitest";

import pkg from "../package.json" with { type: "json" };

/** The commands of `pnpm vercel-build`, in the order they run. */
const steps = pkg.scripts["vercel-build"]
  .split("&&")
  .map((step) => step.trim());

describe("vercel-build", () => {
  it("seeds the database the migration just ran on, before building", () => {
    // scripts/seed.ts fills only preview and local databases and exits 0
    // without connecting on staging and production, so every deployment
    // can run it.
    const migrate = steps.indexOf("pnpm db:migrate");
    expect(migrate).toBe(0);
    expect(steps[migrate + 1]).toBe("pnpm db:seed");
    expect(steps.indexOf("pnpm db:seed")).toBeLessThan(
      steps.indexOf("next build")
    );
  });

  it("still builds and checks the build", () => {
    expect(steps.slice(-2)).toEqual(["next build", "pnpm check:build"]);
  });
});
