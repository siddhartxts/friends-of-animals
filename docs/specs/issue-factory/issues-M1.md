# M1 ticket analysis: issues #69–#83 (ordinals 14–28)

Sources read in full: `research/open-M1.json` (15 bodies, 0 comments), `research/open-M0.json`, `research/spec-55.md`,
`research/spec55.md`, `research/code-infra.md`, `research/code-ui.md`. Codebase skimmed at `3da7347`
(`src/app/competitions/**`, `src/content/sample/**`, `src/server/db/**`, `src/test/db.ts`, `next.config.ts`,
`node_modules/next/dist/docs/01-app/02-guides/`). Prior art (non-binding, superseded spec): `git show
8d06f2e:specifications/SPEC.md` (4002 lines; also split under `specifications/parts/`). Live check 2026-11-19:
`gh api -X GET search/issues` returned `issue_dependencies_summary` for all 15 tickets (counts below are VERIFIED).

## 0. Conventions and milestone-wide findings

### 0.1 Field conventions
- Ordinal n = issue − 55 (verified rule; no M1 body cites another ticket by ordinal: they say "the guardians ticket",
  "the ledger ticket", "the outbox ticket", "the bulk-payment ticket").
- Depends-on has three parts: **native** = GitHub blocked-by count (verified) and the edges that best fit every count in
  M0+M1 (INFERRED: the search API exposes counts, not edges); **extra** = technical prerequisites missing from the
  native closure, to be stored as `extraBlockers` in `docs/factory/ledger.json` (never written to GitHub); **blocks**.
  Runtime verification by the Orchestrator: `gh api repos/siddhartxts/friends-of-animals/issues/<n>/dependencies/blocked_by --jq '[.[].number]'`
  and `.../dependencies/blocking`; replace the inferred edges with the real ones, keep `extraBlockers`.
- AFK class: A = every AC closable against fakes, residue at most shared/deduped (R-RET); B = agent core merges, plus
  ticket-specific human residue before production use; C = mostly human (none in M1).
- Size: S <1h, M 1–3h, L 3–8h, XL >8h (agent wall time incl. tests, seed, pages, axe). Uncertainty 1–5.
- Tournament rule (charter 5): uncertainty ≥ 3, or a risk flag in {auth/security, money, minors/safeguarding,
  encryption, CSP} with size ≥ L. "Rule-triggered, low yield" marks tickets that qualify only by the second clause
  with uncertainty ≤ 2.
- Every ticket shares these ACs: Seam 1 tests (`as(actor).<useCase>`, PGlite + real migrations, fake clock, provider
  fakes); an authorization test per new use case (one allowed role passes, ≥ 1 disallowed role fails); preview seed
  extended; axe clean on every new page. They are not repeated per ticket below unless something is specific.

