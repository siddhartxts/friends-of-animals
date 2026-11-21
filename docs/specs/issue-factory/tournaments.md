# Split and tournament register (input to the execution spec)

Sources: issues-M*.md (size, design uncertainty U, risk flags, angles), CHARTER.md decisions 5, 6, 11 and its Verified /
Skill-invocation / History sections, rubrics-input.md §4 (T1-T8), history-b.md B6, code-infra.md. Hardening re-scores every unit
at runtime and overrides this register per 2.2.

## 0. Rules applied

- **Eligibility:** U >= 3, or a charter flag (A auth/security, $ money/ledger, K minors/safeguarding, E encryption, C CSP) on a
  mechanism the unit itself builds AND size >= L. V = infra/VPS, not a charter flag; calling `can()` from new staff screens is
  not a flag (70a). `r` after U = qualifies by the flag clause only.
- **Kind:** `P+B` = PAPER round, then BUILD round for the top N designs. `P` = PAPER only: r-units whose contested part is
  wording or process (#93, 108, 115a, 117b) and #118, whose BUILD needs the owner's VPS.
- **PAPER:** N+1 designs (3; 4 before a 3-way BUILD; 3 for `P`), one `codebase-design` (DESIGN-IT-TWICE) agent per angle; the
  extra design is the hardening agent's best alternative unless the table names one. Posted as one "PAPER round" comment on
  the unit's issue (no branch). Judged on T1-T7 (T4 = test-plan feasibility), Copeland; top N advance.
- **BUILD:** N contenders, one runner session each, on `proto/<n>-a|b|c` (n = the unit's issue number; the child's for split
  units) cut from the milestone tip; each TDDs only the contested core (interfaces, core use cases, their Seam 1 tests). Judged
  on T1-T8. Winner -> `ticket/<n>-<slug>` plus up to 3 named grafts. Every contender is tagged `proto-archive/<n>-<letter>` at
  its judged commit and pushed; the branch is then deleted (T2) or listed in HUMAN-HANDOFF.md (T1).
- **N:** per-ticket analysis, with overrides #58 -> 3 (U4, A + E; research "2-3"), 61a -> 2 (no charter flag; the NOTIFY design
  stays a PAPER extra), 106a -> 3 (flags $ K A E; research 2). Units added at runtime: 3 if U >= 4 with a charter flag, else 2.
- **J:** 3 judges per PAPER round and per BUILD round (rubric r1), spawned by the Orchestrator, entries anonymised `Entry 1..k`,
  one call per judge covering every pair in both orders; +1 tie-break judge when Copeland, weighted T-sum and added lines tie.
- **S = U x R** (budget cuts): R = top flag weight (K or $ = 3; A, E or C = 2; none or V = 1), +1 if >= 3 charter flags, max 4.

## 1. XL split register
### 1.1 Parent handling (once per XL ticket, when its first child is claimed)

1. Split as 1.2 lists; an unlisted ticket that hardening grades XL gets 2-4 children by the same rules. Dedupe first:
   `issue_read` method `get_sub_issues` on the parent; skip any child whose title already ends with `(<unit>)`.
2. Create each child: `issue_write` method `create`; title from 1.2 (the `M<k>: ` prefix is the only milestone grouping);
   labels `ready-for-agent`, `factory:queued`; body `Part of #<parent> (unit <unit>).`, the parent ACs it covers copied
   verbatim with parent numbering ("AC 1, 2, 3 of #70"), a `Blocked by:` line, the Claude Code footer.
3. Link: `sub_issue_write` method `add`, `sub_issue_id` = the child's REST `id` (not its number). Parent stays under #55.
4. Edges: a child inherits the parent's blockers plus its sibling order (ledger `extraBlockers`); native edges only from T2
   (`gh api -X POST repos/siddhartxts/friends-of-animals/issues/<child>/dependencies/blocked_by -f issue_id=<REST id>`).
   Dependents of a split parent wait for all its children unless 1.3 re-points them.
5. Parent: add `factory:split` (the frontier skips it), keep `ready-for-agent`, stay open as the umbrella; its status comment
   lists the children as checkboxes. Each child gets its own ticket branch, draft PR (`Refs #<child>`) and merge commit.
