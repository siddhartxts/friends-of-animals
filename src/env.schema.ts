// Environment schemas and the one function that parses them. This module stays
// free of `server-only` and Next.js imports so that code running under plain
// Node (scripts/migrate.ts, drizzle.config.ts) can use it. App code reads its
// config through `env()` from "@/env" instead.

import { z } from "zod";

import { previewDatabase } from "./server/db/database-url";

/** A postgres:// URL; `whenUnset` is the error shown when it is missing. */
function postgresUrl(whenUnset: string) {
  return z.url({
    protocol: /^postgres(ql)?$/,
    error: (issue) =>
      issue.input === undefined
        ? whenUnset
        : "must be a postgres:// or postgresql:// URL",
  });
}

const DEPLOYED_APP_ENVS = ["preview", "staging", "production"] as const;
const APP_ENVS = ["local", ...DEPLOYED_APP_ENVS] as const;

/** What APP_URL is when it is unset on a local run. */
const LOCAL_APP_URL = "http://localhost:3000";

/** Set to "1" by Vercel, at build time and at runtime. */
const vercel = z.string().optional();

/**
 * Which deployment this is. Use it for behaviour switches instead of
 * VERCEL_ENV, which can't tell the staging custom environment from preview.
 */
const appEnv = z.enum(APP_ENVS).optional();

/** The variables pages may read while `next build` prerenders them. */
const buildVariables = {
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  VERCEL: vercel,
  APP_ENV: appEnv,
  /**
   * Canonical base URL, e.g. https://shipped-it.dev. Only the server reads
   * it, so it needs no NEXT_PUBLIC_ prefix, but prerendered pages bake it
   * in at build time.
   */
  APP_URL: z
    .url({ protocol: /^https?$/, error: "must be an http(s) URL" })
    .optional(),
  /**
   * Set by Vercel: the host name (no https://) of the branch's latest
   * deployment, and of this deployment. A preview without APP_URL uses the
   * first, else the second.
   */
  VERCEL_BRANCH_URL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
};

/**
 * Set by Vercel at build time and at runtime. They name a preview's own
 * database (src/server/db/database-url.ts).
 */
const previewDatabaseVariables = {
  /** The PR number; empty while the branch has no PR. */
  VERCEL_GIT_PULL_REQUEST_ID: z.string().optional(),
  /** The branch the deployment was built from. */
  VERCEL_GIT_COMMIT_REF: z.string().optional(),
};

/** A random secret: 32 characters or more. */
function secret() {
  return z
    .string()
    .min(32, {
      error: "must be at least 32 characters (use openssl rand -hex 32)",
    })
    .optional();
}

/** Secrets the app server reads. */
const secretVariables = {
  /**
   * Signs session cookies and keys the sign-in rate limits (Better Auth).
   * Required on staging and production; a local run or a preview without
   * it uses a fixed development secret (src/server/deps.ts).
   */
  BETTER_AUTH_SECRET: secret(),
  /**
   * Lets the Seam 2 journeys read the capture mailbox outside production
   * (sent as the x-capture-mailbox-token header). Without it the mailbox
   * route answers 404.
   */
  CAPTURE_MAILBOX_TOKEN: secret(),
};

type AppEnv = (typeof APP_ENVS)[number];

type DeploymentVariables = {
  VERCEL?: string | undefined;
  APP_ENV?: AppEnv | undefined;
  APP_URL?: string | undefined;
  VERCEL_BRANCH_URL?: string | undefined;
  VERCEL_URL?: string | undefined;
};

/**
 * What APP_URL is when it is unset: http://localhost:3000 on a local run,
 * the Vercel branch (or deployment) URL on a preview, and nothing elsewhere.
 */
function defaultAppUrl({
  APP_ENV,
  VERCEL_BRANCH_URL,
  VERCEL_URL,
}: DeploymentVariables): string | undefined {
  if (APP_ENV === undefined || APP_ENV === "local") return LOCAL_APP_URL;
  const host = APP_ENV === "preview" ? (VERCEL_BRANCH_URL ?? VERCEL_URL) : "";
  return host ? `https://${host}` : undefined;
}

/**
 * Every Vercel environment (VERCEL set) must say which deployment it is;
 * only a local run may leave APP_ENV out.
 */
function requireAppEnvOnVercel(
  { VERCEL, APP_ENV }: Pick<DeploymentVariables, "VERCEL" | "APP_ENV">,
  ctx: z.RefinementCtx<Pick<DeploymentVariables, "VERCEL" | "APP_ENV">>
) {
  if (VERCEL !== undefined && APP_ENV === undefined) {
    ctx.issues.push({
      code: "custom",
      path: ["APP_ENV"],
      input: APP_ENV,
      message:
        "APP_ENV is not set. Every Vercel environment must set it to " +
        "preview, staging or production.",
    });
  }
}

/**
 * Staging and production must set APP_URL, so a deployment never
 * bakes http://localhost:3000 into its pages. A preview may leave it out and
 * gets its Vercel URL.
 */
function requireAppUrl(
  values: DeploymentVariables,
  ctx: z.RefinementCtx<DeploymentVariables>
) {
  // An invalid APP_ENV already has its own issue.
  const deployed = DEPLOYED_APP_ENVS.find((name) => name === values.APP_ENV);
  if (
    deployed !== undefined &&
    values.APP_URL === undefined &&
    defaultAppUrl(values) === undefined
  ) {
    ctx.issues.push({
      code: "custom",
      path: ["APP_URL"],
      input: values.APP_URL,
      message:
        `APP_URL is not set. APP_ENV=${deployed} needs its canonical base ` +
        "URL, e.g. https://shipped-it.dev, at build time and at runtime." +
        (deployed === "preview"
          ? " (Previews default to https://$VERCEL_BRANCH_URL, which is not set either.)"
          : ""),
    });
  }
}

