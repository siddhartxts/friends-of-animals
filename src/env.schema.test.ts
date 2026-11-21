import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  buildEnvSchema,
  envSchema,
  migrationEnvSchema,
  parseEnv,
} from "./env.schema";

const DATABASE_URL = "postgres://foa:foa@localhost:5432/foa";
const SITE = "https://shipped-it.dev";
const SECRET = "0123456789abcdef0123456789abcdef";

describe("parseEnv", () => {
  it("treats empty strings as unset", () => {
    const config = parseEnv(buildEnvSchema, { APP_ENV: "", APP_URL: "" });
    expect(config.APP_ENV).toBe("local");
    expect(config.APP_URL).toBe("http://localhost:3000");
    expect(() => parseEnv(envSchema, { DATABASE_URL: "" })).toThrow(
      /DATABASE_URL is not set/
    );
  });

  it("drops variables the schema doesn't name", () => {
    expect(parseEnv(buildEnvSchema, { HOME: "/root" })).not.toHaveProperty(
      "HOME"
    );
  });

  it("lists every invalid variable in one error", () => {
    const schema = z.object({ A: z.string(), B: z.string() });
    expect(() => parseEnv(schema, {})).toThrow(
      /^Invalid environment configuration:\n[\s\S]*\bA\b[\s\S]*\bB\b/
    );
  });
});

describe("buildEnvSchema", () => {
  it("needs nothing, so `next build` runs without a database or secrets", () => {
    expect(parseEnv(buildEnvSchema, {})).toEqual({
      NODE_ENV: "development",
      APP_ENV: "local",
      APP_URL: "http://localhost:3000",
    });
  });

  it("accepts every APP_ENV and rejects anything else", () => {
    for (const appEnv of ["local", "preview", "staging", "production"]) {
      expect(
        parseEnv(buildEnvSchema, { APP_ENV: appEnv, APP_URL: SITE }).APP_ENV
      ).toBe(appEnv);
    }
    expect(() => parseEnv(buildEnvSchema, { APP_ENV: "prod" })).toThrow(
      /APP_ENV/
    );
  });

  it("requires APP_URL on every APP_ENV but local", () => {
    for (const appEnv of ["preview", "staging", "production"]) {
      expect(() => parseEnv(buildEnvSchema, { APP_ENV: appEnv })).toThrow(
        /APP_URL is not set[\s\S]*at APP_URL/
      );
    }
    expect(parseEnv(buildEnvSchema, { APP_ENV: "local" }).APP_URL).toBe(
      "http://localhost:3000"
    );
  });

  it("defaults a preview's APP_URL to its Vercel branch URL", () => {
    const vercel = {
      VERCEL: "1",
      APP_ENV: "preview",
      VERCEL_BRANCH_URL: "foa-git-map-foa.vercel.app",
      VERCEL_URL: "foa-abc123-foa.vercel.app",
    };
    expect(parseEnv(buildEnvSchema, vercel)).toEqual({
      NODE_ENV: "development",
      APP_ENV: "preview",
      APP_URL: "https://foa-git-map-foa.vercel.app",
    });
    expect(
      parseEnv(buildEnvSchema, { ...vercel, VERCEL_BRANCH_URL: "" }).APP_URL
    ).toBe("https://foa-abc123-foa.vercel.app");
    expect(parseEnv(buildEnvSchema, { ...vercel, APP_URL: SITE }).APP_URL).toBe(
      SITE
    );
  });

  it("says so when a preview has neither APP_URL nor a Vercel URL", () => {
    expect(() =>
      parseEnv(buildEnvSchema, { VERCEL: "1", APP_ENV: "preview" })
    ).toThrow(/APP_URL is not set[\s\S]*VERCEL_BRANCH_URL[\s\S]*at APP_URL/);
  });

  it("never defaults APP_URL on staging or production", () => {
    for (const appEnv of ["staging", "production"]) {
      expect(() =>
        parseEnv(buildEnvSchema, {
          VERCEL: "1",
          APP_ENV: appEnv,
          VERCEL_BRANCH_URL: "foa-git-main-foa.vercel.app",
          VERCEL_URL: "foa-abc123-foa.vercel.app",
        })
      ).toThrow(/APP_URL is not set/);
    }
  });

  it("requires APP_ENV on Vercel", () => {
    expect(() => parseEnv(buildEnvSchema, { VERCEL: "1" })).toThrow(
      /APP_ENV is not set[\s\S]*at APP_ENV/
    );
    const config = parseEnv(buildEnvSchema, {
      VERCEL: "1",
      APP_ENV: "production",
      APP_URL: SITE,
    });
    expect(config).toEqual({
      NODE_ENV: "development",
      APP_ENV: "production",
      APP_URL: SITE,
    });
  });

  it("requires APP_URL to be an http(s) URL", () => {
    expect(() => parseEnv(buildEnvSchema, { APP_URL: "example.org" })).toThrow(
      /APP_URL/
    );
    expect(parseEnv(buildEnvSchema, { APP_URL: SITE }).APP_URL).toBe(SITE);
  });
});

