# Research digest: spec #55 and its 80 tickets (verified 2026-11-19)
Sources, all read in full: `research/spec-55.md`; bodies of #56–#135; 10 issue comments (#55 #67 #84–#86 #88–#92, GitHub
MCP); `raw-prs.json`; #55 sub-issues with `issue_dependencies_summary`; repo main `e340a6a`.

## 1. Ticket ordinals -> GitHub issues (VERIFIED)
- Rule: **ticket n = issue #(55+n)**, n = 1..80. #55's body has NO numbered ticket list (it ends "Next step: a new wayfinder map
  ... sliced into vertical tickets"); ordinals are the slice order.
- Evidence from bodies: #57 "Phone sign-in (3) and roles (4)" = #58, #59; #58 "module from 2" = #57; #59 "staff 2FA gate (5)" =
  #60; #62 "step-up (5)" = #60; #63 "submissions (30)" = #85; #64 "(27)" = #82 guardian consent, "(17)" = #72 consent attached
  to competitions; #65 "signed-in areas (from 2 on)" = #57. All match. Owner comments use issue numbers ("M4 #100" in the #89
  comment), not ordinals.
- **Ticket 1 = #56** "M0: CI on every PR: lint, typecheck, tests, Playwright and axe on the preview": **closed, completed**,
  landed on main as `623d950` "Run CI on every PR ... (#56)". It is the only closed ticket. Ticket 2 = #57 ... ticket 80 = #135.
- All 80 (#56–#135) are native sub-issues of #55. All 79 open tickets + #55 carry `ready-for-agent`.
- **Native dependencies exist**: 125 blocked-by edges, all inside #56–#135 (sum blocked_by = sum blocking = 125). GitHub search
  cannot list edges (`is:blocked` returns 0; `blocked-by:N` is treated as text). The Orchestrator reads edges at runtime with
  `gh api repos/siddhartxts/friends-of-animals/issues/<n>/dependencies/blocked_by --jq '[.[].number]'` and cross-checks
  the counts in the table below. Zero-blocker open tickets: **#57, #66, #67, #118**.
- **In-flight work outside main**: draft PR #136 "M0 foundations" (head `M0`, base `main`, 3 commits, 7 files, +722/−152, ops
  scripts only, mergeable clean). #67 (restore drill) is merged into `M0` at `9c69f10` (comment on #67: all 6 ACs met, drills
  passed on the VPS); the PR body lists #57–#66, #68 as "in progress" but the branch holds no app code for them. Open PR #137 =
  the 39 skills (already in the local checkout). DECISION NEEDED by the spec: `factory/trunk` is cut from `main`, so #67's work
  is not on it. Options: merge `origin/M0` into `factory/trunk` once at start (ops-only, no schema), or close #136 and re-land
  #67. Do not let `M0` and `factory/trunk` both target `main`.

### Ticket table (deps = native blocked_by/blocking counts; flags indicative, from bodies)
Flags: A auth/security · $ money/ledger · K minors/consent/safeguarding · E encrypted columns · C CSP · V needs VPS/infra access
· P a provider account needed for the production half · S Seam-2 journey owner · H harness/foundation many tickets build on.