6. Milestone PR: parent checklist line with nested child lines, one `### #<child> <title>` section per merged child,
   `Closes #<parent>` plus one `Closes #<child>` per child. Last child merged -> parent `factory:merged-trunk`. The owner's
   merge closes parent and children. A `factory:failed` child leaves the parent unticked and named in Merge Danger.

### 1.2 Splits (31 parents -> 71 children; size per child; `->` serial, `∥` parallel)
| Parent | Children: unit, child issue title | Order |
| --- | --- | --- |
| #57 | 57a `M0: Seam 1 harness and composition root (57a)` L; 57b `M0: Email one-time-code sign-up and sign-in (57b)` L; 57c `M0: Sessions: list and revoke (57c)` M | a -> b -> c |
| #59 | 59a `M0: Roles, can() policy and append-only audit log (59a)` L; 59b `M0: Roles, audit and dashboard-switcher screens (59b)` L | a -> b |
| #61 | 61a `M0: Outbox, JobQueue port, relay and welcome email (61a)` L; 61b `M0: Worker runtime, workers.yml and preview discovery (61b)` L | a -> b |
| #63 | 63a `M0: Private files: storage port, presign and signed delivery (63a)` L; 63b `M0: Malware scan, ClamAV sidecar and quarantine (63b)` M-L; 63c `M0: File prefixes, purge on drop and files journey (63c)` M | a -> b -> c |
| #66 (M, exception) | 66a `M0: App error tracking with personal-data scrubber (66a)` S-M; 66b `M0: Worker error tracking, heartbeat, uptime and log retention (66b)` S-M | a; b after 61b |
| #70 | 70a `M1: Competitions module: create, edit, preview, publish (70a)` L; 70b `M1: Public competition pages read the database (70b)` M-L | a -> b |
| #75 | 75a `M1: Institution registers for a competition (75a)` M; 75b `M1: Enrol students: participant profile, age category, encrypted fields (75b)` L | a -> b |
| #77 | 77a `M1: Payments core: order per batch, idempotent capture, registration numbers (77a)` L; 77b `M1: Razorpay adapter, Checkout island and webhook route (77b)` L; 77c `M1: Bulk-payment Seam 2 journey (77c)` M | a -> b -> c (c also after #76) |
| #80 | 80a `M1: Refund requests, finance approval and partial refunds (80a)` L; 80b `M1: Cancel a competition and refund every capture (80b)` M-L | a -> b |
| #81 | 81a `M1: Guardian sign-up and children: managed under-13, linked 13-17 (81a)` L; 81b `M1: Minor registrations wait for the guardian (81b)` L | a -> b |
| #83 | 83a `M1: Code-link guardian consent with one-time code (83a)` L; 83b `M1: Signed-form consent and review queue (83b)` L | a ∥ b (serialize dashboard edit) |
| #84 | 84a `M2: Announcements to confirmed registrants (84a)` L; 84b `M2: Reminder schedules and the submission reminder (84b)` L | a; b after 85b |
| #85 | 85a `M2: Image derivatives and metadata stripping in worker-media (85a)` L; 85b `M2: Entries module and individual image submission (85b)` L | a -> b (a may run during M1) |
| #86 | 86a `M2: Video entries: transcode, poster and limits (86a)` L; 86b `M2: Essay entries and the rich-text sanitiser (86b)` M | a ∥ b, both after 85b |
| #89 | 89a `M2: School round: opening, panel, positions, shortlist picks (89a)` L; 89b `M2: Certify judging and finalise the school round (89b)` M | a -> b |
| #91 | 91a `M2: Shortlist-only scope: coordinator-created shortlisted entries (91a)` L; 91b `M2: Seam 2 journey for both submission scopes (91b)` M | a -> b |
| #95 | 95a `M3: FOA rounds: configuration and round status machine (95a)` M-L; 95b `M3: Judge invitations and onboarding (95b)` L; 95c `M3: Round pool and assignment with conflict refusals (95c)` M | a -> b -> c (c also after #94) |
| #99 | 99a `M4: Results release: two-person approval, scheduled publishing (99a)` L; 99b `M4: Public results page with consented credits (99b)` M-L | a -> b |
| #100 | 100a `M4: Certificates: eligibility, issuing, validity (100a)` L; 100b `M4: Public certificate verification and QR target (100b)` M; 100c `M4: Certificate template and Gotenberg PDF rendering (100c)` L | a -> (b ∥ c) |
| #103 | 103a `M4: Gallery curation and public gallery pages (103a)` L; 103b `M4: Consent withdrawal unpublishes and purges the CDN copy (103b)` M; 103c `M4: Visitor reports and immediate hide (103c)` M; 103d `M4: Seam 2 crawl: no public URL serves an original (103d)` S-M | a -> (b ∥ c); d after a + 99b |
| #106 | 106a `M5: Donations core: purpose, machine, FY receipts, FCRA refusal (106a)` L; 106b `M5: Donate page, checkout, thank-you and receipt links (106b)` L | a -> b |
| #109 | 109a `M5: Period lock, two-approver rule, locked-period guard (109a)` L; 109b `M5: Budgets, budget versus actual, accountant export (109b)` M | a ∥ b (merge a first) |
| #110 | 110a `M5: Transparency read model and page (110a)` L; 110b `M5: Seam 2 journey: donation, receipt, lock, totals (110b)` M | a -> b |
| #111 | 111a `M5: CMS core: revisions, preview, publish, versioned legal pages (111a)` L; 111b `M5: Home, about, impact counters and site facts from the CMS (111b)` L | a -> b |
| #112 | 112a `M5: Posts: model, editor, image derivatives, scheduled publishing (112a)` L; 112b `M5: Public blog and stories from the CMS (112b)` L | a -> b (b also after 111b) |
| #115 | 115a `M5: Rights requests and grievance queue (115a)` L; 115b `M5: Subject export and inventory-driven erasure (115b)` L | a -> b |
| #116 | 116a `M5: Report-a-concern form and safeguarding-lead queue (116a)` L; 116b `M5: Breach log and notifications (116b)` M | a ∥ b |
| #117 | 117a `M5: Admin home queues by role (117a)` M; 117b `M5: Per-competition reports and CSV export (117b)` L | a ∥ b |
| #125 | 125a `M6: Events: publish and public pages (125a)` M; 125b `M6: Event registration, waitlist and reminders (125b)` L; 125c `M6: Event check-in, attendance timeline, Seam 2 journey (125c)` M | a -> b -> c |
| #133 | 133a `M8: Auction payment window, fallback, capture and ledger posting (133a)` L; 133b `M8: Auction delivery tracking and thank-you letters (133b)` M | a -> b |
| #135 | 135a `M8: Social metric snapshots and trend (135a)` S-M; 135b `M8: Participation, engagement and partnership reports (135b)` M; 135c `M8: Volunteer, donation and feedback reports, CSV (135c)` M | a ∥ b -> c |