describe("envSchema", () => {
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv(envSchema, {})).toThrow(/DATABASE_URL is not set/);
  });

  it("only accepts a postgres URL for DATABASE_URL", () => {
    expect(parseEnv(envSchema, { DATABASE_URL }).DATABASE_URL).toBe(
      DATABASE_URL
    );
    expect(() =>
      parseEnv(envSchema, { DATABASE_URL: "mysql://localhost/foa" })
    ).toThrow(/must be a postgres:\/\/ .*\n.*at DATABASE_URL/);
  });

  it("includes the build variables", () => {
    const config = parseEnv(envSchema, {
      DATABASE_URL,
      APP_URL: "https://example.org",
    });
    expect(config.APP_URL).toBe("https://example.org");
    expect(config.APP_ENV).toBe("local");
  });

  it("applies the deployment rules at start too", () => {
    expect(() =>
      parseEnv(envSchema, { DATABASE_URL, APP_ENV: "staging" })
    ).toThrow(/APP_URL is not set/);
    expect(() => parseEnv(envSchema, { DATABASE_URL, VERCEL: "1" })).toThrow(
      /APP_ENV is not set/
    );
  });

  it("reports a missing APP_ENV alongside a missing DATABASE_URL", () => {
    expect(() => parseEnv(envSchema, { VERCEL: "1" })).toThrow(
      /DATABASE_URL is not set[\s\S]*APP_ENV is not set/
    );
  });

  it("fails a preview that can't name its database", () => {
    const preview = { DATABASE_URL, APP_ENV: "preview", APP_URL: SITE };
    expect(() => parseEnv(envSchema, preview)).toThrow(
      /name its database[\s\S]*at VERCEL_GIT_COMMIT_REF/
    );
    expect(() =>
      parseEnv(envSchema, { ...preview, VERCEL_GIT_PULL_REQUEST_ID: "" })
    ).toThrow(/name its database/);
  });

  it("keeps the variables that name a preview's database", () => {
    const config = parseEnv(envSchema, {
      DATABASE_URL,
      APP_ENV: "preview",
      APP_URL: SITE,
      VERCEL_GIT_PULL_REQUEST_ID: "12",
      VERCEL_GIT_COMMIT_REF: "map",
    });
    expect(config.VERCEL_GIT_PULL_REQUEST_ID).toBe("12");
    expect(config.VERCEL_GIT_COMMIT_REF).toBe("map");
  });

  it("only needs them on previews", () => {
    expect(
      parseEnv(envSchema, {
        DATABASE_URL,
        APP_ENV: "staging",
        APP_URL: SITE,
        BETTER_AUTH_SECRET: SECRET,
      }).APP_ENV
    ).toBe("staging");
  });

  it.each(["staging", "production"])(
    "requires BETTER_AUTH_SECRET on %s",
    (APP_ENV) => {
      expect(() =>
        parseEnv(envSchema, { DATABASE_URL, APP_ENV, APP_URL: SITE })
      ).toThrow(/BETTER_AUTH_SECRET is not set[\s\S]*at BETTER_AUTH_SECRET/);
    }
  );

  it("lets a local run or a preview go without BETTER_AUTH_SECRET", () => {
    expect(parseEnv(envSchema, { DATABASE_URL }).BETTER_AUTH_SECRET).toBe(
      undefined
    );
  });

  it("refuses a BETTER_AUTH_SECRET shorter than 32 characters", () => {
    expect(() =>
      parseEnv(envSchema, { DATABASE_URL, BETTER_AUTH_SECRET: "short" })
    ).toThrow(/at least 32 characters[\s\S]*at BETTER_AUTH_SECRET/);
  });

  it("reads CAPTURE_MAILBOX_TOKEN, which may be left out", () => {
    expect(parseEnv(envSchema, { DATABASE_URL }).CAPTURE_MAILBOX_TOKEN).toBe(
      undefined
    );
    expect(
      parseEnv(envSchema, { DATABASE_URL, CAPTURE_MAILBOX_TOKEN: SECRET })
        .CAPTURE_MAILBOX_TOKEN
    ).toBe(SECRET);
    expect(() =>
      parseEnv(envSchema, { DATABASE_URL, CAPTURE_MAILBOX_TOKEN: "short" })
    ).toThrow(/at least 32 characters[\s\S]*at CAPTURE_MAILBOX_TOKEN/);
  });
});

