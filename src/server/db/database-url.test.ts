import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  directTls,
  MIGRATIONS_FINGERPRINT,
  migrationsFingerprint,
  migrationTarget,
  previewDatabase,
  previewDatabaseName,
  resolveDatabaseUrl,
  withDatabase,
} from "./database-url";

const PREVIEW_URL =
  "postgres://nonprod_app:0a1b2c@db.shipped-it.dev:6432/foa_pr?sslmode=verify-full";

const hash8 = (ref: string) =>
  createHash("sha256").update(ref).digest("hex").slice(0, 8);

/** This checkout's migrations fingerprint, the last part of every name. */
const FP = MIGRATIONS_FINGERPRINT;

/** The names docker/scripts/sweep-preview-dbs.sh accepts as a preview's. */
const SWEEPER_NAME = /^foa_(pr|br)_[a-z0-9_]{1,56}$/;

describe("migrationsFingerprint", () => {
  const journal = {
    entries: [
      { idx: 0, when: 1794970969591, tag: "0000_enable_pg_trgm" },
      { idx: 1, when: 1795235562652, tag: "0001_57_harness" },
    ],
  };
  const [first, second] = journal.entries as [
    (typeof journal.entries)[number],
    (typeof journal.entries)[number],
  ];

  it("is 8 hex characters, the same for the same migrations", () => {
    expect(migrationsFingerprint(journal)).toMatch(/^[0-9a-f]{8}$/);
    expect(migrationsFingerprint(structuredClone(journal))).toBe(
      migrationsFingerprint(journal)
    );
  });

  it("changes when a migration is added", () => {
    expect(
      migrationsFingerprint({
        entries: [
          ...journal.entries,
          { idx: 2, when: 1795300000000, tag: "0002_58_profiles" },
        ],
      })
    ).not.toBe(migrationsFingerprint(journal));
  });

  it("changes when a migration is regenerated, which re-dates it", () => {
    // The merge queue regenerates a branch's migrations on top of the
    // trunk's. Drizzle's migrator applies only entries dated after the
    // newest one a database has, so the old database can't take them.
    expect(
      migrationsFingerprint({
        entries: [first, { ...second, when: second.when + 1 }],
      })
    ).not.toBe(migrationsFingerprint(journal));
  });

  it("changes when a migration is renumbered or renamed", () => {
    expect(
      migrationsFingerprint({
        entries: [first, { ...second, tag: "0002_57_harness" }],
      })
    ).not.toBe(migrationsFingerprint(journal));
  });

  it("is the committed drizzle/meta/_journal.json's", () => {
    const committed: unknown = JSON.parse(
      readFileSync(
        new URL("../../../drizzle/meta/_journal.json", import.meta.url),
        "utf8"
      )
    );
    expect(FP).toBe(
      migrationsFingerprint(
        committed as Parameters<typeof migrationsFingerprint>[0]
      )
    );
  });
});

describe("previewDatabase", () => {
  it("names a PR's database after its number", () => {
    expect(
      previewDatabase({
        VERCEL_GIT_PULL_REQUEST_ID: "42",
        VERCEL_GIT_COMMIT_REF: "feature/map",
      })
    ).toEqual({ name: `foa_pr_42_${FP}`, comment: "foa-preview pr=42" });
  });

  it("falls back to the branch while there is no PR", () => {
    for (const pr of [undefined, "", "0", "abc", "-3", "1.5"]) {
      expect(
        previewDatabase({
          VERCEL_GIT_PULL_REQUEST_ID: pr,
          VERCEL_GIT_COMMIT_REF: "map",
        })
      ).toEqual({
        name: `foa_br_map_${hash8("map")}_${FP}`,
        comment: "foa-preview branch=map",
      });
    }
  });

  it("keeps the branch as it is in the comment", () => {
    expect(
      previewDatabase({ VERCEL_GIT_COMMIT_REF: "Feature/Map-Tiles" }).comment
    ).toBe("foa-preview branch=Feature/Map-Tiles");
  });

  it("keeps PR names within the sweeper's pattern", () => {
    for (const pr of ["1", "42", "999999999"]) {
      expect(previewDatabase({ VERCEL_GIT_PULL_REQUEST_ID: pr }).name).toMatch(
        SWEEPER_NAME
      );
    }
  });

  it("throws when neither variable names the database", () => {
    expect(() => previewDatabase({})).toThrow(
      /VERCEL_GIT_PULL_REQUEST_ID[\s\S]*VERCEL_GIT_COMMIT_REF/
    );
    expect(() =>
      previewDatabase({
        VERCEL_GIT_PULL_REQUEST_ID: "",
        VERCEL_GIT_COMMIT_REF: "",
      })
    ).toThrow(/name its database/);
  });
});

