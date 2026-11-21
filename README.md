# Friends of Animals

The web platform for **Friends of Animals (FOA)**, a non-profit in India that nurtures compassion for animals among children and young adults through creative competitions, community, awareness, adoption facilitation and fundraising.

Right now the app is the bare foundation: a brand landing page, the site shell, the database layer and the test harness. The public site arrives in [#14](https://github.com/SiddharthMuramkar/friends-of-animals/issues/14).

---

## Contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Running everything in Docker](#running-everything-in-docker)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Database and migrations](#database-and-migrations)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Environment variables](#environment-variables)
- [Deploying](#deploying)
- [Brand assets](#brand-assets)

---

## Tech stack

The stack and hosting layout were locked in [#11](https://github.com/SiddharthMuramkar/friends-of-animals/issues/11). In this repo today:

| Layer              | Choice                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Framework          | [Next.js 16](https://nextjs.org) App Router with Cache Components, Turbopack, `output: "standalone"`                 |
| Language           | TypeScript 7 (strict) on Node.js 26                                                                                  |
| UI                 | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com), `next/font` (Inter), lucide icons, sonner toasts                 |
| Validation         | Zod 4                                                                                                                |
| Database           | PostgreSQL 18                                                                                                        |
| ORM and migrations | [Drizzle ORM](https://orm.drizzle.team) 0.45 + drizzle-kit, on the `postgres.js` driver                              |
| Tests              | [Vitest](https://vitest.dev) + [PGlite](https://pglite.dev) (in-memory Postgres)                                     |
| End-to-end tests   | [Playwright](https://playwright.dev) + [axe](https://github.com/dequelabs/axe-core-npm), against PR previews         |
| Lint and format    | [oxlint](https://oxc.rs/docs/guide/usage/linter) (type-aware) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) |
| Package manager    | pnpm 12                                                                                                              |
| Hosting            | Vercel (functions in `bom1`, Mumbai); Postgres on the Mumbai VPS                                                     |

Every dependency in `package.json` is pinned to an exact version, and `saveExact: true` in `pnpm-workspace.yaml` makes `pnpm add` do the same.

Still to come: Better Auth, Cloudflare R2 storage, the pg-boss worker, next-intl, React Email and Sentry.

## Prerequisites

- **Node.js 26.** `package.json` pins `engines.node` to `26.x`, which is also Vercel's default.
- **pnpm 12.** Node 26 ships without corepack, so install it from npm: `npm install --global pnpm@12.21.0`.
- **Docker** with the Compose plugin (`docker compose version` should work).

## Getting started

```bash
git clone https://github.com/SiddharthMuramkar/friends-of-animals.git
cd friends-of-animals
pnpm install
cp .env.example .env          # defaults match the local database

docker compose up -d db       # start Postgres 18 in Docker
pnpm db:migrate               # apply the migrations
pnpm dev                      # http://localhost:3000
```

To stop the database, run `docker compose stop db`. The data stays in the `pgdata18` volume.

> **Upgrading an older checkout?** The Compose database moved to Postgres 18 with a new user, on a new volume, `pgdata18`, so it starts empty and never mounts the old Postgres 17 data. The React Router template's `pgdata` volume is left alone: if you no longer need it, find it with `docker volume ls` (it is named `<project>_pgdata`) and remove it with `docker volume rm`.

## Running everything in Docker

You can also build and run the production image together with Postgres:

```bash
docker compose up -d --build --wait   # http://localhost:3000
docker compose down                   # stop; the database stays in pgdata18
```

Compose starts three services in order:

| Service   | What it does                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `db`      | Postgres 18. Data in the `pgdata18` volume.                                                                                |
| `migrate` | One-shot: runs `pnpm db:migrate` (the Dockerfile's `migrate` target), then exits.                                          |
| `app`     | The Next.js standalone server (the Dockerfile's `runner` target), as a non-root user. Starts once `migrate` has succeeded. |

Ports are published on `127.0.0.1` only, because Docker's published ports bypass host firewalls such as ufw. Reach them from another machine through an SSH tunnel.

## Scripts

| Script                              | What it does                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server with hot reload (Turbopack)                                                                                              |
| `pnpm build`                        | Production build into `.next/` (includes `.next/standalone`)                                                                        |
| `pnpm start`                        | Serve the production build on port 3000 (`next start` warns under `output: "standalone"`; Docker runs `.next/standalone/server.js`) |
| `pnpm typecheck`                    | Generate Next.js route types, then run `tsc`                                                                                        |
| `pnpm lint`                         | oxlint with type-aware rules                                                                                                        |
| `pnpm format` / `pnpm format:check` | Format with oxfmt / check formatting                                                                                                |
| `pnpm test` / `pnpm test:watch`     | Run the tests once / in watch mode                                                                                                  |
| `pnpm check`                        | typecheck + lint + format:check + test: run it before you push                                                                      |
| `pnpm test:e2e`                     | Playwright journeys and axe against a deployment ([End-to-end tests](#end-to-end-tests))                                            |
| `pnpm db:generate`                  | Create a migration from schema changes (needs `DIRECT_URL` set, even though it does not connect)                                    |
| `pnpm db:migrate`                   | Apply pending migrations                                                                                                            |
| `pnpm db:seed`                      | Add the seed accounts to a local or preview database (idempotent; does nothing on staging and production)                           |
| `pnpm db:studio`                    | Open Drizzle Studio                                                                                                                 |
| `pnpm brand:assets`                 | Regenerate the logo PNGs and icons in `public/brand/` from the SVG master                                                           |
| `pnpm vercel-build`                 | Migrate, seed, then build (Vercel runs this)                                                                                        |

## Project layout

The parts that exist today:

```
src/
├── app/                      # App Router
│   ├── layout.tsx            # <html>, metadata, Inter, theme script, header/footer, toaster
│   ├── page.tsx              # brand landing page
│   ├── not-found.tsx, error.tsx, global-error.tsx
│   ├── globals.css           # Tailwind 4 + shadcn theme
│   └── api/health/route.ts   # GET /api/health: database check for uptime monitors
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   └── logo.tsx, site-header.tsx, site-footer.tsx, theme-toggle.tsx
├── lib/                      # pure utilities, safe anywhere: site.ts (branding), utils.ts (cn), theme.ts
├── env.schema.ts             # Zod env schemas + `parseEnv()`; no server-only, so scripts can use it
├── env.ts                    # server-only, cached config accessor (`env()`)
├── instrumentation.ts        # validates the env when the server starts (+ instrumentation-node.ts)
├── server/db/
│   ├── index.ts              # lazily connected Drizzle client (`db`)
│   ├── database-url.ts       # preview database names, URL rewriting, direct TLS; no server-only
│   └── schema/index.ts       # schema barrel: one file per module, re-exported here
└── test/db.ts                # PGlite test database (`createTestDb()`)
drizzle/                      # generated SQL migrations (committed)
scripts/
├── migrate.ts                # applies migrations through DIRECT_URL, under an advisory lock
├── preview-database.ts       # creates a preview's database from foa_seed
├── load-env.ts               # loads .env.local and .env for scripts and drizzle-kit
└── brand-assets.ts           # derives logo PNGs and icons from the SVG master
tests/e2e/                    # Playwright journeys (*.spec.ts) run against a deployment, with their setup; config in playwright.config.ts
public/brand/                 # the registered logo: SVG master + derived assets
.github/                      # CI workflows and the shared setup action
docker/                       # the VPS database stack: Postgres, PgBouncer, backups (runbook: docker/README.md)
Dockerfile, docker-compose.yml
```

Still to come: the route groups under `src/app/`, `src/server/{domain,jobs,integrations,auth}/`, `src/worker/`, `src/emails/`, and `src/i18n/` + `messages/`.

`docker/` is not part of the app: it is the database stack the VPS runs (Postgres, PgBouncer, backups, firewall), with its own runbook, [`docker/README.md`](docker/README.md).

Code that must never reach the browser starts with `import "server-only"`, so importing it from a Client Component fails the build. Today that is `src/env.ts` and `src/server/db/index.ts`.

Outside a Next.js server bundle, `server-only` throws as soon as it is imported. So the schema files in `src/server/db/schema/` (drizzle-kit loads them), `src/env.schema.ts` and `src/server/db/database-url.ts` (the migration script and drizzle-kit use them), `scripts/`, and anything else that runs under plain Node must not import it, directly or through another module. The future `src/worker/` must either stick to such modules or start Node with `--conditions=react-server`, under which `server-only` resolves to an empty module.

## Database and migrations

The Drizzle schema in `src/server/db/schema/` is the source of truth. Add one file per module and re-export it from `schema/index.ts`. To change the database:

```bash
# 1. edit src/server/db/schema/
pnpm db:generate       # 2. writes a new SQL file to drizzle/
                       # 3. review the SQL and commit it with your change
pnpm db:migrate        # 4. apply it to your database
```

For SQL that Drizzle can't express (extensions, functions, triggers), create an empty migration with `pnpm db:generate --custom --name <what_it_does>` and write the SQL yourself. The first migration, `0000_enable_pg_trgm`, is one: it enables `pg_trgm` for search.

Never edit a migration that has already been applied anywhere; generate a new one instead.

The app's `db` client connects on first use, with prepared statements off (PgBouncer in transaction mode doesn't support them), a pool of 5, a 5 s connect timeout, a 20 s idle timeout and a 20 s `query_timeout`. That last one is only a backstop for a database that stops answering: on the VPS the app roles have a 15 s `statement_timeout` and a 60 s `idle_in_transaction_session_timeout`, and the migrator roles a 30 s `lock_timeout`. Importing it needs no database, so `next build` runs without `DATABASE_URL`; the server itself won't start without it (see [Environment variables](#environment-variables)). TLS comes from the URL's `sslmode`: `verify-full` on Vercel, none locally. When `sslmode` always encrypts, the client also starts TLS on the first byte (`sslnegotiation: 'direct'`, which PgBouncer accepts since 1.25), saving a round trip per connection.

`pnpm db:migrate` holds a Postgres advisory lock (key `5066339983389443922`, the bytes of `FOA_MIGR`) while it migrates, because Drizzle's migrator takes none and Vercel can build two commits of one branch at once: a second run logs that it is waiting, then finds nothing left to apply. Advisory locks belong to one database, so previews don't wait for each other.

### Databases on Vercel

Both URLs point at PgBouncer on the VPS, `db.shipped-it.dev:6432`, with `?sslmode=verify-full`. PgBouncer sends database `foa` to `pg-prod` and every other name to `pg-nonprod`.

| Environment | Database in the URL                 | `DATABASE_URL` role | `DIRECT_URL` role  |
| ----------- | ----------------------------------- | ------------------- | ------------------ |
| production  | `foa`                               | `foa_app`           | `foa_migrator`     |
| staging     | `foa_staging`                       | `staging_app`       | `staging_migrator` |
| preview     | `foa_pr`, a placeholder (see below) | `nonprod_app`       | `nonprod_migrator` |

The app roles can only read and write rows, and PgBouncer pools them by transaction. The migrator roles own the schema and get session mode through a per-user `pool_mode`, so the migration's advisory lock holds. Staging and previews have separate roles: Vercel has no build-only variables, so any preview function could use the preview's `DIRECT_URL`, and the preview roles cannot connect to `foa_staging` at all.

Every preview gets a database of its own. With `APP_ENV=preview`, `src/server/db/database-url.ts` replaces the placeholder with `foa_pr_<n>_<fp>` from `VERCEL_GIT_PULL_REQUEST_ID`, or, before the branch has a PR, `foa_br_<slug>_<hash>_<fp>` from `VERCEL_GIT_COMMIT_REF`: the branch lowercased with other characters turned into `_`, cut so the name fits 63 bytes, then 8 hex characters of the branch's SHA-256. The hash is always added, so branches such as `feat/a-b` and `feat/a.b` never share a database. `<fp>` is the migrations fingerprint: 8 hex characters of the SHA-256 of every migration's tag and date in `drizzle/meta/_journal.json`, bundled into the build. When a branch's migrations are added to, regenerated or renumbered, its next deployment gets a fresh database, because Drizzle's migrator can't apply re-dated migrations to a database that ran the old ones. `pnpm db:migrate` first runs `CREATE DATABASE <name> TEMPLATE foa_seed` (an existing database counts as success) and comments the database `foa-preview pr=<n>` or `foa-preview branch=<ref>`. An hourly sweeper on the VPS reads that comment and drops the databases of closed PRs and deleted branches.

## Testing

```bash
pnpm test             # run once
pnpm test:watch       # watch mode
```

Tests don't need Docker. `createTestDb()` returns a fresh in-memory Postgres (PGlite) with `pg_trgm` loaded and the real migrations from `drizzle/` applied. Code under test imports `db` from `@/server/db`; swap it for the test database:

```ts
import { beforeEach, vi } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";

let testDb: TestDb;
vi.mock("@/server/db", () => ({
  get db() {
    return testDb;
  },
}));

beforeEach(async () => {
  testDb = await createTestDb();
});
```

Under Vitest, `server-only` resolves to an empty module, so server code can be imported directly.

### End-to-end tests

The Playwright journeys in `tests/e2e/` never start a server of their own: they run against a deployment, normally a PR's Vercel preview. Every page a journey visits is also checked with [axe](https://github.com/dequelabs/axe-core-npm), and any violation fails the test. Each test runs twice, on desktop Chrome and on a Pixel 7. In CI they run on every PR ([Continuous integration](#continuous-integration)).

To run them yourself, install Chromium once, then point `PLAYWRIGHT_BASE_URL` at the deployment:

```bash
pnpm exec playwright install --with-deps chromium   # once

# A PR preview: copy its URL from the PR's Vercel comment or the dashboard.
# Previews sit behind Vercel Authentication, so pass the project's
# Protection Bypass for Automation secret (Vercel → Settings →
# Deployment Protection), here read with the Vercel CLI without printing it:
export VERCEL_AUTOMATION_BYPASS_SECRET="$(vercel api /v9/projects/friends-of-animals --scope acme-ef4b \
  | jq -r '.protectionBypass | to_entries[] | select(.value.scope == "automation-bypass") | .key')"
PLAYWRIGHT_BASE_URL=https://friends-of-animals-<hash>-acme-ef4b.vercel.app pnpm test:e2e

# Staging needs no secret.
PLAYWRIGHT_BASE_URL=https://shipped-it.dev pnpm test:e2e

# A local production build (pnpm build, then DATABASE_URL=… PORT=3100 pnpm start):
PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm test:e2e
```

Add `--ui` to watch the tests run, or `--project=desktop` for one viewport. A failed test leaves a trace and a screenshot in `test-results/`; open a trace with `pnpm exec playwright show-trace <path>/trace.zip`.

The secret goes only to this project's own deployments (`https://friends-of-animals-…-acme-ef4b.vercel.app`), so a run pointed at localhost, staging or a mistyped URL never sends it. Global setup (`tests/e2e/global-setup.ts`) trades it once for Vercel's bypass cookie, saved in `playwright/.auth/` (git-ignored), and the tests use the cookie, so the secret never appears in a trace. The cookie does (it opens that one preview for a week), so CI strips it from traces before uploading them.

## Continuous integration

Two GitHub Actions workflows keep `main` deployable:

| Workflow                    | When                                | What                                                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`  | every PR, and every push to `main`  | lint, typecheck, format check and Vitest. Every check runs even after one fails, and any failure fails the job.                                                                                                                                            |
| `.github/workflows/e2e.yml` | once a PR's Vercel preview is ready | the Playwright journeys and axe against that preview, never staging. The result appears on the PR as the commit status `E2E: Playwright and axe on the preview`. A failed run uploads traces and screenshots as the `playwright-…` artefact, kept 14 days. |

`e2e.yml` depends on three settings outside the repo:

- **Vercel sends `repository_dispatch` events.** When a deployment is ready, Vercel sends `vercel.deployment.success` with its URL and environment, and the workflow runs only for `environment == "preview"`. It is a Git setting of the Vercel project, `gitProviderOptions.disableRepositoryDispatchEvents: false` in its API. The project doesn't create GitHub Deployments, so `deployment_status` never fires. GitHub runs `repository_dispatch` workflows from the default branch only, so a change to `e2e.yml` takes effect once it is on `main`.
- **The repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`** holds the Vercel project's Protection Bypass for Automation secret, which gets the tests past Vercel Authentication on previews. GitHub masks it in logs. To rotate it, regenerate it in Vercel (_Settings → Deployment Protection_) and set the new value with `gh secret set VERCEL_AUTOMATION_BYPASS_SECRET`.
- **Vercel's Git Fork Protection stays on** (the default). The job runs the deployed commit's own code with the secret, so it relies on Vercel building a fork's PR only after a team member authorises it.

To rerun the journeys by hand against any preview: `gh workflow run e2e.yml -f url=https://<preview> -f ref=<branch or SHA>` (the result shows in the Actions tab, not on the PR).

## Environment variables

Copy `.env.example` to `.env` for local development. Next.js, drizzle-kit and `pnpm db:migrate` all read it. In app code, read server config through `env()` from `@/env` rather than `process.env`.

The schemas live in `src/env.schema.ts`. The server validates its environment as it starts (`register()` in `src/instrumentation.ts`): if a required variable is missing or invalid, it prints the problems and exits instead of serving errors. `next build` needs no database: code that runs while pages are prerendered reads only `buildEnvSchema` (`APP_URL`, `APP_ENV`, `NODE_ENV`). A local run may leave all of them out. A deployment may not: `APP_URL` is required on staging and production, and `APP_ENV` is required on Vercel (where `VERCEL` is set), at build time and at runtime. A preview without `APP_URL` uses `https://$VERCEL_BRANCH_URL` (or `VERCEL_URL`). A preview also fails to start or migrate when neither `VERCEL_GIT_PULL_REQUEST_ID` nor `VERCEL_GIT_COMMIT_REF` can name its database.

| Variable       | Required                  | Description                                                                                                                                                                                                                       |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | to start the server       | Runtime Postgres URL. On Vercel: PgBouncer on the VPS with the app role ([Databases on Vercel](#databases-on-vercel)). Not needed by `next build`.                                                                                |
| `DIRECT_URL`   | for migrations            | Session-mode URL with the migrator role for `pnpm db:migrate` and drizzle-kit, which never fall back to `DATABASE_URL`. Locally the same URL as `DATABASE_URL`.                                                                   |
| `APP_URL`      | on staging and production | Canonical base URL for absolute URLs (Open Graph images). Defaults to `http://localhost:3000` locally and to the branch URL on a preview. Read only on the server, but prerendered pages bake it in, so set it at build time too. |
| `APP_ENV`      | on Vercel                 | `local` (default), `preview`, `staging` or `production`. Branch on this for behaviour switches, not on `VERCEL_ENV`.                                                                                                              |

## Deploying

The app runs on Vercel Pro with its functions in `bom1` (Mumbai), set in `vercel.json`. Which branch deploys where:

| Branch       | Vercel environment           | Domain                                                                   | Database      |
| ------------ | ---------------------------- | ------------------------------------------------------------------------ | ------------- |
| `main`       | custom environment `staging` | [shipped-it.dev](https://shipped-it.dev), public; `www.` redirects to it | `foa_staging` |
| `production` | Production                   | FOA's own domain                                                         | `foa`         |
| any other    | Preview                      | its `*.vercel.app` URLs, behind Vercel Authentication                    | its own       |

Every push to `main` deploys staging. The `production` branch doesn't exist yet: production stays dormant until FOA's domain is added to it, then `production` is created from `main` and pushed. Promoting a staging deployment to Production in Vercel rebuilds it with the Production variables, so it runs the migrations against `pg-prod`.

Vercel detects Next.js and runs the `vercel-build` script, which applies the migrations, seeds a preview's database and then builds:

- Migrations connect through `DIRECT_URL` only (the migrator role, which PgBouncer gives session mode), never `DATABASE_URL`. It must be available at **build** time: without it `pnpm db:migrate` exits with an error and the deployment fails.
- Staging and production migrate the database `DIRECT_URL` names (`foa_staging`, `foa`) in place. Each preview deployment gets its own database (`foa_pr_<n>_<fp>`, or `foa_br_<slug>_<hash>_<fp>` before its PR) on the non-production Postgres, created during the build ([Databases on Vercel](#databases-on-vercel)).
- The databases (Postgres 18 on the Mumbai VPS behind PgBouncer, with backups, and the `foa_seed` template) are set up in [#12](https://github.com/SiddharthMuramkar/friends-of-animals/issues/12), from `docker/` (runbook: [`docker/README.md`](docker/README.md)). `foa_seed` stays empty: after migrating, `pnpm db:seed` (`scripts/seed.ts`) fills a preview's own database with the seed accounts. It is idempotent, and on staging and production it exits without connecting.

Set `APP_ENV`, `DATABASE_URL` and `DIRECT_URL` per environment in the Vercel project settings, and `APP_URL` for staging (`https://shipped-it.dev`) and production; without them the build fails. Vercel exposes them to the build as well as at runtime, which `APP_URL` needs.

`GET /api/health` runs `select 1` and answers `{"status":"ok","db":{"ok":true,"ms":<n>}}`, or 503 with `{"status":"error","db":{"ok":false}}` (details go to the server log only). It is never cached.

## Brand assets

The FOA logo is a registered mark. `public/brand/` holds the SVG master and every derived PNG and icon; its [README](public/brand/README.md) explains the files and the rules. Never redraw or recolour it. To regenerate the derived files from the master, run `pnpm brand:assets`.