describe("migrationEnvSchema", () => {
  it("reads DIRECT_URL", () => {
    const url = "postgresql://migrator:p@db.example.org:6432/foa";
    expect(parseEnv(migrationEnvSchema, { DIRECT_URL: url }).DIRECT_URL).toBe(
      url
    );
  });

  it("requires DIRECT_URL and never falls back to DATABASE_URL", () => {
    expect(() => parseEnv(migrationEnvSchema, { DATABASE_URL })).toThrow(
      /DIRECT_URL is not set/
    );
    expect(() =>
      parseEnv(migrationEnvSchema, { DIRECT_URL: "", DATABASE_URL })
    ).toThrow(/DIRECT_URL is not set/);
  });

  it("only accepts a postgres URL", () => {
    expect(() =>
      parseEnv(migrationEnvSchema, { DIRECT_URL: "not a url" })
    ).toThrow(/must be a postgres:\/\/ .*\n.*at DIRECT_URL/);
  });

  it("reads APP_ENV and the variables that name a preview's database", () => {
    const config = parseEnv(migrationEnvSchema, {
      DIRECT_URL: DATABASE_URL,
      APP_ENV: "preview",
      VERCEL_GIT_PULL_REQUEST_ID: "",
      VERCEL_GIT_COMMIT_REF: "feature/map",
    });
    expect(config).toEqual({
      DIRECT_URL: DATABASE_URL,
      APP_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "feature/map",
    });
  });

  it("fails a preview that can't name its database", () => {
    expect(() =>
      parseEnv(migrationEnvSchema, {
        DIRECT_URL: DATABASE_URL,
        APP_ENV: "preview",
      })
    ).toThrow(/name its database[\s\S]*at VERCEL_GIT_COMMIT_REF/);
  });

  it("requires APP_ENV on Vercel", () => {
    expect(() =>
      parseEnv(migrationEnvSchema, { DIRECT_URL: DATABASE_URL, VERCEL: "1" })
    ).toThrow(/APP_ENV is not set/);
    expect(() =>
      parseEnv(migrationEnvSchema, {
        DIRECT_URL: DATABASE_URL,
        APP_ENV: "prod",
      })
    ).toThrow(/APP_ENV/);
  });

  it("needs no APP_URL", () => {
    expect(
      parseEnv(migrationEnvSchema, {
        DIRECT_URL: DATABASE_URL,
        APP_ENV: "production",
      }).APP_ENV
    ).toBe("production");
  });

  it("accepts a staging build from main without naming a preview database", () => {
    expect(
      parseEnv(migrationEnvSchema, {
        DIRECT_URL: DATABASE_URL,
        VERCEL: "1",
        APP_ENV: "staging",
        VERCEL_GIT_PULL_REQUEST_ID: "",
        VERCEL_GIT_COMMIT_REF: "main",
      }).APP_ENV
    ).toBe("staging");
  });
});