### 0.2 Findings that change how M1 must be scheduled (read before the per-ticket sections)
1. **Native edges miss technical prerequisites.** #58 (encrypted column type, SMS port) blocks NOTHING natively
   (count 1/0), yet #73, #74, #75, #78, #81 need the encrypted column type and #69 needs the SMS port. #79 needs the
   Files module (#63, proof upload) but its only native blocker is #77, whose closure has no #63. #69's closure
   ({#61, #57}) lacks #58, #59, #60, #62. Rule for the Orchestrator: **M1 entry gate = #57–#64 all `factory:merged-trunk`**,
   plus #65 before #77 and #83 (CSP allowances). Per-ticket `extraBlockers` are listed below for the ledger.
2. **No data inventory note exists** (`grep -ri "data inventory"` = 0 hits outside node_modules). Seven M1 tickets must
   append to it (#73, #74, #75, #78, #79, #81, #83). The first one to merge (planned #73) creates it. Recommended form,
   so #114 can later enforce coverage with a test: `src/server/privacy/inventory.ts` exporting a typed array
   `{ table, column, purpose, retention: { period, basis, toConfirm: true } }`, one entry per PD column, and a short
   `docs/privacy/data-inventory.md` that renders/links it. Append-only list => trivial merge-queue resolution.
3. **Participant profile and registration are shared entities across #75, #76, #77, #78, #81, #82, #83.** #75 creates
   them for the school route; #78 adds self-owned adult profiles; #81 adds guardian-managed (<13) and linked-login
   (13–17) profiles. #75's hardening must design the profile ownership model for all three
   (`owner_kind` institution | self | guardian) and a single `registration_status` enum that #77 (pending_payment,
   confirmed), #78, #80 (refunded) and #81 (pending_guardian) extend. Prior art: SPEC.md §6.5.1, §12.5.
4. **Duplicate detection under encryption.** DOB is encrypted (#75), so #76's "duplicates against students already
   enrolled" cannot use SQL on DOB. #75 must add a deterministic keyed hash column (prior art: SPEC.md §6.5.2
   `identityHash = HMAC(PII_HASH_KEY, normalize(full_name) + '|' + dob)`, NFKD, strip diacritics, lowercase, collapse
   whitespace; optional `student_ref` roll number as first match key). The key is a secret like the column key (#58).
5. **Razorpay webhooks cannot reach per-PR previews.** Razorpay holds one static webhook URL per account, and previews
   sit behind Vercel deployment protection. #77 must confirm captures through (a) the Checkout success handler's
   signature (server-side HMAC-SHA256 of `order_id|payment_id` with the key secret) and/or (b) a server fetch of the
   order's payments, with the webhook as the authoritative async path on staging. Verify both signature schemes against
   Razorpay docs at runtime (Context7/web), never from memory.
6. **Worker-version skew on previews.** The shared non-prod worker (#61) runs code deployed on the VPS, not the PR's
   code. New job types/handlers (#69 dispatcher changes, #71 status jobs, #80 cancellation refunds) do not run on a
   ticket preview until the owner redeploys the worker from trunk/main. Seam 2 journeys in M1 must not depend on a
   NEW worker handler; Seam 1 drains in-process. Runtime check after #61 merges: how the shared worker selects its code.
7. **DLT vs editable SMS templates (#69).** India DLT requires each SMS body to match a pre-registered template (with
   variables and any URL whitelisted). "Edit templates without a code change" therefore holds only for email and in-app;
   SMS templates need a `dlt_template_id` and an edit must flag "re-register with DLT". SMS stays off (`sms.enabled`
   false) so nothing breaks; residue R-DLT.
8. **DB-backed public pages vs prerendering (#70–#72).** `next.config.ts` has `cacheComponents: true` and
   `partialPrefetching: true`; public pages must stay prerendered, keep the no-nonce CSP (#65), JS ≤ 170 KB
   (`pnpm check:build`) and Lighthouse mobile ≥ 90. Today `pnpm build` needs no DB; reading competitions at build time
   would make local/runner builds need Postgres (`.cursor/cloud-start.sh`). Read first:
   `node_modules/next/dist/docs/01-app/02-guides/{incremental-static-regeneration-cache-components,keeping-pages-static,how-revalidation-works,public-static-pages,content-security-policy}.md`.
9. **Sample content is wired into more than the two pages #70 names.** `getSampleCompetitions()` also feeds `/`
   (`src/app/page.tsx` lines 69, 164), `/styleguide`, `src/components/showcase/{competition-card,status-chip}.tsx` and
   `src/app/_components/home-layout.ts` (typed on `@/content/sample/model`). #70 replaces the source only for
   `/competitions` and `/competitions/[slug]`; the home page keeps samples until a later ticket (flag in PR body).
   Sample model already lists 11 statuses (`DRAFT` … `CANCELLED`) that #71/#80 should align with.
10. **Old spec as prior art.** Where #55 and a ticket are silent, runners may read SPEC.md at 8d06f2e (#69: §10 from
    line 2825, §8.10 line 2005; #70–#72: §6.3 line 513, §6.6 line 633; #73–#74: §6.4 line 566; #75–#76, #78: §6.5
    lines 592–632; #77, #79, #80: §8.2–8.3 lines 1589–1760; #81–#83: §12.3–12.7 lines 3441–3600). Ticket + #55 win on
    any conflict; the old spec's Prisma-style names are not to be copied.

## 1. Dependency table (verified counts, inferred edges)

| # | n | Title (short) | native blocked_by (count: inferred edges) | extraBlockers (ledger) | blocks (count: inferred) |
|---|---|---|---|---|---|
| 69 | 14 | Templates, inbox, channel prefs | 1: #61 | #58 #59 #60 #62 #64 | 10: #73 #81 + 8 in M2–M8 |
| 70 | 15 | Create/publish competition; public pages from DB | 1: #60 (alt #59) | #59 (or #60 if native = #59) | 2: #71 #72 |
| 71 | 16 | Status machine on pg-boss schedules | 2: #70 #61 | — | 4: #75 + 3 later (cand. #84 #88 #90) |
| 72 | 17 | Fees, award schemes, attached consent docs | 2: #70 #64 | — | 2: #77 + #82 (alt: a later award ticket) |
| 73 | 18 | Institution registration/verification, Institution ID | 2: #59 #69 (alt #60 #69) | #58 #60 | 2: #74 + 1 later (cand. #121) |
| 74 | 19 | Institution coordinators | 1: #73 | #58 | 2: #75 + 1 later (cand. #87; alt #83) |
| 75 | 20 | Institution registers for competition, enrols students | 2: #74 #71 | #58 #69 | 5: #76 #77 #83 + 2 later (cand. #85 #87 #89) |
| 76 | 21 | CSV student import | 1: #75 | — | 0 |
| 77 | 22 | Bulk fee payment, Razorpay port | 2: #75 #72 | #65 (CSP); child 77c also #76 | 2: #78 #79 |
| 78 | 23 | Individual adult registration, participant dashboard | 1: #77 | #58 | 3: #81 + 2 later (cand. #85 #106) |
| 79 | 24 | Offline payments, needs-review | 1: #77 | #63 #60 | 1: #80 |
| 80 | 25 | Refunds; cancel refunds all | 2: #79 #60 (alt #79 #71) | #60 or #71 (whichever is not native) | 2: later (cand. #105 + #109/#133) |
| 81 | 26 | Guardians and minors | 2: #78 #69 (alt #78 #59) | #58 | 4: #82 + 3 later (cand. #84 #85 #123) |
| 82 | 27 | Per-purpose guardian consent; public credit | 2: #81 #72 (alt #81 #64) | #64/#72 (whichever is not native) | 3: #83 + 2 later (cand. #103 #104 #131) |
| 83 | 28 | Consent by code link or signed form | 3: #82 #75 #63 (alt #74 for #75) | #60 #65 #69 | 0 |

Fit check: M1 blocked_by sum 25 = 18 internal M1 edges + 7 from M0 (#61→69, #60→70, #61→71, #64→72, #59→73,
#60→80, #63→83); M0 external blocking sum 22 (#59:5, #60:5, #61:3, #62:2, #63:4, #64:3) — consistent with the M0
internal fit (#57→58,59,61,65; #59→60,63,64; #61→63,64; #60→62; #63→68). Alternatives in brackets are equally
consistent; the Orchestrator's runtime query settles them.

## 2. Per-ticket analysis

### #69 (ordinal 14) — M1: Message templates, in-app inbox and channel preferences
- **Depends-on:** native #61 (outbox + worker; "on top of the outbox and worker"). Extra: #58 (SMS port + capture
  adapter: "no SMS reaches the SMS port"), #59 (content-manager role, `can()`, audit), #60 (content manager is staff:
  2FA gate), #62 (`sms.enabled` feature flag), #64 (consent to messages; account-settings page and the
  required-by-law override must agree with it). **Blocks:** #73, #81, and 8 tickets in M2–M8 (every message sender).
- **AFK class:** B.
- **Human residue:** R-DLT (each SMS template registered with DLT; `dlt_template_id` filled; SMS flag stays off until
  then; dedupe with #58's DLT child). R-LEGALMSG (counsel confirms which messages are "required by law"; ship a default
  list marked to confirm: OTP, consent receipts, payment receipts, refund notices, safeguarding notices).
- **Ports/providers:** email port (#57), SMS port (#58); in-app is an internal DB channel, not a provider port. New
  internal deep module: `notify(event)` dispatcher = map lookup → audience resolution → template render → per-channel
  delivery with idempotency. Template renderer must escape variables (HTML email) and refuse unknown variables.
- **DB:** `message_template` (key, channel enum `message_channel` email|sms|in_app, locale default `en-IN`, subject,
  body, variables jsonb schema, `dlt_template_id` nullable, version int, updated_by, updated_at; unique key+channel+
  locale); `event_message_map` (event_type, template_key, audience key, channels, `required_by_law` bool, enabled);
  `message_delivery` (outbox_event_id, recipient_user_id, channel, status enum, provider_message_id, attempts; unique
  event+recipient+channel = idempotency); `inbox_item` (user_id, template_key, title, body, link, created_at, read_at);
  `notification_preference` (user_id pk, email bool, sms bool). Seed rows for the welcome message move from #61's
  hard-coded path onto the map.
- **Routes/pages:** `/admin/templates`, `/admin/templates/[key]` (per-channel edit + preview with sample variables),
  `/account/inbox`, `/account/notifications` (or the account-settings prefix #57/#64 established; verify on trunk),
  unread badge in `src/components/site-header.tsx`.
- **Messages namespaces:** `inbox`, `notificationSettings`, `adminTemplates` (default template bodies are DB seed
  content, not next-intl strings).
- **Size:** L — 5 tables, dispatcher refactor of the welcome path, 3 pages + header badge, preference logic with the
  legal override and the SMS flag.
- **Design uncertainty:** 3 — API every later ticket calls (`notify` shape, audience resolver extensible for
  "messages about a minor go to the guardian" in #81, institution coordinators in #75/#77, all registrants in #80);
  map as DB rows vs code table seeded to DB; template language and escaping; DLT coupling.
- **Risk flags:** auth/security (staff screens; template injection/XSS in email HTML), personal data (inbox, message
  bodies), infra (worker handler change → preview skew, finding 0.2.6).
- **Test plan:** Seam 1 — content manager edits template → emit event → drain → email fake has new wording; event
  without map row → no fake receives anything; inbox lists item, unread count, mark-read; another user cannot read or
  mark it; SMS pref off → no SMS but a `required_by_law` message still sends; `sms.enabled` false → SMS fake receives
  0 even when pref on; draining twice delivers once (idempotency); welcome-message regression through the map; audit
  row on template edit; authz: content manager allowed, staff admin + member refused for edit. Seam 2 — none required.
  Axe pages: `/admin/templates`, `/admin/templates/[key]`, `/account/inbox`, `/account/notifications`.
- **File-conflict hotspots:** `src/server/db/schema/index.ts`; #61's outbox/worker job registry; `site-header.tsx`;
  `src/lib/routes.ts`; `src/i18n/messages.ts`; settings registry (#62); seed command; `can()` policy file.
- **Tournament:** YES, 2 contenders (uncertainty 3; foundation for 10 tickets). Angles: (a) code-defined event catalogue
  with typed payloads + DB-editable copy only; (b) fully DB-driven map with a typed audience-resolver registry.
  Judge on: later-ticket ergonomics (`notify(tx, event)` one-liner), idempotency, DLT handling.

### #70 (ordinal 15) — M1: Create and publish a competition; public pages read it from the database
- **Depends-on:** native #60 (alt #59). Extra: whichever of #59/#60 is not native. **Blocks:** #71, #72 (count 2, exact).
- **AFK class:** A. **Human residue:** none (real competitions are FOA data entry after release, not code).
- **Ports/providers:** none new. Clock (fake) for IST conversion tests; `cachedNow()` pattern
  (`src/components/showcase/clock.ts`).
- **DB:** `competition` (uuidv7 id, `code` unique `^[A-Z]{3,6}\d{2}$`, `slug` unique, name, theme, welfare_message,
  participation enum individuals|institutions|both, rules, permitted_materials, duration, `digital_submission_scope`
  enum default all, `shortlist_per_category` default 5, `school_positions` default 3, physical_artwork_rule,
  public_display bool, auction_permitted bool, `age_cutoff_date` date, `status` enum `competition_status` (draft,
  published here; #71/#80 extend), published_at, created_by); `competition_discipline` (or enum array),
  `competition_category`, `competition_age_group` (label, min_age, max_age), `competition_key_date` (kind enum:
  registration_open, registration_close, submission_deadline, school_judging_deadline, results; `at` timestamptz).
  Key-date kinds are the hook #71 schedules.
- **Routes/pages:** `/admin/competitions`, `/admin/competitions/new`, `/admin/competitions/[id]/edit`,
  `/admin/competitions/[id]/preview`; rewrite public `/competitions` and `/competitions/[slug]`
  (`src/app/competitions/[slug]/page.tsx` is 586 lines on the sample model).
- **Messages namespaces:** `adminCompetitions` (new); `competitions` (existing, extended).
- **Size:** XL — long admin form with three repeating groups (categories, age groups, key dates) and IST entry; preview;
  publish validation; public list/detail rewritten from the sample model to a DB read model with caching; Lighthouse.
- **Design uncertainty:** 3 — caching/prerender strategy for DB pages (finding 0.2.8: `"use cache"` + `cacheTag` +
  revalidate on publish vs static shell with a dynamic hole); build needing a DB; read-model shape vs the sample
  `Competition` type the showcase components use; key-date model reused by #71.
- **Risk flags:** CSP (public rendering mode must keep the no-nonce static CSP), auth/security (staff screens), infra
  (build-time DB access on Vercel/runners).
- **Test plan:** Seam 1 — manager creates, edits, previews, publishes; draft absent from the public read model; code
  format and uniqueness (duplicate refused); IST input `2027-01-15 10:00` stored `2027-01-15T04:30:00Z` and rendered
  back in IST; audit row for create/edit/publish; publish refused while required fields missing; authz: competition
  manager allowed, content manager + member refused. Seam 2 — axe on admin pages; public pages in the smoke spec;
  Lighthouse mobile ≥ 90 (performance + accessibility) on `/competitions` and one detail page (local `pnpm start` build
  with seeded Postgres if the preview is unreachable; attach JSON to the PR). Axe pages: the 4 admin pages + 2 public.
- **File-conflict hotspots:** `src/app/competitions/**`, `src/content/sample/**`, `src/components/showcase/
  {competition-card,status-chip}.tsx`, `messages/en-IN/competitions.json`, `src/lib/routes.ts`, schema barrel, seed.
- **Split proposal (XL → 2):** 70a "Competitions module: schema, create/edit/preview/publish use cases, IST↔UTC helper,
  admin screens, audit, seed" (L; ACs 1–3, 5–8, admin axe). 70b "Public competition list and detail read published
  competitions from the DB" (M–L; AC 4 + Lighthouse; blocked by 70a). #71/#72 depend on 70a only.
- **Tournament:** YES on 70b (uncertainty 3 sits in rendering/caching; CSP flag). 70a single implementation unless
  hardening scores ≥ 3. Angles for 70b: (a) cache-tagged prerender with on-publish revalidation; (b) static shell +
  streamed DB section. Judge on build output (route stays ○/◐), Lighthouse, JS budget, CSP.

### #71 (ordinal 16) — M1: The schedule changes competition status automatically
- **Depends-on:** native #70, #61. **Blocks:** #75 + 3 later (candidates #84 reminders, #88 rubric gate, #90 school→FOA flip).
- **AFK class:** A. **Human residue:** none ticket-specific (worker redeploy on the VPS is shared R-WORKER).
- **Ports/providers:** clock (fake), pg-boss (in-process drain from #61). No provider.
- **DB:** extend `competition_status` with registration_open, registration_closed (and in-progress placeholder only if
  needed); optional `competition_schedule` (competition_id, kind, scheduled_for, job_id, version) if the chosen pattern
  needs it. Audit needs a system actor: check #59's audit schema supports `actor_type = system` (else add it here).
- **Routes/pages:** none new; status chip + countdown on `/competitions` and `/competitions/[slug]`; status on the
  admin competition page.
- **Messages namespaces:** `competitions` (status labels, countdown), `adminCompetitions`.
- **Size:** L — transition table, scheduling on publish and on date edit, catch-up when a date is already past,
  public countdown without inline scripts.
- **Design uncertainty:** 3 — the pattern M2 reuses: (a) one delayed job per instant carrying the expected instant and
  a version, handler no-ops when stale; vs (b) a periodic pg-boss schedule ("tick") that derives due transitions from
  key dates, idempotent by construction. Also: enqueue inside the publishing transaction (check pg-boss 12 send
  options for a shared executor; #61 sets the precedent); "honest countdown" under cached rendering (absolute IST time
  server-side + small client island for relative time).
- **Risk flags:** infra (worker; preview skew, finding 0.2.6). Audit correctness.
- **Test plan:** Seam 1 — publish with dates → advance fake clock past open → drain → registration_open; same at close;
  edit the date before it passes → old instant does nothing, new instant transitions; publish after open already
  passed → transitions on first drain; draining twice is idempotent; full transition table (every allowed and
  forbidden pair, including manual attempts to skip states); audit row with system actor per automatic transition;
  authz on any manual use case (manager allowed to reschedule, member refused). Seam 2 — none; public status visible
  in the existing smoke spec. Axe: unchanged public pages re-run.
- **File-conflict hotspots:** `src/server/db/schema/competitions.ts` + competitions use cases (shared with #70, #72,
  #80), job registry (#61; shared with #69, #80), public competition pages, `status-chip.tsx`.
- **Tournament:** YES, 2 contenders: angle (a) vs (b) above. Judge on: correctness under edits/clock jumps,
  reuse ergonomics for #84/#88/#90, test clarity.

### #72 (ordinal 17) — M1: Competition fees, award schemes and attached consent documents
- **Depends-on:** native #70, #64 (alt: #70 + one other; #64's body says "(17) builds on this"). **Blocks:** #77, and
  #82 or a later award-scheme consumer (#95/#97/#99).
- **AFK class:** B.
- **Human residue:** R-LEGALCOPY (competition terms and consent document texts from counsel/FOA; seeds use clearly
  marked sample text, never placeholders in production per `assertNoPlaceholdersInProduction`); R-FOA (fee amounts per
  competition are FOA data entry; award-scheme defaults confirmed).
- **Ports/providers:** none. Money helper (bigint paise ↔ display via `getFormatter()` `inr` format in
  `src/i18n/formats.ts`); reuse/replace `feeDisplay` in `src/content/sample/selectors.ts`.
- **DB:** `competition_fee` (competition_id, route enum individual|institution, `amount_minor` bigint ≥ 0, `currency`
  char(3) check = 'INR'; unique competition+route) or `is_free` on competition; `competition_award_scheme`
  (competition_id, round_key, scheme enum `award_scheme` grades_ab|medals_gsb|ranked_123 default ranked_123, prize
  text per award) — rounds do not exist until #95, so key by a planned-round key (e.g. school, foa_final);
  `competition_consent_document` (competition_id, purpose, consent_document_id, version pinned, attached_by, attached_at).
- **Routes/pages:** admin sections under `/admin/competitions/[id]/` (`fees`, `awards`, `documents`, or tabs on edit);
  public detail shows fees, prizes, links to the exact attached version (needs a versioned public document route, e.g.
  `/documents/[purpose]/v/[version]`, if #64 only renders the current version — check on trunk).
- **Messages namespaces:** `adminCompetitions`, `competitions`.
- **Size:** L — three sub-features, pinned-version semantics, public page additions, money formatting.
- **Design uncertainty:** 3 — per-round award schemes before rounds exist; one document per purpose vs one document
  with clauses (must match #82's purposes); re-attach UX.
- **Risk flags:** money (fee storage), minors/safeguarding (consent documents for minors), CSP (public page only if
  rendering changes).
- **Test plan:** Seam 1 — set fee per route; mark free; bigint round-trip incl. values > 2^31 paise; non-INR refused;
  default award scheme per round = ranked_123; attach doc v1 → publish v2 in Consent → competition still on v1 →
  re-attach → v2; audit row on every change; authz: competition manager allowed, content manager + member refused;
  public read model shows fees/prizes/doc links for published competitions only. Seam 2 — none. Axe pages: the admin
  fee/award/document screens, public detail page.
- **File-conflict hotspots:** competitions schema + admin edit page (shared with #70, #71, #80), public detail page,
  consent module read API (#64; shared with #82, #83), `src/i18n/formats.ts`.
- **Tournament:** YES, 2 contenders (uncertainty 3; money flag + L). Angles: (a) round-keyed award schemes + one doc per
  purpose; (b) competition-level scheme list with per-round override + clause-structured documents.

### #73 (ordinal 18) — M1: Institution registration and verification, Institution ID
- **Depends-on:** native #59, #69 (alt #60, #69). Extra: #58 (encrypted column type), #60 (FOA admin is staff).
  **Blocks:** #74 + 1 later (candidate #121 clubs).
- **AFK class:** A. **Human residue:** shared R-RET only; optional R-FOA (verification checklist; default = free-text reason).
- **Ports/providers:** none new; introduces the **codes module** (Crockford base32 without I, L, O, U; crypto-random;
  32 symbols so `byte & 31` is unbiased; bounded retry on unique violation 23505) with an injectable random source so
  collision retry is testable. Later formats (#75 `{comp}-I-{5}`, #77 `{comp}-R-{6}`, #78 `FOA-P-{YY}{6}`) reuse it.
- **DB:** `institution` (name, type enum, address (not PD: institution's own), pin_code, city, state, country,
  contact email/phone, principal_name, principal_email + principal_phone ENCRYPTED, expected_participants,
  `status` enum `institution_status` pending_verification|verified|rejected|suspended, status_reason,
  `institution_code` unique nullable (set on verify), created_by, verified_by/at); scoped `user_role`
  institution_admin granted on verify (#59). Creates the data inventory note (finding 0.2.2).
- **Routes/pages:** `/institutions/register`, `/institution` (authorised person's status page), `/admin/institutions`
  (queue with status filter), `/admin/institutions/[id]` (verify/reject/suspend with reason).
- **Messages namespaces:** `institutions`, `adminInstitutions`.
- **Size:** L — module + code generator + state machine + admin queue + outcome messages + inventory.
- **Design uncertainty:** 2 — clear; open: may a rejected institution resubmit; is suspended → verified allowed.
- **Risk flags:** auth/security (role grant on verify), personal data, encryption.
- **Test plan:** Seam 1 — register → pending; staff admin verifies with reason → verified, code matches
  `^FOA-I-[0-9A-HJKMNP-TV-Z]{5}$`, institution_admin role scoped to this institution, message to the authorised person
  (drain → email fake + inbox), audit row; reject/suspend need a non-empty reason; full transition table; code
  generator: format, alphabet, collision retry with a seeded source that repeats once, gives up after N; raw SQL shows
  ciphertext for principal phone/email; authz: member may register, only staff admin verifies, member/coordinator
  refused. Seam 2 — none. Axe pages: the 4 pages above.
- **File-conflict hotspots:** `src/server/codes/**` (new), `src/server/db/schema/institutions.ts` (shared with #74, #75,
  #83), data inventory file (new), event→message map seed (#69), `can()` policy, routes/messages registries.
- **Tournament:** YES by rule (auth + encryption, L) — rule-triggered, low yield; 2 contenders: (a) minimal module,
  status column + transition map; (b) deep module with explicit state-machine object shared as the template for
  later machines.

### #74 (ordinal 19) — M1: Institution coordinators
- **Depends-on:** native #73. Extra: #58 (phone invites, encrypted identifier). **Blocks:** #75 + 1 later (candidate #87).
- **AFK class:** A. **Human residue:** shared R-RET; phone invites inherit R-DLT (email works meanwhile).
- **Ports/providers:** email/SMS via #69 `notify` (invitation message).
- **DB:** `institution_invitation` (institution_id, invited_by, identifier encrypted + keyed hash, channel, token_hash
  unique, expires_at, accepted_at, accepted_by, revoked_at, status enum `invitation_status`
  pending|accepted|expired|revoked); `institution_member` (institution_id, user_id, member_role enum
  authorised_person|coordinator, added_at, removed_at) or reuse scoped `user_role` (decide once; prefer roles as the
  source of truth with member rows only for display).
- **Routes/pages:** `/institution/coordinators` (list, invite, remove), `/invitations/[token]` (accept; sign-in/sign-up
  redirect and return).
- **Messages namespaces:** `institutions` (extend) or `coordinators`.
- **Size:** L — invite, accept-with-sign-in round trip, list/remove, expiry, revocation, scoped isolation, audit.
- **Design uncertainty:** 2 — open: must the accepting account's verified email/phone equal the invited identifier
  (recommended yes) or is token possession enough.
- **Risk flags:** auth/security (role grant via token; cross-institution isolation), personal data.
- **Test plan:** Seam 1 — authorised person invites → accept → coordinator role scoped to that institution only;
  coordinator of A cannot read or act on B (any institution-scoped use case refused); removal revokes immediately (next
  call refused) + audit row; invitation expiry (fake clock) and second accept refused; unverified institution cannot
  invite; mismatched identifier refused (if adopted); authz: coordinator cannot invite, member refused. Seam 2 — none.
  Axe pages: `/institution/coordinators`, `/invitations/[token]` (both states).
- **File-conflict hotspots:** institutions schema/module (#73, #75), `can()` policy (institution scope rules),
  invitation-token helper (reuse later in #83 and #81 teen links: make it generic).
- **Tournament:** YES by rule (auth, L) — rule-triggered, low yield; 2 contenders: (a) identifier-bound acceptance;
  (b) token-possession + OTP re-verification.

### #75 (ordinal 20) — M1: Register an institution for a competition and enrol students
- **Depends-on:** native #74, #71. Extra: #58 (encrypted DOB/phone/address), #69 (principal message; already in the
  closure via #73 — keep explicit). **Blocks:** #76, #77, #83 + 2 later (candidates #85/#87/#89).
- **AFK class:** A. **Human residue:** shared R-RET; counsel question "school as joint data fiduciary" is non-blocking (R-DPDP).
- **Ports/providers:** codes module (`{comp}-I-{5}`), `notify`, clock.
- **DB:** `institution_registration` (institution_id, competition_id, reference unique, status enum, registered_by;
  unique institution+competition); `participant_profile` (owner_kind institution|self|guardian, managing
  institution_id, first_name, last_name, `dob` ENCRYPTED, class/grade, guardian name/relationship/phone/email
  ENCRYPTED, address ENCRYPTED, `identity_hash` keyed HMAC for dedupe (finding 0.2.4), optional `student_ref` unique
  per institution, created_by); `registration` (participant_profile_id, competition_id, route enum, institution_
  registration_id, age_group_id, category/discipline choice, `status` enum `registration_status` (enrolled here),
  registration_number nullable). DOB stored, never age; the age group is a derived classification.
- **Routes/pages:** `/institution/competitions` (open competitions, register), `/institution/registrations/[ref]`
  (coordinator dashboard: students + status), `/institution/registrations/[ref]/students/new`.
- **Messages namespaces:** `coordinator` (new), `registration` (status labels shared with #77/#78/#81).
- **Size:** XL — two flows (institution registration with window + reference + principal message; student enrolment
  with encrypted fields, age computation, dashboard) and the shared-entity design.
- **Design uncertainty:** 3 — participant-profile ownership model for #78/#81 (finding 0.2.3); registration status set
  shared across routes; age rules (age on cut-off date, inclusive bounds, overlapping groups); "the other fields the
  brief lists" (read `git show 8d06f2e:specifications/FoA.md`; SPEC.md §6.5.2 column table).
- **Risk flags:** minors/safeguarding (students are mostly minors; guardian contacts), personal data, encryption.
- **Test plan:** Seam 1 — register in window → reference `^[A-Z]{3,6}\d{2}-I-[0-9A-HJKMNP-TV-Z]{5}$`; second
  registration refused; before open and after close refused (status from #71 via fake clock); principal message
  (drain → email fake); add student → right age group per cut-off (fixtures: birthday on cut-off day, day before, day
  after); outside every group refused with a clear reason; raw SQL shows ciphertext for DOB/phones/addresses; dashboard
  read model lists students + status; registration transition table; audit row per new student; authz: coordinator of
  the institution allowed, coordinator of another institution + member refused. Seam 2 — none. Axe pages: the 3 pages.
- **File-conflict hotspots:** `src/server/db/schema/registration.ts` (+ participant profile; shared with #76–#83),
  coordinator dashboard (shared with #76, #77, #83), codes module, data inventory, event map seed.
- **Split proposal (XL → 2):** 75a "Institution registers for a competition" (reference, window, principal message,
  institution-registration statuses, `/institution/competitions`) (M). 75b "Enrol students: participant profile,
  registration, age category, encrypted fields, dashboard" (L; blocked by 75a). #76 and #83 depend on 75b; #77 on both.
- **Tournament:** YES on 75b (uncertainty 3, minors + encryption, L), 2 contenders: (a) single `participant_profile`
  table with owner_kind; (b) profile core + per-route ownership link tables. 75a single implementation.

### #76 (ordinal 21) — M1: Import students from CSV with a per-row error report
- **Depends-on:** native #75 (75b if split). **Blocks:** none.
- **AFK class:** A. **Human residue:** none (no new PD fields if columns = #75's).
- **Ports/providers:** none (parse in the server action; do not persist the upload, or persist as a private FileAsset
  with retention if a preview step is added). CSV parser: hand-rolled RFC 4180 or a pure-JS dependency added to
  `pnpm-lock.yaml` (no install scripts, so no `allowBuilds` change).
- **DB:** optional `student_import` (institution_registration_id, uploaded_by, total, enrolled, failed, created_at) to
  serve the error report download; else regenerate the report in the response.
- **Routes/pages:** `/institution/registrations/[ref]/import` (upload + result), route handlers
  `.../import/template.csv` and `.../import/[importId]/errors.csv` (private, no-store, `can()` checked).
- **Messages namespaces:** `coordinator` (extend: `csvImport`).
- **Size:** M — reuses #75's single-student validator; adds parsing, in-file + existing dedupe, report, template.
- **Design uncertainty:** 2 — limits (prior art: UTF-8 with BOM tolerated, ≤ 1000 rows, ≤ 2 MB, day-first slashed
  dates) and atomicity ("nothing half-imports a row": one transaction per row or per batch of valid rows).
- **Risk flags:** personal data (bulk minors' PII), security (CSV formula injection in the downloadable report: prefix
  cells starting with `= + - @` and tab/CR; upload size/type limits).
- **Test plan:** Seam 1 — 30-row clean file → 30 enrolled, one counts audit row `{total:30, enrolled:30, failed:0}` +
  per-student audit rows; mixed file → good rows enrolled, report names each bad row number + reason; duplicates in
  file and against enrolled students reported, never added; re-upload of fixed rows enrols only those; wrong headers,
  > row limit, > size refused; formula-injection cells neutralised in the report; authz: coordinator allowed, other
  institution's coordinator + member refused. Seed: `fixtures/students-sample.csv` (good + bad rows) and a clean
  30-row fixture reused by #77's journey. Seam 2 — none. Axe pages: import page (empty, success, partial states).
- **File-conflict hotspots:** coordinator dashboard (link), #75's validator module, `coordinator.json`.
- **Tournament:** NO (M, uncertainty 2).

### #77 (ordinal 22) — M1: Bulk fee payment for an institution
- **Depends-on:** native #75, #72. Extra: #65 (CSP allowances for Razorpay Checkout on the signed-in payment page);
  the Seam 2 child also needs #76 (30-row CSV). **Blocks:** #78, #79 (count 2, exact).
- **AFK class:** B.
- **Human residue:** R-RAZORPAY (owner: Razorpay account in test mode; `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET` in Vercel Preview + Staging env; webhook URL `https://shipped-it.dev/api/webhooks/razorpay`
  with payment/order/refund events; live mode later needs FOA KYC — #18). Wizard-walkable. R-RZP-E2E (re-run the M1
  journey on a preview once keys exist).
- **Ports/providers:** payment-gateway port (`createOrder`, `verifyCheckoutSignature`, `verifyWebhook`, `fetchOrder
  Payments`, `refund` stub for #80); Seam 1 fake + webhook simulator (valid/invalid signatures, replays); Razorpay
  adapter via `fetch` (no SDK); non-production fallback adapter when keys are absent (hosted fake checkout so previews
  work before R-RAZORPAY; production fails closed at boot if keys are missing).
- **DB:** `payment_batch` (payer_user_id, institution_registration_id nullable, route, `status` enum
  `payment_batch_status` created|order_created|captured|failed|cancelled, amount_minor bigint, currency, gateway,
  gateway_order_id unique, gateway_payment_id, captured_at); `payment_batch_item` (batch_id, registration_id,
  amount_minor); partial unique index "a registration is in at most one non-terminal batch" (hand-written SQL);
  `gateway_webhook_event` (provider, event_id unique, received_at, signature_valid, processed_at); `registration`:
  status pending_payment|confirmed, `registration_number` unique `{comp}-R-{6}`.
- **Routes/pages:** `/institution/registrations/[ref]/pay` (summary + Checkout island),
  `/institution/registrations/[ref]/payments/[batchId]` (status/receipt), `POST /api/webhooks/razorpay` (raw-body
  signature check, no session), checkout-callback server action.
- **Messages namespaces:** `payments` (new).
- **Size:** XL — port + fake + simulator + adapter + Checkout UI under strict CSP + webhook route + two state machines +
  messages + the milestone's Seam 2 journey.
- **Design uncertainty:** 4 — confirmation path on previews (finding 0.2.5); Checkout script/frames under the nonce CSP;
  automating Razorpay test Checkout in Playwright (popup/iframe) vs the fallback adapter; concurrency of two payers;
  "payment receipt message" vs FY-sequential receipt numbers (`FOA-RCPT-{FY}-{000000}` belongs to donations #106 —
  do not introduce numbering here unless hardening decides otherwise).
- **Risk flags:** money, auth/security (webhook signatures, idempotency), CSP (third-party script/frame on signed-in
  pages), personal data (payer, family contacts), infra (Vercel env vars).
- **Test plan:** Seam 1 — batch of N → one fake order for Σ item amounts; valid capture → all N confirmed, unique
  registration numbers `^[A-Z]{3,6}\d{2}-R-[0-9A-HJKMNP-TV-Z]{6}$`; replayed event → no change (rows, audit,
  messages identical); bad signature → rejected, nothing changes; free competition → confirmed without an order;
  confirmation + receipt messages written to the outbox in the capture transaction (drain → coordinator + each
  family); payment-batch and registration transition tables; concurrent second batch over the same registrations
  refused; authz: the institution's coordinator pays, other coordinator + member refused; webhook route acts as system.
  Seam 2 — M1 journey: institution registers → staff verifies (seed staff TOTP secret) → registers for a seeded open
  competition → imports the 30-row CSV → pays in bulk → sees 30 confirmed with registration numbers; Razorpay test mode
  when keys exist, fallback adapter otherwise (record which in the PR). Axe pages: pay page, payment status page.
- **File-conflict hotspots:** `src/server/db/schema/payments.ts` (new; #78–#80), `registration_status` enum (#75, #78,
  #80, #81), coordinator dashboard, CSP config (`src/proxy.ts` / `src/lib/security-headers.ts`; #65), `src/env.schema.ts`
  + `.env.example`, `tests/e2e/`.
- **Split proposal (XL → 3):** 77a "Payments core: port, fake + webhook simulator, batch/registration machines, order
  per batch, idempotent capture, registration numbers, free confirm, outbox messages" (L; Seam 1 only). 77b "Razorpay
  adapter, Checkout island + CSP allowances, webhook route, non-prod fallback adapter" (L; blocked by 77a; B residue).
  77c "M1 Seam 2 journey" (M; blocked by 77b and #76; B residue R-RZP-E2E). #78/#79 depend on 77a.
- **Tournament:** YES, 3 contenders on 77a (money + security, uncertainty 4): (a) simplest-thing (batch row + status
  column, capture in one transaction); (b) deep-module-first (Payments module with explicit machines and a ledger-ready
  money-event outbox stream for #105); (c) risk-first (event-sourced gateway events table + idempotency keys
  everywhere). 77b: 2 contenders (checkout-signature-first vs order-polling-first). 77c: NO.

### #78 (ordinal 23) — M1: Individual adult registration and payment, participant dashboard
- **Depends-on:** native #77 (77a). Extra: #58 (encrypted DOB/phone). Technical, already in closure: #71 (open
  status), #72 (individual fee, attached consents), #75 (registration module, profile). **Blocks:** #81 + 2 later
  (candidates #85, #106).
- **AFK class:** A. **Human residue:** shared R-RET (copy of the "enter through your school" note is agent-written;
  prior art SPEC.md §6.5.3 wording).
- **Ports/providers:** payment-gateway port (batch of one), codes module (`FOA-P-{YY}{6}`, YY = issue year in IST).
- **DB:** `participant_profile` owner_kind self (owner_user_id, `participant_code` unique, pin_code, city, state,
  country, optional school_name, phone + DOB ENCRYPTED); `registration` route individual; consent records for the
  competition's attached documents (#72) with method `account_checkbox` (or the method enum #64 defines).
- **Routes/pages:** `/participate` (route chooser: school card recommended first, "Participate as an Individual"),
  `/competitions/[slug]/register` (individual form), `/participant` (dashboard), `/participant/registrations/[id]/pay`.
- **Messages namespaces:** `participant` (new), `registration`, `payments`.
- **Size:** L — form + profile + code + batch-of-one reuse + dashboard + minor refusal + consent capture.
- **Design uncertainty:** 2 — age-at-what-date for the under-18 refusal (registration instant in IST vs competition
  cut-off; recommend registration instant); which consents are required at registration.
- **Risk flags:** money, personal data, encryption, minors/safeguarding (correct refusal of under-18s).
- **Test plan:** Seam 1 — adult registers for an open competition accepting individuals → Participant ID
  `^FOA-P-\d{2}[0-9A-HJKMNP-TV-Z]{6}$`; institutions-only or closed competition refused; batch of one at the
  individual fee; capture → confirmed + registration number; registration number used as a sign-in identifier refused;
  DOB under 18 refused with the come-back pointer; dashboard lists registrations + status; consents recorded against
  the attached versions; authz: member registers self, cannot read another participant's dashboard. Seam 2 — none.
  Axe pages: `/participate`, register form, `/participant`, pay page.
- **File-conflict hotspots:** participant profile + registration schema (#75, #81), payments module (#77, #79),
  `src/lib/routes.ts`, header nav (participant dashboard link), `/competitions/[slug]` (register CTA; #70–#72).
- **Tournament:** YES by rule (money + encryption, L) — rule-triggered, low yield; 2 contenders: (a) dedicated
  individual flow; (b) shared registration wizard parameterised by route (future guardian flow in #81).

### #79 (ordinal 24) — M1: Offline payments and payments needing review
- **Depends-on:** native #77 (77a). Extra: #63 (private proof file), #60 (finance/staff gate). **Blocks:** #80.
- **AFK class:** A. **Human residue:** none (proof file and reference added to the inventory under shared R-RET).
- **Ports/providers:** Files module (#63: presigned private upload, scan gate, signed delivery); gateway port (no refund).
- **DB:** `offline_payment` (batch_id, method enum cheque|bank_transfer|cash, reference, proof_file_asset_id,
  amount_minor, received_at, recorded_by); `payment_batch_status` + `captured_offline` (or a `capture_method` column)
  + `needs_review`; `payment_review_case` (batch_id, reason enum registration_closed|registration_cancelled|
  already_paid, gateway_payment_id, opened_at, resolved_at, resolved_by, resolution, resolution_reason text not null).
- **Routes/pages:** `/admin/payments/batches/[id]` (record offline payment), `/admin/payments/review`,
  `/admin/payments/review/[id]` (resolve with reason).
- **Messages namespaces:** `adminPayments` (new; shared with #80).
- **Size:** L — offline capture through the same confirm path, file proof, review detection inside the capture handler,
  list + resolve UI, machine extension.
- **Design uncertainty:** 2 — resolution outcomes are undefined (kept / refund via #80 duplicate path / confirm anyway);
  amount mismatch handling.
- **Risk flags:** money, auth/security (finance/staff only), personal data (proof documents).
- **Test plan:** Seam 1 — finance records offline payment with proof → batch captured, registrations confirmed with
  numbers, audit row; staff admin allowed; coordinator, competition manager, member refused; capture for a closed,
  cancelled or already-paid registration → batch needs_review and the gateway fake shows 0 refunds; case listed;
  resolve with reason → recorded + audit; empty reason refused; extended batch transition table; proof file deliverable
  only to finance/staff (signed URL via #63). Seam 2 — none. Axe pages: the 3 admin pages.
- **File-conflict hotspots:** payments schema/capture handler (#77, #80), `payment_batch_status` enum, admin payments
  pages (#80), data inventory.
- **Tournament:** YES by rule (money, L) — rule-triggered, low yield; 2 contenders: (a) status-column extension;
  (b) separate capture-method + review-case aggregate.

### #80 (ordinal 25) — M1: Refunds approved by finance; cancelling a competition refunds everyone
- **Depends-on:** native #79 + #60 (alt #79 + #71). Extra: the other of #60/#71 (step-up and competition status are
  both required). **Blocks:** 2 later (candidates #105 ledger reversal, #109 or #133).
- **AFK class:** A. **Human residue:** R-FOA (confirm the default refund policy); Razorpay test refunds ride on
  R-RAZORPAY.
- **Ports/providers:** gateway port `refund(paymentId, amountMinor, idempotencyKey)` + webhook `refund.processed` /
  `refund.failed` (verify event names at runtime); step-up (#60); `notify`; job registry for mass refunds.
- **DB:** `refund` (batch_id, kind enum discretionary|cancellation|duplicate, `status` enum `refund_status`
  requested|approved|rejected|processing|refunded|failed, amount_minor, reason, requested_by, approved_by/at,
  gateway_refund_id, idempotency_key unique); `refund_item` (refund_id, batch_item_id, amount_minor);
  `registration_status` + refunded; `competition_status` + cancelled (with forbidden transitions from terminal states).
  Offline-paid batches cannot refund through the gateway: record a manual refund (method + reference) — design gap to
  settle in hardening.
- **Routes/pages:** `/admin/payments/batches/[id]/refund` (request, item picker), `/admin/refunds` (finance queue),
  `/admin/refunds/[id]` (approve/reject with step-up), `/admin/competitions/[id]/cancel` (confirm + step-up).
- **Messages namespaces:** `adminPayments`, `adminCompetitions`.
- **Size:** XL — request/approval with step-up, partial refunds, gateway refunds + webhooks, refund machine, automatic
  cancellation refunds as jobs with retries, mass notification, duplicate path, audit.
- **Design uncertainty:** 3 — policy says no refunds after confirmation except cancellation/duplicates, yet requests
  exist ("discretionary refunds need finance approval", spec Product rules): requests allowed with reason, approval
  mandatory; requester ≠ approver; cancel semantics (allowed until results publish?); partial failure of mass refunds.
- **Risk flags:** money, auth/security (step-up, separation of duties).
- **Test plan:** Seam 1 — request → requested; approval without fresh step-up refused; with step-up (fake clock inside
  the window) → gateway fake refund for the exact amount, registrations refunded, audit rows for request, approval,
  refund; reject path; partial refund touches only listed items, others stay confirmed; competition manager requests,
  coordinator + member refused; finance approves, competition manager refused; same person cannot request and approve;
  cancel competition → drain → every captured batch refunded and every registrant messaged (email fake count = N);
  duplicate resolution refunds without approval; other kinds cannot skip approval; refund webhook replay is a no-op;
  refund transition table; competition cancelled transitions added to #71's table. Seam 2 — none. Axe pages: the 4 pages.
- **File-conflict hotspots:** payments module (#77, #79), competition status machine + admin competition page (#70–#72),
  `registration_status` enum (#81 concurrently adds pending_guardian), job registry, `can()` policy.
- **Split proposal (XL → 2):** 80a "Refund requests, finance approval with step-up, partial refunds, gateway refund +
  webhook, duplicate auto-refund" (L). 80b "Cancel a competition: cancelled status, stop scheduled jobs, automatic
  refunds of every capture, notify registrants" (M–L; blocked by 80a).
- **Tournament:** YES, 3 contenders on 80a (money + auth, uncertainty 3): simplest-thing / deep-module-first /
  risk-first (idempotency + reconciliation job first). 80b: 2 contenders only if hardening scores ≥ 3.

### #81 (ordinal 26) — M1: Guardians and minors
- **Depends-on:** native #78 + #69 (alt #78 + #59). Extra: #58 (phone OTP, encrypted column). Technical, in closure:
  #57 (OTP), #59 (guardian role, links), #75 (profile model). **Blocks:** #82 + 3 later (candidates #84, #85, #123).
- **AFK class:** B.
- **Human residue:** R-DPDP (counsel: guardian OTP + self-declared relationship as verifiable parental consent;
  minimum own-login age 13); R-SAFEGUARD (FOA safeguarding sign-off of the guardian/teen account flows before the
  release PR merges); shared R-RET.
- **Ports/providers:** email/SMS OTP (direct send, not the queue, spec ruling), `notify` audience resolver extended
  ("messages about a minor reach the guardian's channels"), invitation-token helper from #74 for teen links.
- **DB:** `guardian` (user_id, full_name + phone + email ENCRYPTED, verified_at, verification_method);
  `guardian_link` (guardian_id, participant_profile_id, relationship enum, created_at, revoked_at);
  `participant_profile` owner_kind guardian, `user_id` null for under-13, set for 13–17 linked login;
  `registration_status` + pending_guardian (→ pending_payment once the guardian is verified, and with #82 once
  participation consent exists).
- **Routes/pages:** `/guardian/register` (verify by OTP, declare relationship), `/guardian` (children),
  `/guardian/children/new`, `/guardian/children/[id]` (profile; invite a 13–17 login), teen accept page
  (`/invitations/[token]` variant), guardian-initiated individual registration entry (reuse #78's form).
- **Messages namespaces:** `guardian` (new).
- **Size:** XL — identity extension, two child kinds, teen login linking, pending state, message routing, encrypted
  details, #78's age rule relaxed, seed, inventory.
- **Design uncertainty:** 4 — teen account creation and linking (guardian invites vs teen self-signs-up then links);
  who registers a minor; birthdays crossing 13/18; one child appearing on both routes (school-managed profile and
  guardian profile → duplicates; prior art: verified guardian "claims" the school profile, SPEC.md §6.5.1, §12.5).
- **Risk flags:** minors/safeguarding, auth/security (minor accounts), personal data, encryption.
- **Test plan:** Seam 1 — guardian signs up, verifies by OTP code read from the email/SMS fake, declares relationship,
  adds a 9-year-old and a 15-year-old; the under-13 profile has no user/identifier (no sign-in possible); the
  15-year-old signs in with an own OTP login linked to the guardian; minor's individual registration stays
  pending_guardian and pay/confirm is refused until the guardian verifies; a message about the minor lands at the
  guardian's address, not the child's; raw SQL shows ciphertext for guardian details; registration transition table
  extended; authz: guardian manages own children, another guardian refused, teen cannot add siblings. Seam 2 — none.
  Axe pages: the 5 guardian pages + teen accept.
- **File-conflict hotspots:** identity/auth config (Better Auth hooks; M0 code), participant profile + registration
  schema (#75, #78, #82, #83), #69's audience resolver, `can()` policy, header nav, data inventory.
- **Split proposal (XL → 2):** 81a "Guardian sign-up/verification, children (under-13 managed, 13–17 linked login),
  encrypted details, inventory" (L). 81b "Minor individual registration pending until the guardian verifies; age rule
  in #78 relaxed; messages about a minor routed to the guardian" (L; blocked by 81a). #82 depends on 81b.
- **Tournament:** YES, 3 contenders on 81a (minors + auth, uncertainty 4): guardian-invites-teen / teen-signs-up-then-
  links / unified "household" aggregate. 81b: 2 contenders.

### #82 (ordinal 27) — M1: Separate guardian consent for each purpose; public credit defaults to first name plus initial
- **Depends-on:** native #81 + #72 (alt #81 + #64). Extra: the other of #64/#72 (records point at the competition's
  attached version, #72, inside the Consent module, #64). **Blocks:** #83 + 2 later (candidates #103 gallery, #104
  social / #131 auction).
- **AFK class:** B.
- **Human residue:** R-LEGALCOPY (text of each purpose's consent document); R-DPDP; R-FOA (whether auction consent is
  offered for minors at all; creator share stated in the form).
- **Ports/providers:** Consent module (#64), outbox (`consent.withdrawn` event consumed later by #103, #104, #126, #131).
- **DB:** extend #64's `consent` with subject_participant_profile_id, competition_id (null for global purposes such as
  communications), giver_user_id, method; extend `consent_purpose` enum: participation, public_display,
  display_school, display_city (field-by-field opt-in), social_media, auction, communications. Public credit is
  derived (pure resolver), not stored.
- **Routes/pages:** `/guardian/children/[id]/consents` (per competition, per purpose give/withdraw),
  `/guardian/children/[id]/consents/history`.
- **Messages namespaces:** `guardian` (extend) and/or `consent` (#64's).
- **Size:** L — per-purpose records, withdrawal events, credit resolver, history, confirmation guard in the
  registration machine.
- **Design uncertainty:** 3 — document-per-purpose vs clauses (must match #72); per-competition vs global scope per
  purpose; credit resolver for non-Latin names (first grapheme as initial) and where it lives (shared read-model helper
  for #100/#103/#131).
- **Risk flags:** minors/safeguarding, personal data (public exposure of minors), legal consent semantics.
- **Test plan:** Seam 1 — give and withdraw each purpose independently; record stores document version (the
  competition's attached one), giver, subject, time (fake clock), method; withdrawal writes an outbox
  `consent.withdrawn` event (drain → observed); credit resolver: default "Asha K.", + school only with display_school,
  + city only with display_city, Devanagari name fixture; history per child in order; minor registration cannot be
  confirmed without participation consent, can after; authz: the child's guardian allowed, another guardian refused,
  teen cannot give guardian consents. Seam 2 — none. Axe pages: consents page, history page.
- **File-conflict hotspots:** consent schema/enums (#64, #72, #83), registration confirm guard (#77, #81), shared
  credit helper location.
- **Tournament:** YES, 3 contenders (minors high risk, uncertainty 3): simplest-thing (rows per purpose) / deep-module
  (Consent module exposes `canUse(subject, purpose, context)` + credit resolver as its only read API) / risk-first
  (append-only consent events with derived current state).

### #83 (ordinal 28) — M1: Coordinators collect guardian consent by code link or signed forms
- **Depends-on:** native #82, #75 (alt #74), #63. Extra: #60 (FOA admin review screens), #65 (CSP on the public
  tokenized page), #69 (link message). **Blocks:** none.
- **AFK class:** B.
- **Human residue:** R-DPDP (school-collected contact + code link as verifiable consent); R-LEGALCOPY (printable signed
  consent form template); R-DLT (SMS bodies containing URLs must be DLT-whitelisted; email works meanwhile); R-FOA
  (who reviews signed forms; turnaround).
- **Ports/providers:** `notify` (email/SMS link), OTP send (direct), Files module (#63, private upload + scan),
  invitation-token helper (#74).
- **DB:** `consent_link` (participant_profile_id, guardian contact keyed hash, token_hash unique, channel, sent_by,
  sent_at, expires_at, used_at); `consent_form_submission` (participant_profile_id, file_asset_id, uploaded_by,
  `status` enum pending_review|accepted|rejected, reviewed_by/at, review_reason, purposes covered); `consent` method
  enum + code_link, signed_form; giver may be a guardian contact without an account (giver_kind user|guardian_contact)
  + reviewer_id for forms.
- **Routes/pages:** `/institution/registrations/[ref]/consents` (state per student, send/resend link, upload form),
  `/consent/[token]` (public, no account: OTP step then per-purpose give/decline; `noindex`; nonce CSP),
  `/admin/consent-forms`, `/admin/consent-forms/[id]`.
- **Messages namespaces:** `guardianConsent` (public page), `coordinator` (extend), `adminConsentForms`.
- **Size:** XL — two flows, an unauthenticated tokenized page with OTP and rate limits, an admin review queue, file
  integration, dashboard state, seed.
- **Design uncertainty:** 3 — giver identity without an account; token-only vs token + OTP; which purposes a paper
  form covers (reviewer ticks purposes vs whole form); capture of the institution's participation/judging declaration
  (not explicit in any M1 ticket; recommend a declaration checkbox recorded at #75 registration).
- **Risk flags:** minors/safeguarding, auth/security (unauthenticated token flow, OTP abuse), personal data (signed
  forms), CSP (public dynamic page).
- **Test plan:** Seam 1 — coordinator sends a link → guardian (no account) opens the token → OTP to the contact on
  file (email fake) → gives public_display, declines social_media → records with method code_link, guardian giver,
  student subject; token reuse refused; expired token (fake clock) refused; OTP rate limits per identifier + IP;
  uploaded form → pending_review, counts for nothing; staff admin accepts → records method signed_form + reviewer;
  reject → no consent; public-use query false without guardian consent and true after (participation/judging always
  allowed by the declaration); dashboard state per student; authz: the institution's coordinator allowed, another
  coordinator refused, only staff admin reviews, a coordinator cannot accept a form. Seam 2 — none. Axe pages:
  consents dashboard, `/consent/[token]` (both steps + expired state), admin queue, admin detail.
- **File-conflict hotspots:** consent module (#64, #72, #82), coordinator dashboard (#75, #76, #77), `src/proxy.ts`
  (public dynamic route), data inventory, routes/messages registries.
- **Split proposal (XL → 2):** 83a "Code-link consent: send/resend, public tokenized page with OTP, per-purpose
  give/decline, expiry and single use, dashboard state" (L). 83b "Signed-form consent: private upload, FOA review queue,
  accept/reject with reviewer, public-use gating query" (L; independent of 83a except the dashboard column).
- **Tournament:** YES, 3 contenders on 83a (minors + auth + CSP): token+OTP / token-only with short expiry + contact
  confirmation / magic sign-in that creates a lightweight guardian account. 83b: 2 contenders.

## 3. Human residue for M1 (deduped; one `ready-for-human` + `factory:needs-human` child each)

| Id | Item | Owner | Tickets | Blocks merge? | Wizard |
|---|---|---|---|---|---|
| R-RAZORPAY | Razorpay test account; key id/secret + webhook secret in Vercel Preview + Staging; webhook URL on staging | owner (FOA KYC for live, #18) | #77 (77b, 77c), #78–#80 Seam 2 later | no (fallback adapter) | yes |
| R-RZP-E2E | Re-run M1 journey on a preview in Razorpay test mode after R-RAZORPAY | owner triggers, agent verifies | 77c | no | no |
| R-DLT | DLT template registration per SMS template (incl. URL whitelisting); fill `dlt_template_id` | FOA + owner | #69, #74, #83 (dedupe with #58) | no (SMS off) | partial |
| R-LEGALMSG | Counsel confirms the "required by law" message list | counsel | #69 | no | no |
| R-LEGALCOPY | Competition terms, per-purpose consent documents, printable signed form | counsel + FOA | #72, #82, #83 | no (sample text, prod blocked by placeholder guard) | no |
| R-DPDP | Verifiable parental consent sufficiency (OTP, code link, signed form); own-login age 13; school as joint fiduciary | counsel | #75, #81, #82, #83 | no | no |
| R-SAFEGUARD | Safeguarding sign-off of guardian/teen/minor flows | FOA DSL + owner | #81, #83 | release PR merge | no |
| R-RET | Confirm retention periods marked "to confirm" in the inventory | counsel | #73, #74, #75, #78, #79, #81, #83 | no | no |
| R-FOA | Fee amounts, refund policy, award defaults, verification checklist, auction consent for minors | FOA leadership | #72, #73, #80, #82 | no (defaults) | no |
| R-WORKER | Redeploy VPS workers from trunk/main so new job handlers run on staging/previews | owner | #69, #71, #80 | no (Seam 1 drains in-process) | yes |
| R-KEYS | Production encryption + PII hash keys (column key from #58; new `PII_HASH_KEY` from #75) | owner | #75, #76 (dedupe with #58) | no | yes |

## 4. File-conflict hotspots (serialize-on-conflict keys for M1)

| Key | Tickets touching it | Rule |
|---|---|---|
| `src/server/db/schema/competitions.ts` + competitions use cases + admin competition pages | #70, #71, #72, #80 | serialize (#70 → #71 → #72; #80b after) |
| `src/server/db/schema/institutions.ts` | #73, #74, #75a | chain already serial natively |
| `src/server/db/schema/registration.ts` (profile, registration, `registration_status`) | #75, #76, #77, #78, #79, #80, #81, #82, #83 | serialize enum edits; merge queue regenerates SQL |
| `src/server/db/schema/payments.ts` | #77, #78, #79, #80 | serialize (#77a → #78 → #79 → #80) |
| Consent schema/enums (#64's file) | #72, #82, #83 | serial natively (#72 → #82 → #83) |
| `drizzle/**`, `drizzle/meta/_journal.json` | all | merge queue regenerates (charter 9) |
| `src/server/db/schema/index.ts` barrel | #69, #70, #73, #75, #77, #81 | one export line each; merge queue |
| `can()` policy file (#59) | all | append rules; merge queue |
| event→message map seed (#69) | #73, #74, #75, #77, #80, #81, #83 | append rows; merge queue |
| data inventory (`src/server/privacy/inventory.ts`) | #73 (creates), #74, #75, #78, #79, #81, #83 | append; merge queue |
| `messages/en-IN/*.json` + `src/i18n/messages.ts` NAMESPACES | all | one namespace file per ticket-owned area; registry line merges in queue |
| `src/lib/routes.ts` | all with pages | append; merge queue |
| `src/components/site-header.tsx` (badge, dashboard links) | #69, #73, #78, #81 | serialize header edits |
| Seed command + builders (#57) | all | per-module seed files + one registry line |
| Coordinator dashboard `src/app/institution/registrations/[ref]/page.tsx` | #75, #76, #77, #83 | serialize (#76 before #77 when both ready) |
| `src/app/competitions/[slug]/page.tsx`, `src/content/sample/**`, showcase cards | #70, #71, #72, #78 | serialize |
| CSP config (`src/proxy.ts`, `src/lib/security-headers.ts`) | #77, #83 (+ #65 base) | serialize |
| `src/env.schema.ts`, `.env.example` | #75 (`PII_HASH_KEY`), #77 (Razorpay vars) | serialize |
| Job registry (#61) | #69, #71, #80 | serialize |
| `tests/e2e/**` | all (axe pages), #77c journey | append spec files; low conflict |

## 5. Milestone summary

### 5.1 Counts
- **By AFK class:** A = 9 (#70, #71, #73, #74, #75, #76, #78, #79, #80); B = 6 (#69, #72, #77, #81, #82, #83); C = 0.
- **By size:** S = 0; M = 1 (#76); L = 8 (#69, #71, #72, #73, #74, #78, #79, #82); XL = 6 (#70, #75, #77, #80, #81,
  #83). After the proposed splits: 15 tickets → 24 work units (70a/b, 75a/b, 77a/b/c, 80a/b, 81a/b, 83a/b).
- **Design uncertainty:** 4 = #77, #81; 3 = #69, #70, #71, #72, #75, #80, #82, #83; 2 = #73, #74, #76, #78, #79.
- **Tournaments recommended:** 14 of 15 tickets (all but #76). 3-contender: #77 (77a), #80 (80a), #81 (81a), #82,
  #83 (83a). Rule-triggered, low yield (uncertainty 2): #73, #74, #78, #79 — first candidates to downgrade to a
  design-only DESIGN-IT-TWICE pass if the budget tightens. Units without tournament: 70a, 75a, 76, 77c, 80b (unless
  hardening ≥ 3).
- **Risk-flag frequency:** money 5 (#72, #77, #78, #79, #80); minors/safeguarding 6 (#72, #75, #78, #81, #82, #83);
  auth/security 10 (#69, #70, #73, #74, #76, #77, #79, #80, #81, #83); encryption 5 (#73, #74, #75, #78, #81; #76 adds
  the keyed dedupe hash); CSP 4 (#70, #72, #77, #83); infra 4 (#69, #70, #71, #77); personal data 13 (all but #70, #71).

### 5.2 Internal ordering (rolling waves; native + extra blockers + hotspot serialization)
- Entry gate: #57–#64 merged into `factory/trunk`; #65 before #77b and #83a.
- Wave M1-1: #69 ∥ #70a (disjoint modules; registries resolve in the merge queue).
- Wave M1-2: #71 (after #70a) ∥ #73 (after #69) ∥ #70b (after #70a; touches public pages only — run after #71 if the
  hotspot rule is strict, since #71 also edits the public pages).
- Wave M1-3: #72 (after #71, serialized on competitions) ∥ #74 (after #73).
- Wave M1-4: #75a → #75b (after #74 + #71).
- Wave M1-5: #76 ∥ #77a (after #75b; #77a also #72). Merge #76 first (dashboard hotspot).
- Wave M1-6: #77b (after #77a, #65) ∥ #78 (after #77a).
- Wave M1-7: #79 (after #78, payments serialization) ∥ #81a (after #78) ∥ #77c (after #77b + #76).
- Wave M1-8: #80a (after #79) ∥ #81b (after #81a).
- Wave M1-9: #80b (after #80a) ∥ #82 (after #81b + #72).
- Wave M1-10: #83a ∥ #83b (after #82; disjoint except the dashboard column — serialize their dashboard edit).
- **Critical path (9 serial tickets):** #69 → #73 → #74 → #75 → #77 → #78 → #81 → #82 → #83 (the #70 → #71 → #72
  chain finishes inside it). Shortening levers: start #69 the moment #61/#62 merge; split #75 and #81 so 75a/81a start
  early; keep #79/#80 off the critical path.
- Release PR for M1 (`factory/trunk → main`) needs R-SAFEGUARD signed off (#81, #83) and lists `Closes #69` … `Closes #83`.

### 5.3 Cross-milestone dependencies
- **Into M1 (from M0):** native #59→#73, #60→#70, #60→#80, #61→#69, #61→#71, #63→#83, #64→#72 (inferred); technical
  extras #58 → #69/#73/#74/#75/#78/#81, #59/#60/#62/#64 → #69, #63 → #79, #65 → #77/#83, #57 everywhere (harness,
  seed). Hence the gate "all of #57–#64".
- **Out of M1 (24 edges to M2–M8 = 42 blocking − 18 internal; targets inferred):** #69 → 8 (every later message sender: candidates #84, #99, #100,
  #106, #120, #126, #132, #134); #71 → 3 (#84, #88, #90); #73 → 1 (#121); #74 → 1 (#87); #75 → 2 (#85/#87/#89);
  #78 → 2 (#85, #106); #80 → 2 (#105 + one); #81 → 3 (#84, #85, #123); #82 → 2 (#103 + #104 or #131). Verify with
  the `dependencies/blocking` endpoint before scheduling M2.
- **M2+ assumptions created here (document in M1 PR bodies):** `notify(tx, event)` API and audience resolver (#69);
  key-date scheduling pattern (#71); award-scheme keying by planned round until #95 creates rounds (#72); codes module
  (#73); participant profile ownership + `registration_status` (#75); payment money-event stream ready for ledger
  postings and backfill (#77 → #105); `consent.withdrawn` event + `canUse`/credit resolver (#82 → #103, #104, #131);
  public-use gating for school-route students (#83 → #103, #104, #131).