| n | # | M | Title (short) | deps | flags |
|---|---|---|---|---|---|
| 1 | 56 | M0 | CI: lint/type/format/Vitest, Playwright+axe on preview | 0/0 | CLOSED |
| 2 | 57 | M0 | Email OTP sign-up/in, sessions, Seam-1 harness, seed command | 0/4 | A H S P(SES) |
| 3 | 58 | M0 | Phone OTP, MSG91 adapter, encrypted column type | 1/0 | A E P(MSG91/DLT) |
| 4 | 59 | M0 | Scoped roles, `can()`, append-only audit log, audit search | 1/8 | A H S |
| 5 | 60 | M0 | Staff 2FA gate (TOTP/passkey), step-up, per-role sessions | 1/6 | A H |
| 6 | 61 | M0 | Outbox + pg-boss worker(s) on VPS, in-process job drain | 1/5 | H V |
| 7 | 62 | M0 | Runtime settings screen + typed accessor | 1/2 | A H |
| 8 | 63 | M0 | Private uploads, ClamAV gate, signed delivery, env prefixes | 2/5 | A H S V P(R2) |
| 9 | 64 | M0 | Consent documents + consent to messages | 2/3 | K H |
| 10 | 65 | M0 | CSP: static no-nonce, signed-in nonce strict, reports | 1/0 | C |
| 11 | 66 | M0 | Sentry (PII scrubbed), uptime checks, 365-day logs | 0/0 | V P(Sentry,uptime,logs) |
| 12 | 67 | M0 | Restore drill into throwaway container | 0/0 | V — DONE on branch `M0` |
| 13 | 68 | M0 | Nightly R2 -> Backblaze B2 copy | 1/0 | V P(R2,B2) |
| 14 | 69 | M1 | Templates, event->message map, in-app inbox, channel prefs | 1/10 | H |
| 15 | 70 | M1 | Create/preview/publish competition; public pages from DB | 1/2 | H |
| 16 | 71 | M1 | Competition status machine on pg-boss schedules | 2/4 | H |
| 17 | 72 | M1 | Fees per route, award schemes, attached consent docs | 2/2 | $ |
| 18 | 73 | M1 | Institution registration/verification, Institution ID, code generator | 2/2 | E H |
| 19 | 74 | M1 | Institution coordinators (invites) | 1/2 | A |
| 20 | 75 | M1 | Institution registers for competition, enrol students, age category | 2/5 | E K |
| 21 | 76 | M1 | CSV student import, per-row error report | 1/0 | E K |
| 22 | 77 | M1 | Bulk fee payment, Razorpay port, idempotent webhooks | 2/2 | $ S P(Razorpay) |
| 23 | 78 | M1 | Individual adult registration + payment, participant dashboard | 1/3 | $ E |
| 24 | 79 | M1 | Offline payments, needs-review captures | 1/1 | $ |
| 25 | 80 | M1 | Refunds with finance approval; cancel refunds all | 2/2 | $ A |
| 26 | 81 | M1 | Guardians and minors (<13 managed, 13–17 linked login) | 2/4 | K E A |
| 27 | 82 | M1 | Per-purpose guardian consent; credit = first name + initial | 2/3 | K |
| 28 | 83 | M1 | Coordinator collects consent by code link or signed form | 3/0 | K |
| 29 | 84 | M2 | Announcements + deadline reminders | 4/0 | K |
| 30 | 85 | M2 | Image submission (individual), Entries module, HEIC, EXIF strip | 3/3 | H V(worker-media) |
| 31 | 86 | M2 | Video (ffmpeg) and essay submissions | 1/0 | V |
| 32 | 87 | M2 | Coordinator submits for students, conduct certification | 2/1 | |
| 33 | 88 | M2 | Published rubrics gate school judging | 1/2 | |
| 34 | 89 | M2 | School round: panel, positions, shortlist, finalise | 3/3 | |
| 35 | 90 | M2 | Overdue, close-on-behalf, reopen school rounds | 1/0 | |
| 36 | 91 | M2 | Shortlist-only submission scope | 1/0 | S |
| 37 | 92 | M2 | FOA verification of digital entries | 2/3 | |
| 38 | 93 | M3 | Request/dispatch/receive physical artwork, Artwork ID | 1/2 | |
| 39 | 94 | M3 | Verify artwork, custody, discrepancy, "physically ready" check | 1/2 | |
| 40 | 95 | M3 | FOA rounds, judge onboarding, conflicts, assignment | 2/1 | A |
| 41 | 96 | M3 | Blind scoring (no-PII read model), autosave | 1/1 | K |
| 42 | 97 | M3 | Rankings + tie-break, round lock/override, outcomes | 2/2 | S |
| 43 | 98 | M3 | Chained judging levels | 1/0 | |
| 44 | 99 | M4 | Results two-person approval, scheduled publish, results page | 2/5 | A K |
| 45 | 100 | M4 | Certificates (PDF via worker-media), QR verification page | 1/3 | V(Gotenberg) |
| 46 | 101 | M4 | Revoke/reissue certificates, bulk ZIP | 1/0 | S |
| 47 | 102 | M4 | Logo stamping service, shareable certificate image | 1/1 | brand |
| 48 | 103 | M4 | Public gallery with consent gating, CDN purge, reports | 3/1 | K S(crawl) P(R2 CDN) |
| 49 | 104 | M4 | Social-media export queue | 1/0 | K |
| 50 | 105 | M5 | Double-entry ledger, automatic postings, backfill | 1/3 | $ |
| 51 | 106 | M5 | One-time donations, sequential FY receipts, 7-day links | 1/3 | $ K P(Razorpay) |
| 52 | 107 | M5 | Recurring donations (Razorpay subscriptions) | 1/0 | $ P |
| 53 | 108 | M5 | Offline donations, 80G/PAN behind settings | 2/0 | $ E A |
| 54 | 109 | M5 | Budgets, period lock, two-approver rules, accountant export | 2/1 | $ A |
| 55 | 110 | M5 | Transparency page (published periods only) | 2/0 | $ S |
| 56 | 111 | M5 | CMS pages, home sections, impact counters, sanitiser | 1/2 | A(XSS) |
| 57 | 112 | M5 | Blog and stories (scheduled publish) | 2/0 | |
| 58 | 113 | M5 | Contact inbox, captcha, rate limits | 2/0 | A P(captcha) |
| 59 | 114 | M5 | Data inventory + retention jobs, inventory-coverage test | 2/0 | K |
| 60 | 115 | M5 | Privacy rights requests, grievance queue, export | 2/0 | K |
| 61 | 116 | M5 | Safeguarding reports (DSL-only), breach log | 1/0 | K A |
| 62 | 117 | M5 | Admin home queues, basic reports, CSV | 5/1 | |
| 63 | 118 | M5 | Cookieless Umami analytics | 0/0 | C V P(subdomain) |
| 64 | 119 | M6 | Community membership, engagement timeline, ladder | 1/4 | K |
| 65 | 120 | M6 | Post-competition invitations + pilot backfill | 2/0 | K |
| 66 | 121 | M6 | Clubs (one per institution) | 2/0 | |
| 67 | 122 | M6 | Ambassadors (thresholds in settings) | 2/0 | |
| 68 | 123 | M6 | Volunteer applications (14+, guardian <18) | 2/1 | K |
| 69 | 124 | M6 | Volunteer tasks, hours, certificates | 2/0 | |
| 70 | 125 | M6 | Events: publish, register, waitlist, check-in | 3/0 | |
| 71 | 126 | M6 | Campaign messages to consented segments | 2/0 | K |
| 72 | 127 | M7 | NGO directory listings + verification | 2/2 | |
| 73 | 128 | M7 | Directory search by service and distance (earthdistance) | 1/0 | |
| 74 | 129 | M7 | Adoption listings | 1/1 | |
| 75 | 130 | M7 | Adoption applications + coordinator workflow | 2/0 | |
| 76 | 131 | M8 | Auction lots from consented artwork | 2/1 | K $ |
| 77 | 132 | M8 | Bidding, outbid alerts, anti-sniping, concurrency | 1/1 | $ K A |
| 78 | 133 | M8 | Auction payment, delivery, thank-you letters | 2/0 | $ P |
| 79 | 134 | M8 | Feedback surveys | 2/0 | K |
| 80 | 135 | M8 | Objective reports and social metrics | 1/0 | |