describe("previewDatabaseName", () => {
  const branch = (ref: string) =>
    previewDatabaseName({ VERCEL_GIT_COMMIT_REF: ref });

  it("lowercases the branch, turns other characters into one _ and adds a hash", () => {
    expect(branch("Feature/Map-Tiles")).toBe(
      `foa_br_feature_map_tiles_${hash8("Feature/Map-Tiles")}_${FP}`
    );
    expect(branch("fix//two--dashes__x")).toBe(
      `foa_br_fix_two_dashes_x_${hash8("fix//two--dashes__x")}_${FP}`
    );
    expect(branch("dependabot/npm_and_yarn/next-16.4.6")).toBe(
      `foa_br_dependabot_npm_and_yarn_next_16_4_6_${hash8("dependabot/npm_and_yarn/next-16.4.6")}_${FP}`
    );
  });

  it("trims _ from both ends of the slug", () => {
    expect(branch("/-feature-/")).toBe(
      `foa_br_feature_${hash8("/-feature-/")}_${FP}`
    );
  });

  it("gives branches with the same slug different names", () => {
    const names = ["feat/a-b", "feat/a.b", "feat/a_b", "Feat/A-B"].map(branch);
    expect(new Set(names).size).toBe(4);
    for (const name of names)
      expect(name).toMatch(/^foa_br_feat_a_b_[0-9a-f]{8}_[0-9a-f]{8}$/);
  });

  it("hashes the branch as it is, before the slug", () => {
    expect(branch("feat/a-b").endsWith(`_${hash8("feat/a-b")}_${FP}`)).toBe(
      true
    );
  });

  it("ends every name with the migrations fingerprint", () => {
    for (const ref of ["main", "M0", "ticket/57-harness", "日本語"]) {
      expect(branch(ref).endsWith(`_${FP}`)).toBe(true);
    }
  });

  it("keeps a slug that fits 63 bytes whole", () => {
    const ref = "a".repeat(63 - "foa_br_".length - 9 - 9);
    expect(branch(ref)).toBe(`foa_br_${ref}_${hash8(ref)}_${FP}`);
    expect(branch(ref)).toHaveLength(63);
  });

  it("cuts long branches so the name is 63 bytes", () => {
    const ref = "a".repeat(100);
    expect(branch(ref)).toBe(`foa_br_${"a".repeat(38)}_${hash8(ref)}_${FP}`);
    expect(branch(ref)).toHaveLength(63);

    const feature = `feature/${"very-long-branch-name-".repeat(5)}end`;
    const name = branch(feature);
    expect(name.length).toBeLessThanOrEqual(63);
    expect(name).toMatch(/^foa_br_feature_very_long_branch_name_[a-z0-9_]+$/);
    expect(name.endsWith(`_${hash8(feature)}_${FP}`)).toBe(true);
  });

  it("gives long branches that share a prefix different names", () => {
    const prefix = "a".repeat(80);
    expect(branch(`${prefix}-one`)).not.toBe(branch(`${prefix}-two`));
  });

  it("never leaves a double _ before the hash", () => {
    // The cut lands just after the _ that stands for "/", which must go.
    const ref = `${"x".repeat(37)}/yyyyyyyyyy`;
    expect(branch(ref)).toBe(`foa_br_${"x".repeat(37)}_${hash8(ref)}_${FP}`);
  });

  it("uses the hash alone for a branch with nothing left", () => {
    expect(branch("日本語")).toBe(`foa_br_${hash8("日本語")}_${FP}`);
    expect(branch("---")).toBe(`foa_br_${hash8("---")}_${FP}`);
  });

  it("only ever makes plain identifiers of at most 63 bytes", () => {
    for (const ref of ["UPPER", "a.b", "émoji-🐶", "x".repeat(300), "_x_"]) {
      const name = branch(ref);
      expect(name).toMatch(
        /^foa_br_([a-z0-9]([a-z0-9_]*[a-z0-9])?_)?[0-9a-f]{8}_[0-9a-f]{8}$/
      );
      expect(name).toMatch(SWEEPER_NAME);
      expect(name.length).toBeLessThanOrEqual(63);
    }
  });
});

