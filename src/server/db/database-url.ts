// Which database a deployment connects to, and how. Like src/env.schema.ts,
// this module runs under plain Node too: scripts/migrate.ts imports it as well
// as the app's db client, so it must not import `server-only`.

import { createHash } from "node:crypto";

// Bundled into the app at build time, so the runtime names the same database
// as the migration that ran in the build, without reading ./drizzle.
import journal from "../../../drizzle/meta/_journal.json" with { type: "json" };

/** The variables that decide which database a deployment uses. */
export type DatabaseEnv = {
  APP_ENV?: string | undefined;
  /** Set by Vercel: the PR number, empty while the branch has no PR. */
  VERCEL_GIT_PULL_REQUEST_ID?: string | undefined;
  /** Set by Vercel: the branch the deployment was built from. */
  VERCEL_GIT_COMMIT_REF?: string | undefined;
};

/** A preview's own database on pg-nonprod. */
export type PreviewDatabase = {
  /**
   * `foa_pr_<n>_<fp>`, or `foa_br_<slug>_<hash>_<fp>` while the branch has
   * no PR (see `branchDatabaseName`). `<fp>` is `MIGRATIONS_FINGERPRINT`.
   */
  name: string;
  /**
   * The database's comment: `foa-preview pr=<n>` or
   * `foa-preview branch=<ref>`. The hourly sweeper on the VPS parses it to
   * drop the databases of closed PRs and deleted branches, so keep the format.
   */
  comment: string;
};

/** Postgres keeps at most 63 bytes of an identifier (NAMEDATALEN - 1). */
const MAX_NAME_BYTES = 63;
const BRANCH_PREFIX = "foa_br_";
const HASH_CHARS = 8;

/** What `migrationsFingerprint` reads from drizzle/meta/_journal.json. */
export type MigrationJournal = {
  entries: readonly { tag: string; when: number }[];
};

/**
 * 8 hex characters of the SHA-256 of every migration's tag and date, in
 * journal order. Adding, renaming, renumbering or regenerating a migration
 * changes it. Drizzle's migrator applies only the journal entries dated
 * after the newest one a database already has, so a database migrated from
 * an older ./drizzle can't take a regenerated one; a new fingerprint gives
 * the preview a fresh database instead. An applied migration edited by hand
 * keeps its tag and date and goes unnoticed, as it does for the migrator.
 */
export function migrationsFingerprint({ entries }: MigrationJournal): string {
  return createHash("sha256")
    .update(entries.map(({ tag, when }) => `${tag} ${when}\n`).join(""))
    .digest("hex")
    .slice(0, HASH_CHARS);
}

/** The fingerprint of the migrations in this build's ./drizzle. */
export const MIGRATIONS_FINGERPRINT = migrationsFingerprint(journal);

const PR_NUMBER = /^[1-9][0-9]*$/;

export const PREVIEW_DATABASE_UNNAMED =
  "APP_ENV=preview needs VERCEL_GIT_PULL_REQUEST_ID (a PR number) or " +
  "VERCEL_GIT_COMMIT_REF (a branch) to name its database, foa_pr_<n>_<fp> " +
  "or foa_br_<branch>_<hash>_<fp>. Vercel sets both for deployments from Git.";

/**
 * Names a preview's database: `foa_pr_<n>_<fp>` for a PR, else
 * `foa_br_<slug>_<hash>_<fp>` from the branch, where `<fp>` is the
 * migrations fingerprint. So a PR or branch gets a fresh database whenever
 * its migrations change; the sweeper drops the old ones with the PR or
 * branch, by their comment. Throws if neither variable is usable.
 */
export function previewDatabase(env: DatabaseEnv): PreviewDatabase {
  const pr = env.VERCEL_GIT_PULL_REQUEST_ID ?? "";
  if (PR_NUMBER.test(pr)) {
    return {
      name: `foa_pr_${pr}_${MIGRATIONS_FINGERPRINT}`,
      comment: `foa-preview pr=${pr}`,
    };
  }
  const ref = env.VERCEL_GIT_COMMIT_REF ?? "";
  if (ref !== "") {
    return {
      name: branchDatabaseName(ref),
      comment: `foa-preview branch=${ref}`,
    };
  }
  throw new Error(PREVIEW_DATABASE_UNNAMED);
}