## 2. Architecture
- Thin edges: server actions and route handlers parse input (zod 4), resolve the actor, call ONE use case. No UI code touches
  the DB. Each use case takes (actor = session + roles, validated input) and calls `can()` first.
- Stack (locked, #2–#13): Next.js 16.4 App Router on Vercel Pro (`bom1`), Node 26, TS 7, pnpm, oxlint + oxfmt, Tailwind 4 +
  shadcn, Drizzle 0.45 on Postgres 18.7, Better Auth 1.7 + Drizzle adapter, pg-boss 12, Cloudflare R2, sharp (HEIF) + ffmpeg +
  Playwright in `worker-media`, ClamAV and Gotenberg sidecars (**Gotenberg 9.x, exact tag ≥ 9.8.0** per owner comment on #55,
  not 8), Docker Compose on the Mumbai VPS, PgBouncer TLS+SCRAM at `db.shipped-it.dev:6432`, pgBackRest PITR.
- Repo today (main `e340a6a`): no Better Auth, pg-boss, ports or fakes in `package.json`; `src/server/db/schema/index.ts` is an
  empty barrel ("one file per module next to this one"); one migration `drizzle/0000_enable_pg_trgm.sql`; `src/test/db.ts`
  `createTestDb()` = PGlite (pg_trgm loaded) + real migrations, swapped in with `vi.mock("@/server/db")`. Installed PGlite
  0.5.16 ships contrib `cube`, `earthdistance`, `pgcrypto`, `citext`, `uuid_ossp` (#128's fallback should be moot). Messages:
  `messages/en-IN/*.json`. Env: `APP_ENV` in {local, preview, staging, production}; previews use DB `foa_pr_<n>` (or
  `foa_br_<branch>_<hash>` before a PR) created from template `foa_seed`.

### Modules (spec "Modules and their interfaces") -> owning tickets

| Module | Core content | Built by | Extended by |
|---|---|---|---|
| Identity & access | OTP sign-up/in, sessions, scoped roles, `can()`, 2FA gate, step-up, guardian links | #57 | #58 #59 #60 #74 #81 |
| Audit | append-only log (actor, role, action, entity, before/after, IP, UA, time), DB trigger | #59 | every state change |
| Outbox & jobs | event in same tx; worker fan-out; pg-boss schedules; in-process drain | #61 | #69 #71 #84 |
| Files | `FileAsset`, presigned upload, scan gate, metadata strip, derivatives, signed URLs | #63 | #85 #86 #94 #102 |
| Consent | versioned docs, records (subject, giver, purpose, version, time, method), withdrawal event | #64 | #72 #82 #83 |
| Settings | typed runtime settings, defaults, audit-logged, step-up | #62 | many |
| Codes | Crockford base32 generator, collision retry; receipts sequential per FY | #73 | #75 #77 #78 #85 #93 #100 #106 #131 |
| Institutions | registration, verification, members, students, CSV import | #73 | #74 #75 #76 |
| Competitions | definition, scope flags, dates (IST in, UTC stored), status machine | #70 | #71 #72 #88 #90 |
| Registration | individual + institution routes, age category from DOB + cut-off, status machine | #75 | #78 #81 |
| Payments | batch per order, signed idempotent webhooks, offline, needs-review, refunds | #77 | #79 #80 #133 |
| Notifications | email/SMS/in-app ports, templates, event map, reminders, guardian routing | #69 | #84 #126 |
| Entries | per-discipline submission, Entry ID, replace until deadline, FOA verification | #85 | #86 #87 #91 #92 |
| School round | panel, positions, shortlist, certifications, finalise, overdue, close, reopen | #89 | #90 #91 |
| Physical artwork | request, dispatch, receipt, verification, discrepancy, custody, "physically ready" | #93 | #94 #131 |
| FOA judging | rounds by level, rubrics, judges, conflicts, blind scoring, aggregation, lock | #88(rubrics) #95 | #96 #97 #98 |
| Results & certificates | two-person approval, scheduled publish, PDF certs, QR verify, revoke/reissue, ZIP | #99 #100 | #101 #124 |
| Stamping; Gallery & social export | master logo set + approved derivations on derived copies; consent-gated curation, moderation, reports, export queue | #102; #103 | #103 #104; #104 |
| Donations | one-time, recurring, receipts (7-day signed link), donor wall, adults only, 80G/PAN | #106 | #107 #108 |
| Ledger; Transparency | double-entry auto postings, manual entries, budgets, period lock, reversals, 2-approver; public read model from locked periods only, no donor PII | #105; #110 | #109 #133 |
| CMS | pages, home sections, blog, events/campaigns, legal pages, counters, contact inbox, sanitiser | #111 | #112 #113 |
| Community | membership, timeline, ladder milestones, invitations, clubs, ambassadors | #119 | #120 #121 #122 |
| Volunteers / Events | applications, guardian approval, tasks, hours, certs / register, waitlist, check-in | #123 / #125 | #124 |
| NGO directory / Adoption | self-registration, verification, earthdistance search / listings, applications | #127 / #129 | #128 / #130 |
| Auctions | lots from consented artwork, bidding, anti-sniping, payment window, fulfilment | #131 | #132 #133 |
| Reports & analytics | admin queues, basic + objective reports, social snapshots, surveys, Umami | #117 | #118 #134 #135 |
| Privacy | data inventory + retention jobs, rights requests, grievance, safeguarding, breach log | #114 | #115 #116 |

## 3. Ports, adapters and fakes
None exist on main. Seam-1 fakes the spec REQUIRES (in-memory, provider ports only):

| Port | Production adapter | Non-prod deployed adapter | Seam-1 fake | First ticket |
|---|---|---|---|---|
| Email | Amazon SES `ap-south-1` | capture adapter (mailbox readable by staff + Playwright) | in-memory | #57 |
| SMS | MSG91 (DLT) | capture adapter; off while `sms.enabled`=false | in-memory | #58 |
| Payment gateway | Razorpay (domestic INR) | Razorpay test mode | fake + webhook simulator (valid/invalid signatures) | #77 (subs #107) |
| Object storage | Cloudflare R2 (private/public/evidence buckets) | non-prod buckets, prefix per env (`staging`, `pr-<n>`) | in-memory | #63 |
| Malware scanner | ClamAV sidecar | shared VPS ClamAV | fake (clean/infected) | #63 |
| PDF renderer | Gotenberg 9 / Playwright in worker-media | same | fake | #100 |
| Media/image processor | sharp(HEIF)+ffmpeg in worker-media | same | fake | #85 (#86 video, #102 stamping) |

Implied by tickets, not in the spec's list (Orchestrator decides port vs plain module): clock (fake clock, #57), job/outbox
drain (#61), CDN purge (#103 "purges its CDN copy"), B2 copy target (#68, "storage fakes"), error reporter/Sentry (#66, #68),
captcha verifier (#113, provider unnamed), pin-code -> coordinates dataset (#128, openly licensed, static data). Real adapters
run only in Seam 2 sandbox mode; no separate adapter suite.

## 4. Test seams
- Good test: external behaviour through a seam (use-case return values, what another actor can query, messages received by
  fakes, files present, audit rows written). Never assert internal calls, private helpers or table layout; never mock internal
  modules. Build worlds with seed builders ("a verified institution with 30 confirmed students in PAWS26"); time via fake clock,
  never sleeps.
- **Seam 1 (primary)**: `as(actor).<useCase>(input)`; fresh PGlite per test with real migrations (`createTestDb`, extend with
  earthdistance/cube); fake clock; jobs and outbox drained in-process ("advance to registration close, drain jobs, assert");
  in-memory fakes only at provider ports. Mandatory per module: transition table (every allowed AND forbidden transition) for
  each state machine (competition, registration, payment batch, entry, school round, physical artwork, round, results,
  certificate, donation, auction lot, adoption application, volunteer application; tickets add institution, refund, recurring
  donation, period, inbox item, request, safeguarding report, breach, club, ambassador application, task, event, event
  registration, listing, adoption listing); authorization tests per use case (allowed role passes, ≥1 disallowed role fails);
  money invariants (1 capture -> exactly 1 posting + 1 receipt with next number; replayed webhook changes nothing; refund ->
  reversal; transparency totals = ledger totals for published periods); consent gating (withdrawal removes item from every
  public read model; no original asset key or minor PII beyond allowed credit); blind read model has no participant PII;
  rankings match hand-computed fixtures; every milestone's ACs written at this seam first. Harness: #57; drain: #61.
- **Seam 2 (thin)**: Playwright on the PR's Vercel preview + `foa_pr_<n>`, providers in sandbox/test mode, axe on every new
  page, Lighthouse on public pages, crawl proving no public gallery/results URL resolves to an original. CI wiring exists (#56:
  `ci.yml`, `e2e.yml`, bypass secret, smoke journey). Journeys: M0 OTP sign-up (#57), scoped role grant (#59), signed-URL round
  trip (#63); M1 institution + 30-row CSV + bulk pay (#77); M2 both submission scopes (#91); M3 blind scoring + lock (#97); M4
  publish -> QR valid -> revoke -> revoked (#101) + original-asset crawl (#103); M5 donation -> receipt -> lock period ->
  transparency totals (#110). Spec defines none for M6–M8.
- Milestone DoD: migrations apply on fresh DB and on a staging copy; transition tables pass; every message-sending event has a
  template; every new PD field in the data inventory with retention; authz tests for every new use case; no PII in logs/Sentry;
  axe clean; Seam-2 journeys pass on preview AND staging (staging = `main`: verifiable only after a release merge).

## 5. Cross-cutting rules (apply to every ticket)
- **Encryption**: phones, DOB, addresses, guardian details, PAN use an encrypted column type at rest (US 203). Introduced by #58
  (phone encrypted + keyed hash for lookup); used by #73, #75, #76, #78, #81, #108. Mechanism (app-level vs pgcrypto) and key
  management are unspecified: production key is a human-provisioned secret; tests use a fixed test key.
- **Audit log**: append-only, DB trigger rejects UPDATE/DELETE (#59). Written for every state change, permission change, consent
  change, money movement, admin edit of user data; system actor for scheduled transitions (#71); counts-only rows for bulk ops
  (#76) and retention runs (#114).
- **`can(actor, action, resource)`**: the one policy check, first line of every use case. Scopes: global / institution /
  competition / organisation (+ round scope for judges, #95). Roles: member, participant, guardian, institution admin,
  institution coordinator, judge, volunteer, organisation representative, staff admin, super admin, competition manager, content
  manager, community manager, finance, auction manager, adoption coordinator. Staff roles need 2FA. GAP: tickets also use "FOA
  verifier" (#92, #94), "Designated Safeguarding Lead" (#116), "grievance officer" (#115) — not in the spec's role list; the
  implementing ticket must add them or map them to staff roles.
- **Step-up** required for: role grant/revoke (#60), settings change (#62), refund approval (#80), results approval (#99), 80G
  toggle (#108), two-approver ops (#109), data exports (US 20).
- **Consent**: published documents immutable (new version on change); records keyed subject, giver, purpose, version, time,
  method (OTP, code link, signed form + reviewer); withdrawal -> outbox event consumed by gallery (#103), social queue (#104),
  auction (#131), communications (#126, #120, #134). Purposes: participation, public display, school+city display, social media,
  auction, communications. School declaration covers participation + judging only; public use needs guardian code-link consent
  or an FOA-accepted signed form (#83). Competitions attach docs by version (#72).
- **Minors/guardians**: DOB stored, never age. <13: guardian-managed profile, no login; 13–17: own login linked to guardian;
  adults independent. Minor individual registration pending until guardian verifies + participation consent (#81, #82). Messages
  about a minor go to the guardian. Public credit = first name + last initial; school/city per-field opt-in; auction credit
  capped. Minors cannot donate (#106) or bid (#132). Volunteers 14+, guardian approval <18 (#123).
- **Safeguarding**: public no-login "report a concern" form, confirmation shows no details; queue readable only by the DSL role;
  every view/change audited (#116). Quick exit on `/safeguarding` already exists (#35, #48).
- **i18n**: English only; every string through next-intl `messages/en-IN/*.json`.
- **CSP** (#65): static public pages CSP without nonces (self-hosted scripts, no inline handlers, still statically rendered);
  signed-in dynamic areas nonce-based strict CSP; violation reports endpoint, no PII. Other headers already done (#50). Umami
  script self-hosted and allowed (#118).
- **Retention**: every new PD field -> data inventory with purpose + retention period ("default marked to confirm" with
  counsel); before #114 this is a "data inventory note" (location unspecified — pick one file #114 can enforce); #114 adds jobs
  + a test failing on uninventoried PD columns; financial records under legal hold.
- **Accessibility/perf**: axe clean on every new page; Lighthouse mobile ≥ 90 perf + a11y on public pages; design follows
  existing site (logo palette, tile motif, Baloo 2, Inter, Kalam).
- **Other invariants**: money `bigint` paise + ISO currency (INR); times UTC `timestamptz`, viewer TZ default `Asia/Kolkata`,
  admins enter IST; UUIDv7 ids, human codes separate; outbox row in the same tx as the change; no Vercel Cron; OTP sent directly
  via ports, Postgres rate limits per identifier + IP; originals never public; signed URLs after `can()`; idempotent signed
  webhooks; `APP_ENV` not `VERCEL_ENV`; non-prod never indexed (#29); no PII in logs/Sentry; preview seed extended by every
  ticket; registration number never a credential; rich text through one sanitiser.

## 6. Spec rulings (verbatim scope; defaults FOA may change)
1. Availability 99.5%/month; RPO 15 min, RTO 4 h once off-site backups exist; FOA accepts VPS-loss risk in writing before the
   pilot. 2. Money bigint minor units + currency, INR at launch.
3. OTP delivery direct through SMS/email ports, not the queue; Postgres rate limits per identifier and IP; all other messages
   via outbox. 4. File safety: R2 unversioned; nightly copy to B2; deletions reach B2 only after retention window. 5. Restore
   drill into a throwaway container, never `pg-nonprod`, result recorded. 6. Jobs outside prod: staging worker; one shared
   non-prod worker for all live `foa_pr_<n>`, stops when the DB is dropped; local dev process.
7. Analytics: self-hosted cookieless Umami, own DB, no tracking of signed-in children's pages.
8. CSP as in section 5. 9. Non-prod storage: separate buckets, prefix per env, preview prefix purged on DB drop. 10. Children's
   data in R2 by default; storage port makes S3 Mumbai + CloudFront a config change if counsel requires.
- Product defaults: digital scope = all participants; shortlist 5/category + 3 positions; individual route skips school round;
  pilot = school round + one national final on physical work; award scheme ranked 1st/2nd/3rd; physical track only after FOA
  verification; FOA keeps work unless asked back within 30 days of results; fees are configuration (none invented),
  non-refundable after confirmation except cancellation/duplicates; auction proceeds 100% FOA unless proceeds policy sets a
  creator share; copyright stays with creator; one club per institution; ambassador thresholds in settings; no WhatsApp; no 80G,
  FCRA off, no GST at start.
- Owner decisions in comments (binding): #55 Gotenberg 9.x ≥ 9.8.0. #84 announcement audience (individuals or their guardian if
  <18; coordinators of every confirmed institution registration; guardians of every enrolled student or the adult student);
  reminders only to those owing the deadline. #85 no draft: entry created `processing` on upload confirm, Entry ID at creation,
  confirmation at `submitted`; replacement is pending until scanned/processed; infected entry retryable before deadline; one
  entry per registration; guardian may submit for ward. #86 typed essay goes straight to `submitted`; replacement may switch
  text/document. #88 blocked flip tells the manager and re-runs automatically when the last rubric is published (if date
  passed); individuals-only competitions still pass through school judging with zero rounds. #89 all-participants finalise
  moves shortlisted entries straight to `submitted_to_foa`; every confirmed institution registration gets a round; finalise
  needs panel ≥ 1 + conduct + judging attestation; positions optional up to setting; only `submitted` entries shortlistable;
  module exposes school-round outcomes per registration (needed by #100). #90 close-on-behalf applies saved draft picks, emits
  `school_round.closed_on_behalf`; school->FOA flip scheduled, refused while rounds unfinished, re-runs when the last finishes;
  reopen only during school judging, keeps picks as draft, no messages on reopen, only changed outcomes messaged after
  re-finalise. #91 shortlist-only is school route only; created entry reaches `submitted_to_foa` only when processed AND round
  finalised; "not shortlisted" messages by registration, no `not_shortlisted` rows. #92 no `resubmitted` state; resubmission
  deadline = send-back + N days (setting, default 7).

## 7. Milestones (open counts; each ends deployed to staging with its Seam-2 journeys passing)
- M0 foundations, 12 open (#57–#68) + #56 closed: identity, audit, outbox/jobs, files, consent skeleton, settings, CSP, ops.
  Spec also puts codes/money helpers + seed in M0; tickets place codes in #73, money in #72, seed in #57.
- M1, 15 (#69–#83): institutions, competitions, registration with fees, guardians/consent; notifications (#69) moved here from
  the spec's M2 — ticket titles are authoritative for grouping.
- M2, 9 (#84–#92): announcements/reminders, digital submission, rubrics, school round, FOA digital verification.
- M3, 6 (#93–#98): physical-artwork track, FOA judging (rounds, blind scoring, rankings, chained levels).
- M4, 6 (#99–#104): results, certificates + QR, stamping, gallery, social export.
- M5, 14 (#105–#118): ledger, donations, transparency, CMS, blog, contact inbox, privacy, safeguarding, admin queues, Umami.
  **The pilot competition runs after M5.**
- M6, 8 (#119–#126): community, invitations, clubs, ambassadors, volunteers, events, campaigns.
- M7, 4 (#127–#130): NGO directory + distance search, adoption. M8, 5 (#131–#135): auctions (after the pilot's physical artwork
  is verified), feedback surveys, objective reports + social metrics. Total open tickets: 79.

## 8. External providers and accounts

| Provider | Used by | Agent-doable now | Human action (who) |
|---|---|---|---|
| Amazon SES `ap-south-1` | #57, all email | capture adapter + fake | SES account, sending domain SPF/DKIM/DMARC, sandbox exit, prod keys (owner + FOA domain) |
| MSG91 + DLT | #58, #69, SMS | capture adapter, `sms.enabled` off | DLT Principal Entity, sender header, templates (FOA, long lead); MSG91 keys |
| Razorpay | #77–#80, #106, #107, #133 | fake + webhook simulator | account + KYC as NGO, domestic only, Subscriptions enabled (FOA); test keys + webhook secret in Vercel (owner) |
| Cloudflare R2 | #63, #68, #103 | storage fake | FOA R2 account (needed; #27 refile), buckets, API + CDN-purge tokens (owner/FOA) |
| Backblaze B2 | #68 | storage fake | account, bucket, keys (owner/FOA) |
| ClamAV, Gotenberg 9, worker, worker-media | #61, #63, #85, #86, #100 | code + Compose files | deploy on VPS (owner; T1 runners cannot reach the VPS) |
| Umami | #118 | Compose service, script wiring | subdomain DNS + TLS, deploy (owner) |
| Sentry | #66, #68 | PII scrubber + tests | org/project, DSNs (owner) |
| Uptime checks | #66 | config as code | provider unspecified; account + alert target (owner) |
| Log retention 365 d | #66 | docs | Vercel log drain + destination unspecified (owner) |
| Captcha | #113 | port + fake | provider unnamed (decision + keys) |
| Pin-code dataset | #128 | source + licence check | none if openly licensed |
| Cloudflare DNS / prod domain | prod | none | FOA domain onto Vercel when ready (FOA + owner) |
| Vercel | all | previews exist; bypass secret set (#56) | env vars per environment, Static IPs later (owner) |

Non-code prerequisites (US/out-of-scope list; FOA leadership before pilot): Designated Safeguarding Lead, grievance officer, two
finance approvers, 24×7 safeguarding/incident on-call, pen-test vendor, police verification of in-person judges, written
acceptance of availability risk, income-tax 12A/80G status, FCRA, accountant ruling on GST and transparency contents, counsel on
DPDP consent, retention periods, school as joint fiduciary, minimum own-login age (13), data residency. FOA approval needed for
the favicon (#23); logo derivations already approved (#17).

## 9. Out of scope (spec)
Operating a shelter/animal care; foreign donations and GST invoicing (until FCRA + accountant); WhatsApp, native apps, automatic
social posting (manual export queue only); courier integrations (manual tracking numbers); non-English languages at launch;
people-not-code requirements (above); FOA provider paperwork (#18: tax status, Razorpay, DLT, SES, production domain — providers
stay in test mode until done); the favicon question (#23); any logo redesign (registered mark); the old public-site bugs #32–#52
(all closed now); off-site DB backups (blocked on FOA's R2, not #68).