type PreviewDatabaseVariables = {
  APP_ENV?: AppEnv | undefined;
  VERCEL_GIT_PULL_REQUEST_ID?: string | undefined;
  VERCEL_GIT_COMMIT_REF?: string | undefined;
};

/**
 * A preview connects to a database of its own, named from its PR or branch,
 * so it fails the start and the migration when it can't be named.
 */
function requirePreviewDatabase(
  values: PreviewDatabaseVariables,
  ctx: z.RefinementCtx<PreviewDatabaseVariables>
) {
  if (values.APP_ENV !== "preview") return;
  try {
    previewDatabase(values);
  } catch (error) {
    ctx.issues.push({
      code: "custom",
      path: ["VERCEL_GIT_COMMIT_REF"],
      input: values.VERCEL_GIT_COMMIT_REF,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Staging and production sign sessions with their own secret. */
function requireAuthSecret(
  values: {
    APP_ENV?: AppEnv | undefined;
    BETTER_AUTH_SECRET?: string | undefined;
  },
  ctx: z.RefinementCtx<{
    APP_ENV?: AppEnv | undefined;
    BETTER_AUTH_SECRET?: string | undefined;
  }>
) {
  if (
    (values.APP_ENV === "staging" || values.APP_ENV === "production") &&
    values.BETTER_AUTH_SECRET === undefined
  ) {
    ctx.issues.push({
      code: "custom",
      path: ["BETTER_AUTH_SECRET"],
      input: values.BETTER_AUTH_SECRET,
      message:
        `BETTER_AUTH_SECRET is not set. APP_ENV=${values.APP_ENV} needs its ` +
        "own random secret of 32 characters or more (openssl rand -hex 32).",
    });
  }
}

/**
 * Run each check even when another variable is invalid, so the error lists
 * every problem at once.
 */
const always = { when: () => true };

/**
 * Fills in APP_ENV and APP_URL and drops VERCEL and the Vercel host names,
 * which nothing else reads.
 */
function withDefaults<T extends DeploymentVariables>({
  VERCEL: _vercel,
  VERCEL_BRANCH_URL,
  VERCEL_URL,
  APP_ENV,
  APP_URL,
  ...rest
}: T) {
  return {
    ...rest,
    APP_ENV: APP_ENV ?? "local",
    // `requireAppUrl` has already rejected a deployment without a default.
    APP_URL:
      APP_URL ??
      defaultAppUrl({ APP_ENV, VERCEL_BRANCH_URL, VERCEL_URL }) ??
      LOCAL_APP_URL,
  };
}

/**
 * What pages may read while `next build` prerenders them. Outside Vercel
 * nothing here is required, so the build needs no database and no secrets.
 */
export const buildEnvSchema = z
  .object(buildVariables)
  .superRefine(requireAppEnvOnVercel, always)
  .superRefine(requireAppUrl, always)
  .transform(withDefaults);

/**
 * The app server's config, validated when the server starts
 * (src/instrumentation.ts). A missing required variable fails the start.
 */
export const envSchema = z
  .object({
    ...buildVariables,
    ...previewDatabaseVariables,
    /**
     * Runtime connection (PgBouncer in transaction mode on Vercel). On
     * previews it names a placeholder database, which the db client swaps for
     * the preview's own.
     */
    DATABASE_URL: postgresUrl(
      "DATABASE_URL is not set. Point it at a Postgres database, e.g. " +
        "postgres://foa:foa@localhost:5432/foa (see .env.example)."
    ),
    ...secretVariables,
  })
  .superRefine(requireAppEnvOnVercel, always)
  .superRefine(requireAppUrl, always)
  .superRefine(requirePreviewDatabase, always)
  .superRefine(requireAuthSecret, always)
  .transform(withDefaults);

export type Env = z.output<typeof envSchema>;

/**
 * What the migration script and drizzle-kit read. They connect through
 * DIRECT_URL only, a direct or session-mode connection: DATABASE_URL may
 * be the transaction-mode pooler, so it is never a fallback. On a
 * preview (APP_ENV=preview) the script first creates the preview's database,
 * named from the VERCEL_GIT_* variables, then migrates that.
 */
export const migrationEnvSchema = z
  .object({
    DIRECT_URL: postgresUrl(
      "DIRECT_URL is not set. Migrations and drizzle-kit connect through " +
        "it, never through DATABASE_URL. Locally it is the same URL as " +
        "DATABASE_URL, e.g. postgres://foa:foa@localhost:5432/foa (see " +
        ".env.example)."
    ),
    VERCEL: vercel,
    APP_ENV: appEnv,
    ...previewDatabaseVariables,
  })
  .superRefine(requireAppEnvOnVercel, always)
  .superRefine(requirePreviewDatabase, always);

export type MigrationEnv = z.output<typeof migrationEnvSchema>;

/**
 * Parses an env-like object, usually process.env, against `schema`. Empty
 * strings count as unset, so `FOO=` in a .env file behaves like a missing
 * variable. Throws one readable error that lists every problem.
 */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: Record<string, string | undefined>
): z.output<Schema> {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
}