#66 is M, not XL: split because 66b needs 61b (late on M0's critical path); counts against the split cap. Optional splits
only if hardening grades XL: #58 (58a encrypted column, 58b phone OTP), #60 (TOTP + gate / passkeys), #65 (static CSP / nonce
CSP), #92, #97, #102 (per issues-M*.md). Units after splits: M0 19 (incl. #67, verification only), M1 22 (issues-M1.md says
24: miscount), M2 14, M3 8, M4 12, M5 22, M6 10, M7 4, M8 8 = 119.

### 1.3 Downstream re-pointing (ledger `extraBlockers`; native edges only from T2)

#60, #63, #64 and M1 starters -> 59a; #63, #64, #68 -> 61a; #68 -> 63a; #71, #72 -> 70a; #76, #83 -> 75b; #78, #79 -> 77a;
#82 -> 81b; 84b, 86a, 86b, #87 -> 85b; 89a -> #87 + #88 + 85b; 91a, #92 -> 89b; #90 -> 89b + 84b; 100a -> 99a; #103 -> 99b;
108, 110a -> 106a (110a also 109a); 112a -> 111a; #120 -> 125a; 135b -> 125c. Everything else waits for all children.

## 2. Tournament register
### 2.1 Units with a tournament (80: 75 `P+B`, 5 `P`)
| Unit | U | Flags | Kind | N | J | S | Angles: (a) / (b) / (c) and judge-on items |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 57a | 4 | A V | P+B | 3 | 3 | 8 | Spans 57a+57b interfaces; contenders build the harness + one end-to-end sign-up test. (a) BA-maximal: emailOTP plugin, BA DB rate limiter, BA session APIs / (b) BA-thin: BA for cookies and sessions, FOA OTP service reused by #58 / (c) risk-first: harness and port contract tests first, #61 same-transaction hook proven before UI. Judge on #58 fit, fake-clock OTP expiry, `world.ts` extension without edit |
| 58 | 4 | A E | P+B | 3 | 3 | 8 | (a) BA phoneNumber plugin storing the blind index, wrapper keeps the raw number for sending / (b) custom FOA BA plugin for phone OTP / (c) one FOA OTP service for both channels |
| 59a | 3 | A V | P+B | 2 | 3 | 6 | (a) policy as a code table of per-action predicates / (b) declarative role-action matrix; both with explicit audit writes |
| 60 | 3 | A | P+B | 2 | 3 | 6 | (a) layout + policy gate with session `second_factor_at` timestamp / (b) policy-only gate with per-action factor verification |
| 61a | 4 | V | P+B | 2 | 3 | 4 | (a) outbox-only from Vercel, worker relays into pg-boss / (b) pg-boss `send` inside the Drizzle transaction; PAPER extra: outbox + LISTEN/NOTIFY, no pg-boss |
| 63a | 3 | A K V | P+B | 2 | 3 | 9 | Spans 63a+63b interfaces. (a) prefix-move quarantine + redirect delivery / (b) status-gate quarantine + streaming-proxy delivery |
| 64 | 3 | K | P+B | 2 | 3 | 9 | (a) append-only consent event log + `LegalBlock` bodies / (b) record-with-withdrawal table + Markdown bodies; both keep legal pages static (F7) |
| 65 | 5 | C A | P+B | 3 | 3 | 10 | (a) per-page script hashes computed post-build / (b) SRI + `'strict-dynamic'` / (c) `'unsafe-inline'` on static pages only, nonce on signed-in pages; judges run `pnpm build` + violation journey |
| 69 | 3 | A V | P+B | 2 | 3 | 6 | (a) code-defined event catalogue, typed payloads, DB-editable copy only / (b) fully DB-driven map + typed audience-resolver registry; judge `notify(tx, event)` ergonomics, idempotency |
| 70b | 3 | C | P+B | 2 | 3 | 6 | (a) `"use cache"` + `cacheTag`, revalidate on publish / (b) static shell + DB section streamed in Suspense; judge route stays prerendered, Lighthouse, JS budget |
| 71 | 3 | V | P+B | 2 | 3 | 3 | (a) one delayed job per instant with expected instant + version, stale no-op / (b) periodic pg-boss tick deriving due transitions |
| 72 | 3 | $ K C | P+B | 2 | 3 | 12 | (a) round-keyed award schemes + one document per purpose / (b) competition-level scheme list with per-round override + clause documents |
| 73 | 2r | A E | P+B | 2 | 3 | 4 | (a) status column + transition map / (b) explicit state-machine object, template for later machines |
| 74 | 2r | A | P+B | 2 | 3 | 4 | (a) identifier-bound acceptance / (b) token possession + OTP re-verification |
| 75b | 3 | K E | P+B | 2 | 3 | 9 | (a) single `participant_profile` with `owner_kind` / (b) profile core + per-route ownership link tables |
| 77a | 4 | $ A C | P+B | 3 | 3 | 16 | (a) batch row + status column, capture in one transaction / (b) Payments module with explicit machines + ledger-ready money-event stream for #105 / (c) event-sourced gateway events + idempotency keys everywhere |
| 77b | 3 | $ A C | P+B | 2 | 3 | 12 | (a) checkout-signature-first / (b) order-polling-first; webhook replay and CSP allowances judged on both |
| 78 | 2r | $ E K | P+B | 2 | 3 | 8 | (a) dedicated individual flow / (b) shared registration wizard parameterised by route |
| 79 | 2r | $ A | P+B | 2 | 3 | 6 | (a) status-column extension / (b) separate capture-method + review-case aggregate |
| 80a | 3 | $ A | P+B | 3 | 3 | 9 | (a) simplest-thing: refund rows on the batch machine / (b) deep Refunds module, requester != approver invariant inside / (c) risk-first: idempotency + reconciliation job first |
| 81a | 4 | K A E | P+B | 3 | 3 | 16 | (a) guardian invites the teen / (b) teen signs up, then links / (c) unified household aggregate |
| 81b | 3 | K A | P+B | 2 | 3 | 9 | (a) `pending_guardian` status + confirm guard, routing in #69's audience resolver / (b) `guardian_approval` request entity + `MinorContactPolicy` used by `notify` |
| 82 | 3 | K | P+B | 3 | 3 | 9 | (a) rows per purpose / (b) Consent exposes only `canUse(subject, purpose, context)` + credit resolver / (c) append-only consent events, derived state |
| 83a | 3 | K A C | P+B | 3 | 3 | 12 | (a) token + OTP / (b) token-only, short expiry + contact confirmation / (c) magic sign-in creating a lightweight guardian account |
| 83b | 3 | K A | P+B | 2 | 3 | 9 | (a) reviewer ticks covered purposes per form / (b) whole-form acceptance mapped to a fixed purpose set per form version |
| 84a | 3 | K E | P+B | 2 | 3 | 9 | (a) per-recipient outbox events in the send transaction / (b) one event + batched worker fan-out with a recipient resolver |
| 84b | 3 | K | P+B | 2 | 3 | 9 | (a) per-instance delayed jobs with deadline snapshot / (b) 15-minute cron sweeper over `reminder_job` rows |
| 85a | 4 | K V | P+B | 3 | 3 | 12 | (a) global-libvips Docker build / (b) WASM HEIC decode + prebuilt sharp / (c) ffmpeg decode shared with #86 |
| 85b | 3 | K A C | P+B | 2 | 3 | 12 | (a) `entry` + `entry_file` with history table / (b) single entry row with `pending_file_asset_id`; judge fit for #91, #92 |
| 86a | 3 | K C V | P+B | 2 | 3 | 9 | (a) probe-then-transcode single job / (b) early-reject probe job + transcode job |
| 86b (M) | 3 | A | P+B | 2 | 3 | 6 | (a) `sanitize-html` allowlist profiles / (b) `rehype-sanitize` schema per profile; both run the shared XSS corpus |
| 88 | 3 | - | P+B | 2 | 3 | 3 | (a) guard registry + `competition_transition_block`, event-driven re-run / (b) direct guard in the flip handler, re-enqueue on publish |
| 89a | 3 | K | P+B | 2 | 3 | 9 | (a) one `school_round_pick` table with flags / (b) shortlist + position tables behind a `SchoolRound` aggregate |
| 90 | 3 | - | P+B | 2 | 3 | 3 | (a) revert from `entry_transition` history / (b) `school_round_finalisation` snapshot row |
| 91a | 2r | K | P+B | 2 | 3 | 6 | Promotion mechanism only. (a) event-driven promotion on both triggers / (b) one readiness projection, idempotent consumer |
| 91b (M) | 3 | A | P+B | 2 | 3 | 6 | (a) preview-only phase control, unreachable in production / (b) phase-parked seed competitions |
| 92 | 2r | A K | P+B | 2 | 3 | 6 | Module boundary only. (a) Entries sub-module writing `entry_verification` / (b) separate Verification module (#94 reuses) |
| 93 | 2r | K | P | 3d | 3 | 6 | (a) per-artwork records / (b) shipment aggregate / (c) per-artwork records + optional shipment grouping; #94, #131 extend it |
| 94 | 3 | A K | P+B | 2 | 3 | 9 | (a) status-centric + thin side tables / (b) append-only custody events, status materialised |
| 95b | 2r | A K | P+B | 2 | 3 | 6 | (a) #74's invitation pattern + consent rows / (b) onboarding aggregate with one gate `canJudge(judge, round)` |
| 95c (M) | 3 | K A | P+B | 2 | 3 | 9 | (a) institution-level conflicts + staff resolution rows / (b) conflict as a pure function over (judge, entry) facts |
| 96 | 3 | K A | P+B | 3 | 3 | 9 | (a) allow-list DTO + per-criterion action / (b) `BlindJudging` module, branded `BlindEntryView`, import-boundary test / (c) DB view with no profile joins + whole-sheet save |
| 97 | 3 | A | P+B | 2 | 3 | 6 | (a) pure `rankRound` over exact rationals, snapshot at lock / (b) SQL aggregation + TS tie-break |
| 99a | 3 | A K | P+B | 2 | 3 | 9 | (a) snapshot-and-hash release, publish re-verifies hash / (b) live-derived results, release row pins lock + time |
| 99b | 3 | K C | P+B | 2 | 3 | 9 | (a) `"use cache"` + `cacheTag("results:<id>")` / (b) static shell + Suspense; embargo-leak test, Lighthouse |
| 100a | 3 | K A | P+B | 2 | 3 | 9 | (a) one `issueCertificates` inserting the difference / (b) per-source issuers behind `EligibleCertificateSource` |
| 100c | 3 | K | P+B | 2 | 3 | 9 | (a) HTML/CSS -> Gotenberg Chromium / (b) SVG template -> Gotenberg or resvg; Devanagari, determinism, size |
| 101 | 2r | A K | P+B | 2 | 3 | 6 | (a) ZIP built per request / (b) ZIP cached per certificate-set hash |
| 102 | 3 | K | P+B | 2 | 3 | 9 | (a) sharp-only SVG share card / (b) HTML card via Gotenberg screenshot + sharp composite |
| 103a | 3 | K C A | P+B | 3 | 3 | 12 | (a) dynamic DB pages in Suspense / (b) `Gallery` module, branded `PublicAssetUrl`, cache-tagged prerender / (c) `gallery_public_item` projection rebuilt per consent event |
| 103b (M) | 4 | K | P+B | 2 | 3 | 12 | (a) sync unpublish + purge job with deadline row / (b) purge queue on a high-priority pg-boss schedule + SLA monitor |
| 105 | 4 | $ A | P+B | 3 | 3 | 12 | (a) app-level balance check, consumer per event / (b) `Ledger.post(tx, source, lines)` + mapping table + deferred balance trigger / (c) SQL-first invariants + property-based tests |
| 106a | 3 | $ K A E | P+B | 3 | 3 | 12 | (a) gateway-adapter-first: purpose column on `payment_batch` + dispatcher over #77's port / (b) state-machine-first: polymorphic `payment_subject` + explicit donation machine / (c) ledger-first: `Ledger.post` + FY receipt number in the capture transaction are the truth |
| 106b | 3 | $ A C | P+B | 2 | 3 | 12 | (a) on-request receipt render from snapshot, hashed-token route / (b) worker PDF in private bucket + short signed URL |
| 107 | 3 | $ A C | P+B | 2 | 3 | 12 | (a) webhook-driven state, local `cancel_requested` / (b) provider result drives state, webhooks reconcile |
| 108 | 2r | $ E A | P | 3d | 3 | 8 | 80G/PAN boundary: (a) settings text + snapshot / (b) versioned receipt templates / (c) per-receipt rendered wording |
| 109a | 3 | $ A | P+B | 2 | 3 | 9 | (a) generic `finance_approval` aggregate + operation registry / (b) pending state on `ledger_period` + `pending_manual_entry` |
| 110a | 3 | $ | P+B | 2 | 3 | 9 | (a) computed on read, `cacheTag('transparency')` / (b) snapshot table written in the lock transaction |
| 111a | 4 | A C | P+B | 3 | 3 | 8 | (a) `"use cache"` + repo-content fallback / (b) static shell + Suspense after `connection()` / (c) block-schema-first module; build with `DATABASE_URL` unset |
| 111b | 4 | A | P+B | 2 | 3 | 8 | (a) facts in settings merged with CMS / (b) all facts in CMS, tax facts mirrored |
| 112a | 3 | A C | P+B | 2 | 3 | 6 | (a) sanitised HTML + light editor / (b) block JSON + form block editor |
| 112b | 3 | A | P+B | 2 | 3 | 6 | (a) status flip + revalidate route / (b) cached `publish_at <= now` query |
| 113 | 3 | A C | P+B | 2 | 3 | 6 | (a) self-hosted proof-of-work / (b) Turnstile adapter behind the same port |
| 114 | 4 | K A $ | P+B | 3 | 3 | 16 | (a) exhaustive classification / (b) column marker / (c) heuristics + marker; fail-closed, cost on later tickets |
| 115a | 2r | K A | P | 3d | 3 | 6 | (a) one `rights_request` aggregate + due-date policy / (b) per-kind tables + queue read model / (c) case queue shared with #116a |
| 115b | 4 | K A E $ | P+B | 3 | 3 | 16 | (a) generic inventory-driven engine / (b) per-module `exportSubject`/`eraseSubject` registry / (c) two-phase erasure job + dry run |
| 116a | 3 | K A E | P+B | 3 | 3 | 12 | (a) deny list in `can()` / (b) separate safeguarding guard `can()` cannot override / (c) (b) + encrypted content + read-audit decorator |
| 117b | 2r | A | P | 3d | 3 | 4 | (a) SQL view per report / (b) typed report definitions + shared CSV writer / (c) job-refreshed snapshot tables |
| 118 (M) | 3 | C K V | P | 3d | 3 | 9 | (a) Caddy + 443 / (b) Cloudflare Tunnel / (c) tunnel + first-party proxy |
| 119 | 3 | K | P+B | 2 | 3 | 9 | (a) projection table + `profile-always` subject / (b) dual-key subject + `Timeline` module |
| 123 | 2r | K A E | P+B | 2 | 3 | 8 | (a) application machine with guardian sub-state / (b) reusable `guardian_approval` entity |
| 124 | 3 | K | P+B | 2 | 3 | 9 | (a) polymorphic certificate subject / (b) `volunteer_certificate` table + union read model |
| 125b | 3 | K | P+B | 2 | 3 | 9 | (a) `FOR UPDATE` on `event` / (b) counter column + conditional UPDATE |
| 126 | 3 | K A | P+B | 2 | 3 | 9 | (a) stored SQL-builder segment / (b) `Audience` module reused by #134 |
| 127 | 2r | A E | P+B | 2 | 3 | 4 | (a) single `directory_listing` / (b) `organisation` + listing projection |
| 130 | 3 | E | P+B | 2 | 3 | 6 | (a) coordinator-centric workflow / (b) three-party workflow, owner confirms |
| 131 | 3 | K $ | P+B | 2 | 3 | 9 | (a) lot owns custody state via #94's API / (b) artwork module owns transitions |
| 132 | 4 | $ A E | P+B | 3 | 3 | 16 | (a) `FOR UPDATE` lot row / (b) optimistic CAS + bounded retry / (c) append-only bid log + `SERIALIZABLE`; real-Postgres suite |
| 133a | 4 | $ K E A | P+B | 3 | 3 | 16 | (a) offer entity + payment batch of one / (b) lot-level payment state + payment link per offer / (c) generic "payable" interface in Payments |
| 134 | 3 | K A | P+B | 2 | 3 | 9 | (a) invitation-ledger anonymity / (b) per-survey HMAC respondent key |

### 2.2 Units without a tournament (39) and runtime re-scoring

57b, 63b (inherit the 57a / 63a winner), 57c, 59b, 61b, 62, 63c, 66a, 66b, 67, 68; 70a, 75a, 76, 77c, 80b; 87, 89b; 95a, 98; 100b,
103c, 103d, 104; 109b, 110b, 116b, 117a; 120, 121, 122, 125a, 125c; 128, 129; 133b, 135a, 135b, 135c. #66 scores U3 only on owner
decisions (code design U2); 70a and 80b get a 2-way `P+B` if hardening scores U >= 3 (80b also if graded L). Flagged units here
keep the 3-judge final review (charter 6). Hardening's U, size and flags override this register: a listed unit below the rule
loses its tournament (ledger `"dropped (rescore)"`); an unlisted unit meeting it gets `P+B`, N per section 0, default angles
simplest-thing / deep-module-first / risk-first; any U change recomputes S.

## 3. Totals
| Measure | Count |
| --- | --- |
| Tournaments | 80 (M0 8, M1 17, M2 12, M3 6, M4 8, M5 18, M6 5, M7 2, M8 4) |
| PAPER rounds / design documents | 80 / 259 (19 rounds x 4, 61 x 3) |
| BUILD rounds | 75 (56 two-way, 19 three-way) |
| Prototype branches `proto/<n>-<letter>` | 169 (one per BUILD contender, pushed for cold judging; Vercel off for `proto/**`; until that is verified on `M0`, <= W + 3 pushed at once) |
| Archived tags `proto-archive/<n>-<letter>` | 169 (winners included, at the judged commit) |
| Judge calls | 465 (240 PAPER + 225 BUILD) + tie-breaks |
| Extra agent-hours | ~440 (M0 50, M1 102, M2 62, M3 28, M4 43, M5 94, M6 25, M7 10, M8 27) |

Unit costs (replaced by measured values after the first 5 tournaments): design doc 0.25 h; PAPER judge call 0.1 h (0.15 h for 4
designs); each BUILD contender beyond the first 2.0 h (L) or 1.0 h (M); facts pack 0.15 h per contender; BUILD judge call 0.2 h
per entry; graft + archive 0.5 h. Per tournament: `P` 1.05 h, 2-way L 5.05 h, 2-way M 4.05 h, 3-way L 8.2 h. Wall-clock added to
the unit's path: ~0.5 h (`P`), ~3.5 h (`P+B`; contenders run in parallel runner sessions).

## 4. Budget-cut order (lowest S first; applies only to tournaments not yet started)

Apply the next step each time the budget section reports over-pace; reinstate in reverse order after a `seven_day` reset. A
downgraded unit keeps its PAPER winner as the plan and its final-review panel; the ledger records `"paper-only (cut <k>)"`.

| Step | Action | Units | Saves h | Left h | BUILD / contenders left |
| --- | --- | --- | --- | --- | --- |
| 1 | S <= 4: BUILD -> `P`; drop `P` of 117b | 61a 71 73 74 88 90 127; 117b | 29 | 411 | 68 / 155 |
| 2 | S = 6: BUILD -> `P`; drop `P` of 93, 115a | 59a 60 69 70b 79 86b 91a 91b 92 95b 97 101 112a 112b 113 130; 93 115a | 64 | 347 | 52 / 123 |
| 3 | S 8-9 three-way -> two-way | 58 80a 82 96 111a | 16 | 331 | 52 / 118 |
| 4 | S = 8: BUILD -> `P`; drop `P` of 108 | 58 78 111a 111b 123; 108 | 21 | 310 | 47 / 108 |
| 5 | S = 9: BUILD -> `P`; drop `P` of 118 | 63a 64 75b 80a 81b 82 83b 84a 84b 86a 89a 94 95c 96 99a 99b 100a 100c 102 109a 110a 119 124 125b 126 131 134; 118 | 108 | 202 | 20 / 54 |
| 6 | S = 12 three-way -> two-way | 83a 85a 103a 105 106a 116a | 19 | 183 | 20 / 48 |

Floor (never cut): 57a (foundation every ticket builds on) and 65 (U5) as three-way; S = 16 three-way 77a 81a 114 115b 132 133a;
two-way 72 77b 83a 85a 85b 103a 103b 105 106a 106b 107 116a. Below the floor the Orchestrator slows the wave width instead.
M0 tournaments (57a-65) normally run before any shortage shows, so steps 1-2 mostly act on M1+ units.