describe("resolveDatabaseUrl", () => {
  const pr = { APP_ENV: "preview", VERCEL_GIT_PULL_REQUEST_ID: "7" };

  it("swaps a preview's placeholder database for its own", () => {
    expect(resolveDatabaseUrl(PREVIEW_URL, pr)).toBe(
      `postgres://nonprod_app:0a1b2c@db.shipped-it.dev:6432/foa_pr_7_${FP}?sslmode=verify-full`
    );
  });

  it("keeps the credentials and every query parameter", () => {
    const url =
      "postgresql://nonprod_migrator:f00d@db.shipped-it.dev:6432/foa_pr?sslmode=verify-full&application_name=foa";
    const resolved = new URL(resolveDatabaseUrl(url, pr));
    expect(resolved.username).toBe("nonprod_migrator");
    expect(resolved.password).toBe("f00d");
    expect(resolved.pathname).toBe(`/foa_pr_7_${FP}`);
    expect(resolved.search).toBe("?sslmode=verify-full&application_name=foa");
  });

  it("uses the branch database before the PR exists", () => {
    expect(
      resolveDatabaseUrl(PREVIEW_URL, {
        APP_ENV: "preview",
        VERCEL_GIT_PULL_REQUEST_ID: "",
        VERCEL_GIT_COMMIT_REF: "Feature/Map",
      })
    ).toContain(`/foa_br_feature_map_${hash8("Feature/Map")}_${FP}?`);
  });

  it("leaves every other environment's URL alone", () => {
    const production =
      "postgres://foa_app:beef@db.shipped-it.dev:6432/foa?sslmode=verify-full";
    for (const APP_ENV of [undefined, "local", "staging", "production"]) {
      expect(
        resolveDatabaseUrl(production, {
          APP_ENV,
          VERCEL_GIT_PULL_REQUEST_ID: "7",
        })
      ).toBe(production);
    }
  });

  it("throws on a preview it can't name", () => {
    expect(() =>
      resolveDatabaseUrl(PREVIEW_URL, { APP_ENV: "preview" })
    ).toThrow(/name its database/);
  });
});

describe("migrationTarget", () => {
  // Vercel sets these on every deployment from Git, staging's included.
  const fromMain = {
    VERCEL_GIT_PULL_REQUEST_ID: "",
    VERCEL_GIT_COMMIT_REF: "main",
  };

  it("migrates foa_staging in place and creates no database", () => {
    const DIRECT_URL =
      "postgres://staging_migrator:f00d@db.shipped-it.dev:6432/foa_staging?sslmode=verify-full";
    expect(
      migrationTarget({ DIRECT_URL, APP_ENV: "staging", ...fromMain })
    ).toStrictEqual({ url: DIRECT_URL });
  });

  it("migrates production and local runs in place too", () => {
    const DIRECT_URL =
      "postgres://foa_migrator:beef@db.shipped-it.dev:6432/foa?sslmode=verify-full";
    for (const APP_ENV of ["production", "local", undefined]) {
      expect(
        migrationTarget({ DIRECT_URL, APP_ENV, ...fromMain })
      ).toStrictEqual({ url: DIRECT_URL });
    }
  });

  it("creates a preview's own database and migrates that", () => {
    expect(
      migrationTarget({
        DIRECT_URL:
          "postgres://nonprod_migrator:f00d@db.shipped-it.dev:6432/foa_pr?sslmode=verify-full",
        APP_ENV: "preview",
        VERCEL_GIT_PULL_REQUEST_ID: "7",
        VERCEL_GIT_COMMIT_REF: "map",
      })
    ).toStrictEqual({
      url: `postgres://nonprod_migrator:f00d@db.shipped-it.dev:6432/foa_pr_7_${FP}?sslmode=verify-full`,
      preview: { name: `foa_pr_7_${FP}`, comment: "foa-preview pr=7" },
    });
  });

  it("migrates the database the app then connects to", () => {
    for (const git of [
      { VERCEL_GIT_PULL_REQUEST_ID: "7", VERCEL_GIT_COMMIT_REF: "map" },
      { VERCEL_GIT_PULL_REQUEST_ID: "", VERCEL_GIT_COMMIT_REF: "Feature/Map" },
    ]) {
      const env = { APP_ENV: "preview", ...git };
      const migrated = migrationTarget({
        DIRECT_URL:
          "postgres://nonprod_migrator:f00d@db.shipped-it.dev:6432/foa_pr?sslmode=verify-full",
        ...env,
      });
      const runtime = new URL(resolveDatabaseUrl(PREVIEW_URL, env));
      expect(runtime.pathname).toBe(`/${migrated.preview?.name}`);
      expect(new URL(migrated.url).pathname).toBe(runtime.pathname);
    }
  });
});

describe("withDatabase", () => {
  it("adds a database to a URL without one", () => {
    expect(withDatabase("postgres://u:p@h:6432", "postgres")).toBe(
      "postgres://u:p@h:6432/postgres"
    );
  });
});

describe("directTls", () => {
  it("negotiates TLS directly when sslmode always encrypts", () => {
    for (const mode of ["require", "verify-ca", "verify-full"]) {
      expect(directTls(`postgres://h/foa?sslmode=${mode}`)).toEqual({
        sslnegotiation: "direct",
      });
    }
  });

  it("leaves URLs without TLS, or with optional TLS, alone", () => {
    for (const url of [
      "postgres://foa:foa@localhost:5432/foa",
      "postgres://h/foa?sslmode=disable",
      "postgres://h/foa?sslmode=prefer",
      "postgres://h/foa?sslmode=allow",
    ]) {
      expect(directTls(url)).toEqual({});
    }
  });

  it("lets the URL's own sslnegotiation win", () => {
    expect(
      directTls("postgres://h/foa?sslmode=verify-full&sslnegotiation=postgres")
    ).toEqual({});
  });
});
