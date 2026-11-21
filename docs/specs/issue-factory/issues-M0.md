# M0 ticket analysis: #57 to #68 (milestone M0, "foundations")

Inputs: `research/open-M0.json`, `research/spec-55.md`, `research/raw-{open,closed,prs}.json`, GitHub
(PR #136, branch list, comments on #55 and #67, native dependency counts from the search API), and the
repo at `/home/user/friends-of-animals` (branch `claude/stoic-thompson-ukn0dx` = `main` e340a6a plus
two skill-vendoring commits). Analysed 2026-11-19.

Legend. AFK class: **A** fully agent-doable against fakes/ports; **B** agent-doable core plus human
residue; **C** mostly human. Size in agent effort: S <1h, M 1-3h, L 3-8h, XL >8h (split). Design
uncertainty 1-5 = how many credible, materially different designs exist. "explicit" edge = stated in
the ticket body (by ordinal or module name) and/or present as a native GitHub dependency; "inferred" =
required by the acceptance criteria but not stated.

---

## 0. Verified facts the rest of this file relies on

### 0.1 Ordinal mapping

Ordinal n in #55 = issue #(55+n), verified:

| Ordinal | Issue | Evidence |
| --- | --- | --- |
| 1 | #56 (closed 2026-11-19, merged as 623d950) | "M0: CI on every PR: lint, typecheck, tests, Playwright and axe on the preview" |
| 2 | #57 | #58 "builds on the Identity and access module from 2"; #65 "signed-in areas (from 2 on)" |
| 3 | #58 | #57 "Phone sign-in (3) ... come later" |
| 4 | #59 | #57 "roles (4) come later" |
| 5 | #60 | #59 "The staff 2FA gate (5) comes later"; #62 "needs step-up (5)" |
| 17 | #72 | #64 "consent attached to competitions (17)" = "Competition fees, award schemes and attached consent documents" |
| 27 | #82 | #64 "Guardian consent for each purpose (27)" |
| 30 | #85 | #63 "Derived copies and metadata stripping come with submissions (30)" = "Image submission by an individual participant" |

None of the 80 open issues has a GitHub milestone set (`milestone: null`). Milestone membership is the
`M0:` title prefix only. The Orchestrator groups by title prefix.

### 0.2 Native GitHub dependencies

Native dependencies exist. The search API exposes only counts (`issue_dependencies_summary`), not the
edges. The inferred edge set below reproduces every count exactly (11 internal M0 edges; all M0
blockers are open M0 tickets, `total_blocked_by` = `blocked_by`).

| Issue | Ord | Open blocked_by | Open blocking | Native blockers (inferred, count-exact) | Native blocked (inferred) |
| --- | --- | --- | --- | --- | --- |
| #57 | 2 | 0 | 4 | none | #58, #59, #61, #65 |
| #58 | 3 | 1 | 0 | #57 | none |
| #59 | 4 | 1 | 8 | #57 | #60, #63, #64 + 5 in M1+ |
| #60 | 5 | 1 | 6 | #59 | #62 + 5 in M1+ |
| #61 | 6 | 1 | 5 | #57 | #63, #64, #68 + 2 in M1+ |
| #62 | 7 | 1 | 2 | #60 | 2 in M1+ |
| #63 | 8 | 2 | 5 | #59, #61 | 5 in M1+ |
| #64 | 9 | 2 | 3 | #59, #61 | 3 in M1+ |
| #65 | 10 | 1 | 0 | #57 | none |
| #66 | 11 | 0 | 0 | none | none |
| #67 | 12 | 0 | 0 | none | none |
| #68 | 13 | 1 | 0 | #61 (or #63: count-equivalent; treat both as blockers) | none |

Runtime check the Orchestrator runs before wave 0 (edges, not counts):
`gh api repos/siddhartxts/friends-of-animals/issues/<n>/dependencies/blocked_by --jq '[.[].number]'`
for n in 57..68 (on a VPS runner), or GraphQL `issue(number:<n>){ blockedBy(first:20){ nodes{ number state } } }`.
Do NOT use the search qualifiers `blocked-by:<n>` / `blocking:<n>`: they returned unrelated issues
(#12, #37, #40, #52, #55) in testing; they are not dependency filters.

### 0.3 Repository state (what exists, what does not)

Exists and is reused by M0:

- `src/test/db.ts` `createTestDb()`: fresh in-memory PGlite 0.5.16 per call, loads the `pg_trgm`
  extension, applies the real `./drizzle` migrations. Code under test imports `db` from
  `@/server/db`, swapped with `vi.mock` (documented in the file).
- `src/server/db/index.ts`: lazy postgres.js client, `prepare: false` (PgBouncer transaction mode),
  `max: 5`. `src/server/db/database-url.ts`: previews connect to `foa_pr_<n>` (or `foa_br_<slug>_<hash>`
  before the branch has a PR), swapped in from the placeholder `foa_pr` URL.
- `src/server/db/schema/index.ts`: an empty barrel (`export {}`) with the rule "one file per module,
  re-exported here; never import server-only in schema files".
- `drizzle/`: one migration, `0000_enable_pg_trgm.sql` (custom SQL). `drizzle.config.ts` reads
  `DIRECT_URL` only.
- `scripts/migrate.ts`: advisory-locked migration through `DIRECT_URL`; on previews creates the preview
  database from template `foa_seed` first (`scripts/preview-database.ts`), keeping it if it exists
  ("exists; keeping it"), so preview databases persist across pushes to the same PR.
- `package.json` `vercel-build` = `pnpm db:migrate && next build && pnpm check:build`.
- `src/env.schema.ts` (zod 4) with `envSchema` (runtime), `buildEnvSchema` (prerender),
  `migrationEnvSchema`. `APP_ENV` in `local | preview | staging | production` drives behaviour.
- `src/proxy.ts` (Next 16 replacement for middleware) with matcher `["/blog/:slug", "/competitions/:slug"]`
  only (404 rewrite for unknown slugs).
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `output: "standalone"`,
  `headers()` = `securityHeaders(APP_ENV)` (#50: HSTS, nosniff, Referrer-Policy, Permissions-Policy,
  COOP, X-Frame-Options DENY) + noindex outside production (#29). No CSP.
- `src/app/layout.tsx`: root layout with static `SiteHeader`, an inline theme script
  (`<script dangerouslySetInnerHTML={{ __html: themeScript }} />`) and JSON-LD.
- `src/app/api/health/route.ts`: `GET` runs `select 1`; comment: "the queue and worker heartbeat join it
  with the worker".
- `src/i18n/messages.ts`: every namespace imported statically and listed three times (import,
  `NAMESPACES`, spread). `src/i18n/messages.test.ts` fails unless files and `NAMESPACES` match exactly
  and each file holds one top-level key named after the file; it also bans cliché phrases.
- `src/lib/routes.ts`: the one registry of public routes; comment says login and later modules stay out
  until built; supports `nonProduction: true`.
- Playwright (Seam 2) wired by #56: `playwright.config.ts` requires `PLAYWRIGHT_BASE_URL`, projects
  `desktop` (Desktop Chrome) and `mobile` (Pixel 7), `retries: 0`, bypass cookie via
  `VERCEL_AUTOMATION_BYPASS_SECRET`; `tests/e2e/smoke.spec.ts` with an axe helper.
- CI: `.github/workflows/ci.yml` on every `pull_request` (any base, so PRs into `factory/trunk` are
  covered) and pushes to main. `.github/workflows/e2e.yml` on `repository_dispatch`
  `vercel.deployment.success` (preview only) and `workflow_dispatch` (`url`, `ref` inputs).
- VPS (`docker/`): pg-prod (database `foa`), pg-nonprod (`foa_staging`, template `foa_seed`, previews),
  PgBouncer `db.shipped-it.dev:6432` (TLS+SCRAM, transaction pooling), pgBackRest, hourly
  `sweep-preview-dbs.sh` that drops `foa_pr_<n>` when the PR is closed and `foa_br_*` when the branch is
  gone (keyed on the database comment `foa-preview pr=<n>` / `foa-preview branch=<ref>`).

Does not exist (M0 creates it): Better Auth, any table, any use case, the `as(actor)` seam, a fake
clock, provider ports or fakes, seed builders or a seed command, pg-boss, a worker process, R2/S3
code, ClamAV, Sentry, a CSP, `GLOSSARY.md`, `docs/adr/`, `.claude/settings.json` (no guardrail hooks
yet).

---

## 1. Findings the Orchestrator must act on before wave 0

**F1. M0 is already partly underway on branch `M0` (draft PR #136).** PR #136 "M0 foundations"
(head `M0` at 0121d0d, base `main`, draft, 3 commits, `mergeable_state: clean`) is an integration
branch where "each ticket lands with a `--no-ff` merge". #67 is implemented and merged into `M0` at
9c69f10 (restore drill rewrite, `restore-drill.test.ts`, systemd timer; "36 test files, 439 tests
pass"); #67's only comment confirms it. The other 11 tickets are listed "in progress", but no branch
for them exists on origin (branches: `M0`, `main`, `claude/stoic-thompson-ukn0dx`). Charter decision 2
cuts `factory/trunk` from `main`, which would drop #67's work. Required before wave 0:
(a) cut `factory/trunk` from `M0` instead of `main` (or merge `M0` into `factory/trunk` as its first
commit); (b) `list_sessions` / branch scan to confirm no other session is building any M0 ticket
(duplicate-work risk); (c) owner decides the fate of PR #136 (close in favour of the factory's
release PR, or keep as the release PR for M0). Mark #67 `factory:merged-trunk` once trunk contains
9c69f10; do not rebuild it.

**F2. Hand-written SQL migrations collide with charter decision 9.** Decision 9 says runners edit the
Drizzle TS schema only and the merge queue regenerates SQL. M0 needs SQL that `drizzle-kit generate`
cannot produce from the TS schema: #59 append-only trigger on `audit_log` (`BEFORE UPDATE OR DELETE`
row trigger + `BEFORE TRUNCATE` statement trigger), #64 immutability of published consent documents,
#61 pg-boss DDL (if installed by migration) and any `GRANT USAGE ON SCHEMA`, optionally #61 an
`AFTER INSERT` trigger writing the welcome outbox row. The existing `0000_enable_pg_trgm.sql` is itself
custom. The merge-queue rule must keep custom SQL: runner commits the body to
`drizzle/custom/<issue>-<slug>.sql`; after rebase the merge queue runs
`pnpm drizzle-kit generate --custom --name <issue>_<slug>` and pastes the body into the generated file,
then regenerates schema migrations; `restore-drill.sh` `expected_objects` reads the journal and
snapshots, so journal/snapshot integrity is a gate.

**F3. Seam 2 workflow changes do not take effect from `factory/trunk`.** `e2e.yml` says GitHub runs
`repository_dispatch` workflows from the default branch only. Any ticket that changes `e2e.yml`
(e.g. #57 passing a mailbox token to Playwright) is inert until merged to `main`, which the factory
never does. Options: (1) owner merges a small PR to `main` before wave 0 that passes
`CAPTURE_MAILBOX_TOKEN` (and later secrets) into the "Run Playwright" step; (2) the Orchestrator runs
`gh workflow run e2e.yml --ref <ticket-branch> -f url=<preview-url> -f ref=<sha>`
(`workflow_dispatch` uses the workflow file from `--ref`), but then no commit status is posted (the
status step is gated on `repository_dispatch`), so the Orchestrator reads the run conclusion itself.
Recommended: (1) as residue R0-2, with (2) as the fallback.

**F4. Deployment secrets gate Seam 2 from #57 on.** Once Better Auth is in, every preview needs
`BETTER_AUTH_SECRET` at runtime (and at build, if the seed writes BA-encrypted TOTP secrets in #60).
Missing it fails preview boot (`validateEnvOrExit`) or auth. New provider variables must be optional
outside production (capture/fake adapters by default) so previews stay green without human action;
only `APP_ENV=production` requires SES/MSG91/R2/Sentry keys. Wave-0 residue R0-1: set
`BETTER_AUTH_SECRET` (distinct values: Preview, staging custom environment, Production) and
`CAPTURE_MAILBOX_TOKEN` (Preview, staging; plus GitHub Actions secret) in Vercel. Whether the
Orchestrator may set Preview-scope random secrets itself via Vercel MCP `create_project_env` is a
charter decision; default is human.

**F5. Staging is the public live site.** Staging deploys `main` to `shipped-it.dev`; production is
dormant. "Outside production, a capture adapter stores each message so staff and tests can read the
code" therefore puts OTP codes on a public site: anyone who can read the capture mailbox can sign in as
anyone on staging. The mailbox reader must be (a) absent in production (404), (b) behind a
constant-time-compared `x-foa-mailbox-token` header (Playwright) or a staff role with 2FA (humans,
after #60), (c) never linked from navigation, `noindex`, `Cache-Control: no-store`. Judges check this
explicitly (security rubric).

**F6. Database roles are DML-only, and role names differ per environment.** App roles (`foa_app`,
`staging_app`, `nonprod_app`) get SELECT/INSERT/UPDATE/DELETE through `ALTER DEFAULT PRIVILEGES FOR ROLE
<env>_migrator`, cannot CREATE, and "new schemas need `GRANT USAGE ON SCHEMA ... TO foa_app` in their
migration" (docker/README). A migration cannot hard-code the env's role name. Consequences: keep every
FOA table in `public`; pg-boss (#61) needs its own schema plus DDL at queue creation, so either the
worker connects as a role that owns schema `pgboss` (new VPS roles `foa_worker`, `staging_worker`,
`nonprod_worker`: human residue) or Vercel never touches pg-boss (outbox-only, recommended). The
append-only trigger (#59) also binds the migrator (table owner): data fixes and DPDP erasure need a
superuser path (`SET session_replication_role = replica`), which only the owner can run.

**F7. Static rendering constraints shape #57, #64 and #65.** `cacheComponents` is on, `next build` has
no database ("the build needs no database and no secrets"), and the root layout renders `SiteHeader` on
every page. (a) #57 must keep the header static: a plain "Sign in" link, no server-side session read in
the root layout. (b) #64 "legal pages show the current published version" moves `/privacy` and
`/terms` text from `src/content/legal/*.ts` to the database; a page that queries at build fails, and a
request-time page is no longer "statically rendered", which #65 requires of "every public page". This
is a real #64 vs #65 conflict; acceptable designs: static shell + cached dynamic hole (`'use cache'` with
a tag, `revalidateTag`/`updateTag` on publish; check `node_modules/next/dist/docs/01-app` for the Next
16.4 API) with #65's "statically rendered" check scoped to the shell, or a build-time fallback to the
repo text plus request-time refresh. (c) The Next 16.4 CSP guide (`node_modules/next/dist/docs/01-app/
02-guides/content-security-policy.md`) states nonces require dynamic rendering and "Partial Prerendering
(PPR) is incompatible with nonce-based CSP"; with `cacheComponents` every route gets a prerendered
shell where possible, so signed-in trees must opt out entirely (e.g. `await connection()` in the
signed-in layout). It also documents experimental SRI (`experimental.sri`) for hash-based CSP on
static pages. Next's App Router emits inline flight-data scripts (`self.__next_f.push`), so a public
CSP of `script-src 'self'` alone breaks hydration; #65 must pick hashes, SRI + `'strict-dynamic'`, or
`'unsafe-inline'` on static pages. Design uncertainty is maximal.

**F8. Better Auth 1.7 constraints (verified in its 1.7.15 docs).** (a) `rateLimit` is per IP + path
(`window`, `max`, `customRules`, `storage: "memory" | "database" | "secondary-storage"`, model
`rateLimit`), enabled by default only in production; per-identifier (per email, per phone) limits are
FOA code. In tests it must be enabled explicitly. (b) `emailOTP` options include `expiresIn` (seconds),
`allowedAttempts` (default 3, then `TOO_MANY_ATTEMPTS`), `sendVerificationOTP`. (c) Passkeys are a
separate package `@better-auth/passkey`; TOTP is `twoFactor` from `better-auth/plugins`.
(d) `session.freshAge` measures time since session creation (default 1 day), not time since the last
second factor, so step-up (#60) is FOA code (a `second_factor_at` column or per-action verification).
(e) BA's core user model requires a unique email; phone-only sign-up (#58) needs the phoneNumber
plugin's temp-email approach or FOA's own flow; the spec's "User, holding an email, a phone or both"
is not BA's default. (f) BA creates users through its adapter, outside FOA's transactions, so #61's
"Signing up writes a welcome event in the same transaction ... If the transaction rolls back, no event
is sent" needs a verified mechanism: a BA database hook proven to share the insert's transaction, a
Postgres `AFTER INSERT ON "user"` trigger writing the outbox row (atomic regardless of BA), or FOA
owning user creation. Verify each in `node_modules/better-auth` at runtime.

**F9. VPS capacity under parallel previews.** pg-nonprod: 2 CPU, 4 GB, `max_connections = 200`;
PgBouncer gives each preview database `pool_size=10 reserve_pool_size=2`. W parallel ticket PRs = W
preview databases. Add the shared preview worker (#61: direct connections per live preview database),
ClamAV (#63: roughly 1-1.5 GB RAM with signatures) and the staging worker. With W=10, preview pools
alone can claim 120 connections. The shared preview worker must cap connections per database (1-2) and
the Orchestrator should keep W <= 6 while #61/#63 run on the VPS.

**F10. Rate limits vs Seam 2.** Playwright runs `fullyParallel` across two projects from one GitHub
runner IP against a persistent preview database. Per-IP code limits (#57, #58) will trip unless the
journeys use few code requests and unique emails per run (`e2e+<runId>-<project>@example.test`), and
the per-IP default leaves headroom (e.g. 20 codes per IP per 15 min). No bypass header: a bypass on
staging is an account-takeover vector (F5).

**F11. Shared-file hotspots across M0 (serialize or design out).**

| File / area | Touched by | Mitigation the harness ticket (#57) should build in |
| --- | --- | --- |
| `src/server/db/schema/index.ts` | all with tables (#57-#64, #68) | one `export * from "./<module>"` line per module; merge queue unions lines |
| `drizzle/*.sql`, `drizzle/meta/*` | all with tables | charter rule 9 plus F2 custom-SQL rule |
| `src/test/world.ts` (harness) | #58 (SMS fake), #59 (roles in actors), #61 (drain), #63 (storage, scanner fakes), #66 (error reporter fake), #68 | registries: modules register fakes, seed builders and drainers in their own files; `world.ts` never edited after #57 |
| `src/server/app/*` composition root | every port ticket | ports map typed by module augmentation; one registration line per module |
| `src/server/seed/*` | #57, #58, #59, #60, #62, #64 | per-module seed files, one barrel line each |
| `src/env.schema.ts`, `.env.example` | #57, #58, #61, #63, #66, #68 | per-provider schema fragments merged in one place; optional outside production |
| `src/i18n/messages.ts` | #57, #59, #60, #61, #62, #63, #64 | 3 lines per namespace; merge queue unions; keep namespaces disjoint |
| Better Auth config (`src/server/modules/identity/auth.ts`) | #57, #58 (phone), #60 (twoFactor, passkey, session hooks) | plugin list assembled from per-feature files |
| `src/proxy.ts` | #57 (optional signed-in redirect), #60 (staff gate), #65 (CSP nonce) | #57 defines `SIGNED_IN_PREFIXES` in `src/lib/routes.ts`; #65 owns proxy CSP |
| `next.config.ts`, `src/instrumentation.ts` | #65 (static CSP headers), #66 (Sentry) | keep CSP in `src/lib/csp.ts`, Sentry in `src/lib/observability/*` |
| `src/app/layout.tsx` | #65 (theme script out of inline), #66 (Sentry client) | no session reads in the root layout |
| `package.json`, `pnpm-lock.yaml` | most | merge queue reruns `pnpm install --lockfile-only` after rebase |
| `docker/compose.yml`, `docker/README.md` | #61, #63, #66, #68 (and #67 already) | new services in a separate `docker/workers.yml` compose file |
| `docker/scripts/sweep-preview-dbs.sh` | #61 (stop serving), #63 (purge prefix) | a post-drop hook directory (`docker/scripts/preview-dropped.d/*.sh`) |
| `tests/e2e/*.spec.ts` | #57, #59 then #60 (step-up in the roles journey), #63 | shared helpers in `tests/e2e/support/` created by #57 |
| `vitest.config.ts` | #57 (setup files), #61 (maybe a Postgres project) | settle structure in #57 |

---

## 2. Per-ticket analysis

### #57 (ordinal 2): M0: Sign up and sign in by email one-time code

- **Depends on:** nothing open (explicit: no native blockers; #56 CI is closed and merged).
- **Blocks:** #58 (explicit "from 2", native), #59 (inferred, native), #61 (inferred: "welcome message
  sent after sign-up", native), #65 (explicit "from 2 on", native); every later ticket through the
  Seam 1 harness and seed builders (explicit: "lays the base every later ticket tests on").
- **AFK class:** B.
- **Human residue:**
  1. R0-1: Vercel env `BETTER_AUTH_SECRET` (>=32 random bytes, distinct for Preview, staging,
     Production) and `CAPTURE_MAILBOX_TOKEN` (Preview, staging) plus GitHub Actions secret
     `CAPTURE_MAILBOX_TOKEN`. Blocks this ticket's Seam 2 gate (F4).
  2. R0-2: a `main` PR adding `CAPTURE_MAILBOX_TOKEN: ${{ secrets.CAPTURE_MAILBOX_TOKEN }}` to the
     "Run Playwright" step of `e2e.yml` (F3), or accept `workflow_dispatch` fallback.
  3. SES for production (dormant until FOA's domain; #18 closed not_planned): AWS account in
     `ap-south-1`, verified sending domain with DKIM/SPF/DMARC records in Cloudflare DNS, production
     access (sandbox exit), IAM key restricted to `ses:SendEmail` on that identity, keys in Vercel
     Production env. Wizard-walkable.
  4. Decisions with defaults (one non-blocking `ready-for-human` decision issue): code length 6 digits,
     lifetime 10 min, 5 verify attempts per code, per-email limit 5 codes / 15 min, per-IP 20 codes /
     15 min, member session 30 days, sign-up notice wording (counsel for DPDP notice).
  5. Vercel "Run up to one build per branch" (docker/README follow-up 7; the seed now runs in the
     build too; the advisory lock covers migrations only).
- **Ports / providers:** `EmailSender` port (SES adapter via `@aws-sdk/client-sesv2`; capture adapter
  writing `captured_message`; in-memory fake for Seam 1); `Clock`; `Ids` (UUIDv7, generated in app:
  PGlite 0.5 is not Postgres 18, so no server `uuidv7()`); `OtpCodes` (random source, deterministic in
  tests); `RateLimiter` (Postgres-backed); Better Auth 1.7 (`drizzleAdapter`, `emailOTP`, `nextCookies`)
  as a library behind the identity module, never imported by UI code.
- **New tables / columns:** Better Auth core `user`, `session`, `account`, `verification` (generate with
  the BA CLI into `src/server/db/schema/identity.ts`; ids UUIDv7 via `advanced.database.generateId`);
  per-identifier limiter `otp_rate_limit` (scope enum `email|ip`, `key_hash` = HMAC of the normalised
  identifier or IP, `window_start`, `count`; PK (scope, key_hash, window_start)) and/or BA's
  `rateLimit` table for its per-IP-per-path limiter; `captured_message` (id, channel enum `email|sms`,
  `to_address`, subject, `body_text`, `body_html`, `meta` jsonb, `created_at`), present in every
  environment's schema, written only outside production. No custom SQL needed.
- **Routes / pages:** `/sign-up`, `/sign-in` (email step, then code step), `/account/sessions`
  (signed-in, dynamic; route group `src/app/(signed-in)/account/...` with a layout that resolves the
  actor and redirects visitors to `/sign-in`), `/api/auth/[...all]` (BA handler), `/api/dev/mailbox`
  (JSON, 404 when `APP_ENV=production`, token-guarded: F5). `src/lib/routes.ts`: a `signIn` route and
  a `SIGNED_IN_PREFIXES` export (`/account`, later `/admin`, `/dashboard`) that #65 consumes. Header:
  static "Sign in" link only (F7).
- **Messages namespaces:** new `auth` (sign-up, sign-in, code step, expiry, rate-limit and
  attempts errors), new `account` (sessions page). Register both in `src/i18n/messages.ts`.
- **Size:** XL. Better Auth integration, OTP flow, two rate limiters, sessions UI, three email adapters,
  the capture mailbox, the Seam 1 harness (section 3), seed builders and a seed command wired into
  `vercel-build`, env schema, Playwright journey, axe on three pages, GLOSSARY.md and ADRs (first build
  ticket: spec says the glossary is seeded "the first time a build ticket uses them").
- **Design uncertainty:** 4. Credible designs differ on: BA-maximal (emailOTP plugin + BA DB rate
  limiter + BA session APIs) vs BA-thin (BA for cookies/sessions only, FOA OTP service reused by phone
  in #58, F8e); how the fake clock controls BA's internal `Date` use (vi fake timers on `Date` only vs
  FOA-owned expiry checks); flat vs namespaced `as(actor)` facade; capture mailbox exposure model;
  whether user creation lets #61 write the outbox row in the same transaction (F8f).
- **Risk flags:** auth/security (OTP, sessions, mailbox on public staging), personal data (email, IP,
  user agent in sessions and limiter keys: hash IPs and identifiers), infra/prod (`vercel-build`
  changes affect staging and production builds; seed must refuse to run outside `preview`/`local`).
- **Test plan:**
  - Seam 1: visitor requests code, fake email holds a 6-digit code, verify creates user + session and
    returns a signed-in actor; returning user gets the same user id; code expired after
    `clock.advance(10 min + 1 s)`; wrong code 5 times gives `too_many_attempts`; 6th request for one
    email inside the window is refused with `retryAfter` and the fake received exactly 5 messages;
    per-IP limit across different emails; window rollover after `clock.advance`; list sessions
    returns only own sessions; revoke one (that session no longer resolves an actor), revoke all;
    revoking another user's session refused; visitor listing sessions refused (authorization tests);
    capture adapter contract test on PGlite (send then read latest for an address); adapter selection
    matrix (production selects SES and requires its keys; preview/staging/local select capture);
    mailbox endpoint guard (production 404, missing or wrong token refused, token compare is
    constant-time); `seedPreview()` run twice is idempotent; seeded member signs in at Seam 1; harness
    self-tests (section 3.6).
  - Seam 2: `tests/e2e/auth-email.spec.ts`: sign up with a unique email, read the code through
    `tests/e2e/support/mailbox.ts`, land signed in, open `/account/sessions`, sign out, sign in again;
    a seeded member signs in.
  - axe: `/sign-up`, `/sign-in` (both steps), `/account/sessions`.
- **Conflict hotspots:** creates every F11 registry, so it conflicts with nothing in flight (wave 0,
  W=1) but defines the conflict surface for all later tickets. Direct overlaps later: #58 and #61 (sign-up
  use case), #60 and #58 (BA config), #64 (sign-up gains a consent step), #65 (proxy, layout).
- **Suggested split (XL):**
  - **57a Seam 1 harness and composition root (L):** section 3 in full: `createWorld`, `FakeClock`,
    ports registry, `as(actor)`, actor model, minimal `can()` stub, seed-builder registry,
    `pnpm db:seed` + `vercel-build` hook (preview/local only, idempotent), `EmailSender` port with fake,
    capture and SES adapters, `captured_message`, env schema fragments, GLOSSARY.md, ADR 0001-0003.
    No UI. Merge first; it is the dependency of everything.
  - **57b Email OTP sign-up/sign-in (L):** Better Auth, `user/session/account/verification`, OTP use
    cases, both rate limiters, `/sign-up`, `/sign-in`, `/api/auth/[...all]`, `/api/dev/mailbox`,
    Seam 2 journey, axe, seeded accounts that sign in.
  - **57c Sessions management (M):** list/revoke one/revoke all use cases, `/account/sessions`, axe.
  Order 57a -> 57b -> 57c (57c needs sessions from 57b). Children close #57 together.
- **Tournament:** yes, 3 contenders (risk-flagged auth, size XL, uncertainty 4). Angles: (a) BA-maximal;
  (b) BA-thin with an FOA OTP service shared with phone; (c) risk-first: harness and port contract
  tests first, transactional hook for #61 proven before UI. Run it on 57a+57b design (interface sketch +
  one end-to-end sign-up test per contender, DESIGN-IT-TWICE), not on full UI. Rubric additions: #58
  compatibility, #61 same-transaction feasibility, fake-clock control of OTP expiry,
  extension-without-edit of `world.ts`.

### #58 (ordinal 3): M0: Sign in by phone one-time code

- **Depends on:** #57 (explicit "builds on the Identity and access module from 2", native).
  #62 (inferred, soft): needs the `sms.enabled` setting; #62 lands much later (after #59 and #60), so
  #58 reads `sms.enabled` through the typed settings accessor contract with default `false`, defined
  by whichever lands first (recommend #58 adds a stub `settings.get('sms.enabled')` returning the
  default; #62 binds it to the table). Do not block #58 on #62.
- **Blocks:** no native M0 edges; M1 #75 and #81 (encrypted column type for date of birth, guardian
  contact), #69 (SMS port), #108 (encrypted PAN), #74/#83 (codes by phone).
- **AFK class:** B.
- **Human residue:**
  1. DLT registration via MSG91 (FOA): Principal Entity, sender header, OTP content template; then MSG91
     account, auth key, sender id and template id in Vercel Production env. Long lead time (#7/#18).
  2. Field-encryption keys per environment (`FIELD_ENCRYPTION_KEYS` key ring with versions,
     `FIELD_HMAC_KEY` for the blind index): generate and set in Vercel Preview, staging and Production;
     owner keeps an offline backup (losing the key loses every phone number); key-rotation policy.
     Preview keys could be agent-set if the charter allows (F4).
  3. Flip `sms.enabled` to on (after #62) once DLT approval arrives.
- **Ports / providers:** `SmsSender` port (MSG91 adapter, capture adapter reusing `captured_message`
  with `channel='sms'`, in-memory fake); `FieldCipher` (AES-256-GCM via `node:crypto` with versioned
  key ring) and `BlindIndex` (HMAC-SHA-256 of the E.164-normalised number); settings read
  (`sms.enabled`); `RateLimiter` (scope `phone`).
- **New tables / columns:** on `user`: `phone_ciphertext` (text: `v<key>:<iv>:<ct>:<tag>` or bytea),
  `phone_hash` (text, unique partial index where not null), `phone_verified` (bool); a Drizzle custom
  type `encryptedText()` reused by M1+ (date of birth, address, guardian details, PAN); limiter scope
  `phone` added to the enum. Better Auth's phoneNumber plugin expects plain `phoneNumber` /
  `phoneNumberVerified` and passes the raw number to `sendOTP`, so it cannot be used unchanged with an
  encrypted column (F8e).
- **Routes / pages:** no new routes; `/sign-up` and `/sign-in` gain a phone method (hidden or replaced by
  "codes come by email" when SMS is off). Possibly `/api/auth/phone/*` if FOA writes its own BA plugin.
- **Messages namespaces:** extends `auth` (phone field, SMS-off notice, phone errors).
- **Size:** L (custom column type with key ring, blind index, SMS adapters, phone OTP flow on top of
  BA, limits, SMS-off UX, seed user with phone).
- **Design uncertainty:** 4. Options: BA phoneNumber plugin storing the blind index in `phoneNumber`
  with a request wrapper that keeps the raw number for sending; a custom FOA BA plugin for phone OTP;
  one FOA OTP service for both channels (reshapes #57's flow); email-required user model (temp email)
  vs nullable email; ciphertext format and key-versioning scheme.
- **Risk flags:** auth/security, personal data, encryption.
- **Test plan:**
  - Seam 1: with `sms.enabled=true`, phone sign-up and sign-in through the SMS fake; with it false, no
    SMS fake call and the use case returns `sms_disabled` pointing to email; raw `select` of `user`
    never contains the plain number (assert ciphertext != number and no 10-digit substring); sign-in
    finds the user by blind index; same number in different formats (`+91 98...`, `098...`) maps to one
    user; per-phone and per-IP limits; a user with email and phone signs in with either (same user id);
    ciphertext decrypts after adding a new key version (rotation readiness); capture adapter writes
    `channel='sms'`; production config requires MSG91 keys, other envs never call MSG91.
  - Seam 2: none required by the ticket (SMS is off on previews by default); optional journey with
    the setting on via seed.
  - axe: `/sign-in` and `/sign-up` with the phone option visible and with the SMS-off notice.
- **Conflict hotspots:** BA config (#57, #60); `user` schema file (#57, #59 user search); `auth`
  namespace (#57, #64 consent step); sign-up use case (#61 welcome event, #64 consent); seed (#57);
  env schema (#61, #63, #66).
- **Suggested split:** not required. If it overruns, 58a encrypted column type + blind index (S-M,
  unblocks M1 #75/#81 early) and 58b phone OTP (M-L).
- **Tournament:** yes, 2-3 contenders (encryption + auth, L, uncertainty 4). Angles: BA phoneNumber
  plugin adapted; custom FOA BA plugin; shared FOA OTP service.

### #59 (ordinal 4): M0: Scoped roles, the can() policy and an append-only audit log

- **Depends on:** #57 (inferred: users, sessions, harness, signed-in admin pages; native blocker).
- **Blocks:** #60 (explicit "(5) comes later", native), #63 (explicit "allowed by `can()`", native), #64
  (explicit "writes an audit row", native), #62 (inferred: audit, super-admin-only), and 5 M1+ tickets
  natively (likely among #69, #70, #73, #74, #79, #80: every staff role check).
- **AFK class:** A (production bootstrap of the first super admin is an operational step, below).
- **Human residue:**
  1. FOA names the production super admin(s); the owner runs a provided bootstrap command against
     production (`pnpm admin:bootstrap-super-admin --email <e>`, migrator `DIRECT_URL`) because no
     runner may touch production.
  2. Counsel: audit-log retention and how DPDP erasure (#115) coexists with an append-only log (store
     ids and changed fields, not full personal records, in before/after).
- **Ports / providers:** none external. Internal `AuditLog.write(tx, entry)` used by every state-changing
  use case; `can(actor, action, resource)` policy.
- **New tables / columns:** enum `role` (16 values from #55: member, participant, guardian,
  institution_admin, institution_coordinator, judge, volunteer, organisation_representative,
  staff_admin, super_admin, competition_manager, content_manager, community_manager, finance,
  auction_manager, adoption_coordinator); enum `role_scope_type` (global, institution, competition,
  organisation); `user_role` (id, user_id, role, scope_type, scope_id uuid null and unconstrained:
  polymorphic, no FK; check `scope_type='global'` iff `scope_id is null`; unique on (user_id, role,
  scope_type, scope_id) with `NULLS NOT DISTINCT`; verify PGlite support; granted_by_user_id,
  granted_at); revoke = delete row + audit (history lives in the audit log). `audit_log` (id, occurred_at,
  actor_user_id null for system, actor_role, action, entity_type, entity_id, before jsonb, after jsonb,
  ip, user_agent; indexes on (actor_user_id, occurred_at desc), (entity_type, entity_id),
  (action, occurred_at desc)). Custom SQL (F2): `audit_log_reject_mutation()` trigger function,
  `BEFORE UPDATE OR DELETE ... FOR EACH ROW` and `BEFORE TRUNCATE ... FOR EACH STATEMENT`.
  Possibly `session.active_role` for the dashboard switcher.
- **Routes / pages:** `/admin/roles` (search user, grant and revoke scoped roles), `/admin/audit`
  (search by user, entity type, action), `/dashboard` (role switcher and per-role landing placeholders).
  Admin route group `src/app/(staff)/admin/...` (the #60 gate attaches here).
- **Messages namespaces:** `admin` (shell and navigation), `adminRoles`, `adminAudit`, `dashboard`.
- **Size:** XL (policy engine, two tables + trigger, audit integration, three screens, switcher,
  multi-role seed, Seam 2, axe).
- **Design uncertainty:** 3. Policy as code table of per-action predicates vs declarative role-action
  matrix; scope resolution (resource carries `institutionId`/`competitionId`/`organisationId` vs
  resolver per resource type); audit writes explicit in use cases vs generic table triggers; active-role
  state (cookie vs session column vs URL).
- **Risk flags:** auth/security, personal data (audit before/after, IP, user agent), infra (trigger also
  binds the migrator: F6).
- **Test plan:**
  - Seam 1: super admin grants a global role and an institution-scoped role and the grantee's next
    `as(actor)` call reflects it (roles loaded per request, no cache); revoke takes effect immediately;
    staff admin and member refused for grant/revoke (authorization tests); each grant/revoke writes one
    audit row with before/after, actor, IP, user agent from actor meta; `update audit_log` and
    `delete from audit_log` and `truncate audit_log` raise at the database level on PGlite;
    `can()` table test: global role passes everywhere, scoped role passes for its scope id, fails for
    another scope id (scope mismatch), fails for another scope type; audit search by user, entity type,
    action, with pagination; multi-role user switches dashboards; seed users with several roles and
    scopes (fixed seed UUIDs for future institution/competition scopes, e.g. `SEED_IDS.competition.paws26`).
  - Seam 2: `tests/e2e/roles.spec.ts`: seeded super admin signs in (mailbox code), opens `/admin/roles`,
    finds a seeded member, grants `institution_coordinator` scoped to a seeded institution id, sees it
    listed, sees the audit entry. #60 later adds TOTP step-up to this journey.
  - axe: `/admin/roles`, `/admin/audit`, `/dashboard`.
- **Conflict hotspots:** actor type and `can()` stub created by #57 (#59 replaces internals only);
  `user` search vs #58 encrypted phone (search by phone only through the blind index); role-grant use
  case later wrapped by #60; `(staff)` layout with #60; seed; `e2e/roles.spec.ts` with #60.
- **Suggested split (XL):** 59a backend (L): enums, `user_role`, `audit_log` + trigger, `can()`, grant /
  revoke / search use cases, audit writer, seed; 59b UI (L): `/admin/roles`, `/admin/audit`,
  `/dashboard` switcher, Seam 2, axe. 59a unblocks #60/#63/#64 (they need the backend only).
- **Tournament:** yes, 2 contenders (auth, XL, uncertainty 3): code-table policy vs declarative matrix,
  each with explicit audit writes.

### #60 (ordinal 5): M0: Staff two-factor gate and step-up for sensitive actions

- **Depends on:** #59 (explicit: "(5) comes later" in #59; AC "Granting or revoking a role asks for
  step-up"; native), #57 (sessions). #62 (inferred, soft): "Staff sessions expire sooner ... following
  settings defaults", while #62 needs #60's step-up: a cycle, broken by #60 using the documented
  defaults through the settings accessor contract (default value in code) and #62 binding storage
  later.
- **Blocks:** #62 (explicit "(5)", native); 5 M1+ natively (likely #80 refunds, #99 results approval,
  #109 two-approver money operations, #108, #116 or #117).
- **AFK class:** A (decisions below have spec defaults).
- **Human residue (non-blocking decisions):** staff and member session lifetimes (spec: "staff sessions
  are shorter"; propose staff 12 h, member 30 days); step-up window (closed #3: "a 10-minute step-up");
  FOA's recovery procedure for a lost second factor; passkey relying-party id follows `APP_URL` host
  (previews on `*.vercel.app` hosts each get their own RP id; production needs FOA's final domain);
  real staff enrol their own devices at go-live.
- **Ports / providers:** Better Auth `twoFactor` (TOTP; table `twoFactor`, secret encrypted with the BA
  secret, backup codes), `@better-auth/passkey` (table `passkey`, `@simplewebauthn/server`); `Clock`;
  `AuditLog`.
- **New tables / columns:** BA `twoFactor`, `passkey`, `user.twoFactorEnabled`; FOA `session.second_factor_at`
  (timestamptz, last successful second factor in this session) used by the gate and step-up; per-role
  session expiry applied in a BA `databaseHooks.session.create.before` hook and on staff-role grant
  (shorten live sessions).
- **Routes / pages:** `/account/security` (enrol TOTP with QR code, register passkey, remove factor),
  `/auth/second-factor?next=` (verify for this session), step-up prompt (dialog or
  `/auth/step-up?next=`); the `(staff)` layout redirects un-enrolled staff to enrolment and
  unverified sessions to `/auth/second-factor`. Use cases enforce the same rule inside `can()` for staff
  actions (defence in depth; server actions are callable directly).
- **Messages namespaces:** `security` (enrolment, second factor, step-up, errors).
- **Size:** L (TOTP + passkey integration, gate in layout and policy, step-up freshness, per-role
  lifetimes, audit events, preview-only seed secret, Seam 2 update).
- **Design uncertainty:** 3. Gate placement (layout vs proxy vs policy only); step-up via session
  timestamp vs per-action factor verification; BA twoFactor's sign-in interception vs FOA-driven
  second factor after OTP sign-in (verify whether BA intercepts `emailOtp` sign-in when
  `twoFactorEnabled`).
- **Risk flags:** auth/security.
- **Test plan:**
  - Seam 1: staff role holder without a factor is refused every staff use case with
    `enrolment_required`; after enrolment but before verification in this session, `second_factor_required`;
    users with no staff role are never asked; grant/revoke with `second_factor_at` 9 min 59 s old passes,
    10 min 1 s old is refused `step_up_required` (fake clock); TOTP verification honours the fake clock;
    enrolment, factor removal and step-up failures write audit rows; staff session expires before a
    member session after `clock.advance`; granting a staff role shortens the grantee's live sessions;
    seed refuses to write the known TOTP secret when `APP_ENV` is staging or production.
  - Seam 2: update `tests/e2e/roles.spec.ts`: seeded super admin signs in, enters TOTP computed from the
    preview-only known secret (`otpauth`), passes step-up, grants the role. Optional passkey journey on
    Chromium with Playwright's virtual authenticator (CDP WebAuthn); both projects are Chromium.
  - axe: `/account/security`, `/auth/second-factor`, the step-up prompt.
- **Conflict hotspots:** BA config (#57, #58); `(staff)` layout and `/admin/*` (#59, #62); role-grant use
  case (#59); session policy file (#62); `src/proxy.ts` (#65) if the gate is placed there;
  `e2e/roles.spec.ts` (#59); seed constants.
- **Suggested split:** not required; optional 60a TOTP + gate + step-up + lifetimes (M-L) and 60b
  passkeys (M).
- **Tournament:** yes, 2 contenders (auth, L, uncertainty 3): layout+policy gate with session timestamp
  vs policy-only gate with per-action verification.

### #61 (ordinal 6): M0: Outbox and background worker on the VPS

- **Depends on:** #57 (inferred: sign-up, email port, harness; native blocker).
- **Blocks:** #63 (explicit "The worker scans each new file", native), #64 (explicit "through the
  outbox", native), #68 (explicit "A pg-boss schedule", native), #66 worker half (inferred: "for the VPS
  workers", "worker health"), M1 #69 and #71 natively; every later event consumer.
- **AFK class:** B.
- **Human residue (VPS):**
  1. Database roles for the worker per environment (agent writes the bootstrap SQL in
     `docker/postgres/bootstrap/`; owner applies): a role that owns schema `pgboss` and has DML on
     `public` (`foa_worker` on pg-prod, `staging_worker` and `nonprod_worker` on pg-nonprod;
     `nonprod_worker` needs CONNECT on `postgres` to list preview databases and on every preview).
  2. Secrets in `/etc/foa/secrets` (worker database passwords; SES keys for the production worker,
     dormant), `docker compose -f docker/workers.yml up -d` on the VPS, confirm health checks.
  3. Confirm the shared preview worker picks up a new `foa_pr_<n>` and lets go after the sweeper drops it
     (the agent cannot reach the VPS: verification is human or a T2 runner with no production access).
  4. Decide CPU/memory caps for the worker services on the shared VPS (F9).
- **Ports / providers:** `JobQueue` port (pg-boss 12 adapter in the worker; in-process drain adapter in
  Seam 1); outbox writer `emit(tx, event)`; `EmailSender` (welcome email); `Clock`; pg-boss 12
  (`fromDrizzle(tx, sql)` exists for postgres-js if Vercel ever enqueues inside a transaction;
  `migrate: false` + `getConstructionPlans(schema)` for installs by a privileged role).
- **New tables / columns:** `outbox` (id UUIDv7, event_type, aggregate_type, aggregate_id, payload jsonb,
  occurred_at, available_at, attempts, last_error, status enum `outbox_status` pending|dispatched|failed,
  dispatched_at; partial index on pending by available_at); `worker_heartbeat` (worker, environment,
  last_seen_at, version) shared with #66; pg-boss schema `pgboss` (owned by the worker role, not by a
  drizzle migration, unless the tournament picks migration install; F6). Optional custom SQL:
  `AFTER INSERT ON "user"` trigger writing the welcome outbox row (F8f), `NOTIFY` on outbox insert.
- **Routes / pages:** none. `/api/health` may report worker heartbeat freshness (coordinate with #66).
- **Processes / infra:** `src/worker/main.ts` (Node 26 process: outbox relay, pg-boss workers,
  schedules registry `SCHEDULES`), `Dockerfile` target `worker`, `docker/workers.yml` with
  `worker-prod`, `worker-staging`, `worker-preview` (discovers databases on pg-nonprod whose comment
  starts `foa-preview ` every 60 s, one pg-boss instance and relay per database with 1-2 connections,
  stops on `3D000 invalid_catalog_name` or disappearance) and `pnpm worker:dev` for local work. Workers
  connect on the `db` network directly (LISTEN/NOTIFY and session features do not work through
  PgBouncer transaction pooling).
- **Messages namespaces:** `emails` (welcome subject and body) until #69 moves templates to the database.
- **Size:** XL (outbox, job port, dispatcher, drain, retries, welcome email, worker runtime, three
  Compose services plus dev process, multi-database discovery, health, README).
- **Design uncertainty:** 4. Outbox-only from Vercel with the worker relaying into pg-boss (no pg-boss
  grants for app roles; recommended) vs pg-boss `send` inside the Drizzle transaction from Vercel
  (needs grants on `pgboss` for three differently named app roles) vs outbox + LISTEN/NOTIFY with no
  pg-boss for events; welcome-event atomicity (BA hook vs DB trigger vs FOA-owned user creation);
  preview discovery (poll comments vs sweeper-driven registry table).
- **Risk flags:** infra/prod (new long-running services on the production VPS), personal data (event
  payloads; keep ids, not emails, in payloads), reliability.
- **Test plan:**
  - Seam 1: sign-up writes exactly one `identity.user_signed_up` outbox row in the same transaction;
    `world.drain()` sends one welcome email through the email fake; a use case that throws after `emit`
    leaves no outbox row and the drain sends nothing; email fake failing twice is retried with backoff
    (advance the fake clock between drains; sent on attempt 3); always-failing ends `failed` and is
    listed by `world.jobs.failed()` and the outbox row shows `failed` with `last_error`; draining twice
    sends once (idempotency key = outbox id); schedules registry lists named schedules with cron in
    IST/UTC as declared.
  - Adapter contract tests: pg-boss adapter against real Postgres (PGlite if pg-boss runs on it; verify
    at runtime, otherwise a `services: postgres:18` job in `ci.yml`, which runs from the PR branch).
    Preview discovery logic as a pure function over a listed `(datname, comment)` set.
  - Seam 2: none required. Human check on the VPS: welcome email appears in a preview's capture mailbox.
  - axe: none (no pages).
- **Conflict hotspots:** sign-up use case (#57, #58, #64); `world.ts` drain registration (designed out
  by #57's registry); `docker/compose.yml`/`docker/README.md` (#63 ClamAV, #66, #68; use
  `docker/workers.yml`); `Dockerfile` (#63 worker scan job runs in the same image);
  `sweep-preview-dbs.sh` (#63 purge); `/api/health` (#66); env schema.
- **Suggested split (XL):** 61a outbox + `JobQueue` port + relay + in-process drain + welcome email +
  retries/failed visibility (L, class A, unblocks #63/#64 Seam 1 work); 61b worker runtime: entrypoint,
  Docker target, `docker/workers.yml` services, preview discovery, heartbeat, dev process, README (L,
  class B with all the VPS residue). #63, #64 and #68 need 61a; their VPS deployment needs 61b.
- **Tournament:** yes, 2-3 contenders (infra, XL, uncertainty 4): outbox-only relay; in-transaction
  pg-boss send; outbox + NOTIFY.

### #62 (ordinal 7): M0: Runtime settings screen

- **Depends on:** #60 (explicit "needs step-up (5)", native), #59 (inferred: audit rows, super-admin-only
  `can()`), #57.
- **Blocks:** 2 M1+ natively (candidates: #84 reminder timing, #108 80G setting, #114 retention periods,
  #121/#122 thresholds, #125, #132); binds `sms.enabled` for #58 and staff session lifetime for #60.
- **AFK class:** A.
- **Human residue:** FOA confirms organisation facts (80G held: off; FCRA enabled: off) and default
  values; none blocking.
- **Ports / providers:** none external; `AuditLog`, step-up guard, `Clock`.
- **New tables / columns:** `setting` (key text PK, value jsonb, updated_by_user_id, updated_at).
  Descriptions, zod schemas and defaults live in code, in per-module registries
  (`src/server/modules/<module>/settings.ts`) merged by one barrel line each; first keys
  `sms.enabled` (false), `org.has80G` (false), `org.fcraEnabled` (false), `auth.staffSessionHours`
  (default from #60).
- **Routes / pages:** `/admin/settings` (list with descriptions, defaults and current values; edit with
  step-up).
- **Messages namespaces:** `adminSettings`.
- **Size:** M (table, typed registry and accessor, one screen, step-up and audit reuse, seed).
- **Design uncertainty:** 2 (typed key registry with zod is the obvious design; open points are read
  caching across serverless instances, e.g. read-through per request vs 30 s TTL, and where key
  registries live).
- **Risk flags:** auth/security (super admin + step-up); money-adjacent (80G/FCRA flags gate receipts and
  foreign payments in M5).
- **Test plan:**
  - Seam 1: unset key returns its documented default; valid change stored and read back on the next call
    (no deploy); invalid value refused with the zod message and nothing written; staff admin refused,
    super admin allowed (authorization tests); change without fresh step-up refused (fake clock); every
    change writes an audit row with before/after; registry rejects unknown keys at the type level and
    at runtime.
  - Seam 2: none required.
  - axe: `/admin/settings` (list and edit states).
- **Conflict hotspots:** settings registry barrel (every later settings ticket); `(staff)` admin
  navigation (#59, #60); session-policy file (#60); `adminSettings` namespace is new.
- **Suggested split:** none.
- **Tournament:** no (uncertainty 2, size M).

### #63 (ordinal 8): M0: Private file uploads with malware scan and signed delivery

- **Depends on:** #59 (explicit "only people allowed by `can()`"; "A staff admin can"; native), #61
  (explicit "The worker scans each new file"; native), #57. Soft: #65 (CSP `connect-src` must allow the
  R2 endpoint for browser PUTs).
- **Blocks:** 5 M1+ natively (candidates: #79 offline-payment proof, #83 signed paper forms, #85 image
  submission, #86, #87, #94 condition photos, #108 donation proof, #111/#112 blog images, #129 adoption
  photos).
- **AFK class:** B.
- **Human residue:**
  1. Storage account: FOA's Cloudflare R2 account does not exist yet (#27 closed not_planned "blocked on
     FOA's R2 account"). Needed: production buckets (private, public, evidence with object lock),
     non-production buckets (prefixes `staging/`, `pr-<n>/`, `br-<hash>/`), API tokens scoped per bucket,
     bucket CORS allowing `PUT` from `shipped-it.dev`, preview origins and production origin. Decision:
     interim non-production bucket on the owner's Cloudflare account so previews work before FOA's
     account exists. Without a non-production bucket, the Seam 2 AC cannot pass.
  2. VPS: deploy the ClamAV sidecar (memory, F9) and the worker scan job; R2 credentials in the worker
     env and in the preview-sweep hook (prefix purge on database drop).
  3. Counsel: where children's files live (R2 vs AWS S3 Mumbai); the port keeps it a configuration change.
- **Ports / providers:** `ObjectStorage` port (R2 adapter via `@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner` with the R2 endpoint; in-memory fake that enforces presign expiry
  with the fake clock); `MalwareScanner` port (ClamAV `clamd` INSTREAM over TCP; fake that flags the
  EICAR string); `JobQueue` (scan job); `Clock`.
- **New tables / columns:** `file_asset` (id, owner_user_id, purpose enum `file_asset_purpose`
  (start with `test_upload`/`general`; later modules add values), content_type, size_bytes, bucket,
  storage_key, status enum `file_asset_status` (pending_upload, uploaded, scanning, clean, quarantined,
  deleted), sha256 null, scanned_at, scan_result, created_at). R2 has no presigned POST policy, so size
  limits are enforced by signing `Content-Length`/`Content-Type` into the presigned PUT, refusing to
  presign over-limit declarations, and a post-upload `HEAD` check (size, type) before scanning; magic-byte
  sniffing in the scan step.
- **Routes / pages:** `/api/files/presign` (POST: purpose, type, size; returns upload URL + file id),
  `/api/files/[id]/complete`, `/api/files/[id]` (`can()` check, then 302 to a short-lived signed GET URL,
  `Cache-Control: no-store`); a signed-in demo page `/account/files` for the Seam 2 round trip.
- **Messages namespaces:** `files` (upload widget, limits, scan status, errors).
- **Size:** XL (presign flow, delivery with `can()`, limits, scanner port and ClamAV adapter, scan job and
  quarantine, per-environment prefixes, purge on drop, demo page, Seam 2).
- **Design uncertainty:** 3. Quarantine as prefix move vs status-only gate; delivery by redirect vs
  streaming proxy; purge on drop via the sweeper hook vs a worker job; where type/size rules live (per
  purpose registry).
- **Risk flags:** auth/security, personal data, minors (the module later carries children's artwork),
  infra/prod (sidecar, buckets).
- **Test plan:**
  - Seam 1: owner presigns, uploads to the storage fake, completes, scan job (drained) marks clean, owner
    gets a signed URL and the fake serves it; another member is refused a signed URL, a staff admin
    gets one (authorization tests); before scanning only the uploader can fetch; EICAR upload ends
    `quarantined` and is never delivered, even to staff; signed URL refused after
    `clock.advance(expiry + 1 s)`; over-limit size and disallowed type refused at presign and on a
    mismatching `HEAD`; storage keys carry the environment prefix (`pr-<n>/`) derived from env;
    purge-prefix function deletes only that prefix.
  - Seam 2: `tests/e2e/files.spec.ts`: signed-in member uploads a small PNG on `/account/files`, waits
    for clean (needs the shared preview worker and ClamAV on the VPS, or a scan bypass that must NOT
    exist; so this journey is gated on residue 1-2), fetches it back through the signed URL.
  - axe: `/account/files`.
- **Conflict hotspots:** `can()` resources (#59); `JobQueue`/worker registration (#61); `Dockerfile` and
  `docker/workers.yml` (#61, #66, #68); `sweep-preview-dbs.sh` (#61); env schema (#68 shares the storage
  config); CSP `connect-src` (#65); `/account/*` tree (#57, #64).
- **Suggested split (XL):** 63a `file_asset`, storage port + R2 adapter, presign, complete, signed
  delivery with `can()`, limits (L, Seam 1 against fakes); 63b scanner port, ClamAV adapter and sidecar
  service, scan job, quarantine (M-L); 63c environment prefixes, purge on drop hook, demo page, Seam 2
  (M, residue-gated). #68 needs 63a.
- **Tournament:** yes, 2 contenders (security, XL, uncertainty 3): prefix-move quarantine with redirect
  delivery vs status-gate quarantine with streaming delivery.

### #64 (ordinal 9): M0: Consent documents and consent to messages

- **Depends on:** #59 (explicit "writes an audit row"; "Only staff can publish"; native), #61 (explicit
  "through the outbox"; native), #57 (inferred: consent asked at sign-up, account settings).
- **Blocks:** 3 M1+ natively (#72 "attach versioned terms and consent documents from the Consent module",
  #82 "Extends Consent for minors", likely #83); later #126 campaigns (communication consent).
- **AFK class:** B (light).
- **Human residue:** approved legal copy for the privacy notice, terms and the messages-consent document
  (counsel/FOA; seed placeholders marked as drafts, carried over from `src/content/legal/*.ts`); FOA
  confirms consent purposes and who publishes; counsel on whether the sign-up consent wording meets
  DPDP notice requirements.
- **Ports / providers:** none external; outbox `emit` (`consent.withdrawn`, `consent.given`), `AuditLog`,
  `Clock`; the single rich-text sanitiser is M5 (#111), so document bodies use a structured format
  (e.g. the existing `LegalBlock[]` model as jsonb) or sanitised Markdown.
- **New tables / columns:** enum `consent_purpose` (start: `privacy_notice`, `terms`, `messages`; #82 adds
  participation, public_display, school_and_city, social_media, auction, communications);
  `consent_document` (id, purpose, version int, title, body, published_at, published_by; unique
  (purpose, version); custom SQL trigger rejecting updates and deletes once `published_at` is set);
  `consent` records as an event log `consent_event` (id, subject_type + subject_id (user now, participant
  profiles for minors later), giver_user_id, purpose, document_id, action given|withdrawn, method enum
  `web_form|otp_link|paper_form|staff_recorded`, occurred_at) with a "current state" query/view, or a
  record table with `withdrawn_at`; choose for #82's needs.
- **Routes / pages:** `/account/consents` (give/withdraw messages consent, history with document
  versions), `/admin/consent-documents` (draft, preview, publish new version; view old versions),
  sign-up step asking for messages consent (#57's flow), `/privacy` and `/terms` render the current
  published version and its number (F7 static-rendering conflict with #65).
- **Messages namespaces:** `consent`; edits `legal` (version label) and `auth` (sign-up consent step).
- **Size:** L (versioning with immutability, consent log, outbox event, three UIs plus legal pages,
  static-rendering design, seed).
- **Design uncertainty:** 3. Event log vs record-with-withdrawal; subject modelling for future minors;
  document body format; legal pages caching strategy (F7).
- **Risk flags:** personal data, minors/safeguarding (foundation for guardian consent), legal copy.
- **Test plan:**
  - Seam 1: staff admin publishes v2 and v1 stays readable and byte-identical; updating a published
    version fails at the database level; member refused publishing (authorization test); member gives
    and withdraws messages consent and history lists both with document versions and methods; give and
    withdraw each write an audit row; withdraw writes one `consent.withdrawn` outbox row in the same
    transaction (drain delivers to a test subscriber); current-version query returns the latest
    published version; sign-up records the consent given at sign-up.
  - Seam 2: none required by the ticket; the `/privacy` page check fits the CSP/smoke journey.
  - axe: `/account/consents`, `/admin/consent-documents`, `/privacy` and `/terms` (already in the public
    smoke set for `/safeguarding` style pages), the sign-up consent step.
- **Conflict hotspots:** `/sign-up` flow and `auth` namespace (#57, #58); `/privacy` and `/terms` and
  `src/content/legal/*` (#65 static check); `/account/*` (#57, #63); outbox event registry (#61);
  `(staff)` admin navigation (#59, #60, #62).
- **Suggested split:** none (L).
- **Tournament:** yes, 2 contenders (personal data/minors foundation, L, uncertainty 3): event log with
  structured `LegalBlock` bodies vs record table with Markdown bodies; both must solve F7.

### #65 (ordinal 10): M0: Content Security Policy for public and signed-in pages

- **Depends on:** #57 (explicit "dynamic signed-in areas (from 2 on)", native). Coordination, not
  blockers: #63 (R2 `connect-src`), #66 (Sentry endpoint or tunnel route), #60 (staff pages are
  signed-in pages), #64 (legal pages static), later #77 Razorpay and #118 Umami add sources.
- **Blocks:** nothing natively; M5 #118 says "The tracking script is self-hosted and allowed by the CSP".
- **AFK class:** A.
- **Human residue:** decide rollout (Report-Only on staging for N days, then enforce) and confirm "No
  page on staging logs a CSP violation" after the M0 release PR merges to `main` (staging deploys from
  `main` only). Neither blocks the ticket PR.
- **Ports / providers:** none; a CSP report sink.
- **New tables / columns:** none required; optional `csp_violation` aggregate (directive, blocked origin,
  document path without query, count, first/last seen) if reports are stored rather than logged.
- **Routes / pages:** `/api/csp-report` (accepts `application/csp-report` and Reporting API
  `application/reports+json`; strips query strings and fragments from every URL, drops `sample`/script
  samples, caps body size, rate-limits; no IP stored) plus `Reporting-Endpoints` header. Proxy matcher
  extended with `SIGNED_IN_PREFIXES` from `src/lib/routes.ts` to set the nonce CSP and `x-nonce`.
- **Code:** `src/lib/csp.ts` builds policies from typed directive sets (public static, signed-in nonce,
  per-feature additions so #63/#66/#77/#118 add sources without rewriting); `next.config.ts` `headers()`
  sends the static policy for public paths; the inline theme script in `src/app/layout.tsx` moves to a
  self-hosted blocking file or gets a build-time hash; JSON-LD `application/ld+json` blocks are data and
  not subject to `script-src`.
- **Messages namespaces:** none.
- **Size:** L (policy builder, two header paths, report endpoint with scrubbing, inline script removal,
  build-output static check, Playwright violation listener, research on Next 16.4 behaviour).
- **Design uncertainty:** 5 (F7c): per-page script hashes computed post-build vs experimental SRI with
  `'strict-dynamic'` vs `'unsafe-inline'` limited to static pages; signed-in trees fully dynamic vs
  partial; whether `cacheComponents` shells on signed-in routes receive the nonce.
- **Risk flags:** CSP, auth/security (a broken policy breaks sign-in; a lax one fails the spec).
- **Test plan:**
  - Seam 1 / unit: `csp.ts` produces the expected directive strings per area and environment (dev adds
    `'unsafe-eval'` only in development); report endpoint strips URLs and samples and rejects oversize
    bodies; proxy sets a fresh nonce per request and the header matches `x-nonce`.
  - Build check: extend `scripts/check-build.ts` (runs in `vercel-build`) to assert every public route
    is still prerendered (the build output "static" markers) and that public HTML has no inline
    executable scripts outside the allowed hashes.
  - Seam 2: `tests/e2e/csp.spec.ts`: header present on `/` (no nonce) and on `/account/sessions` (nonce,
    `strict-dynamic`); a `securitypolicyviolation` listener (and console listener) records zero
    violations across the smoke pages and the sign-in journey (also reused by #57's journey).
  - axe: no new pages (rerun existing smoke).
- **Conflict hotspots:** `src/proxy.ts` (#57, #60), `next.config.ts` (#66 `withSentryConfig`),
  `src/app/layout.tsx` (#66 client init), `scripts/check-build.ts`, `src/lib/security-headers.ts`
  (#50 comment says X-Frame-Options stays until the CSP adds `frame-ancestors 'none'`).
- **Suggested split:** none (L); 65a public static CSP + report endpoint can start before #57's
  signed-in pages if the Orchestrator wants parallelism; 65b nonce CSP after #57.
- **Tournament:** yes, 3 contenders (CSP, uncertainty 5): hash-based static CSP; SRI + `strict-dynamic`;
  `'unsafe-inline'` on static pages only with nonce strictness on signed-in pages. Judges must run
  `pnpm build` and the violation journey.

### #66 (ordinal 11): M0: Error tracking, uptime checks and 365-day log retention

- **Depends on:** none natively. Inferred soft: #61 for worker Sentry and worker health ("for the VPS
  workers", "worker health"); #65 coordination (Sentry ingest host or tunnel route in `connect-src`).
- **Blocks:** nothing natively; #68 ("reported to Sentry", inferred); every milestone's definition of
  done ("No personal data appears in logs or in Sentry").
- **AFK class:** C (agent builds about a third: SDK wiring, scrubber, heartbeat health, docs).
- **Human residue:**
  1. Sentry organisation and project(s); DSN for the app (Vercel staging + Production env) and the
     workers (VPS env); optional auth token for source-map upload in builds.
  2. Uptime provider choice and account (owner decision), alert destination (owner email/phone), checks
     for the app health URL, TCP `db.shipped-it.dev:6432`, and worker health (recommended: worker
     heartbeat reported through `/api/health` or a push heartbeat, so nothing on the VPS needs to be
     reachable from outside); trigger a forced failure and confirm the alert.
  3. 365-day log storage: Vercel log drain to a store with 365-day retention, and VPS container logs
     (today `json-file` 50 MB x 5, far short of 365 days) shipped to the same store; provider or
     self-hosting decision and cost; counsel on keeping IPs and other personal data in logs for 365 days.
  4. Silencing procedure confirmation for the README.
- **Ports / providers:** `ErrorReporter` port (Sentry adapter via `@sentry/nextjs` for the app and
  `@sentry/node` for workers; fake capturing scrubbed events for tests); `worker_heartbeat` (with #61).
- **New tables / columns:** none beyond `worker_heartbeat` (owned by #61 or #66, whichever lands first).
- **Routes / pages:** extend `/api/health` with worker heartbeat freshness per environment; optional
  Sentry tunnel route (e.g. `/monitoring`) to keep the CSP same-origin.
- **Messages namespaces:** none.
- **Size:** M (agent part: SDK init in `src/instrumentation.ts` + `onRequestError`, client init,
  `beforeSend`/`beforeBreadcrumb` scrubber, `sendDefaultPii: false`, no-op without DSN, worker init,
  heartbeat health, README).
- **Design uncertainty:** 3, but the open points are owner decisions (providers, cost), not code design.
- **Risk flags:** personal data (scrubbing), infra/prod (production monitoring and VPS logging).
- **Test plan:**
  - Seam 1 / unit: scrubber removes `request.data`, cookies, auth headers, query strings, `user` fields
    except a hashed id, and redacts emails, Indian phone numbers (`+91`, 10-digit) and known name
    fields from messages, breadcrumbs and `extra`; a fake event carrying fake personal data comes out
    clean; reporter is a no-op without DSN; environment tag equals `APP_ENV`; `/api/health` returns 503
    when the heartbeat is stale (fake clock).
  - Seam 2: none (Sentry and uptime proofs are human residue on staging).
  - axe: none.
- **Conflict hotspots:** `next.config.ts` and `src/instrumentation.ts` (#65), `src/app/layout.tsx`,
  `/api/health` (#61), `docker/workers.yml` and `docker/README.md` (#61, #63, #68), env schema.
- **Suggested split:** 66a app Sentry + scrubber + tests (S-M, class A, can run any time after #57);
  66b worker Sentry + heartbeat health + uptime + log retention docs (S-M agent, rest human; after
  61b).
- **Tournament:** no (decisions are human; code uncertainty low).

### #67 (ordinal 12): M0: Restore drill into a throwaway container

- **Depends on:** nothing.
- **Blocks:** nothing.
- **Status:** implemented and merged into branch `M0` at 9c69f10 (PR #136, `Closes #67`), with
  evidence of two passing drills on the VPS (`latest` and `--target`), `restore-drill.test.ts`, and
  `foa-restore-drill.timer` (1st of the month, 04:00 IST). Not on `main` yet.
- **AFK class:** A (done). The factory does not rebuild it.
- **Human residue:** merge path to `main` (via PR #136 or the factory's M0 release PR, F1); after merge,
  on the VPS: `git -C /srv/foa pull && sudo /srv/foa/docker/scripts/install-systemd.sh` to enable the
  timer; alerting on a failed `foa-restore-drill` (docker/README follow-up 5, overlaps #66).
- **Ports / providers, tables, routes, messages:** none (ops scripts, systemd units; reads
  `drizzle/meta/_journal.json` and snapshots, so later migrations must keep journal/snapshot integrity:
  F2).
- **Size:** S (Orchestrator work only: verify `factory/trunk` contains 9c69f10, run
  `pnpm vitest run docker/scripts/restore-drill.test.ts`, label `factory:merged-trunk`).
- **Design uncertainty:** 1.
- **Risk flags:** infra/prod (production backups; already mitigated: `--network none`, read-only repo,
  disk guard).
- **Test plan:** existing `docker/scripts/restore-drill.test.ts` (arguments, record, WAL replay,
  expected objects); `vitest.config.ts` on `M0` already includes `docker/**/*.test.ts`.
- **Conflict hotspots:** `vitest.config.ts` (include list), `docker/README.md`,
  `docker/scripts/install-systemd.sh` (#61 and #68 may add timers or services).
- **Tournament:** no.

### #68 (ordinal 13): M0: Nightly copy of R2 files to Backblaze B2

- **Depends on:** #61 (explicit "A pg-boss schedule runs the copy nightly"; native), #63 (inferred:
  storage port and the production buckets; may be the native edge instead of #61), #66 (explicit
  "Failures are retried and reported to Sentry"; inferred soft: use the `ErrorReporter` port, fake in
  tests). Uses #62 if the retention window becomes a setting (soft).
- **Blocks:** nothing.
- **AFK class:** B.
- **Human residue:**
  1. Backblaze B2 account (FOA or owner), bucket(s), application key scoped to the bucket, server-side
     encryption on; keys in the production worker env on the VPS.
  2. R2 read access to FOA's production buckets (FOA's R2 account does not exist yet: #27).
  3. Retention window value (FOA/owner; propose 30 days) and counsel on data residency: B2 has no India
     region, and #55 lists "whether children's data must stay in India" as a counsel question.
  4. Verify the single-file restore runbook against real buckets once they exist.
- **Ports / providers:** `ObjectStorage` (source R2 production buckets: list, get; target B2 through its
  S3-compatible API: put, delete), `JobQueue` schedule (nightly, IST), `ErrorReporter`, `Clock`.
- **New tables / columns:** `offsite_copy` manifest (source_bucket, key, etag, size, source_last_modified,
  copied_at, deleted_in_source_at null; PK (source_bucket, key)), so selection and the retention rule are
  testable at Seam 1. Alternative: B2 versioning + lifecycle rules (configuration, not code), which does
  not satisfy the Seam 1 AC alone.
- **Routes / pages:** none. A CLI `pnpm offsite:restore --bucket <b> --key <k> [--to <bucket>]` in the
  worker image, documented in `docker/README.md`.
- **Messages namespaces:** none.
- **Size:** M (selection + retention use case, B2 adapter config, schedule registration, retries,
  reporting, restore CLI, docs).
- **Design uncertainty:** 2 (manifest table vs listing both sides each night; streaming copy through the
  worker is forced by cross-provider copy).
- **Risk flags:** infra/prod, personal data (copies children's files to a third party; residency).
- **Test plan:**
  - Seam 1: new object copied; changed etag copied again; unchanged skipped; object deleted in R2 is
    marked `deleted_in_source_at` and stays in B2 until `clock.advance(retention)` passes, then deleted
    from B2; a failing put is retried with backoff and the final failure reaches the error reporter
    fake; only production buckets are selected (non-production prefixes never copied); restore CLI
    copies one key back through the fakes.
  - Seam 2: none.
  - axe: none.
- **Conflict hotspots:** storage config in the env schema (#63), schedules registry (#61),
  `docker/workers.yml`/`docker/README.md` (#61, #63, #66), error reporter (#66).
- **Suggested split:** none.
- **Tournament:** no.

---

## 3. What #57 must build for everyone else (Seam 1 harness contract)

The parent spec fixes the seam: "Each test calls the use cases as `as(actor).<useCase>(input)`, the same
entry points the server actions and route handlers call", on "a fresh PGlite database per test with the
real migrations", with "a fake clock", "jobs and outbox events drained in-process", "in-memory fakes ...
only at the provider ports" (payment gateway with webhook simulator, SMS, email, object storage, malware
scanner, PDF renderer, media processor), "seed builders" shared with previews, and tests that "never
mock internal modules". Every M1-M8 ticket's acceptance criteria are written at this seam, so 57a is
judged as infrastructure: stability and extension without edits matter more than features.

### 3.1 Layout (recommended; names are the contract later tickets follow)

```text
src/server/
  app/
    ports.ts           # interface Ports {} — extended by module augmentation, one file per port
    context.ts         # UseCaseContext: { db: Db | Tx, ports, clock, ids, actor, log }
    create-app.ts      # createApp(deps) -> { as(actor): UseCases }; merges module facades
    production.ts      # productionPorts(env): picks adapters by APP_ENV (capture outside production)
    actor.ts           # Actor, RequestMeta, actorFromSession(session)
  modules/
    identity/          # #57: auth.ts (Better Auth factory), use-cases/*, policy.ts (can stub), seed.ts
    <module>/          # later: same shape; facade in index.ts: (ctx) => ({ useCaseA, useCaseB })
  ports/
    email/             # port.ts, ses.ts, capture.ts, fake.ts, contract.ts (shared contract suite)
  seed/
    index.ts           # seedPreview(db): runs registered module seeders in order, idempotent
    registry.ts        # registerSeeder(name, fn, { after })
    ids.ts             # SEED_IDS: fixed UUIDs (super admin, members, future institution/competition)
  log.ts               # redacting logger (no personal data in logs: DoD)
  privacy/inventory.ts # PERSONAL_DATA_FIELDS registry (column -> purpose -> retention placeholder)
src/test/
  db.ts                # existing createTestDb (keep; harness builds on it)
  world.ts             # createWorld(): the one entry point for Seam 1 tests
  clock.ts             # FakeClock
  fakes/registry.ts    # registerFake(portName, factory) — modules add fakes without editing world.ts
scripts/seed.ts        # pnpm db:seed: APP_ENV preview|local only, DIRECT_URL, calls seedPreview
tests/e2e/support/     # mailbox.ts (read code), accounts.ts (re-exports seed account constants), csp.ts later
```

### 3.2 Interfaces 57a must ship (TypeScript shapes)

```ts
// src/server/app/actor.ts
export type RequestMeta = { ip: string; userAgent: string };
export type Actor =
  | { kind: "visitor"; meta: RequestMeta }
  | { kind: "user"; userId: string; sessionId: string; roles: readonly RoleGrant[];
      secondFactorAt: Date | null; meta: RequestMeta }      // roles [] and secondFactorAt null until #59/#60
  | { kind: "system"; process: "worker" | "seed" | "cli"; job?: string };

// src/test/world.ts
export interface World {
  db: TestDb;                       // fresh PGlite with real migrations (snapshot-cloned, 3.4)
  clock: FakeClock;                 // now(), advance(ms | { minutes, hours, days }), set(instant)
  fakes: Fakes;                     // typed map; #57 provides fakes.email; others register theirs
  seed: SeedBuilders;               // typed map of builder functions from registered modules
  as(actor: Actor): UseCases;       // the same facade server actions call
  visitor(meta?: Partial<RequestMeta>): Actor;
  signIn(user: { id: string }, meta?: Partial<RequestMeta>): Promise<Actor>;  // real session row
  drain(opts?: { until?: Date }): Promise<void>;   // runs registered drainers; no-op until #61
}
export function createWorld(opts?: { now?: string; fakes?: Partial<FakeOverrides> }): Promise<World>;
```

Rules:

1. `as(actor)` returns a flat object `{ requestEmailCode, verifyEmailCode, listSessions, ... }` exactly as
   #55 writes it; module facades are merged with a helper that fails type-checking on a duplicate
   use-case name (so 79 tickets add one merge line each and collisions are caught at compile time).
2. Every use case: parse input with zod, call `can(ctx.actor, action, resource)` first, run in
   `db.transaction` when it writes, write audit (from #59 on) and outbox (from #61 on) through `tx`.
   57a ships `can()` in `modules/identity/policy.ts` with only #57's rules (visitor may request/verify
   codes; a user may list/revoke own sessions); #59 replaces the internals, never the call sites.
3. Server actions and route handlers stay thin: resolve actor from the BA session + request headers
   (IP from `x-forwarded-for` as Vercel sets it, user agent), call one use case, map typed errors to
   messages. No UI file imports `db` or Better Auth server APIs directly (oxlint `no-restricted-imports`
   rule added by 57a is a cheap enforcement).
4. Typed errors: use cases return or throw a discriminated `DomainError` (`code` such as
   `rate_limited`, `code_expired`, `too_many_attempts`, `forbidden`, `step_up_required`) that tests
   assert on and UI maps to `auth.*` messages.

### 3.3 Fake clock

- `FakeClock` is the only time source for FOA code (`ctx.clock.now()`); no `new Date()` / `Date.now()` in
  use cases (oxlint rule or grep gate in the judge rubric).
- Better Auth reads the system clock internally (OTP expiry, session expiry, TOTP). The harness keeps
  them aligned: `createWorld` calls `vi.useFakeTimers({ toFake: ["Date"] })` and every
  `clock.advance/set` also calls `vi.setSystemTime`, leaving real timers so PGlite and promises run.
  Whether PGlite's SQL `now()` follows faked `Date` is unknown: business timestamps are always passed
  from `ctx.clock` explicitly; columns may keep `defaultNow()` only as a fallback, never relied on in
  assertions. 57a includes a harness self-test proving OTP expiry follows `clock.advance`.
- Fake timers are reset in `afterEach` from a Vitest setup file (`vitest.config.ts` `setupFiles`).

### 3.4 Database per test, fast

- Keep `createTestDb` semantics (fresh, isolated, real migrations, `pg_trgm` loaded). As migrations grow
  across 79 tickets, re-running them per test gets slow: 57a migrates once per Vitest worker and clones
  per test from a dumped data directory (PGlite `dumpDataDir()` + `new PGlite({ loadDataDir })`; verify
  the API in PGlite 0.5.16 at runtime), with a fallback to plain `createTestDb`. Budget: after the first
  world in a worker, `createWorld()` under 150 ms (judge measures with 20 worlds).
- Extensions needed later (`earthdistance` for M7) are loaded in the same factory; #55 notes "extended
  with `earthdistance` if PGlite supports it".
- Code under test receives `db` through the context, not `vi.mock("@/server/db")`; the existing mock
  recipe stays valid for legacy pure modules only.

### 3.5 Provider fakes, adapters and contracts

- Each port: `port.ts` (interface), production adapter, capture adapter where the spec wants one
  (email, SMS), in-memory fake, and `contract.ts`, a shared test suite run against the fake and the
  capture adapter (and against the real adapter in sandbox mode only at Seam 2). This keeps fakes
  faithful: the fake is wrong if it passes a contract the adapter fails.
- 57a ships the email port completely and the registry for the rest. Later tickets add, by
  `registerFake` in their own module files: SMS (#58), job drain (#61), storage and scanner (#63),
  error reporter (#66), payment gateway with webhook simulator (#77), PDF renderer (#100), media
  processor (#85).
- Email fake API used by every later test: `fakes.email.sent` (array), `fakes.email.lastTo(address)`,
  `fakes.email.codeFor(address)` (parses the OTP), `fakes.email.failNext(n, error)`.
- Production wiring (`production.ts`): `APP_ENV=production` requires real adapters and their keys (env
  schema refinement); every other environment uses capture adapters and never needs provider keys.

### 3.6 Seed builders and the seed command

- Builders are server code in `src/server/seed/` (no Vitest imports), deterministic (seeded PRNG, e.g.
  `@faker-js/faker` with `faker.seed(55)` and locale `en_IN`), shared by tests (`world.seed.member()`,
  `world.seed.superAdminUser()`) and previews (`seedPreview`).
- `seedPreview` is idempotent (upsert on natural keys such as email) because preview databases persist
  across pushes (`createPreviewDatabase` keeps existing databases). It refuses to run unless `APP_ENV` is
  `preview` or `local`. Account emails use a reserved domain (`@example.test`) and are exported as
  constants for Playwright (`tests/e2e/support/accounts.ts`).
- `vercel-build` becomes `pnpm db:migrate && pnpm db:seed && next build && pnpm check:build`, where
  `db:seed` exits 0 doing nothing outside preview/local. Seeding connects through `DIRECT_URL` (the
  migrator role on previews, which owns the tables).
- 57a seeds: one super-admin user account (the role arrives with #59's seeder), three members, all able
  to sign in by email code through the capture mailbox. Later tickets register seeders with ordering
  (`after: ["identity"]`).

### 3.7 Things #57 must leave in place so later tickets do not edit shared files

| Later need | Hook #57 provides |
| --- | --- |
| #58 SMS fake, #63 storage/scanner fakes, #66 reporter fake | `registerFake(portName, factory)` + `Fakes` interface augmentation |
| #59 roles on actors | `Actor.roles` field (empty) and `actorFromSession` that #59 extends via a roles loader hook |
| #59 `can()` | `can()` call in every use case from day one |
| #60 second factor | `Actor.secondFactorAt` field (null) and session column hook point |
| #61 drain | `world.drain()` iterating registered drainers (empty until #61) |
| #61 welcome event | sign-up path that can run FOA code in the user-creation transaction (proved in the tournament: F8f) |
| #62 settings | `settings.get(key)` contract with code defaults (may be stubbed by #58 first) |
| #64 consent at sign-up | sign-up flow composed of steps, so a consent step is added without rewriting |
| #65 CSP | `SIGNED_IN_PREFIXES` in `src/lib/routes.ts`; no inline handlers in new pages |
| #114 data inventory | `PERSONAL_DATA_FIELDS` registry with entries for email, IP hash, user agent |
| Every ticket | seeder registry, schema barrel lines, message namespace per module, GLOSSARY.md, `docs/adr/` |

### 3.8 Acceptance checks the judges apply to 57a (beyond the ticket ACs)

1. A new test file can build a world, sign a seeded user in, call a use case and assert on fake email and
   database rows in under 15 lines.
2. Adding a fake port and a seeder for a new module touches only new files plus at most one barrel line.
3. Two tests in parallel share nothing (fresh database, fresh fakes, independent clocks).
4. No use case reads the system clock or `process.env` directly; `env()` is read once in
   `production.ts`.
5. `pnpm check` passes; `pnpm build` passes with no database; the public pages remain prerendered.
6. Docs: a 1-page `docs/agents/seam-1.md` (or a section in `docs/agents/`) with the canonical test
   template, plus GLOSSARY.md entries (Actor, Visitor, Member, Session, One-time code, Capture mailbox,
   Seam 1, Seam 2, Seed builder) and ADRs (Better Auth behind the identity module; harness design; app-
   generated UUIDv7).

---

## 4. Milestone summary

### 4.1 Counts

| AFK class | Tickets | Count |
| --- | --- | --- |
| A | #59, #60, #62, #65 (+ #67 already done) | 4 (+1) |
| B | #57, #58, #61, #63, #64, #68 | 6 |
| C | #66 | 1 |

| Size | Tickets | Count |
| --- | --- | --- |
| S | #67 (verification only) | 1 |
| M | #62, #66, #68 | 3 |
| L | #58, #60, #64, #65 | 4 |
| XL (split) | #57 (3 children), #59 (2), #61 (2), #63 (3) | 4 |

After splits: 19 work units (57a, 57b, 57c, 58, 59a, 59b, 60, 61a, 61b, 62, 63a, 63b, 63c, 64, 65, 66a,
66b, 67, 68), 18 of them needing code (67 is verification only); #58, #60 and #65 have optional splits
noted in their sections.

Tournaments recommended: #57 (3-way, design-level), #58, #59, #60, #61, #63, #64 (2-way), #65 (3-way).
No tournament: #62, #66, #67, #68.

Design-uncertainty scores: #65=5; #57, #58, #61=4; #59, #60, #63, #64, #66=3; #62, #68=2; #67=1.

Risk flags: auth/security #57 #58 #59 #60 #62 #63 #65; personal data #57 #58 #59 #61 #63 #64 #66 #68;
encryption #58; minors/safeguarding #63 #64 (foundations); CSP #65; infra/prod #57 #59 #61 #63 #66 #67
#68; money-adjacent #62.

### 4.2 Internal ordering (rolling waves)

```text
wave 0 (W=1):  57a -> 57b -> 57c                     (+ #67 reconciliation: no code; F1)
wave 1:        58, 59a, 61a, 65, 66a                 (all need #57 only)
               59b after 59a; 61b after 61a
wave 2:        60 (after 59a), 63a (after 59a + 61a), 64 (after 59a + 61a)
               63b after 63a + 61a; 63c after 63b (+ residue for Seam 2)
wave 3:        62 (after 60), 68 (after 61a + 63a; 66a for the reporter), 66b (after 61b)
```

Critical paths: 57a-57b-57c -> 59a -> 60 -> 62 (settings binds `sms.enabled` and staff session lifetime);
57 -> 61a -> 63a -> 68. M1's earliest starters need 59a (roles), 61a (outbox), 64 (consent), 58
(encrypted columns), 63a (files).

Serialization rules for M0 (charter decision 4 applied):

- 58 and 59a may run together only if #59 keeps roles and audit in new schema files
  (`schema/access.ts`, `schema/audit.ts`) and #58 limits itself to `schema/identity.ts`; both touch seed
  only through their own seeder files.
- 58 and 61a both edit the sign-up use case; allow parallel, merge 61a first (critical path), rebase 58.
- 60 and 62 share the session-policy and admin navigation files: 62 strictly after 60.
- 63a and 64 share only `/account/*` subroutes and the outbox registry: parallel allowed.
- 61b, 63b, 66b and 68 all edit `docker/workers.yml` / `docker/README.md`: serialize their merges.
- 65 and 66a both edit `next.config.ts` and `src/instrumentation.ts` / layout: parallel build, serialized
  merge; 65 also edits `src/proxy.ts`, which #60 may touch: merge 65 before 60 or keep the gate out of
  the proxy.

### 4.3 Human residue roll-up (child issues: `ready-for-human` + `factory:needs-human`)

Blocking agent gates (raise at wave-0 start):

- R0-1 Vercel env: `BETTER_AUTH_SECRET` (Preview, staging, Production), `CAPTURE_MAILBOX_TOKEN`
  (Preview, staging, GitHub secret) [#57 Seam 2].
- R0-2 `main` PR passing `CAPTURE_MAILBOX_TOKEN` into `e2e.yml` [#57 Seam 2; F3].
- R0-3 Decide `factory/trunk` base (`M0` branch) and PR #136's fate; confirm no parallel M0 sessions [F1].
- R0-4 Field-encryption keys per environment with offline backup [#58].
- R0-5 Non-production R2 bucket + token + CORS (interim owner account or FOA's) [#63 Seam 2].
- R0-6 VPS: worker roles, secrets, `docker/workers.yml` up, ClamAV sidecar [#61b, #63b verification].

Non-blocking (production readiness, ordered by what unblocks production first): SES domain + production
access [#57]; DLT + MSG91 [#58]; FOA R2 production buckets [#63, #68]; Sentry + uptime + 365-day logs
[#66]; B2 account and residency ruling [#68]; first production super admin bootstrap [#59]; legal copy for
privacy/terms/messages consent [#64]; defaults decisions (code limits, session lifetimes, step-up window,
retention window) [#57, #60, #62, #68]; CSP enforce timing and staging check after release [#65]; restore
drill timer install after merge [#67].

### 4.4 Cross-milestone dependencies

Native outgoing counts into M1+: #59 -> 5, #60 -> 5, #61 -> 2, #62 -> 2, #63 -> 5, #64 -> 3 (22 edges;
the Orchestrator resolves the exact edges at runtime, 0.2). Inferred from ticket bodies:

| M0 ticket | M1+ tickets that need it | Evidence |
| --- | --- | --- |
| #57 | all (harness, seed); #74 (invitees sign in or sign up), #78, #81 | "lays the base every later ticket tests on" |
| #58 | #75 (date of birth, guardian contact encrypted), #81 (guardian OTP, encrypted fields), #83, #108 (PAN), #69 (SMS port) | encrypted column type introduced in #58; #55 encrypted columns list |
| #59 | #69 (content-manager role), #70 (competition manager), #73 (institution-admin scoped role), #74, #79, #80, #105, #113, #116, #127 | `can()` in every use case; scoped roles |
| #60 | #80 ("after step-up"), #99 ("Approving needs step-up"), #108, #109 (two-approver money operations), data exports | "Later tickets reuse it for publishing results, money operations and data exports" |
| #61 | #69 ("on top of the outbox and worker"), #71 (pg-boss schedules), #77, #82, #84, #105 ("through the outbox"), #126 | outbox/jobs module |
| #62 | #84 ("Reminder timing lives in runtime settings"), #108 (80G setting), #114 (retention periods as settings), #121, #122, #125, #132 | settings module |
| #63 | #79, #83 (private files), #85-#87 (scan gate), #94 (condition photos), #108 (proof), #111, #112, #129 | "every later upload ... uses" |
| #64 | #72 (attach consent documents), #82 (extends Consent), #83, #126 (communication consent) | Consent module |
| #65 | #77 (Razorpay checkout sources), #118 ("allowed by the CSP") | CSP builder must be extensible |
| #66 | every milestone's definition of done (no personal data in Sentry), #68 | |
| #67, #68 | none | |

Cross-milestone hazards to carry forward: audit append-only vs DPDP erasure (#59 vs #115); polymorphic
`scope_id` without foreign keys until institutions/competitions exist (#59 vs #70/#73); consent
`subject` modelling must fit minors without logins (#64 vs #81/#82); the CSP builder must take Razorpay
and Umami sources (#65 vs #77/#118); data residency of R2 and B2 copies (#63, #68 vs counsel).
