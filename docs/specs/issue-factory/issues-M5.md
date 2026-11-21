# M5 ticket analysis: #105 to #118 (milestone M5: finance, CMS, privacy, admin, analytics)

Inputs: `research/open-M5.json` (14 tickets, 0 comments each), `research/spec-55.md` (#55 body; #55's only comment is the
owner's Gotenberg 9.x ruling, read via GitHub MCP `issue_read get_comments`), `research/raw-closed.json` (#15 = unruled
recommendations, never rulings; #18 = tax-status note), `research/issues-M0.md` (Seam 1 harness contract section 3,
#59-#65 designs), `research/issues-M1.md` (#69, #77-#81 designs, R-codes), `research/issues-M2.md` (F2 enum rule, F4
sanitiser, F13 contact-only recipients, H22-H33, G6-G7), `research/issues-M6-M8.md` (H1-H21, G1-G5), `research/code-{app,
infra,server,ui}.md`, dependency counts from `gh api -X GET search/issues` (`issue_dependencies_summary`, 2026-11-19), the
repo at `/home/user/friends-of-animals` (HEAD `3da7347`, read-only: `src/lib/site.ts`, `src/app/_components/home-layout.ts`,
`src/content/{sample,legal}/*`, `src/app/{donate,impact,contact}/page.tsx`, `messages/en-IN/{impact,donate,contact}.json`,
`node_modules/next/dist/docs/01-app/**`), prior art `git show 8d06f2e:specifications/SPEC.md` §8.4-8.8, §9.4, §11.6-11.8,
§12.9-12.12 (non-binding; ticket + #55 win; its ledger is SINGLE-entry and must not be copied, #105 requires double-entry),
Umami docs via Context7 `/websites/umami_is` (tracker attributes `data-host-url`, `data-domains`, `data-do-not-track`,
`data-before-send`; env `COLLECT_API_ENDPOINT`). Analysed 2026-11-19.

Legend. AFK class: **A** every AC closable by an agent against fakes/ports (residue = non-blocking defaults/copy);
**B** agent core plus human residue that gates an AC or the Seam 2 journey; **C** mostly human. Size in agent effort:
S < 1 h, M 1-3 h, L 3-8 h, XL > 8 h (split into 2-4 children, charter decision 11). Design uncertainty (U) 1-5: how many
credible, materially different designs exist (>= 3 = real architectural choice). Risk flags: **A** auth/security, **$**
money/ledger, **K** minors/safeguarding, **E** encryption, **C** CSP, **V** infra/VPS, **PD** personal data. Tournament per
charter decision 5: yes when U >= 3, or a charter flag (A, $, K, E, C) and size >= L. Kind: **PAPER** (3-4 interface designs,
DESIGN-IT-TWICE, judged cheaply) or **BUILD** (2-3 TDD'd implementations on `proto/<issue>-<letter>`). "Rule-triggered, low
yield" = qualifies only by the flag clause with U <= 2: PAPER round only. "explicit" = stated in the body; "native" = a
GitHub blocked-by edge (counts verified, edges inferred, 0.2); "inferred" = required by the ACs but not stated. "trunk" =
the ticket's milestone branch (`M5`), per the charter.

---

## 0. Verified facts the rest of this file relies on

### 0.1 Ordinal mapping (ordinal n = issue #(55+n))

| Ordinal | Issue | Title | Evidence |
| --- | --- | --- | --- |
| 50 | #105 | M5: Ledger with automatic postings | "Budgets, period lock, two-approver rules and the accountant export come in a later ticket" = #109 |
| 51 | #106 | M5: One-time donations with receipts | #105 "So do donation postings"; #106 "Recurring donations, offline donations and 80G come later" = #107, #108 |
| 52 | #107 | M5: Recurring donations | |
| 53 | #108 | M5: Offline donations and 80G receipts | |
| 54 | #109 | M5: Budgets, period lock, two-approver rules and accountant export | |
| 55 | #110 | M5: Transparency page | |
| 56 | #111 | M5: CMS pages, home sections and impact counters | "The blog, contact inbox and events come in later tickets" = #112, #113, #125 |
| 57 | #112 | M5: Blog and stories | |
| 58 | #113 | M5: Contact inbox | |
| 59 | #114 | M5: Data inventory and retention jobs | `issues-M6-M8.md` F9 "#114 (ord 59)" |
| 60 | #115 | M5: Privacy rights requests and grievance queue | |
| 61 | #116 | M5: Safeguarding reports and breach log | |
| 62 | #117 | M5: Admin home queues and basic reports | "Full objective reports and social metrics come in M8" = #135 |
| 63 | #118 | M5: Cookieless web analytics (Umami) | #119 = ordinal 64 (`issues-M6-M8.md`) |

No M5 body cites another ticket by number or ordinal; the chain is by module name and prose ("a later ticket", "come
later"). All 14 are open, sub-issues of #55, labelled `ready-for-agent`, milestone field `null` (group by the `M5:` title
prefix), 0 comments.

### 0.2 Native GitHub dependencies (counts exact, edges inferred)

**Correction to the charter's "No native GitHub issue dependencies exist".** The qualifiers `is:blocked` / `is:blocking`
return 0, but `issue_dependencies_summary` on every search hit is non-zero: native edges EXIST, the search API just does not
expose them. M5 blocked_by sum = 24, blocking sum = 10 (query below, 2026-11-19).

```bash
gh api -X GET search/issues -f q='repo:siddhartxts/friends-of-animals is:issue is:open M5 in:title' -f per_page=50 \
  --jq '.items[] | [.number, .issue_dependencies_summary.blocked_by, .issue_dependencies_summary.blocking] | @tsv'
```

| Issue | Ord | blocked_by | blocking | Count-consistent candidate blockers | Count-consistent candidate blocked |
| --- | --- | --- | --- | --- | --- |
| #105 | 50 | 1 | 3 | #80 (M1 analysis: "#80 blocks 2 later: #105 + one"); alt #77, #79 | #106, #109 + one of #108 / #110 / #133 |
| #106 | 51 | 1 | 3 | #105 (alt #78) | #107, #108, #110 |
| #107 | 52 | 1 | 0 | #106 | none |
| #108 | 53 | 2 | 0 | #106 + one of #105 / #63 / #62 | none |
| #109 | 54 | 2 | 1 | #105 + one of #60 / #80 | #110 |
| #110 | 55 | 2 | 0 | #106, #109 (alt #105 + #109, or #109 + #111) | none |
| #111 | 56 | 1 | 2 | one of #64 / #59 / #60 / #86 | #112 + one of #113 / #125 / #110 |
| #112 | 57 | 2 | 0 | #111 + one of #63 / #85 | none |
| #113 | 58 | 2 | 0 | #111 or #69, + one of #69 / #59 / #57 | none |
| #114 | 59 | 2 | 0 | #62, #61 (alt #59, #73) | none (so #115 is NOT natively blocked by #114) |
| #115 | 60 | 2 | 0 | #81 + one of #63 / #59 / #64 / #61 | none |
| #116 | 61 | 1 | 0 | #69 or #59 | none |
| #117 | 62 | 5 | 1 | 5 of #73, #80, #89, #92, #93, #99, #100, #103 | #135 (#135 has exactly 1 blocker) |
| #118 | 63 | 0 | 0 | none | none |

Preferred count-exact fit: 9 internal edges (#105 -> #106, #108, #109; #106 -> #107, #108, #110; #109 -> #110; #111 -> #112,
#113), 1 outgoing (#117 -> #135), 15 incoming. Equally consistent: #105 -> #133 instead of #108 (8 internal, 16 incoming).
Runtime check (T2 runner with `gh`; cloud sessions cannot use GraphQL and gh 2.89 lacks `blockedBy`):

```bash
for n in $(seq 105 118); do
  printf '#%s blocked_by=' "$n"
  gh api "repos/siddhartxts/friends-of-animals/issues/$n/dependencies/blocked_by" --jq '[.[].number]'
done
```

If edges cannot be read, schedule on the UNION of the candidates above and each unit's "hard deps" in section 4.2.

### 0.3 Decisions that bind M5 (none on the M5 tickets themselves)

| Source | Decision | M5 consequence |
| --- | --- | --- |
| #55 comment (owner, 2026-11-19) | PDF sidecar is Gotenberg 9.x (>= 9.8.0, exact tag pinned), not 8 | Any M5 PDF (receipts if rendered by the worker, accountant export if PDF) uses #100's `PdfRenderer` port on Gotenberg 9 |
| #55 Product rules | "FOA starts with no 80G (receipts without 80G wording), FCRA off (domestic INR only), and no GST invoices" | `org.has80G=false`, `org.fcraEnabled=false` defaults (#62 keys); no GST anywhere |
| #55 Codes | Receipt number `FOA-RCPT-{FY}-{000000}`, sequential per financial year (the only sequential code) | `{FY}` token undefined: default `2627` = Apr 2026-Mar 2027 (prior art); G8 confirms |
| #55 Donations module | receipts behind signed links valid 7 days, never attachments; donor wall opt-in; corporate disclosure; adults-only check; foreign payments refused | #106 |
| #55 Transparency module | "a public read model computed only from published (locked) periods, with no donor personal data" | locked == published: no separate publish step (prior art had LOCKED -> PUBLISHED; do not copy) |
| #55 Rulings | Umami self-hosted, cookieless, own database, no tracking of signed-in children's pages | #118 |
| #55 Rulings (CSP) | static public pages: CSP without nonces, self-hosted scripts only; signed-in areas: nonce CSP | Razorpay Checkout must not loosen the public static CSP (F6) |
| #55 Out of scope | FOA leadership must provide a DSL, a grievance officer, two finance approvers | G11 (release-gating residue) |
| #18 (closed) | "income-tax registration ... used to be 12A/80G and are now under the Income-tax Act 2025" | 80G wording and section numbers are accountant-supplied text in settings, never hard-coded (F21) |
| #15 (closed, unruled) | e.g. supporters wall read live with 300 s revalidate | NOT a ruling; do not apply |

### 0.4 Repository facts that change how M5 is built

| # | Fact | Evidence | Consequence |
| --- | --- | --- | --- |
| R1 | No modules or tables exist; schema barrel `export {}`; one migration. | `issues-M2.md` R1 | Every M5 ticket builds on M0-M4 code. At claim the runner lists `src/server/modules/` and `src/server/db/schema/` on `M5` and adopts the names there (payments, files, notify, settings registry, inventory). |
| R2 | drizzle runs all pending migrations in ONE transaction. | `code-server.md` 4 | M2 F2 enum rule: each M5 status enum is created with ALL its values in its first ticket (2.1); adding a value to an M0/M1 enum (`role`, `file_asset_purpose`, `refund_kind`, payment purpose) goes in a migration nothing else in the PR references. |
| R3 | `src/lib/site.ts` `SITE.org` holds 12 placeholders (legalName, email, phone, address, registration type/number/pan, grievanceOfficer name/email, socials, fees); `next.config.ts` calls `assertNoPlaceholdersInProduction()` at build. | file | #111 moves display facts to the DB; a build has no DB, so the build-time guard must become a runtime readiness check (F10). |
| R4 | `src/app/_components/home-layout.ts`: `HOME_LAYOUT` is already CMS-shaped (hero with message keys under `home.`, 4 `counterKeys`, 11 sections incl. `events` hidden). | file | #111 swaps message keys for CMS text with the same shape; `visibleSections()` and `openAnnouncement()` stay. |
| R5 | `COUNTER_KEYS` = participants, institutions, competitions, statesReached, artworksShowcased, certificatesIssued (no funds key); `/impact` lists a "funds" measure: "shown on the transparency page once giving opens"; `getSampleImpact()` returns data only outside production. | `src/content/sample/model.ts:113`, `messages/en-IN/impact.json:45-74` | Funds raised is computed by #110, never typed in (F9). |
| R6 | Legal docs are typed `LegalDoc` blocks with `{fact}` refs into `SITE.org`; `POLICIES_UPDATED = "2026-11-18"`; `safeguarding.ts` says "Until our online report form is ready, write to ...". | `src/content/legal/*` | #111 versions legal pages; #116 must change the safeguarding copy (after #111 it is CMS content, H39). |
| R7 | `/contact`: `TOPICS` = GENERAL, SCHOOLS, NGOS, ADOPTION, VOLUNTEERING, DONATIONS, MEDIA plus a safeguarding callout linking `/safeguarding`; `contact.json` "A contact form is coming." | `src/app/contact/page.tsx:29` | #113 topic enum = these 7; safeguarding concerns are never stored in the inbox (route to #116). |
| R8 | `/donate` is static with `DonateAction` JSON-LD and a "can't" list (tax, foreign, minors, rescue); the heading text is the LCP element by design (comment in file). | `src/app/donate/page.tsx` | #106 adds a form island without becoming the LCP or breaking Lighthouse. |
| R9 | Stories: `src/content/stories/articles/<slug>.ts` via dynamic import; `src/proxy.ts` 404s unknown `/blog/:slug` from build-time `isStorySlug`; sitemap has one entry per story; blog article initial JS 164.1 kB of the 170 kB budget. | `code-app.md` 1, 3; `code-tooling.md` | #112 replaces the slug source (H40), imports existing articles, and must not add client JS to article pages. |
| R10 | Quick exit is added per URL by `src/app/@exit/<path>/page.tsx` returning `<QuickExitBar />`. | `code-app.md` 2 | #116 report form gets Quick exit with one file. |
| R11 | No sanitiser, captcha, CSV writer, PDF library or zip library in `package.json`. | grep | First ticket to need each adds it (H29 lockfile); #86b owns the sanitiser (M2 F4). |
| R12 | Next 16.4: `revalidateTag(tag, profile)` is stale-while-revalidate (`"max"` recommended; no second argument is deprecated); `updateTag` (Server Actions) gives read-your-writes; Draft Mode works with Cache Components. | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/{revalidateTag,updateTag,cacheTag,draft-mode}.md`, `02-guides/draft-mode.md` | Anything that must DISAPPEAR at once (unlocked period, unpublished CMS draft) uses `updateTag` or `{ expire: 0 }` (F8). |
| R13 | VPS publishes only 6432 (FOA-INBOUND); lego HTTP-01 uses host :80 for the PgBouncer cert; pgBackRest backs up the pg-prod cluster only (local repo1). | `code-infra.md` 1 | Umami on a TLS subdomain needs a new ingress (F18); its database on pg-prod is covered by pgBackRest automatically. |
| R14 | `robots.ts` disallows `/admin`, `/dashboard`, `/institution`, `/judge`, `/api`, `/verify`; `routes.test.ts` asserts `/transparency` is absent (unbuilt). | `code-app.md` 6 | #110 removes `/transparency` from that list and adds the ROUTES entry; #106 adds `/receipts` to `disallow` + `noindex`. |
| R15 | No CSP yet; #65 builds `src/lib/csp.ts` with per-feature source additions. | `issues-M0.md` #65 | #106 (Razorpay), #113/#116 (captcha, only if third-party), #118 (Umami) add sources through #65's registry (H32). |
| R16 | PGlite is one serial connection. | `code-server.md` 2 | Receipt numbering, double webhooks and racing approvers are enforced in SQL (row lock, unique keys, CHECK) and proven by sequential replay; optional real-Postgres check via `.cursor/cloud-start.sh`. |

---

## 1. Findings the Orchestrator must act on

**F1. Native edges exist; schedule on the union until read.** See 0.2. The charter fact "No native GitHub issue
dependencies exist" is wrong for M5 (and per `issues-M0.md`/`issues-M2.md`, for M0-M2 too). Run the REST check at plan
time; record real edges in the ledger; keep inferred `extraBlockers` (section 4.2) on top.

**F2. Most of M5 can enter the frontier long before M4 finishes.** Hard deps: finance chain (#105-#110) needs only M0 + M1
(#77, #79, #80, #81; #100 only if receipts are worker-rendered PDFs, F5); #111 needs M0 + the sanitiser (#86b, or builds
it, F12); #112 adds #85a; #113, #114, #115, #116 need M0/M1 only; #118 needs only #65. Only #117 needs M2-M4 (#92, #93, #99,
#100, #103). Branch-model consequence: `M5` is cut from `M4`, which may not exist yet. Rule: on the first claim of an M5
ticket, the Orchestrator creates every missing milestone branch in order (`M2` from `M1`, `M3` from `M2`, `M4` from `M3`,
`M5` from `M4`; all identical at that moment) and opens the stacked milestone PRs; the cascade rule then carries every later
M1-M4 merge forward into `M5`. Do not cut `M5` from `M1` directly (breaks the stack and the cascade order).

**F3. #105 must be double-entry; do not copy the prior-art single-entry ledger.** Recommended model: `ledger_account`
(kind asset/liability/income/expense/equity; "categories" = income and expense accounts finance manages) + `ledger_posting`
(header: occurred_at, period_month `YYYY-MM` in IST, source_type, source_id, reversal_of) + `ledger_line` (account,
debit_minor / credit_minor, exactly one > 0). Enforce in SQL (custom migration, H2): append-only triggers on posting and
line (`BEFORE UPDATE OR DELETE`, `BEFORE TRUNCATE`), a `DEFERRABLE INITIALLY DEFERRED` constraint trigger that checks
sum(debit) = sum(credit) and >= 2 lines per posting at commit, unique `(source_type, source_id, posting_kind)` for
idempotency, `currency = 'INR'` CHECK. Runtime check: PGlite supports constraint triggers (`CREATE CONSTRAINT TRIGGER ...
DEFERRABLE`); if not, the balance check is a use-case invariant plus a SQL assertion query in the test. Posting rules: 2.2.

**F4. Donations need a payment PURPOSE in the Payments module (#77's batch is registration-centric).** 106a adds
`purpose` (`registration_fee` | `donation`; `auction` later for #133) to the payment batch (or a polymorphic
`payment_subject`), makes `payment_batch_item.registration_id` nullable or moves items behind the purpose, and adds a
dispatcher so `payment.captured` / `payment.failed` / `refund.processed` reach Donations for donation batches. If purpose
is an enum, add it in its own migration (R2). Serialize with any open Payments work (H14). The ledger consumer (#105) maps
purpose -> income account, so 106a also extends #105's mapping (H34).

**F5. Receipts: render on request from an immutable snapshot, not by a new worker job.** "Download link valid for 7 days"
plus the M5 Seam 2 journey ("open its receipt") on a preview: a worker-rendered PDF (Gotenberg via #100's port) needs a NEW
worker handler, which does not run on previews until the owner redeploys the shared non-prod worker (M1 finding 0.2.6), and
needs Gotenberg reachable. Recommended: the capture transaction writes `receipt` (number, FY, seq) with a frozen JSON
snapshot of every printed field (org facts, donor name/type, amount, amount in Indian-system words, mode, reference, 80G
block if applicable, template version); `/receipts/[token]` validates a random 32-byte token (SHA-256 hash stored,
`expires_at = issued_at + 7 days`) and renders an A4 print page (HTML, print CSS; PDF optional via a pure-JS library on
Vercel). No new secret (hashed tokens, `issues-M6-M8.md` 0.4 design rule), no worker, no raw presigned R2 URL (SigV4
presign maximum is 7 days = 604800 s: verify for R2 at runtime; do not rely on it). Receipt snapshots must not hold a clear
PAN (#108: encrypt the snapshot field or render PAN from the encrypted column). Contender: worker-rendered PDF in the private
bucket. Tournament on 106b.

**F6. Razorpay Checkout must not loosen the static public CSP.** `/donate` stays static with the no-nonce CSP. Recommended
flow: `/donate` form (server action) creates a `pending` donation and redirects to `/donate/checkout/[donationId]?t=<token>`
(dynamic route, nonce CSP + Razorpay `script-src https://checkout.razorpay.com`, `frame-src https://api.razorpay.com`;
verify exact hosts against Razorpay docs at runtime) -> Checkout -> signature-verified return -> `/donate/thank-you`.
Previews cannot receive Razorpay webhooks (M1 F5): capture is confirmed by the Checkout signature + order fetch; the webhook
is the async path on staging. Use #77b's non-production fallback adapter when keys are absent.

**F7. Refund kinds outside #80's policy.** #55: only cancellation and duplicate resolution refund without approval. M5 adds
two system refunds: `foreign_payment` (#106, FCRA off) and `recurring_after_cancel` (#107, a charge that lands after the
donor cancelled). Add both to #80's refund-kind enum in a migration nothing else references (R2). A foreign capture posts
Dr `1100 gateway_clearing` / Cr `2100 foreign_receipts_refundable` (liability, never income) and the refund reverses it, so
income and transparency never include it and no receipt number is consumed. Discretionary donation refunds go through
#80's request + finance approval (requester != approver).

**F8. Period lock vs automatic postings vs revalidation.** (a) A gateway event dated in a locked month cannot be refused:
the ledger consumer posts it into the earliest open month with `late_adjustment = true` and `original_period_month`; manual
entries and reversals targeting a locked month are refused. A SQL trigger on `ledger_posting` insert refuses any
`period_month` whose `ledger_period.status = 'locked'` (defence in depth). (b) The M5 journey locks the CURRENT month right
after a donation; #109 must therefore allow locking a month whose start is <= now (UI warns "month not ended"; two
approvers protect), or the journey is impossible without time travel on a preview. (c) Lock and unlock execute in the second
approver's Server Action, which calls `updateTag('transparency')` so an unlocked month disappears immediately (R12);
never `revalidateTag('transparency', 'max')` for unlock.

**F9. Funds raised is computed, not CMS-edited.** #110: "The funds-raised counter on the impact page comes from the same
source"; AC: equals the transparency donations total "for the same period". Definition (record in GLOSSARY.md): current
FY to date over locked months, donation income accounts net of refunds. #110 adds a computed `fundsRaised` counter
(read-model query); #111's impact-counter editor excludes it. Whichever of #110/#111b merges second wires it into the
`/impact` page and the home counters (H39).

**F10. Static rendering with DB content (#110, #111, #112).** `pnpm build` must pass with `DATABASE_URL` unset; public
pages must stay prerendered (static shell) with Lighthouse >= 90 and the 170 kB JS budget. A `"use cache"` read runs at
build and has no DB there. Contenders for #111a's tournament: (a) `"use cache"` + `cacheTag` with a build-time fallback to
the repo content (`src/content/*`, messages) when no DB is configured, `updateTag` on publish; (b) static shell + dynamic
holes inside `<Suspense>` after `await connection()` (always fresh, costs TTFB on every request, may hurt Lighthouse); (c)
publish writes a content snapshot that the build bundles (requires a deploy per publish: violates "without a deploy",
reject). The root layout's org JSON-LD and footer facts read the same cached facts function. `assertNoPlaceholdersInProduction`
moves from `next.config.ts` (build) to a runtime readiness check (production `/api/health` reports `facts_incomplete`, and
the admin shell shows a banner) because facts now live in the DB. Fact ownership: behaviour-driving and tax facts (legal
name, registration type/number, PAN, 80G/FCRA, 80G wording) are #62 settings (super admin + step-up); display facts (email,
phone, address, socials, grievance officer name/email) are a CMS `site_facts` document (content manager). One cached
`getOrgFacts()` with tag `org-facts` merges both.

**F11. Legal pages: one source of truth with #64.** #64 (M0) already renders `/privacy` and `/terms` from published
consent documents. #111's "Legal pages show their current version, and consent documents link to it" means: the four legal
pages (privacy, terms, safeguarding, child-protection-policy) become versioned CMS LEGAL documents; each consent document
(#64/#82) stores the legal revision it was published against (`consent_document.legal_revision_id`, nullable) and the
consent UI links to the current legal page version. Runtime check at claim: what #64 stored (`grep -rn "privacy" src/server/
modules/consent`). If #64 put the privacy notice body into `consent_document`, 111a migrates the page body into the CMS and
keeps the consent text in the consent document; it never deletes or edits a published consent document (#64's
immutability trigger).

**F12. One rich-text sanitiser.** M2 F4: #86b creates `src/server/rich-text/sanitize.ts` (profile `essay`). #111a adds the
`cms` profile (links, headings, lists, emphasis; `rel="noopener noreferrer nofollow"` on external links), #112a adds `post`
(plus images whose `src` must be a public derivative URL from the Files module). Sanitise on save AND on render (AC). If
#111a is claimed before #86b merges, #111a creates the module at that path and #86b extends it (first to land owns; shared
XSS corpus test `sanitize.test.ts` with script tags, `on*=` handlers, `javascript:`/`data:` URLs, SVG, `<style>`,
`srcset`, entity-encoded payloads).

**F13. New staff roles not in #55's list of 16.** #116 needs `safeguarding_lead`; #115 needs `grievance_officer`. Both
staff (2FA). If #59 made `role` a Postgres enum, each value goes in its own migration that nothing else in the PR
references (R2; hotspot H30, shared with M2's `foa_verifier`). #116 AC "Every other role is denied" includes `super_admin`:
the runner checks #59's `can()` for a super-admin bypass and adds an explicit deny for `safeguarding.*` resources that no
global role overrides; audit rows for safeguarding actions carry status/severity/assignee only, never content.

**F14. Public forms need a shared human check.** #113 (contact, AC "captcha and rate limits") and #116 (report a concern,
no account) are public, static-page forms. Recommended `HumanCheck` port (Seam 1 fake: pass/fail on demand) with a default
self-hosted proof-of-work adapter (challenge row with random salt stored server-side and single-use; no third-party
script, CSP stays `'self'`, no new secret) and an optional Cloudflare Turnstile adapter (needs site key + secret + CSP
sources: residue G13). Plus a honeypot field, a minimum fill time, and Postgres rate limits (#57's limiter) per IP and per
normalised email. IPs are stored only as keyed hashes using the existing `PII_HASH_KEY` (R-KEYS from #75): no new secret.
#113 owns the module (`src/server/modules/public-forms/`, H42); #116a reuses it (soft dependency; whichever lands first owns).

**F15. #114's coverage test needs a definition of "personal-data column".** Contenders for #114's tournament: (a)
exhaustive classification: the test introspects every table in the schema barrel (`getTableConfig` from
`drizzle-orm/pg-core`) and fails unless every column is either an inventory entry or listed in a `NON_PERSONAL` allowlist
(fails closed on every new column; every later ticket classifies its columns, H5); (b) column-level marker: a `pd()`
wrapper or the encrypted column type marks PD columns, the test requires an entry for each marked column (fails open if a
runner forgets the marker); (c) name heuristics (email, phone, name, dob, address, pan, ip, note, message) plus (b).
Recommended (a). Every inventory entry also carries the `subject` path (how a row links to a user, participant profile,
guardian or donor) and the retention action (`delete` | `anonymise` | `retain`) with a legal-basis floor, so #115's export
and erasure engines need no retrofit (F16).

**F16. Append-only tables vs retention and erasure.** `audit_log` (#59 trigger), ledger postings/lines (#105), consent
events (#64), safeguarding incident log (#116), contact and privacy notes cannot be deleted by the app role. Rules: (1) no
module writes personal data into `audit_log.before/after` beyond ids and changed field names (judges grep M5 diffs for
it); (2) financial records (ledger, donations, receipts, payments, PAN) carry `basis: legal_obligation` with a floor
(default 8 years after FY end, G1/G8) that settings cannot shorten; retention jobs never touch them before the floor;
erasure anonymises the donor's contact fields only after the floor; (3) deleting audit rows past their retention is an
owner-run superuser operation (M0 F6), out of the job's reach: the job reports "retained by design".

**F17. Worker version skew blocks the M5 Seam 2 journey.** New worker handlers in M5: ledger consumer (#105), donation
follow-ups (#106/#107 messages), scheduled post publish (#112), retention sweep (#114), export build and erasure (#115),
breach fan-out (#116b). Seam 1 drains in-process, but on a preview the shared non-prod worker runs whatever code the owner
last deployed. The #110b journey needs ledger postings on the preview: residue R5-1 (owner redeploys the shared non-prod
preview worker from the `M5` tip before 110b runs; wizard; staging worker stays on `main`). 110b that cannot pass for lack of R5-1 goes `factory:needs-human`;
never weaken the journey.

**F18. Umami ingress on a box that publishes nothing but 6432.** Options for #118's PAPER round: (a) Caddy on 443 with a
FOA-INBOUND rule for 443 and ACME DNS-01 via Cloudflare (HTTP-01 on :80 is taken by lego for PgBouncer); (b) Cloudflare
Tunnel (`cloudflared`, outbound only, no firewall change, TLS at Cloudflare; DNS is already Cloudflare per #55); (c) either
of the above plus a first-party proxy: Next rewrites `/stats/script.js` and `/stats/api/send` to the Umami origin, so the CSP
stays `script-src 'self'` / `connect-src 'self'` and ad blockers matter less (set Umami's client-IP header env so
geolocation sees the visitor, not Vercel; verify the variable name at runtime). Recommended (b) + (c). Umami database:
`umami` on pg-prod owned by a new role `umami` (covered by pgBackRest automatically; Umami runs its own migrations, so the
role needs DDL on that database only); one Umami instance with two websites (staging host, production host).

**F19. "Signed-in children's pages send nothing" on static public pages.** The script renders only in the public static
shell, never in signed-in trees (`/dashboard`, `/account`, `/institution`, `/admin`, `/judge`, auth and register pages,
`/consent/[token]`, `/receipts/[token]`, `/donate/checkout/*`). Public pages are static and cannot know who is signed in,
so a signed-in 13-17-year-old browsing `/competitions` would still send a cookieless page view. Recommended: a self-hosted
`data-before-send` handler file (no inline script, CSP-safe) cancels sends while a first-party marker is present (set at
sign-in for every account, or only for minors; cleared at sign-out); `data-domains` lists only the staging and production
hostnames, so previews (`*.vercel.app`) and local send nothing even if the script loads; the script tag renders only when
`NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set (unset on Preview and local). Verify Umami's own disable switch
(`localStorage` `umami.disabled`) at runtime as an alternative.

**F20. CSV safety shared by #109 and #117.** One `src/server/lib/csv.ts` (H45): RFC 4180, UTF-8 BOM, CRLF, neutralises
text cells starting with `=`, `+`, `-`, `@`, tab or CR (prefix `'`), emits amounts as numeric cells (negative amounts must not
be "neutralised" into text), and never interpolates personal data the viewer may not see. First of 109b/117b to land owns it.

**F21. 80G is accountant-supplied, renamed law.** #18: 12A/80G now sit under the Income-tax Act 2025. #108 must not
hard-code section numbers or wording: settings `org.taxExemption.wording` (text), `org.taxExemption.registrationNumber`,
`org.taxExemption.validUntil` (all step-up + audit, #62), default empty with a draft wording marked "confirm with
accountant" for tests and previews. Turning `org.has80G` on with empty wording is refused by the setting's zod refinement.

**F22. Signed-in minor detection.** #106 "A signed-in minor can't start a donation": needs an Identity query `isMinor(actor,
now)` (true when the user has their own participant profile with age < 18 at `now` in IST, i.e. a #81 linked teen login).
DOB is encrypted (#75): the check decrypts in the use case, never in SQL. Runtime check: does #81 expose it? If not, 106a adds
it to the identity module (one function, tested at the 18th-birthday boundary with the fake clock).

**F23. Lighthouse runner prerequisite.** #106, #110, #111, #112, #118 carry Lighthouse ACs. Runtime check at claim:
`grep -ril lighthouse .github package.json tests`. If still absent (the first Lighthouse ticket is #70 in M1), the runner
does not build one ad hoc; the Orchestrator blocks the Lighthouse AC on the harness ticket (`issues-M6-M8.md` F5).

**F24. Age-group reports over encrypted DOB (#117).** "split by route and age group": DOB is encrypted (#75), so SQL cannot
derive age groups. Runtime check: does `registration` persist the age group / category key computed at registration
(#55: "Age category is computed from date of birth and the cut-off date")? If not, 117b files a follow-up (cap rules) to
persist it with a backfill, and computes in application code meanwhile (acceptable at pilot scale; document the cost).

---

## 2. Shared M5 conventions

### 2.1 State machines introduced in M5 (all enum values created by the owning unit; F2-style rule)

| Enum (owner) | Values | Allowed transitions (trigger) | Forbidden examples every table must include |
| --- | --- | --- | --- |
| `donation_status` (106a) | `pending`, `captured`, `failed`, `expired`, `refund_pending`, `refunded`, `partially_refunded` | none -> pending (start online donation); none -> captured (offline donation 108, recurring charge 107); pending -> captured (INR domestic capture); pending -> failed (payment failed); failed -> captured (later successful payment on the same order); pending -> expired (checkout not completed within `donations.pendingExpiryHours`, job); pending -> refund_pending (foreign capture while FCRA off; no receipt); captured -> refund_pending (finance-approved refund sent to gateway); refund_pending -> refunded / partially_refunded (refund processed) | refunded -> anything; expired -> captured without a new checkout; captured -> failed; pending -> refunded without refund_pending; any receipt allocation outside pending/none -> captured |
| `recurring_donation_status` (107) | `pending_authorisation`, `active`, `past_due`, `halted`, `cancelled`, `completed` | none -> pending_authorisation; pending_authorisation -> active (authenticated/activated); pending_authorisation -> cancelled (abandoned after 24 h sweeper, or donor); active -> active (charged: new donation); active -> past_due (charge failed, gateway retrying); past_due -> active (charged); past_due -> halted (retries exhausted); active / past_due / halted -> cancelled (donor, finance or provider); active -> completed (provider completed) | cancelled -> active; completed -> active; halted -> active; any charge producing a donation after cancelled (refund instead, F7) |
| `ledger_period_status` (109a) | `open`, `locked` | none -> open (first posting or explicit creation of a month); open -> locked (lock, two approvers); locked -> open (unlock, two approvers, reason required) | open -> open; locked -> locked; any transition by a single finance user; any manual posting into a locked month |
| `finance_approval_status` (109a) | `pending`, `approved`, `rejected`, `cancelled`, `expired` | none -> pending (request); pending -> approved (different finance user, step-up; executes the operation in the same transaction); pending -> rejected (different finance user, reason); pending -> cancelled (requester); pending -> expired (job after `ledger.approvalExpiryDays`) | requester approves own request; approved / rejected / cancelled / expired -> anything |
| `contact_message_status` (113) | `new`, `in_progress`, `closed` | none -> new (form); new -> in_progress (assign or status change); in_progress -> closed; new -> closed (no action needed / spam, reason); closed -> in_progress (reopen) | closed -> new; in_progress -> new |
| `privacy_request_status` (115a) | `submitted`, `in_progress`, `completed`, `partially_completed`, `rejected`, `cancelled` | none -> submitted; submitted -> cancelled (requester); submitted -> in_progress (grievance officer starts or assigns); in_progress -> completed; in_progress -> partially_completed (erasure with retained categories); submitted / in_progress -> rejected (reason) | completed / partially_completed / rejected / cancelled -> anything; in_progress -> cancelled by requester |
| `safeguarding_report_status` (116a) | `new`, `triaged`, `investigating`, `escalated`, `resolved` | none -> new (public form); new -> triaged (severity set); triaged -> investigating; triaged -> resolved (no action needed, outcome required); investigating -> escalated (authority reference); investigating -> resolved; escalated -> resolved | new -> resolved; new -> investigating; resolved -> anything |
| `breach_status` (116b) | `open`, `contained`, `notified`, `closed` | none -> open; open -> contained; open -> notified (notice may precede containment); contained -> notified; contained -> closed (no notification required, reason); notified -> closed | closed -> anything; notified -> open |
| `cms_revision_status` (111a) | `draft`, `published`, `superseded` | none -> draft; draft -> published (previous published -> superseded in the same transaction); published -> superseded | published -> draft; superseded -> anything; edit of a published or superseded revision |
| `post_status` (112a) | `draft`, `scheduled`, `published`, `archived` | none -> draft; draft -> scheduled (`publish_at` > now); draft -> published; scheduled -> published (job at `publish_at`; re-reads status and `publish_at`); scheduled -> draft (unschedule; job becomes a no-op); published -> archived; archived -> draft | scheduled -> archived; archived -> published; draft -> archived |

### 2.2 Ledger posting rules (proposed seeded chart; G8 confirms codes and names)

System accounts (not editable, not deletable): `1000 bank`, `1010 cash`, `1100 gateway_clearing` (Razorpay receivable),
`2100 foreign_receipts_refundable` (liability), `3000 accumulated_fund` (equity, opening balances). Seeded income accounts
("categories"): `4100 registration_fees`, `4200 donations_individual`, `4210 donations_corporate`, `4220 csr_contributions`,
`4900 other_income`. Seeded expense accounts: `5100 prizes_awards`, `5200 certificates_printing`, `5300 logistics`, `5400
platform_technology`, `5500 payment_gateway_fees`, `5600 events_outreach`, `5900 other_expense`. Finance adds, renames and
deactivates income/expense accounts; kind never changes after first use. Each account has `public_label` and `public_group`
for #110 (finance must map anything that would reveal one person's pay to a broad label).

| Source event (consumer) | Debit | Credit | `source_type` / idempotency key | Unit |
| --- | --- | --- | --- | --- |
| registration payment captured online | 1100 | 4100 | `payment_capture` / gateway payment id | 105 |
| registration payment recorded offline (#79) | 1000 or 1010 by method | 4100 | `offline_payment` / offline payment id | 105 |
| registration refund processed (#80) | 4100 | 1100 (1000 for an offline manual refund) | `refund` / refund id; `reversal_of` = capture posting | 105 |
| backfill of captures before #105 | as above | as above | same keys (backfill is idempotent by construction) | 105 |
| donation captured online (INR, domestic) | 1100 | 4200 / 4210 / 4220 by donor type | `donation_capture` / gateway payment id | 106a |
| foreign capture while FCRA off | 1100 | 2100 | `foreign_capture` / gateway payment id | 106a |
| foreign auto-refund processed | 2100 | 1100 | `refund` / refund id | 106a |
| donation refund processed | 42xx | 1100 | `refund` / refund id | 106a |
| recurring charge captured | 1100 | 4200 | `donation_capture` / gateway payment id | 107 |
| offline donation | 1000 or 1010 | 42xx | `donation_offline` / donation id | 108 |
| manual entry (finance; >= 2 balanced lines; above threshold needs approval) | chosen | chosen | `manual` / posting id | 105, 109a |
| correction | mirror of the original lines | | `reversal` / original posting id | 105, 109a |

Out of scope (follow-up, G8): gateway settlement fees and bank transfers from Razorpay settlements (needs settlement reports),
auction proceeds (#133).

### 2.3 Events, templates, settings and schedules added in M5 (proposed names; hardening may rename)

| Name | Kind | Unit |
| --- | --- | --- |
| consumes `payment.captured`, offline-payment event (#79), `refund.processed` (#80); one-shot `ledger.backfill_requested` | outbox consumers (names verified on trunk at claim) | 105 |
| `donation.captured` -> template `donation_thank_you` (email; in-app if account; carries the receipt link, never an attachment) | event + template | 106a |
| `donation.refunded`, `donation.foreign_refunded` -> templates `donation_refunded`, `donation_foreign_refunded` | events + templates | 106a |
| `receipt.link_reissued` -> template `receipt_link` | event + template | 106b |
| `recurring_donation.activated`, `.charged` (thank-you + receipt link), `.charge_failed` (`recurring_charge_failed`), `.cancelled` (`recurring_cancelled`) | events + templates | 107 |
| `donation.offline_recorded` -> `donation_thank_you` (when the donor gave an email) | event | 108 |
| `finance_approval.requested` (in-app to other finance users), `finance_approval.decided`; `ledger_period.locked`, `.unlocked` | events + templates | 109a |
| `cms.published` (revalidate tags), job `cms.publishScheduledPost` (delayed, `singletonKey` = post id) | event + job | 111a, 112a |
| `contact_message.received` -> `contact_acknowledgement` (to the sender's email, contact-only recipient, M2 F13); `contact_message.routed` (in-app to the team) | events + templates | 113 |
| schedule `privacy.retentionSweep` (daily 02:15 IST); audit action `privacy.retention_run` (counts only) | schedule (H10) | 114 |
| `privacy_request.submitted` (ack + in-app to grievance officers), `.completed`, `privacy_export.ready` (`privacy_export_ready`, link), jobs `privacy.buildExport`, `privacy.executeErasure`, schedule `privacy.flagOverdue` (daily) | events, templates, jobs | 115a, 115b |
| `safeguarding.report_submitted` -> `safeguarding_report_alert` (to safeguarding leads; no content, link only) | event + template | 116a |
| `breach.principal_notice` (`required_by_law`; guardian routing for minors), `breach.authority_notice` | events + templates; job `breach.fanOut` | 116b |

Settings keys (H7; each description says "confirm with FOA" / "confirm with counsel" / "confirm with accountant"):
`donations.minAmountMinor` (10000 = Rs 100), `donations.maxAmountMinor` (10000000 = Rs 1 lakh), `donations.presetAmountsMinor`
([50000, 100000, 250000, 500000]), `donations.allowGuest` (true), `donations.pendingExpiryHours` (24),
`recurring.minAmountMinor` (10000), `recurring.maxAmountMinor` (1500000), `org.has80G` and `org.fcraEnabled` (exist, #62),
`org.taxExemption.{wording,registrationNumber,validUntil}` (F21), `ledger.manualEntryApprovalThresholdMinor` (5000000 =
Rs 50,000), `ledger.approvalExpiryDays` (7), `contact.routing` (topic -> team role map), `contact.rateLimit.perIpPerHour`
(5), `contact.rateLimit.perEmailPerDay` (5), `retention.<policy>.days` (one per policy, F15), `privacy.requestDueDays` (30),
`privacy.exportLinkHours` (72), `privacy.exportRetentionDays` (7), `breach.authorityEmail` (empty). Receipt link lifetime is
fixed at 7 days by #55 (constant, not a setting).

### 2.4 File-conflict hotspot codes

Global codes reused (meaning as in `issues-M6-M8.md` 0.3 and `issues-M2.md` 2.3): **H1** schema barrel; **H2**
`drizzle/*.sql` + `drizzle/meta/*` (custom SQL preserved, merge queue regenerates); **H3** `src/i18n/messages.ts`; **H4**
`src/lib/routes.ts` + `nav.json` + `routes.test.ts` + `robots.ts` + `sitemap.ts`; **H5** data inventory; **H6** seed
builders; **H7** settings registry; **H8** `can()` action table; **H9** outbox events + consumers + event->template map;
**H10** schedule registry; **H12** `security-headers.ts`; **H14** Payments module; **H16** consent schema/registry; **H19**
admin/dashboard navigation + `src/lib/app-routes.ts`; **H21** derivative purposes / worker-media registry; **H29**
`package.json` + lockfile; **H30** role registry/enum; **H32** CSP source registry (#65).

M5-specific codes:

| Code | File(s) (proposed paths) | Owner | Touched by | Merge rule |
| --- | --- | --- | --- | --- |
| H34 | `src/server/db/schema/ledger.ts`, `src/server/modules/ledger/**` (posting API `post(tx, {...})`, source->account mapping, consumer registry) | 105 | 106a, 107, 108, 109a, 109b, 110a, #133 | Serialize merges; mapping rows appended in per-source files. |
| H35 | `src/server/db/schema/donations.ts`, `donation_status`, capture handler, receipt numbering | 106a | 106b, 107, 108, 110a | Serialize 106a -> 106b -> (107, 108 in either order, one at a time). |
| H36 | Payments purpose + dispatcher (extends H14) | 106a | 107 (subscription events), #133 | Serialize with any open Payments work. |
| H37 | `src/server/modules/donations/receipts/**` (snapshot builder, template, number formatter), `src/app/receipts/[token]/**` | 106a/106b | 107, 108 (80G block) | Serialize. |
| H38 | `src/server/db/schema/cms.ts`, `src/server/modules/cms/**` (documents, revisions, block registry, publish + tags) | 111a | 111b, 112a, 112b, 116a (safeguarding page link), #125 | Serialize; new block types in new files. |
| H39 | Public pages rewired from repo content to CMS: `src/app/page.tsx`, `_components/home-layout.ts`, `about/page.tsx`, `(legal)/**`, `impact/page.tsx`, `src/lib/site.ts`, `next.config.ts` (placeholder guard), root layout JSON-LD, `messages/en-IN/{home,about,impact,legal}.json` | 111b | 110a (funds counter), 112b (home stories), 116a (safeguarding copy) | 111b first; others rebase. |
| H40 | `src/app/blog/**`, `src/content/stories/**`, `src/proxy.ts` story-slug check, `sitemap.ts`, `seo.test.ts` | 112b | (none in M5) | Single owner; proxy edits serialize with any open proxy ticket. |
| H41 | Privacy registry: inventory entries (H5) + retention policy registry + subject resolvers + anonymisers (`src/server/modules/privacy/**`) | 114 | 115a, 115b, every PD ticket | Append-only entries; the coverage test is the arbiter. |
| H42 | `src/server/modules/public-forms/**` (HumanCheck port, honeypot, rate-limit helper), form island component | 113 | 116a (#125, #134 later) | First to land owns; serialize. |
| H43 | Admin home queue registry `src/server/modules/reports/queues.ts` + `src/app/admin/page.tsx` | 117a | later queue owners (#119+) | Append one queue definition per file. |
| H44 | Two-approver mechanism `src/server/modules/ledger/approvals/**` | 109a | (later money operations) | Single owner in M5. |
| H45 | `src/server/lib/csv.ts` | first of 109b / 117b | the other | Serialize. |
| H46 | Umami: `src/app/layout.tsx` (script tag), `public/analytics/before-send.js`, `next.config.ts` rewrites, `docker/analytics.yml`, `docker/postgres/bootstrap/umami.sql` | 118 | (none) | Root layout is a one-ticket-per-wave file (code-app 9). |
| H47 | `file_asset_purpose` values: `donation_proof` (108), `cms_image` (112a), `privacy_export` (115b) | #63 | 108, 112a, 115b | Append; R2 rule if enum. |

### 2.5 Residue codes

Reused: **G1** counsel retention confirmations (single child under #114); **G2** DLT templates for new SMS-capable
messages; **G3** legal/FOA copy sign-off batch per milestone; **G4** Razorpay live mode/KYC (#18); **G5** FOA product
defaults batch per milestone; **G6** VPS deploy of worker-media; **G7** non-prod R2 bucket + CORS; **R-RAZORPAY**,
**R-WORKER**, **R-KEYS** (`issues-M1.md` 3). New for M5:

| Code | Residue | Blocks |
| --- | --- | --- |
| G8 | Accountant/CA rulings batch: FY token in receipt numbers, receipt layout and "no goods or services" line, chart of accounts mapping and public labels, accountant export format (CSV journal vs Tally import), foreign-contribution test (currency != INR vs any international card), cash donations and tax receipts, settlement-fee accounting, transparency page contents (#55 "For the accountant"), financial retention floor | nothing (defaults); production go-live of donations |
| G9 | FOA's tax-exemption registration details (number, validity, approved wording under the Income-tax Act 2025) once FOA holds it | turning `org.has80G` on in production |
| G10 | Razorpay Subscriptions enabled on the test (and later live) account; webhook subscription events added to the staging webhook (`subscription.*`, `refund.*`; verify names) | real-gateway check of #107 on staging |
| G11 | FOA appointments: two finance approvers (distinct people), Designated Safeguarding Lead (+ deputy), grievance officer (name/email into CMS facts), each enrolled with 2FA and granted their role in production | release PR merge of M5 (period lock impossible with one finance user; safeguarding queue unattended) |
| G12 | Umami infra: ingress choice (F18), Cloudflare DNS record and tunnel token or 443 rule + cert, apply `umami.sql` bootstrap on pg-prod, `docker compose -f docker/analytics.yml up -d --wait`, create the two websites, set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (+ `UMAMI_ORIGIN` if proxied) in Vercel staging and Production, confirm page views on staging, confirm the database appears in the next pgBackRest backup | #118 ACs "Umami runs in Compose ... included in backups", "Public page views show up in Umami" |
| G13 | Only if Turnstile is chosen over the self-hosted check: Cloudflare Turnstile site key + secret in Vercel, CSP sources | nothing with the default design |
| G14 | Public R2 bucket (and custom domain/CDN) for derived public images; dedupe with #63's public bucket and #103's gallery residue | preview Lighthouse/visual check of #112 with uploaded images |
| G15 | Counsel: breach notification channel to the Data Protection Board / CERT-In applicability, pre-approved breach notice templates; DSL: safeguarding escalation contacts (SJPU, police), 24x7 on-call (#55 out of scope) | production use of #116b notices; safeguarding sign-off |
| R5-1 | Owner redeploys ONLY the shared non-prod preview worker from the `M5` tip so M5 handlers run on previews (staging worker stays on `main`) (F17) | #110b journey |
| R5-2 | FOA safeguarding sign-off of the public report form, DSL queue and breach process (like M1 R-SAFEGUARD) | M5 release PR merge |

---

## 3. Per-ticket analysis

### #105 (ordinal 50): M5: Ledger with automatic postings

- **Depends on:** explicit: Payments module (#77 captured payments, #79 offline payments, #80 refunds), outbox (#61:
  "through the outbox"), audit (#59: "Every ledger write appears in the audit log"), finance role (#59) behind the staff 2FA
  gate (#60). Native (1, candidates): #80 (alt #77, #79). Inferred hard: #77a, #79, #80a, #61a, #59, #60, #57 (harness).
- **Blocks:** native 3: #106, #109 + one of #108 / #110 / #133. Inferred: every money ticket (#106-#110, #133).
- **AFK class:** A.
- **Human residue:** G8 (chart of accounts names and codes, public labels; non-blocking). G1 (manual-entry descriptions
  and counterparty text may hold personal data: inventory row, retention under the financial floor).
- **Ports / providers:** none external. Internal: `ledger.post(tx, posting)` API; outbox consumers; `AuditLog.write`;
  `Clock` (IST period derivation).
- **New tables / columns (proposed):** `ledger_account` (id, code text unique, name, kind enum `ledger_account_kind`
  (`asset`, `liability`, `income`, `expense`, `equity`), is_system, is_active, public_label, public_group (text registry:
  `income`, `programs`, `fundraising`, `administration`), sort_order, created_by, created_at); `ledger_posting` (id UUIDv7,
  seq bigint identity unique (journal number), occurred_at timestamptz, period_month text `YYYY-MM` IST, source_type text
  (zod registry, not an enum: later tickets add sources without R2 risk), source_id text, posting_kind text, description,
  reversal_of_posting_id null, late_adjustment bool default false, original_period_month null (used by 109a), created_by_user_id
  null (system), created_at; unique (source_type, source_id, posting_kind)); `ledger_line` (id, posting_id, account_id,
  debit_minor bigint default 0, credit_minor bigint default 0, currency char(3) CHECK = 'INR', competition_id null, memo;
  CHECK exactly one of debit/credit > 0). Custom SQL (H2): append-only triggers on both tables; deferred balance constraint
  trigger (F3). Seed accounts (2.2).
- **Use cases (proposed):** `postPaymentCapture`, `postOfflinePayment`, `postRefund` (consumers, system actor),
  `backfillLedgerFromPayments` (system), `createManualEntry` (finance; balanced lines, >= 2), `reversePosting` (finance; mirror
  lines into an open period), `createLedgerAccount`, `updateLedgerAccount`, `deactivateLedgerAccount`, `listPostings` (filters:
  account/category, date range, source), `getPosting`, `trialBalance` (helper for tests and #109).
- **Backfill design:** idempotent by the unique key. Contenders: (a) custom migration inserts one outbox row
  `ledger.backfill_requested` so every environment (template `foa_seed`, previews, staging, production) runs it exactly once
  through the worker; (b) one-shot pg-boss job registered at worker start with a `singletonKey`; (c) owner-run CLI. Prefer (a).
- **Routes / pages:** `/admin/ledger` (postings list with account and date filters, totals row), `/admin/ledger/[seq]`
  (posting detail with lines, reverse action), `/admin/ledger/entries/new` (manual entry with dynamic lines),
  `/admin/ledger/accounts` (categories: create, rename, deactivate).
- **Messages namespaces:** `adminLedger`.
- **Size:** L. Double-entry schema with three SQL guards, three consumers + backfill, manual entries, account management, two
  screens with filters, seed, authz tests.
- **Design uncertainty:** 4. Accounts + lines vs signed single-entry rows with paired categories; posting via outbox consumer
  (ticket) with consumer idempotency by source key vs by outbox event id; backfill mechanism; balance enforcement deferred
  trigger vs application invariant; bigint mode in Drizzle (`mode: "bigint"` vs `"number"`; runtime check what #77 used for
  `amount_minor`, keep consistent).
- **Risk flags:** $, A (finance only, staff 2FA), PD (counterparty in descriptions).
- **Test plan:**
  - Seam 1: world with a competition, an institution batch of 3 captured online (#77 fake gateway) and 1 offline (#79);
    `world.drain()` -> exactly one posting per capture, each with debits = credits (assert via `trialBalance` and a raw SUM
    query); replay the same `payment.captured` outbox event (re-emit and drain) -> posting count and every balance unchanged;
    approve and process a partial refund (#80 fake) -> one refund posting referencing the capture, the capture posting
    byte-identical (select before/after); raw `UPDATE ledger_line` / `DELETE FROM ledger_posting` / `TRUNCATE` raise on
    PGlite; an unbalanced manual entry (debit 100, credit 90) is refused by the use case AND by the deferred trigger when
    inserted raw in a transaction; backfill: insert 2 captured payments with the consumer disabled (or before the migration in
    the fixture), run `backfillLedgerFromPayments` -> 2 postings, run again -> 2; manual entry and account create/rename write
    audit rows (actor, before/after without personal data); period_month derived in IST (capture at 2026-04-30T19:00Z =
    2026-05-01 00:30 IST lands in `2026-05`).
  - Authz: finance passes create/reverse/list; competition_manager, staff_admin (write), member fail; consumers run only as
    system (a user actor calling `postPaymentCapture` fails).
  - Seam 2: none required. `tests/e2e/105-ledger.spec.ts`: seeded finance user (TOTP) opens the 3 ledger pages; axe each,
    both themes.
- **Conflict hotspots:** H34 (owner), H14 (consumes payment events; no edits), H9, H8, H19, H6, H2 (custom SQL), H3.
- **Split:** none (L).
- **Tournament:** yes (U4, $, L). BUILD, 3 contenders, 3 judges: (a) simplest-thing: accounts + lines, application-level
  balance check, consumer per event type; (b) deep-module-first: `Ledger.post(tx, source, lines)` single entry point with a
  declarative source->accounts mapping table (2.2) and deferred SQL balance trigger; (c) risk-first: SQL-first invariants
  (deferred trigger, append-only, unique keys, locked-period hook placeholder) with property-based tests (random postings
  always balance, replays are no-ops). Judges weigh: replay safety, how cleanly #106-#109 and #133 add sources, SQL guards.

### #106 (ordinal 51): M5: One-time donations with receipts

- **Depends on:** explicit: Payments (#77) and Ledger (#105). Native (1): #105. Inferred hard: #77a + #77b (gateway port,
  fake + webhook simulator, Checkout, non-prod fallback adapter, webhook route), #80a (gateway refunds, refund kinds, F7),
  #81 (teen logins for the minor check, F22), #69 (thank-you message, contact-only recipients for guests), #62
  (`org.fcraEnabled`, `org.has80G`), #65 (CSP registry, F6), #73 (inventory file `src/server/privacy/inventory.ts`, M1 F2),
  #58/#75 (encrypted column for donor phone/address). Soft: #100 (only if receipts are worker-rendered PDFs, F5).
- **Blocks:** native 3: #107, #108, #110. Inferred: #117 (finance KPIs later), #133 (payments purpose pattern).
- **AFK class:** A (fallback adapter covers previews; real Razorpay test mode rides on R-RAZORPAY).
- **Human residue:** G8 (FY token, receipt layout, foreign-contribution test, receipt wording "no goods or services were
  provided"); G5 (guest donations allowed: default yes for one-time; min/max/preset amounts; donor types list; whether
  donors may leave a public message: default no); G2 (SMS thank-you, off until DLT); G1 (donor fields retention under the
  financial floor); G4 (live mode). G3 (thank-you and refund template copy).
- **Ports / providers:** `PaymentGateway` (#77; adds nothing for one-time beyond `refund`), Notifications (`notify`),
  Settings, `Clock`, `AuditLog`; `PdfRenderer` (#100) only in the worker-PDF contender.
- **New tables / columns (proposed):**
  - 106a: `donor` (id, user_id null, donor_type enum `donor_type` (`individual`, `corporate`, `csr`), display_name,
    organisation_name null, contact_person null, email citext, email_normalized, phone (encrypted) null, address (encrypted)
    null, created_at; index on email_normalized); `donation` (id, donor_id, frequency enum `donation_frequency` (`one_time`,
    `monthly`), recurring_donation_id null (107), source enum `donation_source` (`online`, `offline`), status
    `donation_status` (all 7 values, 2.1), amount_minor bigint, currency, payment_batch_id null, gateway_payment_id null
    unique, show_on_wall bool default false, wall_name null (default first name + last initial), disclose_organisation bool
    null (required for corporate/CSR, no default), declared_adult bool, declared_indian_source bool (FCRA declaration), fy text
    null, captured_at null, created_at); `receipt` (id, number text unique, fy text, seq int, donation_id unique, issued_at,
    snapshot jsonb, template_version int, cancelled_at null; unique (fy, seq)); `receipt_sequence` (fy text PK, last_seq int;
    `INSERT ... ON CONFLICT DO NOTHING` then `UPDATE ... SET last_seq = last_seq + 1 RETURNING` in the capture transaction:
    gapless, failed payments never consume a number); `receipt_link` (id, receipt_id, token_hash bytea unique, expires_at,
    issued_to (`donor` | `finance`), created_by_user_id null, created_at). Payments: purpose (F4). Refund kinds `foreign_payment`
    (F7). Inventory rows for every donor/donation PD column.
  - 106b: no new tables (pages, Checkout route, receipt rendering, reissue flow).
- **Use cases (proposed):** 106a `startDonation` (public or member; refuses `isMinor` actors with `minor_must_ask_guardian`;
  validates amount bounds; creates donor + pending donation + payment batch purpose donation + gateway order),
  `confirmDonationCheckout` (signature + order fetch; idempotent), capture handler (inside Payments' capture transaction:
  FCRA check -> foreign path, else captured + receipt allocation + outbox `donation.captured`), `handleDonationRefund`,
  `expirePendingDonations` (job), `isMinor` (identity, if missing, F22). 106b `getReceiptByToken`, `reissueReceiptLink`
  (donor who owns it, or finance), `requestReceiptLinkByEmail` (guest: email + receipt number -> new link mailed to the email
  on file; same response whether or not it matches), `listDonations` / `getDonation` (finance).
- **Routes / pages:** `/donate` (form island added to the static page; amount chips, frequency fixed to one-time here, donor
  type, wall opt-in, disclosure radio for corporate/CSR, declarations), `/donate/checkout/[donationId]` (dynamic, nonce CSP,
  Razorpay sources; F6), `/donate/thank-you` (status, receipt link), `/receipts/[token]` (print page; `noindex`, `no-store`,
  `Referrer-Policy: no-referrer`; expired -> "ask for a new link" form), `/receipts/request` (guest reissue form),
  `/admin/donations`, `/admin/donations/[id]` (finance: detail, reissue link). `POST /api/webhooks/razorpay` unchanged
  (dispatcher routes by purpose). Add `/receipts` to `robots.ts` disallow (H4).
- **Messages namespaces:** `donate` (extend; owned by 106b), `donationCheckout`, `receipts`, `adminDonations`.
- **Size:** XL. Payments generalisation, donation machine, gapless FY numbering, FCRA auto-refund path, minor refusal, ledger
  mapping, receipt snapshot + token links + reissue, public form + checkout under CSP + thank-you, admin list, Lighthouse.
- **Design uncertainty:** 3. Payments purpose vs a separate donation payment path; receipt rendering (F5); checkout route
  placement (F6); guest vs signed-in donors and donor dedupe (by user id, else normalised email + donor type).
- **Risk flags:** $, A (webhook idempotency, tokenised receipts), K (minor refusal), C (Checkout), PD, E (donor phone/address).
- **Test plan:**
  - Seam 1 (106a): adult member donates Rs 500 -> pending; webhook simulator `payment.captured` (valid signature) -> donation
    captured, exactly one ledger posting Dr 1100 / Cr 4200 (drain), exactly one receipt `FOA-RCPT-2627-000001`; second donation
    -> `...-000002`; replay the webhook -> no second posting, no second receipt, no second message (fakes' counts identical);
    invalid signature -> rejected, nothing changes; fake clock at 2027-03-31T23:59 IST then 2027-04-01T00:00 IST -> numbers
    `FOA-RCPT-2627-00000n` then `FOA-RCPT-2728-000001`; failed payment consumes no number; foreign capture (`currency: "USD"` or
    `international: true` per G8 default "either") with FCRA off -> gateway fake shows one refund of the full amount, donation
    `refund_pending` -> `refunded` after `refund.processed`, ledger postings Dr 1100/Cr 2100 then Dr 2100/Cr 1100, no receipt,
    donor told why; with `org.fcraEnabled=true` the same capture follows the normal path (behind the flag, spec "specified but
    not built": only the refusal is tested as on); refund of a captured donation (via #80's approval) -> reversal posting,
    receipt `cancelled_at` set, number never reused; signed-in 15-year-old (#81 linked login) `startDonation` -> refused
    `minor_must_ask_guardian`, guardian of that teen allowed; donation transition table: every allowed and forbidden row (2.1).
  - Seam 1 (106b): receipt link expires: `clock.advance(7 days + 1 s)` -> `getReceiptByToken` refused `expired`; donor reissues
    -> new token, old token still expired; finance reissues for any donation; another member refused; guest
    `requestReceiptLinkByEmail` with matching email sends one `receipt_link` message, non-matching sends nothing, both return
    the same response; receipt snapshot frozen: change `SITE`/settings facts after issue -> rendered receipt unchanged.
  - Authz: public/member `startDonation` allowed, minor refused; finance list/detail/reissue allowed; content_manager,
    competition_manager refused.
  - Seam 2: none required by this ticket (M5 journey is 110b). `tests/e2e/106-donate.spec.ts`: `/donate`, `/donate/thank-you`
    (seeded donation), `/receipts/<seeded token>`, `/admin/donations`; axe, both themes; Lighthouse mobile >= 90 on `/donate`
    and `/donate/thank-you` (F23).
  - Real-Postgres optional check (R16): 20 concurrent captures -> 20 distinct gapless numbers (`.cursor/cloud-start.sh`).
- **Conflict hotspots:** H35, H36, H37 (owner), H14, H34, H9, H8, H5, H7, H4, H19, H32 (CSP), H3, H6.
- **Split (XL):**
  - **106a** "Donations core: payment purpose, donation machine, FY receipt numbering, FCRA refusal, minor check, ledger
    mapping" (L). Deps: #105, #77a, #80a, #81, #62, #69.
  - **106b** "Donate page, checkout route, thank-you, receipt links and reissue" (L). Deps: 106a, #77b, #65.
- **Tournament:** 106a yes ($ K A, L, U3): BUILD, 2 contenders, 3 judges: (a) purpose column on payment batch + dispatcher
  (simplest-thing); (b) polymorphic `payment_subject` interface implemented by Registration and Donation (deep-module-first).
  106b yes ($ C, L, U3): BUILD, 2 contenders: (a) on-request receipt rendering from snapshot with hashed-token route (F5);
  (b) worker-rendered PDF in the private bucket + tokenised redirect to a short signed URL. Judges must run `pnpm build`
  (static `/donate` preserved) and the receipt-expiry tests.

### #107 (ordinal 52): M5: Recurring donations

- **Depends on:** explicit: Donations module (#106: "extends the Donations module with Razorpay subscriptions"). Native (1):
  #106. Inferred hard: 106a (+ 106b for the donate form), #69 (failed-charge message), #78/#57 (signed-in dashboard),
  #80a (`recurring_after_cancel` refund kind, F7), #62.
- **Blocks:** none natively. Inferred: #117/#135 KPIs (MRR) later.
- **AFK class:** A.
- **Human residue:** G10 (Subscriptions enabled on the Razorpay account, staging webhook events); G5 (min/max monthly
  amount, whether donors may pause: default no, charge day: provider default); G2; G3 (failed-charge and cancellation
  copy); G8 (one receipt per charge confirmed; FY statement out of scope).
- **Ports / providers:** `PaymentGateway` extended: `ensurePlan(amountMinor, period: "monthly")`, `createSubscription(planId,
  customer, notes)`, `cancelSubscription(id, {atCycleEnd: false})`, `fetchSubscription(id)`; webhook simulator extended with
  subscription events (`subscription.authenticated`, `.activated`, `.charged`, `.pending`, `.halted`, `.cancelled`,
  `.completed`; verify names and payloads against Razorpay docs at runtime, never from memory). Fallback adapter on previews
  simulates authorisation and the first charge.
- **New tables / columns (proposed):** `recurring_donation` (id, donor_id, user_id NOT NULL, amount_minor, currency, status
  `recurring_donation_status` (all 6 values), gateway_plan_id, gateway_subscription_id unique, show_on_wall, wall_name,
  next_charge_at null, failed_attempts int, cancelled_at null, cancelled_by (`donor` | `finance` | `provider` | `system`),
  created_at); `gateway_plan` (amount_minor, period, gateway_plan_id; unique (amount_minor, period)); `recurring_charge_failure`
  (id, recurring_donation_id, gateway_payment_id unique, failed_at, reason_code) (idempotent failure messages, no donation);
  `donation.recurring_donation_id` (exists from 106a), `donation.gateway_payment_id` unique (idempotency per charge).
- **Use cases (proposed):** `startRecurringDonation` (signed-in adult; plan + subscription; returns Checkout params),
  `handleSubscriptionEvent` (one handler per event type; idempotent by gateway payment id / event id),
  `cancelRecurringDonation` (donor or finance; provider cancel immediately; status changes on confirmation or at once with the
  provider's success response: hardening), `listMyRecurringDonations`, `listRecurringDonations` (finance).
- **Routes / pages:** `/donate` (monthly option; sign-in prompt when choosing monthly), `/donate/checkout/[donationId]` reused
  with subscription mode, `/dashboard/donations` (my donations and receipts, recurring list with status and next charge),
  `/dashboard/donations/recurring/[id]` (cancel with confirmation), `/admin/donations/recurring` (finance list).
- **Messages namespaces:** `donorDashboard` (new), `donate` (extend, serialize with 106b), `adminDonations` (extend).
- **Size:** L. Port extension + simulator, subscription machine, charge -> donation + posting + receipt reuse, failure path,
  cancellation race, dashboard pages.
- **Design uncertainty:** 3. Status driven by webhooks only vs optimistic local updates; cancellation race (a charge event
  after local cancel); plan reuse per amount vs plan per subscription; preview behaviour without webhooks.
- **Risk flags:** $, A (webhook idempotency, donor-only cancel), C (Checkout reuse), PD.
- **Test plan:**
  - Seam 1: signed-in adult starts Rs 1,000 monthly -> `pending_authorisation`, fake gateway holds one plan and one
    subscription; simulate `authenticated` -> `active`; `charged` (payment p1) -> one donation `captured`, one posting, receipt
    `...-00000n`; replay `charged` p1 -> nothing new; `charged` p2 next month (`clock.advance(1 month)`) -> second donation,
    next receipt number; `pending` (failed charge f1) -> `past_due`, one `recurring_charge_failed` message, zero donations,
    replay f1 -> still one message; donor cancels from dashboard -> fake gateway records `cancelSubscription(atCycleEnd:
    false)`, status `cancelled`; a late `charged` p3 dated after cancellation -> auto-refund `recurring_after_cancel`, no
    donation, no receipt, ledger untouched or reversed per F7 (assert "no charge is taken": net zero and refund recorded);
    another member cannot cancel it (authz), finance can; minor refused at start; recurring transition table (2.1).
  - Seam 2: none. `tests/e2e/107-recurring.spec.ts`: `/dashboard/donations`, recurring detail; axe both themes.
- **Conflict hotspots:** H35, H36, H37, H14 (port extension), H34, H9, H19, H3; `donate` namespace with 106b.
- **Split:** none (L).
- **Tournament:** yes ($, L, U3). BUILD, 2 contenders, 3 judges: (a) webhook-driven state only, local cancel marks
  `cancel_requested` until confirmed (risk-first); (b) provider call result drives state immediately, webhooks reconcile
  (simplest-thing). Judges weigh the late-charge race and replay safety.

### #108 (ordinal 53): M5: Offline donations and 80G receipts

- **Depends on:** explicit: Donations + receipts (#106), Ledger (#105), Files ("proof (an uploaded file)": #63), settings
  ("80G and PAN live behind the organisation-fact settings": #62), step-up (#60). Native (2): #106 + one of #105 / #63 / #62.
  Inferred hard: 106a (+ 106b for the PAN field on `/donate`), #63a, #60, #62, #58/#75 (encrypted column), #79 (offline method
  enum reuse).
- **Blocks:** none natively.
- **AFK class:** A (draft wording marked "confirm with accountant" satisfies the AC in tests and previews).
- **Human residue:** G9 (registration details and approved wording when FOA obtains the exemption); G8 (cash donation
  limits for tax receipts, PAN requirement thresholds); G1 (PAN retention under the financial floor); G3.
- **Ports / providers:** Files (`ObjectStorage`, scan gate, signed delivery via `can()`), Settings, step-up, `AuditLog`.
- **New tables / columns (proposed):** `offline_donation_detail` (donation_id PK, method (reuse #79's enum `cheque`,
  `bank_transfer`, `cash`), reference, received_on date, proof_file_asset_id, recorded_by_user_id, created_at); `donor.pan`
  (encrypted) + `donor.pan_last4`; `donation.tax_receipt_requested` bool; receipt snapshot's 80G block stores `pan_last4` only,
  full PAN rendered from the encrypted column (F5); settings `org.taxExemption.*` (F21); `file_asset_purpose` +
  `donation_proof` (H47, R2 rule). PAN format CHECK in zod (`^[A-Z]{5}[0-9]{4}[A-Z]$`).
- **Use cases (proposed):** `recordOfflineDonation` (finance; proof required and `clean`; donor details; date; posts and
  allocates the next receipt number in one transaction), `getDonationProofUrl` (finance only), donation form PAN capture when
  `org.has80G` (in `startDonation`, 106a code path), receipt snapshot includes the 80G block iff `org.has80G` and PAN given.
- **Routes / pages:** `/admin/donations/offline/new` (form with proof upload), `/admin/donations/[id]` (proof link, 80G
  status), `/donate` (PAN + tax-receipt checkbox shown only when `org.has80G`), `/admin/settings` (existing; new keys appear
  through the registry).
- **Messages namespaces:** `adminDonations` (extend), `donate` (extend; serialize with 106b/107).
- **Size:** L. Offline entry through the shared receipt path, proof file purpose with finance-only rule, conditional PAN with
  encryption, 80G wording block, settings keys with refinements, seed.
- **Design uncertainty:** 2. Where the 80G wording lives (settings text, F21) and how receipts already issued behave when the
  flag flips (unchanged: snapshots are immutable).
- **Risk flags:** $, E (PAN), A (finance-only proof, step-up on settings), PD.
- **Test plan:**
  - Seam 1: finance records a Rs 25,000 cheque donation with a clean proof -> one donation `captured` (`source=offline`), one
    posting Dr 1000 / Cr 4200, one receipt with the next number (shares `receipt_sequence` with online donations); proof
    `pending`/`quarantined` refused; proof signed URL: finance allowed; staff_admin, super_admin, competition_manager, the donor
    refused (a deliberate deviation from #63's staff-admin default, tested explicitly); with `org.has80G=false`: `startDonation` input with PAN
    is refused/ignored (no PAN column written), receipt snapshot has no 80G block, rendered receipt contains no wording text;
    turning 80G on without fresh step-up refused, with step-up allowed, audit row with before/after (no PAN); with 80G on and
    empty wording refused by the setting refinement; with 80G on: PAN required when the tax-receipt box is ticked, raw SQL shows
    ciphertext in `donor.pan`, receipt carries the configured wording and `pan_last4`; receipts issued before the flip are
    unchanged; inventory test passes with the new columns.
  - Authz: finance records; staff_admin, content_manager, member refused.
  - Seam 2: none. axe: `/admin/donations/offline/new`, `/admin/donations/[id]`, `/donate` with 80G on (seeded setting).
- **Conflict hotspots:** H35, H37, H47, H7, H5, H8, H34, `donate` namespace.
- **Split:** none (L).
- **Tournament:** yes by rule ($ E, L) - rule-triggered, low yield: PAPER round (3 designs of the 80G/PAN boundary: settings
  text + snapshot; versioned receipt templates table; per-receipt rendered wording), 3 judges on the final diff.

### #109 (ordinal 54): M5: Budgets, period lock, two-approver rules and accountant export

- **Depends on:** explicit: Ledger (#105: "This extends the Ledger module"), step-up (#60: "with step-up"), settings ("a
  threshold set in settings": #62), audit (#59). Native (2): #105 + one of #60 / #80. Inferred hard: #105, #60, #62.
- **Blocks:** native 1: #110 (transparency reads locked periods).
- **AFK class:** A.
- **Human residue:** G8 (export format: CSV journal default vs Tally import; columns); G5 (approval threshold Rs 50,000
  default, approval expiry 7 days, budget granularity monthly); G11 (two distinct finance users in production; release-gating).
- **Ports / providers:** none external; step-up guard, Settings, `AuditLog`, `Clock`.
- **New tables / columns (proposed):**
  - 109a: `ledger_period` (month text PK `YYYY-MM`, status `ledger_period_status` (`open`, `locked`), locked_at, locked_by,
    last_unlocked_at, last_unlock_reason); `finance_approval` (id, operation text registry (`period_lock`, `period_unlock`,
    `manual_entry`), payload jsonb (no personal data beyond ids), status `finance_approval_status` (5 values), requested_by,
    requested_at, decided_by null, decided_at, decision_reason, executed_posting_id null; CHECK decided_by <> requested_by);
    custom SQL trigger refusing `ledger_posting` inserts whose `period_month` is locked (F8); consumer change in #105's posting
    API: locked month -> earliest open month + `late_adjustment` (H34); settings `ledger.manualEntryApprovalThresholdMinor`,
    `ledger.approvalExpiryDays`.
  - 109b: `budget` (id, account_id (income/expense only), period_month, amount_minor bigint, notes, created_by, updated_by,
    updated_at; unique (account_id, period_month)); CSV writer (H45, F20).
- **Use cases (proposed):** 109a `requestPeriodLock`, `requestPeriodUnlock` (reason), `approveFinanceRequest` (different
  finance user + step-up; executes), `rejectFinanceRequest`, `cancelFinanceRequest`, `expireFinanceRequests` (job),
  `createManualEntry` wrapped (above threshold -> approval request; below -> immediate), `listPeriods`. 109b `setBudget`,
  `budgetVsActual(periodFrom, periodTo)` (actual: income = credits - debits, expense = debits - credits), `exportLedger(from,
  to)` (journal CSV: seq, date_ist, period, account_code, account_name, debit_inr, credit_inr, narration, source_type,
  source_ref, reversal_of_seq, late_adjustment; totals row; audit row with the range).
- **Routes / pages:** 109a `/admin/ledger/periods` (month list with status, request lock/unlock), `/admin/ledger/approvals`
  (pending requests, approve/reject with step-up). 109b `/admin/budgets` (grid per category x month), `/admin/budgets/report`
  (budget vs actual with variance and % used), `/admin/ledger/export` (date range -> `GET
  /admin/ledger/export.csv?from=&to=` route handler, `no-store`).
- **Messages namespaces:** `adminFinancePeriods`, `adminApprovals` (109a); `adminBudgets` (109b; export labels in
  `adminLedger` is #105's file: use `adminBudgets` or a new `adminLedgerExport` to avoid editing #105's namespace).
- **Size:** XL. Period machine + DB guard + late-adjustment routing, generic two-approver mechanism with step-up and expiry,
  manual-entry threshold, budgets + report, balanced CSV export, four screens, seed with two finance users.
- **Design uncertainty:** 3 (109a): generic approval aggregate vs per-operation pending columns; executing the operation in
  the approver's transaction vs a follow-up job; DB guard vs use-case guard; current-month locking (F8b). 109b: 2.
- **Risk flags:** $, A (separation of duties, step-up).
- **Test plan:**
  - Seam 1 (109a): finance A requests lock of `2026-11` -> period still `open`; A approves own request -> refused
    `self_approval`; finance B approves without fresh step-up -> refused `step_up_required`; B with step-up (fake clock inside
    the window) -> period `locked`, audit rows for request, approval and lock; `createManualEntry` into `2026-11` -> refused
    `period_locked`; raw INSERT of a posting with `period_month='2026-11'` -> trigger raises; a `payment.captured` dated in
    November drained after the lock -> posting in the earliest open month with `late_adjustment=true`,
    `original_period_month='2026-11'`; a correction of a November posting -> reversal in an open month; unlock needs request +
    different approver + reason, audit row; manual entry above threshold -> pending approval, no posting until B approves, then
    exactly one posting; below threshold -> immediate; pending request expires after 7 days (clock + drain); period transition
    table and approval transition table (2.1).
  - Seam 1 (109b): budgets for two categories over two months; `budgetVsActual` equals a hand-computed fixture; export for a
    range: parse the CSV, SUM(debit) = SUM(credit) = trial balance for the range; a narration starting with `=` comes out as
    text `'=...`, negative amounts stay numeric; a range cutting an IST day boundary includes exactly the postings dated in IST
    days within the range.
  - Authz: finance requests/approves/exports/sets budgets; staff_admin, competition_manager, super_admin (if not finance)
    refused for approve; member refused everything.
  - Seam 2: none. axe: the 5 pages (`/admin/ledger/periods`, `/admin/ledger/approvals`, `/admin/budgets`,
    `/admin/budgets/report`, `/admin/ledger/export`).
- **Conflict hotspots:** H34 (posting API change), H44 (owner), H45, H2 (trigger), H7, H8, H9, H19, H6 (two finance users with
  preview-only TOTP seeds, #60 pattern).
- **Split (XL):**
  - **109a** "Period lock, two-approver rule with step-up, locked-period guard and late adjustments" (L). Deps: #105, #60, #62.
  - **109b** "Budgets, budget versus actual and the accountant export" (M). Deps: #105 (not 109a); merge after 109a (nav,
    namespace order).
- **Tournament:** 109a yes ($ A, L, U3): BUILD, 2 contenders, 3 judges: (a) generic `finance_approval` aggregate with an
  operation registry (deep-module-first); (b) per-operation pending state on `ledger_period` and a `pending_manual_entry`
  table (simplest-thing). 109b no (M, U2): single implementation, 3 judges ($).

### #110 (ordinal 55): M5: Transparency page

- **Depends on:** explicit: Transparency read model over the ledger and locked periods (#105, #109), donor wall and
  organisation disclosure (#106), impact page counter (F9; #111b owns the impact page). Native (2): #106, #109 (alt #105 +
  #109). Inferred hard: 106a, 109a, #65 (static CSP), #61 (internal revalidate route only if the worker must revalidate;
  lock/unlock run in Server Actions, F8c). 110b (journey) additionally: 106b, #77b fallback adapter, R5-1.
- **Blocks:** none natively.
- **AFK class:** B (110b's journey needs R5-1; 110a is A).
- **Human residue:** G8 (transparency contents per #55 "For the accountant"; public labels per account); R5-1; R-RAZORPAY
  (journey uses the fallback adapter otherwise; record which in the PR); G3 (page copy).
- **Ports / providers:** none external; read-only queries; `cacheTag('transparency')`.
- **New tables / columns (proposed):** none required. Optional `transparency_snapshot` (period_month PK, data jsonb,
  generated_at) written in the lock transaction, deleted on unlock (contender b). Uses `ledger_account.public_label/
  public_group` (#105).
- **Use cases (proposed):** `getTransparency({fy})` (public; locked months only: income and expense by public label per month,
  totals, FY-to-date; organisations with `disclose_organisation=true` and their FY totals over locked months net of refunds;
  individuals with `show_on_wall=true` by `wall_name` only, no amounts; no budgets), `getFundsRaised({fy})` (same source,
  donation income accounts), invalidation hook called by 109a's lock/unlock execution (`updateTag`).
- **Routes / pages:** `/transparency` (public, static shell + cached read; ROUTES entry + nav label + sitemap; remove from
  `routes.test.ts` unbuilt list, R14), `/impact` and home counters show the computed funds raised (H39). JSON-LD: none required.
- **Messages namespaces:** `transparency` (new); `impact` (one key for the computed counter; serialize with 111b).
- **Size:** XL (with the milestone journey). 110a: read model with strict PD exclusion, cached public page with immediate
  invalidation, funds counter wiring, Lighthouse. 110b: the M5 Seam 2 journey across donation, receipt, two-approver lock and
  public totals.
- **Design uncertainty:** 3 (110a): computed-on-read with tag invalidation vs snapshot table written at lock; month vs FY
  presentation; where the wall reads (live donations vs locked periods: wall is recognition, not a figure; recommended
  locked-period donations only, so nothing appears before its month is published). 110b: 2.
- **Risk flags:** $, PD (donor names, organisation identities), A (unpublished data leakage).
- **Test plan:**
  - Seam 1 (110a): world with donations in Oct and Nov (individual opted in, individual not opted in, corporate disclosed,
    CSR not disclosed), registration fees, one refund, one manual expense; lock October only: `getTransparency` lists
    October, not November; October totals per account equal `trialBalance` for October (assert every account and the grand
    totals); November never appears in the page data (serialize the returned object and the rendered RSC payload with
    `renderToString` of the page component and assert no `2026-11` and no November amounts); donor PD scan: seeded emails,
    phones, PANs, full names of non-opted donors, gateway ids and receipt numbers do not occur anywhere in the serialized data;
    opted-in individual appears by wall name only; disclosed corporate appears with its FY total over locked months; CSR
    undisclosed absent; `getFundsRaised` equals the transparency donations total for the same FY; unlock October (109a) ->
    `getTransparency` no longer lists October and the cache tag was invalidated (spy on the tag helper at the port, not
    internals); late adjustment posted into December appears only when December locks.
  - Seam 2 (110b): `tests/e2e/m5-donation-transparency.spec.ts` on the PR preview: guest donates Rs 500 via `/donate`
    (Razorpay test mode if keys exist, else the fallback adapter), thank-you shows the receipt link, the receipt page shows a
    number matching `^FOA-RCPT-\d{4}-\d{6}$` and the amount; finance A (seeded TOTP) requests lock of the current month,
    finance B approves with step-up; `/transparency` shows the month with a donations total that equals the ledger total
    shown on `/admin/ledger` filtered to that month; `/impact` funds raised equals that total; axe on `/transparency`;
    Lighthouse mobile >= 90 on `/transparency` (F23). Preconditions: R5-1; the journey uses unique donor emails per run
    (`e2e+<runId>@example.test`) and asserts deltas, not absolute totals (the preview DB persists across pushes).
- **Conflict hotspots:** H39 (impact page), H4 (routes, sitemap, routes.test), H34 (read only), H35 (read only), H3, H6
  (seed: two months, one locked).
- **Split (XL):**
  - **110a** "Transparency read model, public page and computed funds raised" (L). Deps: 106a, 109a, #65; wire `/impact` after
    111b if 111b merged first (else edit the static impact page and let 111b rebase).
  - **110b** "M5 Seam 2 journey: donation, receipt, lock, transparency totals" (M). Deps: 110a, 106b, 109a, R5-1.
- **Tournament:** 110a yes ($, L, U3): BUILD, 2 contenders, 3 judges: (a) computed on read inside `"use cache"` with
  `cacheTag('transparency')` and `updateTag` on lock/unlock; (b) snapshot table written in the lock transaction and read by
  the page. Judges run `pnpm build` with `DATABASE_URL` unset and the PD scan test. 110b no (M, U2).

### #111 (ordinal 56): M5: CMS pages, home sections and impact counters

- **Depends on:** explicit: "the one sanitiser" (#86b, M2 F4; or builds it, F12), audit (#59: "every publish is
  audit-logged"), consent documents (#64: "consent documents link to it"). Native (1): one of #64 / #59 / #60 / #86.
  Inferred hard: #59, #60 (content_manager is staff: 2FA), #64, #65 (static CSP; build-output static assertions), #57
  (harness). Soft: #86b.
- **Blocks:** native 2: #112 + one of #113 / #125 / #110. Inferred: #116a (safeguarding page copy), #125 (events extend CMS).
- **AFK class:** A (current repo copy migrates as-is; FOA facts entered later by content managers).
- **Human residue:** G3 (approved legal page text; counsel sign-off of the four legal pages before production); FOA facts
  (email, phone, address, socials, grievance officer contact) entered in the CMS by FOA staff; G5 (which sections are visible,
  impact counter values); G1 (CMS editor names in revisions).
- **Ports / providers:** none external. Internal: sanitiser, `AuditLog`, cache tags (`updateTag`), Draft Mode.
- **New tables / columns (proposed):** `cms_document` (id, key text unique (`home`, `about`, `impact`, `site_facts`,
  `legal_privacy`, `legal_terms`, `legal_safeguarding`, `legal_child_protection`), kind text registry (`home`, `page`,
  `legal`, `impact`, `facts`), created_at); `cms_revision` (id, document_id, version int, body jsonb (zod discriminated union of
  blocks per kind; rich text stored sanitised), status `cms_revision_status` (3 values), created_by, created_at,
  published_by, published_at; unique (document_id, version); partial unique (document_id) WHERE status = 'published'
  generated by drizzle `uniqueIndex().where()`, value exists in the same CREATE TYPE so R2 does not bite);
  `consent_document.legal_revision_id` null (F11; R2-safe nullable column). Impact counters are a body of the `impact`
  document (keys from `COUNTER_KEYS` minus the computed `fundsRaised`, value, as-of date). Settings keys for tax facts (F10)
  if #62 lacks them.
- **Use cases (proposed):** `saveDraft(documentKey, body)` (sanitises on save), `publishRevision(revisionId)` (audit,
  `updateTag(<document tag>)`), `getPublishedDocument(key)` (public, cached, sanitises on render), `getDraftForPreview(key)`
  (content manager, Draft Mode), `listRevisions`, `getOrgFacts()` (cached, tag `org-facts`, F10), readiness check
  `orgFactsComplete()`.
- **Routes / pages:** `/admin/cms` (document list with draft/published state), `/admin/cms/[key]` (editor per kind: home
  layout editor with section toggles and hero text, about blocks, legal rich text, impact counters, site facts), Draft Mode
  entry `/api/cms/preview?key=` (POST from the editor, sets the Draft Mode cookie, redirects to the public URL) and exit
  action; public `/`, `/about`, `/impact`, `/privacy`, `/terms`, `/safeguarding`, `/child-protection-policy` read the CMS
  (legal pages show "Version n, published <date>").
- **Messages namespaces:** `adminCms` (new); `home`, `about`, `impact`, `legal` shrink to UI chrome (labels, headings that are
  not content); content keys move to seed revisions (H39).
- **Size:** XL. Content model with revisions and immutability, sanitiser profile, Draft Mode preview, publish with immediate
  revalidation, seven public pages rewired with a build-without-DB fallback, legal versioning with consent link, facts
  migration off `SITE.org` with the runtime readiness check, editors, seed import of current copy, Lighthouse.
- **Design uncertainty:** 4. Static rendering strategy (F10 a/b), block schema vs single rich-text field per document,
  revision model (revision rows vs document + pending copy), facts split between settings and CMS (F10), legal ownership with
  #64 (F11).
- **Risk flags:** A (stored XSS through rich text; content_manager staff gate), C (static public CSP, no inline scripts from
  content), legal copy, PD minimal.
- **Test plan:**
  - Seam 1 (111a): content manager saves a draft about page whose rich text contains `<script>`, `<img onerror>`,
    `<a href="javascript:...">` -> stored body has none of them (sanitise on save); a revision inserted raw with unsafe HTML is
    stripped by `getPublishedDocument` (sanitise on render); draft is not returned by `getPublishedDocument` (public) but is by
    `getDraftForPreview` (content manager); member and competition_manager refused preview; publish writes one audit row and
    supersedes the previous published revision; updating a published revision fails; legal page publish increments the
    version and the current consent document's link resolves to it; content_manager allowed, staff_admin (if not
    content_manager) and member refused for save/publish.
  - Seam 1 (111b): home layout edit (hide `seasonal`, change hero heading) -> `getPublishedDocument('home')` returns it; impact
    counters edit; `fundsRaised` not editable (refused); `getOrgFacts()` merges settings + facts document; readiness check
    reports missing facts by key; build-time guard removed from `next.config.ts` and replaced (unit test on the readiness
    function).
  - Build check: `pnpm build` with `DATABASE_URL` unset passes and the build output still marks `/`, `/about`, `/impact` and
    the four legal routes prerendered (extend #65's `check-build` assertion list); initial JS per page within budget.
  - Seam 2: none required. `tests/e2e/111-cms.spec.ts`: `/admin/cms`, `/admin/cms/home`, `/admin/cms/legal_privacy`; public
    pages in the smoke set; axe both themes; Lighthouse mobile >= 90 on `/`, `/about`, `/impact`, `/privacy` (F23).
- **Conflict hotspots:** H38 (owner), H39 (owner, 111b), H16 (consent link), H3, H4 (no new routes but `routes.test`), H19,
  H6, `next.config.ts` and `src/app/layout.tsx` (one-ticket-per-wave files, code-app 9).
- **Split (XL):**
  - **111a** "CMS core: documents, revisions, sanitiser profile, Draft Mode preview, publish with audit and revalidation, legal
    pages versioned and linked from consent documents" (L). Deps: #59, #60, #64, #65, sanitiser (#86b or own).
  - **111b** "Home sections, about, impact counters and site facts from the CMS; placeholder guard becomes a runtime check" (L).
    Deps: 111a.
- **Tournament:** 111a yes (U4, A, L): BUILD, 3 contenders, 3 judges: (a) `"use cache"` + `cacheTag` with repo-content
  fallback when no DB at build; (b) static shell + Suspense holes after `connection()`; (c) block-schema-first deep module with
  (a)'s rendering. Judges must run `pnpm build` with `DATABASE_URL` unset and the XSS corpus. 111b yes (U4): BUILD, 2
  contenders (facts in settings + CMS merged vs facts all in CMS with tax facts mirrored from settings).

### #112 (ordinal 57): M5: Blog and stories

- **Depends on:** explicit: CMS (#111: "extends the CMS module"), Files for images (#63), scheduled job (#61: "The scheduled
  publish runs as a job"), derived copies ("resized derived copies, never originals": #85a's `MediaProcessor` and derivative
  registry). Native (2): #111 + one of #63 / #85. Inferred hard: 111a, #63a, #85a, #61a, sanitiser (F12). 112b also: 111b
  (home "stories" section).
- **Blocks:** none natively.
- **AFK class:** B (public images on previews need G7/G14 and worker-media G6 for derivatives; Lighthouse is an AC).
- **Human residue:** G14 (public bucket + domain, `next/image` `remotePatterns` host), G6 (worker-media deployed), G3 (author
  names and bylines), G5 (categories blog vs story; authors shown).
- **Ports / providers:** `ObjectStorage`, `MediaProcessor` (#85a: `processImage`), `JobQueue` (delayed job), `Clock`,
  sanitiser, cache tags.
- **New tables / columns (proposed):** `cms_post` (id, slug text unique (`^[a-z0-9-]{3,80}$`), kind enum `post_kind`
  (`blog`, `story`), title (<= 70, SEO), excerpt (<= 160), body jsonb (blocks; rich text sanitised with the `post` profile),
  cover_file_asset_id, cover_alt (required), author_name, status `post_status` (4 values), publish_at null, published_at null,
  updated_at, created_by); `cms_post_image` (post_id, file_asset_id, alt, position); `file_asset_purpose` + `cms_image` (H47);
  derivative kinds `post_cover_1200`, `post_inline_960`, `og_1200x630` in the public bucket (H21). No original key is ever
  written into a body or rendered.
- **Use cases (proposed):** 112a `createPost`, `updatePost`, `schedulePost` (enqueue delayed job, singleton by post id),
  `unschedulePost`, `publishPost`, `archivePost`, `publishScheduledPost` (job: re-reads status and `publish_at`; no-op if
  changed), `uploadPostImage` (presign + scan + derivatives), `listPosts` (staff). 112b `listPublishedPosts({kind, page})`,
  `getPublishedPostBySlug`, `publishedSlugs()` (cached; proxy and `generateStaticParams`), `importRepoStories` (one-off seed:
  converts `src/content/stories/articles/*.ts` into posts, preserving fact-check blocks and reading helpers).
- **Routes / pages:** `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]` (editor, schedule, publish, preview via Draft
  Mode from 111a); public `/blog`, `/blog/[slug]` rewired (Article/BlogPosting JSON-LD, canonical, OG image from the
  derivative); `src/proxy.ts` story-slug check reads `publishedSlugs()` (cached list with tag `posts`, never a DB query per
  request without cache); `sitemap.ts` posts from the CMS.
- **Messages namespaces:** `adminBlog` (new); `stories` (extend/shrink: chrome only).
- **Size:** XL. Post model + editor + image upload with derivatives + scheduling job + public rewire of index, article,
  proxy, sitemap, JSON-LD + import of existing articles + Lighthouse with remote images.
- **Design uncertainty:** 3. Body format (blocks vs sanitised HTML with an editor library; editor JS only on admin pages),
  scheduled-publish visibility (job flips status + `updateTag` through an internal revalidate route vs cached query with
  `publish_at <= now` and a short `cacheLife` so no worker->Vercel call is needed), proxy slug source (cached list vs
  page-level `notFound()` with status 200 under Cache Components: code-app 3 says proxy rewrite is required for a 404 status).
- **Risk flags:** A (stored XSS), C (no inline scripts, remote image hosts in `img-src`), K (stories about children: photos need
  consent; the editor states it, content manager responsibility), PD low.
- **Test plan:**
  - Seam 1 (112a): schedule a post for `T`; before `T` (`clock.set(T - 1 min)`, drain) -> not public; `clock.set(T)`, drain ->
    `published`, `published_at = T`; unschedule then advance -> stays draft (job no-op); reschedule twice -> one publish;
    draft never returned by public queries; unsafe body stripped on save and render (shared corpus); inline image whose `src`
    is an original key or an external host -> refused on save; upload -> derivatives exist in the public bucket fake,
    original only in the private bucket; content_manager allowed; member, competition_manager refused.
  - Seam 1 (112b): every URL in a published post's rendered HTML, JSON-LD and metadata resolves to a public derivative key
    (walk the HTML; assert none matches an original storage key or the private bucket host); JSON-LD validates as
    `BlogPosting` with headline, datePublished, image, author; metadata title <= 60 with suffix, description <= 160 (zod at
    write + test); imported repo stories render with the same headings as before (snapshot of heading list per slug).
  - Build check: `pnpm build` with `DATABASE_URL` unset passes; `/blog` and `/blog/[slug]` prerendered shells; article JS
    within budget (currently 164.1/170 kB: no editor code on public pages).
  - Seam 2: crawl part of #55 Seam 2 ("no public URL resolves to an original"): `tests/e2e/112-blog.spec.ts` visits `/blog`
    and one post, collects every `src`/`href`/`srcset`, asserts none hits the private bucket or an original key; axe both
    themes on `/blog`, a post, `/admin/blog`, `/admin/blog/[id]`; Lighthouse mobile >= 90 on `/blog` and a post (needs G14 on
    previews; record "Lighthouse with fallback cover images" if G14 open).
- **Conflict hotspots:** H38, H40 (owner), H21, H47, H10/H9 (job), H4 (sitemap), `src/proxy.ts` (one ticket per wave),
  `next.config.ts` `images.remotePatterns` (M2 R10: shared with #85/#103), H29 (editor dependency), H3.
- **Split (XL):**
  - **112a** "Posts: model, editor, images with public derivatives, schedule/publish job" (L). Deps: 111a, #63a, #85a, #61a.
  - **112b** "Public blog and stories from the CMS: index, article, proxy, sitemap, JSON-LD, story import" (L). Deps: 112a,
    111b.
- **Tournament:** 112a yes (U3, A, L): BUILD, 2 contenders, 3 judges (sanitised HTML + lightweight editor vs block JSON with a
  form-based block editor). 112b yes (U3, L): BUILD, 2 contenders (status flip + revalidate route vs cached `publish_at <=
  now` query); judges run `pnpm build` and the original-URL crawl.

### #113 (ordinal 58): M5: Contact inbox

- **Depends on:** explicit: notification port for the acknowledgement (#69), staff roles + audit (#59), rate limits
  (#57's Postgres-backed limiter). Native (2): candidates #111 or #69, + one of #69 / #59 / #57. Inferred hard: #69, #59, #60,
  #57, #65 (CSP for the form island), #73 (inventory file).
- **Blocks:** none natively. Inferred: #116a (reuses the public-form guard, F14).
- **AFK class:** A (self-hosted human check needs no keys).
- **Human residue:** G5 (topic -> team routing defaults: GENERAL -> staff_admin, SCHOOLS -> competition_manager, NGOS ->
  community_manager, ADOPTION -> adoption_coordinator, VOLUNTEERING -> community_manager, DONATIONS -> finance, MEDIA ->
  content_manager; rate limits); G1 (message retention, default 24 months); G3 (acknowledgement copy); G13 only if Turnstile.
- **Ports / providers:** new `HumanCheck` port (fake + self-hosted proof-of-work adapter; Turnstile optional), Notifications
  (contact-addressed email), rate limiter, `AuditLog`.
- **New tables / columns (proposed):** `contact_message` (id, reference text unique `CM-{YY}-{6}` (Crockford, random),
  topic enum `contact_topic` (7 values from R7), name, email citext, phone (encrypted) null, organisation null, subject
  (<= 150), message (<= 5000), status `contact_message_status` (3 values), team text (role key), assigned_to_user_id null,
  ip_hash bytea, created_at, closed_at null); `contact_note` (id, message_id, author_user_id, body, created_at; append-only
  trigger); `human_check_challenge` (id, salt, difficulty, expires_at, used_at) for the self-hosted adapter; routing in setting
  `contact.routing`.
- **Use cases (proposed):** `issueHumanCheckChallenge` (public), `submitContactMessage` (public: honeypot, min fill time,
  human check, per-IP and per-email limits; creates item, routes by topic, emits ack), `listInbox` (staff: own team's items;
  staff_admin all), `getContactMessage`, `assignContactMessage`, `changeContactMessageStatus`, `addContactNote`.
- **Routes / pages:** `/contact` (form island on the static page; topic picker includes "Safeguarding concern" that links to
  `/safeguarding/report` and stores nothing), `POST /api/contact` or a Server Action, `/admin/inbox` (filters: topic,
  status, assignee, team), `/admin/inbox/[id]` (detail, assign, status, notes).
- **Messages namespaces:** `contactForm` (new), `adminInbox` (new); `contact` (edit the "form is coming" line).
- **Size:** L. Public form with abuse controls and a new port, inbox machine, routing, notes with audit, two staff screens,
  ack through notifications, inventory, seed.
- **Design uncertainty:** 3. Human-check approach (F14); team model (role keys vs a `team` table); visibility rule (team
  members vs all staff).
- **Risk flags:** A (public abuse, captcha), C (only if a third-party check), PD (sender details).
- **Test plan:**
  - Seam 1: public submission with a valid check -> one `contact_message` `new`, routed team per topic, one
    `contact_acknowledgement` email to the sender (fake) with the reference and no message body echo; failed check -> refused,
    nothing stored; honeypot filled -> silently dropped (same response); 6th submission from one IP within an hour -> refused
    `rate_limited`; 6th from one email in a day (different IPs) -> refused; stored IP is a hash, never the raw IP (raw SQL);
    assign, status change and note each write an audit row (before/after: status, assignee; never message text); inbox item
    transition table (2.1); routing change in settings applies to new items only; safeguarding topic stores nothing.
  - Authz: routed team member and staff_admin can read/assign/change/note; another team's member refused; member and
    anonymous refused staff use cases.
  - Seam 2: none. axe: `/contact` (form states: empty, error, success), `/admin/inbox`, `/admin/inbox/[id]`; `pnpm build`
    keeps `/contact` prerendered.
- **Conflict hotspots:** H42 (owner), H9, H8, H5, H7, H19, H3, H32 (only Turnstile), `messages/en-IN/contact.json`.
- **Split:** none (L).
- **Tournament:** yes (U3, A, L). BUILD, 2 contenders, 3 judges: (a) self-hosted proof-of-work + server challenge rows; (b)
  Turnstile adapter behind the same port with a fake (CSP sources added on `/contact` only). Default winner criteria: no new
  secret, CSP unchanged, Lighthouse.

### #114 (ordinal 59): M5: Data inventory and retention jobs

- **Depends on:** explicit: settings for retention periods (#62: "The periods are settings"), scheduled jobs (#61),
  audit (#59). Native (2): #62, #61 (alt #59, #73). Inferred hard: #59, #61a, #62, #73 (inventory file exists, M1 F2), #57
  (harness). Ordering note: every PD-bearing ticket merged before #114 must already have inventory rows; #114 backfills any
  gaps it finds on trunk.
- **Blocks:** none natively. Inferred hard: #115 (export and erasure need inventory subject paths and anonymisers, F15/F16);
  every later PD ticket appends entries (H41).
- **AFK class:** A.
- **Human residue:** G1 (every retention period "confirm with counsel"; this ticket hosts the single G1 child that later
  tickets append to); G8 (financial floor, default 8 years after FY end).
- **Ports / providers:** none external. `JobQueue` schedule, Settings, `AuditLog`, `Clock`.
- **New tables / columns (proposed):** inventory stays code (`src/server/privacy/inventory.ts`, typed entries `{table, column,
  category, purpose, subject: {kind, via}, retention: {policyKey, defaultDays, basis, floorDays?, toConfirm: "counsel"},
  action: "delete" | "anonymise" | "retain"}` plus `NON_PERSONAL` allowlist, F15); `retention_policy` registry in code
  (`registerRetentionPolicy({key, table, eligible(now, days), action, anonymise?})`); `legal_hold` (id, subject_type,
  subject_id, reason, placed_by, placed_at, released_at); `retention_run` (id, started_at, finished_at, dry_run, counts jsonb
  (policy key -> deleted/anonymised/held/skipped), status). Settings `retention.<policy>.days` per policy.
- **Use cases (proposed):** `runRetentionSweep` (system; per policy: eligible rows -> skip legal holds and basis floors ->
  delete or anonymise -> counts), `previewRetentionSweep` (super admin; dry run), `placeLegalHold`, `releaseLegalHold`
  (super admin, step-up), `getInventory` (staff_admin/super admin read).
- **Starter policies (runtime check which tables exist on trunk):** expired OTP/verification rows and rate-limit buckets
  (days), message delivery logs (365 days), in-app inbox items (365 days after read), abandoned pending minor registrations
  (7 days), quarantined file assets (30 days), contact messages (24 months, if #113 merged; else #113 registers it).
- **Routes / pages:** none required; optional `/admin/privacy/retention` (inventory table, last runs, legal holds) for
  operability.
- **Messages namespaces:** `adminPrivacy` (only if the optional page ships).
- **Size:** L. Coverage test over the whole schema with backfill of missing M0-M5 entries, retention engine + policy
  registry + legal holds + floors, schedule, settings keys, audit.
- **Design uncertainty:** 4. PD classification (F15 a/b/c); policy registry per module vs central; anonymise semantics per
  table (null vs tombstone values vs keyed hash); interplay with append-only tables (F16).
- **Risk flags:** PD, K (deleting minors' records correctly), A (destructive job), $ (financial floor).
- **Test plan:**
  - Seam 1: coverage test: introspect every table in the barrel; adding a fixture table with an unclassified column makes the
    test fail (meta-test via the pure classifier function); every inventory entry references an existing column; every PD
    entry has subject + retention + action.
  - Retention: seed expired and fresh rows for two policies; `clock.advance(period + 1 day)`, drain the schedule -> expired rows
    deleted/anonymised, fresh rows untouched; a row under `legal_hold` survives; a financial row with a shorter configured
    period survives until the floor (setting below the floor is refused by zod, and a raw lower value is ignored by the
    engine); one audit row `privacy.retention_run` per run with counts only (assert no email, phone, name, id lists in
    `after`); changing `retention.<policy>.days` without step-up refused, with step-up allowed + audit (#62 path); running the
    sweep twice changes nothing the second time.
  - Authz: super_admin places/releases holds and previews; staff_admin reads inventory; finance, member refused; the sweep
    runs only as system.
  - Seam 2: none. axe: the optional page if built.
- **Conflict hotspots:** H41 (owner), H5 (owner of the test), H7, H10, H8, H2 (none: no custom SQL), every PD ticket in flight
  (they must add entries; the merge queue resolves the append-only file).
- **Split:** none (L).
- **Tournament:** yes (U4, L). BUILD, 3 contenders, 3 judges: exhaustive classification (a), column marker (b), heuristics +
  marker (c) (F15). Judges weigh fail-closed behaviour and the cost imposed on later tickets.

### #115 (ordinal 60): M5: Privacy rights requests and grievance queue

- **Depends on:** explicit: guardian links ("for themselves or a linked child": #81), signed link for the export (#63),
  retention rules for erasure exceptions (#114). Native (2): #81 + one of #63 / #59 / #64 / #61. Inferred hard: #114 (not
  native: extraBlocker), #81, #63a, #61a (export and erasure jobs), #69 (status messages), #59, #60 (grievance officer is staff).
- **Blocks:** none natively.
- **AFK class:** A.
- **Human residue:** G11 (grievance officer appointed; name/email in CMS facts); G1 (request retention 3 years after
  closure; due days 30 vs DPDP maximum: counsel); counsel: erasure exceptions list, whether a 13-17 teen may file alone
  (default: access yes, erasure via guardian); G3 (request and completion templates).
- **Ports / providers:** `ObjectStorage` (export ZIP, private, signed delivery), `JobQueue`, Notifications, `AuditLog`, `Clock`;
  zip library (new dependency, pure JS, H29).
- **New tables / columns (proposed):** `privacy_request` (id, reference `PR-{YY}-{6}`, type enum `privacy_request_type`
  (`access`, `correction`, `erasure`), status `privacy_request_status` (6 values), subject_kind (`user` | `participant_profile`),
  subject_id, requested_by_user_id, relation (`self` | `guardian`), correction_details text null, due_at, assigned_to_user_id
  null, resolution_note null, retained jsonb null (category, basis, until), export_file_asset_id null, created_at,
  completed_at); `privacy_request_note` (append-only); `erasure_record` (subject_kind, subject_id, request_id, erased_at) for
  replay after a backup restore (owner procedure); role `grievance_officer` (F13); `file_asset_purpose` + `privacy_export`
  (H47); settings `privacy.requestDueDays`, `privacy.exportLinkHours`, `privacy.exportRetentionDays`.
- **Use cases (proposed):** 115a `submitPrivacyRequest` (self or linked child; a guardian only for a child linked to them),
  `cancelPrivacyRequest`, `listMyPrivacyRequests`, `listGrievanceQueue` (due date, overdue flag computed from the clock),
  `assignPrivacyRequest`, `addPrivacyRequestNote`, `startPrivacyRequest`, `completeCorrection` (applies through owning modules'
  use cases), `rejectPrivacyRequest`, schedule `flagOverdue` (daily in-app nudge). 115b `buildSubjectExport` (job: every
  inventory entry with a subject path -> rows for the subject, decrypt encrypted columns, include the subject's own uploads and
  receipts; `data.json` + files -> ZIP -> private bucket -> signed link valid `privacy.exportLinkHours`), `previewErasure`
  (per entry: delete / anonymise / retain with basis), `executeErasure` (job; idempotent; withdraws consents via #64/#82,
  anonymises per inventory, keeps financial records, writes `erasure_record`, reports retained categories).
- **Routes / pages:** `/dashboard/privacy` (my requests and my children's), `/dashboard/privacy/new`,
  `/dashboard/privacy/[id]` (status, export download link), `/admin/privacy/requests` (grievance queue: due, overdue badge,
  assignee filter), `/admin/privacy/requests/[id]` (notes, start, complete, erasure preview + execute with step-up).
- **Messages namespaces:** `privacyRequests` (new), `adminGrievance` (new).
- **Size:** XL. Request lifecycle + queue with due dates (115a); an export engine and an erasure engine that walk every
  module's data through the inventory (115b).
- **Design uncertainty:** 115a 2; 115b 4 (generic inventory-driven engine vs per-module exporter/eraser registry; file
  inclusion; tombstones vs nulls; consent withdrawal cascade ordering).
- **Risk flags:** PD, K (guardian acting for a child; minors' data deletion), A (export leakage to the wrong subject), E
  (decrypted data in the export), $ (financial records retained).
- **Test plan:**
  - Seam 1 (115a): adult submits access, correction, erasure -> each `submitted` with `due_at = created + 30 days`; guardian
    submits for a linked 9-year-old (allowed) and for an unlinked child (refused); teen self-access allowed (default),
    teen self-erasure refused (default, routed to guardian); grievance queue lists all with due dates; `clock.advance(31
    days)` -> overdue flag true for open ones, false for completed; assign/start/complete/reject write audit rows (no PD in
    before/after); request transition table (2.1).
  - Seam 1 (115b): world with a member who registered, submitted an entry, donated, received messages and a certificate;
    access -> drain -> export ZIP in the storage fake; `data.json` contains every inventory-covered row for that subject (assert
    against a list generated from the inventory for this world) and nothing of a second seeded member (scan for their email,
    phone, names); encrypted columns appear decrypted only inside the ZIP; link expires after 72 h (fake clock); erasure ->
    preview lists retain for donations/receipts/ledger with basis; execute -> profile PII null/tombstoned, entry originals
    deleted from the storage fake, consents withdrawn (outbox `consent.withdrawn` emitted), donation rows kept with donor
    contact retained until the floor, `erasure_record` written; running execute twice changes nothing.
  - Authz: requester and their guardian see their requests; another member refused; grievance_officer works the queue;
    staff_admin refused (unless also grievance officer); erasure execute needs step-up.
  - Seam 2: none. axe: `/dashboard/privacy`, `/dashboard/privacy/new`, `/dashboard/privacy/[id]`, `/admin/privacy/requests`,
    `/admin/privacy/requests/[id]`.
- **Conflict hotspots:** H41 (subject resolvers, anonymisers), H30 (role), H47, H8, H9, H10, H19, H3, H29, H16 (consent
  withdrawal API).
- **Split (XL):**
  - **115a** "Rights requests, guardian requests and the grievance queue with due dates" (L). Deps: #81, #59, #60, #69, #114.
  - **115b** "Subject export behind a signed link and inventory-driven erasure" (L). Deps: 115a, #114, #63a, #61a, #64/#82.
- **Tournament:** 115a yes by rule (K A, L) - rule-triggered, low yield: PAPER round. 115b yes (U4, K, L): BUILD, 3 contenders
  (high risk), 3 judges: (a) generic engine driven only by inventory entries; (b) per-module `exportSubject` / `eraseSubject`
  registry with the inventory as the coverage check; (c) risk-first: erasure as a two-phase job (plan rows persisted, then
  execute) with a dry-run report.

### #116 (ordinal 61): M5: Safeguarding reports and breach log

- **Depends on:** explicit: notification port for breach notices (#69), roles ("Only the safeguarding-lead role": #59 role
  registry + new role, F13), audit (#59). Native (1): #69 or #59. Inferred hard: #59, #60, #69, #57 (rate limiter), #81
  (guardian routing of breach notices about minors), #58/#75 (encrypted column). Soft: #113 (HumanCheck, F14), #111b (the
  safeguarding page copy lives in the CMS after it).
- **Blocks:** none natively. Inferred: #117a (safeguarding queue count for leads, optional).
- **AFK class:** A (release-gated by R5-2).
- **Human residue:** R5-2 (FOA safeguarding sign-off of the form, queue and breach process); G11 (DSL and deputy appointed and
  granted `safeguarding_lead`); G15 (authority channel, notice templates, escalation contacts, on-call); G1 (reports 7 years
  after closure or until the subject turns 25, whichever later, prior art; breach records); G3 (child-friendly form copy,
  confirmation copy).
- **Ports / providers:** `HumanCheck` (#113), rate limiter, Notifications (`required_by_law` notices; guardian routing;
  contact-only recipients), `AuditLog`, `Clock`; encrypted column type.
- **New tables / columns (proposed):**
  - 116a: `safeguarding_report` (id, reference `SG-{YY}-{6}`, anonymous bool, reporter_name (encrypted) null,
    reporter_contact (encrypted) null, reporter_is_child bool, category text registry (child safety concern, suspected abuse,
    inappropriate contact, privacy exposure, bullying, adult conduct, other), description (encrypted), subject_details
    (encrypted) null, status `safeguarding_report_status` (5 values), severity enum `safeguarding_severity` (`critical`,
    `high`, `medium`, `low`) null until triage, assigned_to_user_id null, escalation_reference (encrypted) null, ip_hash,
    created_at, triaged_at, resolved_at, outcome (encrypted) null); `safeguarding_incident_log` (id, report_id,
    author_user_id, kind (`note`, `status_change`, `escalation`), body (encrypted), created_at; append-only trigger); role
    `safeguarding_lead` (H30). No file attachments in v1 (avoid storing abuse imagery; the form says how to report imagery to
    cybercrime.gov.in, as the safeguarding page already does).
  - 116b: `breach_record` (id, title, aware_at, contained_at null, severity, personal_data_involved, minors_affected,
    affected_count, impact text, status `breach_status` (4 values), authority_notified_at null, authority_reference null,
    principals_notified_at null, lead_user_id, created_at); `breach_timeline_event` (append-only: at, kind, note);
    `breach_notification` (breach_id, recipient_user_id, channel, sent_at; unique (breach_id, recipient_user_id, channel)).
    Setting `breach.authorityEmail`.
- **Use cases (proposed):** 116a `submitSafeguardingReport` (public, no account: human check, rate limits, Quick exit page;
  returns no details), `listSafeguardingReports` (lead: reference, category, severity, status, age; no content),
  `viewSafeguardingReport` (lead; writes audit `safeguarding.report_viewed`), `triageReport`, `startInvestigation`,
  `escalateReport`, `resolveReport`, `addIncidentLogEntry`, alert to leads on submit. 116b `recordBreach`, `updateBreach`,
  `addBreachTimelineEvent`, `notifyAffectedUsers(breachId, {userIds | allUsers})` (fan-out job; minors -> guardians;
  idempotent per recipient), `notifyAuthority(breachId)` (email to the configured address, or record a manual reference),
  `closeBreach`.
- **Routes / pages:** `/safeguarding/report` (public and indexable so people can find it; prerendered shell + form
  island; `src/app/@exit/safeguarding/report/page.tsx` Quick exit), `/safeguarding/report/sent` (generic confirmation, no
  details, no reference shown), link from `/safeguarding` (CMS content edit after 111b, else the legal TS module);
  `/admin/safeguarding`, `/admin/safeguarding/[id]` (incident log); `/admin/breaches`, `/admin/breaches/[id]`.
- **Messages namespaces:** `safeguardingReport` (new), `adminSafeguarding` (new), `adminBreaches` (new).
- **Size:** XL. A public anonymous form with abuse controls and Quick exit, a role isolated even from super admin, read-audit,
  encrypted content, incident log, report machine (116a); breach log with timeline, machine and a fan-out to affected users and
  the authority (116b).
- **Design uncertainty:** 116a 3 (isolation mechanism inside `can()` vs a separate guard; encryption scope; alerting without
  content); 116b 2.
- **Risk flags:** K, A (role isolation, public form abuse), PD, E (report content).
- **Test plan:**
  - Seam 1 (116a): anonymous submission with a valid human check -> one report `new`; return value and the confirmation page
    model contain no description, category or reference; one `safeguarding_report_alert` to each safeguarding lead with no
    report content (assert message bodies contain none of the seeded description words); raw SQL shows ciphertext for
    description and reporter contact; `viewSafeguardingReport` as lead -> content + one audit row per view; as super_admin,
    staff_admin, content_manager, competition_manager, finance, member, anonymous -> refused (every role listed: AC "Every
    other role is denied"); every transition writes an audit row with status/severity/assignee only; report transition table
    (2.1); rate limit per IP; honeypot.
  - Seam 1 (116b): super_admin records a breach affecting 3 users (one adult, one teen with guardian, one under-13 managed
    profile's guardian) -> `notifyAffectedUsers` + drain -> notices to the adult and the two guardians, none to the teen,
    delivered even when the recipients opted out of non-required messages (`required_by_law`); replay sends nothing new;
    `notifyAuthority` sends one email to `breach.authorityEmail` (fake) or records the manual reference when unset; breach
    transition table; audit rows.
  - Authz: breach use cases: super_admin (and staff_admin, G5 default) allowed; finance, member refused.
  - Seam 2: none. axe: `/safeguarding/report` (with Quick exit bar), `/safeguarding/report/sent`, `/admin/safeguarding`,
    `/admin/safeguarding/[id]`, `/admin/breaches`, `/admin/breaches/[id]`; `pnpm build` keeps `/safeguarding/report`
    prerendered.
- **Conflict hotspots:** H30 (role), H8 (deny rule), H42 (reuse), H39 (safeguarding page copy), H9, H5, H19, H3, `src/app/@exit/`
  (new file only), H4 (route entry if the form is in public nav/footer).
- **Split (XL):**
  - **116a** "Public report-a-concern form and the safeguarding-lead queue with incident log" (L). Deps: #59, #60, #69, #57,
    (#113 for HumanCheck, soft).
  - **116b** "Breach log with timeline and notifications to affected people and the authority" (M). Deps: #59, #60, #69, #81.
    Independent of 116a.
- **Tournament:** 116a yes (K A, L, U3): BUILD, 3 contenders (high risk), 3 judges: (a) explicit deny list in `can()` for the
  `safeguarding` resource family; (b) a separate safeguarding guard module that `can()` cannot override, with its own
  designation table; (c) risk-first: (b) plus encrypted-by-default content and read-audit as a decorator on every read use
  case. 116b no (M, U2): single implementation, 3 judges (PD).

### #117 (ordinal 62): M5: Admin home queues and basic reports

- **Depends on:** explicit: queue sources: institutions to verify (#73), entries to verify (#92), artwork arriving (#93), results
  to approve (#99), refunds to approve (#80), reports to review (#103 gallery reports; optionally #116a for safeguarding leads);
  report sources: registrations (#75, #78), entries (#85, #86), shortlisted (#89), verified (#92), certificates (#100), fee
  totals (#77 / #105). Native (5): 5 of #73, #80, #89, #92, #93, #99, #100, #103. Inferred hard: all of the above, #59.
- **Blocks:** native 1: #135 (M8 objective reports).
- **AFK class:** A.
- **Human residue:** G5 (queue SLAs, which roles see which queue, report breakdowns); none blocking.
- **Ports / providers:** none external; read queries; CSV writer (H45).
- **New tables / columns (proposed):** none (queue counts and reports are live indexed queries); possibly a persisted age group
  on registration (F24, follow-up only). Audit action `reports.exported` per CSV export.
- **Use cases (proposed):** 117a `getAdminHome(actor)` (queues the actor's roles allow: key, count, oldest age, link),
  `listQueueItems(key)` (when a module has no filtered list screen). 117b `getCompetitionReport(code)` (registrations, entries,
  shortlisted, verified, certificates by route x age group; fee totals from captured payments net of refunds),
  `exportCompetitionReportCsv(code)`.
- **Routes / pages:** `/admin` (home: queue cards linking to each module's filtered list, e.g. `/admin/institutions?status=
  pending_verification`; runtime check per module), `/admin/queues/[key]` (fallback list), `/admin/reports`,
  `/admin/reports/competitions/[code]`, `GET /admin/reports/competitions/[code]/export.csv` (route handler, `no-store`).
- **Messages namespaces:** `adminHome`, `adminReports`.
- **Size:** XL. Six queues across six modules with role filtering (117a), plus per-competition reports with fixtures, fee
  totals and CSV (117b).
- **Design uncertainty:** 2. Queue registry in code with one definition per module file; counts live vs cached 60 s.
- **Risk flags:** A (role-scoped visibility, competition-scoped managers), PD (CSV).
- **Test plan:**
  - Seam 1 (117a): world with 2 institutions pending verification, 3 entries `submitted_to_foa` (+1 individual-route
    `submitted` per #92's rule), 2 artworks requested past dispatch deadline, 1 competition in results pending approval, 2
    refunds requested, 1 open gallery report; each queue count equals its fixture and `listQueueItems` returns exactly those
    items; competition_manager sees institution, entry, artwork, results queues, not refunds; finance sees refunds only;
    content_manager sees gallery reports; safeguarding queue only for safeguarding_lead (if 116a merged); member refused the
    admin home.
  - Seam 1 (117b): hand-computed fixture for one competition (e.g. 30 registrations: 20 school-route, 10 individual across 3 age
    groups; 24 entries; 9 shortlisted; 7 verified; 5 certificates; fees Rs X captured, Rs Y refunded) -> every cell equals the
    fixture; competition_manager scoped to competition A refused for B; CSV equals the on-screen numbers, contains only
    aggregate cells (no names, emails, phones, codes of participants), neutralises a competition name starting with `=`;
    export writes an audit row.
  - Seam 2: none. axe: `/admin`, `/admin/queues/[key]`, `/admin/reports`, `/admin/reports/competitions/[code]`.
- **Conflict hotspots:** H43 (owner), H45, H19 (`/admin` landing may exist from #59: runtime check; replace its placeholder),
  H8, H3; read-only use of many modules' queries (add exported query functions in those modules: small edits in H22, H14,
  M3/M4 module files).
- **Split (XL):**
  - **117a** "Admin home queues by role" (M). Deps: #59, #73, #80, #92, #93, #99, #103 (+116a optional).
  - **117b** "Per-competition reports and CSV export" (L). Deps: #75, #77, #78, #85, #89, #92, #100, #105.
- **Tournament:** 117a no (M, U2). 117b yes by rule (A, L) - rule-triggered, low yield: PAPER round only, 1 judge + PD skeptic.

### #118 (ordinal 63): M5: Cookieless web analytics (Umami)

- **Depends on:** explicit: CSP (#65: "allowed by the CSP"), Compose stack and backups (VPS: pgBackRest, #67 restore drill
  already merged on `M0`), signed-in pages (#57) and children (#81) for suppression. Native (0). Inferred hard: #65, #57.
  Soft: #81 (minor marker if suppression is minors-only, F19), #66 (uptime check for Umami), #70 (Lighthouse runner, F23).
- **Blocks:** none. Can be claimed as soon as #65 merges (earliest M5 unit).
- **AFK class:** B (3 of 6 ACs are verifiable only on the VPS/staging: G12).
- **Human residue:** G12 (whole deploy path). Counsel: confirm cookieless page views on public pages are acceptable under DPDP
  without consent (non-blocking).
- **Ports / providers:** Umami (self-hosted, pinned exact image tag, verify the current major and its Postgres requirements
  at runtime); Cloudflare Tunnel or Caddy (F18).
- **New tables / columns:** none in the app database. Umami database `umami` on pg-prod (role `umami`, bootstrap SQL in
  `docker/postgres/bootstrap/umami.sql`, owner applies).
- **Files / infra (proposed):** `docker/analytics.yml` (Umami service with `healthcheck` against its heartbeat endpoint
  (verify path), `cloudflared` service if chosen, resource limits, `restart: unless-stopped`; a separate compose file so
  `docker/workers.yml` (H28) and `docker/compose.yml` (`name: foa-vps`) are untouched), `docker/README.md` section,
  `src/components/analytics/umami-script.tsx` (renders `<script defer src="/stats/script.js" data-website-id=...
  data-host-url="/stats" data-domains="<staging host>,<production host>" data-before-send="foaBeforeSend">` only when
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set), `public/analytics/before-send.js` (self-hosted handler, F19), `next.config.ts`
  rewrites `/stats/:path*` -> `UMAMI_ORIGIN` (only when set), CSP registry: no new host when proxied (`'self'` only).
- **Routes / pages:** none new; script in the public static shell only (root layout or a public layout segment; signed-in
  layouts never include it).
- **Messages namespaces:** none.
- **Size:** M. Compose service + bootstrap SQL + docs (agent part), script component with env gating, before-send handler,
  rewrites, CSP, tests; deployment is residue.
- **Design uncertainty:** 3 (ingress F18; suppression of signed-in minors on public pages F19; one instance vs two).
- **Risk flags:** C, K (no tracking of children), V (new service on the production VPS), PD (IP handling inside Umami).
- **Test plan:**
  - Unit: the script component renders nothing when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is unset (preview, local) and renders the
    tag with the expected attributes when set; `data-domains` contains only staging and production hosts; signed-in layouts
    (`/dashboard`, `/account`, `/institution`, `/admin`, `/judge`, auth pages) do not include the component (render each layout
    and assert absence, or a static import graph test); CSP builder output for public pages contains no third-party host;
    before-send handler returns false when the marker is present (pure function test).
  - Build check: `pnpm build` passes; public pages still prerendered; initial JS budget unchanged (the script is a separate
    static file, not a Next chunk: assert `check:build` totals unchanged).
  - Seam 2 (preview): `tests/e2e/118-analytics.spec.ts`: on the preview no request goes to `/stats/*` or any analytics host
    across the smoke pages (request listener), no cookie is set by analytics, zero CSP violations; Lighthouse mobile >= 90 on
    public pages (F23).
  - Staging (human, G12): page view appears in Umami for `shipped-it.dev`; `docker compose -f docker/analytics.yml ps` shows
    healthy; next pgBackRest backup lists the `umami` database.
- **Conflict hotspots:** H46 (owner), `src/app/layout.tsx` (one ticket per wave with #57, #65, #66), `next.config.ts`
  (#65, #66, #111b), H32/H12 (CSP), `docker/README.md` (#61, #63, #66, #68).
- **Split:** none (M).
- **Tournament:** yes (U3): PAPER round only (3 designs: Caddy + 443; Cloudflare Tunnel; tunnel + first-party proxy), 3 judges
  (C, K flags); BUILD is pointless without the VPS.

---

## 4. Milestone summary

### 4.1 Counts

| Measure | Value |
| --- | --- |
| Tickets | 14 (#105-#118, ordinals 50-63) |
| AFK class | A = 11 (#105, #106, #107, #108, #109, #111, #113, #114, #115, #116, #117); B = 3 (#110, #112, #118); C = 0 |
| Size (tickets) | M = 1 (#118); L = 5 (#105, #107, #108, #113, #114); XL = 8 (#106, #109, #110, #111, #112, #115, #116, #117) |
| XL splits | #106 (106a L, 106b L), #109 (109a L, 109b M), #110 (110a L, 110b M), #111 (111a L, 111b L), #112 (112a L, 112b L), #115 (115a L, 115b L), #116 (116a L, 116b M), #117 (117a M, 117b L) |
| Work units after splits | 22: M = 109b, 110b, 116b, 117a, 118; L = the other 17 |
| Design uncertainty (units) | 4 = 105, 111a, 111b, 114, 115b; 3 = 106a, 106b, 107, 109a, 110a, 112a, 112b, 113, 116a, 118; 2 = 108, 109b, 110b, 115a, 116b, 117a, 117b |
| Risk flags | $ = 105, 106a, 106b, 107, 108, 109a, 109b, 110a, 110b; K = 106a, 114, 115a, 115b, 116a, 118 (112a content); A = 105, 106a, 106b, 107, 108, 109a, 110a, 111a, 112a, 113, 114, 115a, 115b, 116a, 117a, 117b; E = 106a, 108, 115b, 116a; C = 106b, 107, 111a, 112a, 113 (Turnstile only), 118; V = 118; PD = all but 109b and 118's app part |
| Tournaments | 18 of 22 units. BUILD 3-way: 105, 111a, 114, 115b, 116a. BUILD 2-way: 106a, 106b, 107, 109a, 110a, 111b, 112a, 112b, 113. PAPER only: 108, 115a, 117b (rule-triggered, low yield), 118 (infra). None: 109b, 110b, 116b, 117a (single implementation; 3 judges where flagged) |
| Native edges | blocked_by 24 (9 internal in the preferred fit), blocking 10 (#117 -> #135 outgoing) |

### 4.2 Unit table (scheduling input; hard deps = native candidates + inferred extraBlockers)

| Unit | Child title (proposed) | Size | U | Flags | Tournament | Hard deps (M0-M4 + M5) |
| --- | --- | --- | --- | --- | --- | --- |
| 118 | (#118 itself) Cookieless web analytics (Umami) | M | 3 | C K V | PAPER | #65 #57 (G12 for 3 ACs) |
| 105 | (#105 itself) Ledger with automatic postings | L | 4 | $ A | BUILD 3 | #77a #79 #80a #61a #59 #60 |
| 114 | (#114 itself) Data inventory and retention jobs | L | 4 | PD K A $ | BUILD 3 | #59 #61a #62 #73 |
| 106a | Donations core: purpose, machine, FY receipts, FCRA refusal, minor check | L | 3 | $ K A E | BUILD 2 | 105 #77a #80a #81 #62 #69 |
| 109a | Period lock, two-approver rule, locked-period guard | L | 3 | $ A | BUILD 2 | 105 #60 #62 |
| 109b | Budgets, budget vs actual, accountant export | M | 2 | $ | no | 105 (merge after 109a) |
| 106b | Donate page, checkout route, thank-you, receipt links | L | 3 | $ A C | BUILD 2 | 106a #77b #65 |
| 107 | (#107 itself) Recurring donations | L | 3 | $ A C | BUILD 2 | 106a 106b #69 #80a |
| 108 | (#108 itself) Offline donations and 80G receipts | L | 2 | $ E A | PAPER | 106a #63a #60 #62 (106b for the PAN field) |
| 110a | Transparency read model, page, computed funds raised | L | 3 | $ PD | BUILD 2 | 106a 109a #65 |
| 110b | M5 Seam 2 journey | M | 2 | $ | no | 110a 106b 109a + R5-1 |
| 111a | CMS core, preview, publish, versioned legal pages | L | 4 | A C | BUILD 3 | #59 #60 #64 #65 sanitiser (#86b or own) |
| 111b | Home, about, impact counters, site facts from CMS | L | 4 | A | BUILD 2 | 111a |
| 112a | Posts: model, editor, public derivatives, schedule job | L | 3 | A C | BUILD 2 | 111a #63a #85a #61a |
| 112b | Public blog from the CMS, proxy, sitemap, import | L | 3 | A | BUILD 2 | 112a 111b (G14 for preview images) |
| 113 | (#113 itself) Contact inbox | L | 3 | A PD | BUILD 2 | #69 #59 #60 #57 #65 (111a if native) |
| 115a | Rights requests and grievance queue | L | 2 | PD K A | PAPER | #81 #59 #60 #69 114 |
| 115b | Subject export and erasure | L | 4 | PD K A E $ | BUILD 3 | 115a 114 #63a #61a #64 #82 |
| 116a | Public report form and safeguarding-lead queue | L | 3 | K A PD E | BUILD 3 | #59 #60 #69 #57 (113 soft) |
| 116b | Breach log and notifications | M | 2 | PD A | no | #59 #60 #69 #81 |
| 117a | Admin home queues by role | M | 2 | A | no | #59 #73 #80 #92 #93 #99 #103 (116a optional) |
| 117b | Per-competition reports and CSV | L | 2 | A PD | PAPER | #75 #77 #78 #85 #89 #92 #100 105 |

### 4.3 Internal ordering (rolling waves)

```text
earliest (as soon as their M0/M1 deps merge; F2 branch rule creates M2..M5 if missing):
  118 (after #65)          105 (after #80a)          114 (after #62, #61a, #73)        116b (after #81)
wave M5-1:  106a, 109a (after 105)   111a (after #64, #65, sanitiser)   113 (after #69)   116a (after #69; 113 soft)
wave M5-2:  106b (after 106a)   109b (after 109a merged)   110a (after 106a + 109a)   111b, 112a (after 111a)
            115a (after 114 + #81)
wave M5-3:  107, 108 (after 106b; merge 107 then 108)   112b (after 112a + 111b)   115b (after 115a)
wave M5-4:  110b journey (after 110a + 106b + R5-1)
last:       117a, 117b (after M2-M4 sources merge: #92, #93, #99, #100, #103)
            -> M5 milestone PR (stacked on M4) lists Closes #105 ... Closes #118
```

Critical path inside M5 (finance, defines the milestone journey): #80a -> 105 -> 106a -> 106b -> 110b, with 109a -> 110a
joining before 110b (5 serial units). The milestone's completion is bounded by 117a/117b (need M4). Peak M5 concurrency: 6
(wave M5-1/M5-2), at W = 6.

Serialization rules (charter decision 4 applied to M5):

- 106a, 106b, 107, 108 share H35/H37 and the `donate` namespace: merge one at a time in that order.
- 105, 106a, 109a, 107, 108 all touch H34 (ledger mapping or posting API): 105 first; 109a's posting-API change merges before
  any later source mapping (rebase others).
- 106a changes the Payments module (H14/H36): serialize with any still-open M1 payments unit (#77b/c, #79, #80b).
- 111a -> 111b -> (112b, 110a's impact wiring, 116a's safeguarding copy edit): H39 owner first; others rebase.
- 112b edits `src/proxy.ts`: one proxy ticket per wave (with #70, #112 in code-app 9).
- 113 owns H42; if 116a is claimed first, 116a builds the module and 113 reuses it (first to land owns).
- 115a and 116a both add role values (H30): serialize their migrations; each value in its own migration (R2).
- 109b and 117b share the CSV writer (H45): first to merge owns.
- 118 edits `src/app/layout.tsx` and `next.config.ts`: never in the same wave as 111b (next.config placeholder guard) or any
  open #65/#66 follow-up.
- Every PD ticket in flight while 114 merges must add inventory rows that satisfy 114's test after rebase (merge queue re-runs
  `pnpm test` on the final commit).

### 4.4 Human residue roll-up (children labelled `ready-for-human` + `factory:needs-human`, deduped)

Blocking an AC, the milestone journey or the release PR:

- **R5-1** Redeploy ONLY the shared non-prod preview worker from the `M5` tip after 105/106a/109a merge; confirms ledger
  postings appear on a preview. Blocks 110b. Never check out `M5` in `/srv/foa` (the production clone; timers run its
  scripts as root) and never move `worker-staging` off `main` (staging's database is migrated by `main` and lacks M5
  tables). The wizard builds the image from the `M5` tip in a separate checkout and restarts one service (`docker compose
  -f <checkout>/docker/workers.yml up -d --build --wait worker-preview`; never `down`, never `-v`), then checks a preview's
  `/admin/ledger`. M5 schedule handlers (retention sweep, overdue flags) must no-op on preview databases whose tables do not
  exist yet (`to_regclass` check), because the same worker serves M1-M4 ticket previews. Owner. Dedupe with M1 R-WORKER.
- **G12** Umami deploy path (F18). Blocks #118 ACs 1-2 (compose/backups, page views). Wizard-walkable (DNS, tunnel token,
  bootstrap SQL, compose up, website creation, Vercel env vars, staging check).
- **G11** FOA appointments and role grants: two finance approvers, DSL + deputy, grievance officer. Blocks the M5 release PR
  merge (period lock, safeguarding queue, grievance queue need people).
- **R5-2** FOA safeguarding sign-off (report form copy, DSL queue, breach process). Blocks the M5 release PR merge.
- **R-RAZORPAY** (exists, M1): keys in Vercel Preview + staging; 110b uses the fallback adapter otherwise (record which).
- **G14** Public bucket + domain for derived images (dedupe with #63/#103 residue). Blocks real-image Lighthouse on 112b
  previews only.

Non-blocking (tickets merge with defaults; batch per milestone):

- **G8** accountant batch (one child): FY token, receipt layout, chart of accounts and public labels, export format, foreign
  test, cash/tax receipts, settlement fees, transparency contents, financial retention floor.
- **G9** tax-exemption registration details and approved wording (when FOA holds it).
- **G10** Razorpay Subscriptions enablement + subscription webhook events on staging.
- **G5** FOA defaults (one child listing setting keys): donation amounts and presets, guest donations, recurring bounds,
  manual-entry approval threshold and expiry, budget granularity, contact routing and rate limits, request due days, breach
  staff roles, queue SLAs and visibility, impact counters shown, home sections visible.
- **G3** copy sign-off (one child): donate flow, thank-you/refund/receipt-link templates, receipt text, recurring messages,
  legal pages (counsel), CMS seed content, contact acknowledgement, safeguarding form (child-friendly) and confirmation,
  rights-request templates, breach notices (with G15).
- **G15** counsel/DSL: breach authority channel and templates, escalation contacts, on-call.
- **G1** retention rows for every new PD field (hosted under #114): donors, donations, PAN, offline proofs, receipts snapshots,
  ledger descriptions, contact messages and notes, CMS editor fields, privacy requests and notes, exports, safeguarding reports
  and logs, breach records.
- **G2** DLT templates for SMS-capable messages (donation thank-you, failed charge, request updates); SMS stays off.
- **G13** only if Turnstile is chosen.
- Operational (not tickets): finance enters real budgets and opening balances (`3000 accumulated_fund`), content managers
  enter FOA facts and approved copy, FOA decides public labels for expense accounts.

### 4.5 Cross-milestone dependencies

Needed from M0: #57 (harness, rate limiter, sessions), #59 (roles, `can()`, audit; role registry for two new roles), #60
(staff 2FA, step-up), #61 (outbox, pg-boss schedules, drain, workers), #62 (settings: 80G, FCRA, thresholds, retention),
#63 (Files: proof, CMS images, exports), #64 (consent documents, legal link, withdrawal API), #65 (CSP registry). From M1:
#69 (notifications, contact-only recipients, `required_by_law`), #73 (inventory file), #75/#58 (encrypted column type,
`PII_HASH_KEY`), #77 (gateway port, fake + simulator, Checkout, fallback adapter, webhook route), #78 (participant dashboard),
#79 (offline payments), #80 (refunds, refund kinds), #81 (guardian links, teen logins). From M2: #85a (MediaProcessor,
derivatives), #86b (sanitiser), #89, #92 (reports, queues). From M3: #93 (artwork queue). From M4: #99 (results queue), #100
(certificates in reports; `PdfRenderer` only if receipts render in the worker), #103 (gallery reports queue).

M5 feeds later milestones:

| M5 unit | Later tickets that need it | What |
| --- | --- | --- |
| 105, 109a | #133 (auction ledger postings), #135 (donation and finance reports) | ledger posting API (H34), period lock rules |
| 106a | #133 (payments purpose `auction`), #135 | payments purpose/dispatcher (H36), donations data |
| 111a | #125 (events and campaigns extend the CMS), #126 | CMS documents, block registry (H38), revalidation pattern |
| 112a | #129 (adoption photos reuse public derivative purposes) | public derivative kinds, scheduled publish job pattern |
| 113 | #125, #134 (public forms) | HumanCheck + rate-limit module (H42) |
| 114 | every PD ticket in M6-M8 (`issues-M6-M8.md` H5, G1) | inventory coverage test, retention policy registry (H41) |
| 115b | M6-M8 PD tickets | subject resolvers and anonymisers each new module must register |
| 116a | #123/#124 (volunteer safeguarding declarations), #130 | safeguarding-lead role, report intake |
| 117a, 117b | #135 (objective reports), M6-M8 queues (volunteer, NGO, adoption, auction follow-ups) | queue registry (H43), report and CSV patterns (H45) |
| 118 | #135 (web stats in objective reports) | Umami instance and website ids |

Cross-milestone hazards to carry forward: F2 branch-creation rule for early M5 claims; F13 role-enum migrations (M2's
`foa_verifier`, M5's `safeguarding_lead`, `grievance_officer`); F15 fail-closed inventory test cost on every later schema
change; F16 append-only tables vs erasure; F17 worker version skew for every milestone journey that depends on a new handler;
F20 CSV safety for #135's exports; F23 Lighthouse runner for #125, #127-#129, #131.