/** The name of a preview's database; see `previewDatabase`. */
export function previewDatabaseName(env: DatabaseEnv): string {
  return previewDatabase(env).name;
}

/**
 * `foa_br_<slug>_<hash>_<fp>`: the slug is the branch lowercased, with every
 * run of other characters than [a-z0-9] turned into one `_`, cut so the name
 * fits 63 bytes; the hash is the first 8 hex characters of the branch's
 * SHA-256; `<fp>` is the migrations fingerprint. The hash is always there,
 * because the slug alone can collide: `feat/a-b` and `feat/a.b` have the
 * same one, and the sweeper would drop their shared database once either
 * branch is deleted. A branch with nothing left for a slug gets
 * `foa_br_<hash>_<fp>`.
 */
function branchDatabaseName(ref: string): string {
  const hash = `${createHash("sha256")
    .update(ref)
    .digest("hex")
    .slice(0, HASH_CHARS)}_${MIGRATIONS_FINGERPRINT}`;
  // The slug is ASCII, so its length is its size in bytes.
  const room = MAX_NAME_BYTES - BRANCH_PREFIX.length - 1 - hash.length;
  const slug = ref
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replace(/^_+/, "")
    .slice(0, room)
    .replace(/_+$/, "");
  return slug === ""
    ? `${BRANCH_PREFIX}${hash}`
    : `${BRANCH_PREFIX}${slug}_${hash}`;
}

/** `url` with its database (the path) replaced by `database`. */
export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${encodeURIComponent(database)}`;
  return parsed.href;
}

/**
 * The URL a deployment really connects to. On previews DATABASE_URL and
 * DIRECT_URL name a placeholder database (`/foa_pr`), shared by every preview
 * in the Vercel settings; this swaps in the preview's own database. PgBouncer
 * sends any database but `foa` to pg-nonprod, so a preview never reaches
 * production. Other environments get `url` unchanged.
 */
export function resolveDatabaseUrl(url: string, env: DatabaseEnv): string {
  return env.APP_ENV === "preview"
    ? withDatabase(url, previewDatabaseName(env))
    : url;
}

/** What scripts/migrate.ts migrates. */
export type MigrationTarget = {
  /** The connection to migrate through. */
  url: string;
  /** On a preview, its own database, which the script creates first. */
  preview?: PreviewDatabase;
};

/**
 * A preview migrates its own database, named once here so that the script
 * creates and then connects to the same one. Every other environment,
 * staging and production included, migrates the database DIRECT_URL names
 * in place and creates nothing.
 */
export function migrationTarget(
  env: DatabaseEnv & { DIRECT_URL: string }
): MigrationTarget {
  if (env.APP_ENV !== "preview") return { url: env.DIRECT_URL };
  const preview = previewDatabase(env);
  return { url: withDatabase(env.DIRECT_URL, preview.name), preview };
}

/** The sslmodes that always encrypt, which libpq requires for direct TLS. */
const ENCRYPTED_SSLMODES = new Set(["require", "verify-ca", "verify-full"]);

/**
 * postgres.js options for direct TLS negotiation: TLS from the first byte,
 * without the SSLRequest round trip first (PostgreSQL 17+; PgBouncer accepts
 * it since 1.25). Only when the URL's sslmode always encrypts, as libpq
 * allows, so a local URL without sslmode still connects in plain text. TLS
 * itself, and how the certificate is checked, comes from the URL's sslmode;
 * an `sslnegotiation` in the URL wins over this.
 */
export function directTls(url: string): { sslnegotiation?: "direct" } {
  const params = new URL(url).searchParams;
  const sslmode = params.get("sslmode");
  return sslmode !== null &&
    ENCRYPTED_SSLMODES.has(sslmode) &&
    !params.has("sslnegotiation")
    ? { sslnegotiation: "direct" }
    : {};
}
