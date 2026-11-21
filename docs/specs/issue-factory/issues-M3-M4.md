# M3–M4 ticket analysis: issues #93–#104 (ordinals 38–49)

Sources read in full: `research/open-M3.json`, `research/open-M4.json` (12 bodies, 0 comments each), `research/spec-55.md`,
`research/spec55.md`, `research/open-M2.json` (#85, #86, #88, #89, #92), `research/issues-M0.md` (#60, #61, #63),
`research/issues-M1.md` (conventions, #69, #72, #82), `research/issues-M6-M8.md` (§0.1 F1–F10, §0.3 hotspot codes),
`research/code-ui.md`, `research/code-app.md`, `research/code-infra.md`. Owner comments read live (GitHub MCP, 2026-11-19):
#55 (Gotenberg 9.x ≥ 9.8.0, "Decision (M4)"), #89 (school-round outcomes query "which M4 #100 needs"), #92 (no `resubmitted`
state). Codebase skimmed at `3da7347` (read-only): `src/content/judging.ts`, `src/content/sample/{certificate,model}.ts`,
`src/components/showcase/{certificate-preview,gallery-frames}.tsx`, `src/app/page.tsx` (home `Gallery` section, lines
267–278), `src/app/robots.ts`, `src/lib/routes.ts`, `public/brand/README.md`, `playwright.config.ts`,
`tests/e2e/smoke.spec.ts`, `package.json`, `pnpm-workspace.yaml`, `vercel.json`, `docker/`. Prior art (non-binding,
superseded): `git show 8d06f2e:specifications/SPEC.md`. Live check 2026-11-19: `gh api -X GET search/issues -f
q='repo:siddhartxts/friends-of-animals is:issue in:title M3'` (and `M4`) returned `issue_dependencies_summary` for all
12 tickets: the counts below are VERIFIED; the edges are INFERRED.

## 0. Conventions and milestone-wide findings

### 0.1 Field conventions
- Ordinal n = issue − 55: #93 = 38 … #104 = 49. No M3/M4 body cites another ticket by number or ordinal; they say "the next
  ticket", "the single 'physically ready for judging' check that FOA rounds rely on", "Auction states come in M8", "the
  engagement history (M6)".
- **Depends-on** has three parts: **native** = GitHub blocked-by count (verified) with the edges that best fit every count
  (inferred; alternatives listed); **extra** = technical prerequisites outside the native closure, stored as `extraBlockers`
  in the ledger (never written to GitHub); **blocks**. Runtime verification: on T2
  `gh api repos/siddhartxts/friends-of-animals/issues/<n>/dependencies/blocked_by --jq '[.[].number]'` and
  `.../dependencies/blocking`; on T1 the counts via the search call above (GraphQL is blocked; the edges need T2 or the
  owner). Replace inferred edges with real ones; keep `extraBlockers`.
- **AFK class:** A = every AC closable against fakes, residue at most shared/deduped; B = agent core merges, plus
  ticket-specific human residue before production use; C = mostly human (none here).
- **Size:** S < 1 h, M 1–3 h, L 3–8 h, XL > 8 h agent wall time (tests, seed, pages, axe included). XL → split into 2–4
  children. **Design uncertainty** 1–5.
- **Tournament rule (charter 5):** uncertainty ≥ 3, or a risk flag in {auth/security, money, minors/safeguarding,
  encryption, CSP} with size ≥ L. "Rule-triggered, low yield" = qualifies only by the second clause with uncertainty ≤ 2.
  "PAPER" = design-only DESIGN-IT-TWICE round recommended without a BUILD tournament.
- Shared ACs on every ticket (not repeated per ticket): Seam 1 (`as(actor).<useCase>`, PGlite + real migrations, fake
  clock, in-process drain, provider fakes); an authorization test per new use case (≥ 1 allowed role passes, ≥ 1 disallowed
  role fails); preview seed extended; axe clean on every new page (desktop + mobile projects).
- Names below (tables, enums, use cases, routes, namespaces) are proposals; hardening may rename. Status enums are
  `<entity>_status`. One messages namespace file per ticket-owned area (`src/i18n/messages.ts` registry, F7 in
  issues-M6-M8.md). Hotspot codes H1–H21 are the ones defined in issues-M6-M8.md §0.3; H22–H32 are new here (§4).

### 0.2 Findings that change how M3/M4 must be built or scheduled (read before the per-ticket sections)
1. **M34-1 Long serial chain.** Native edges make M3 a strict chain (#93 → #94 → #95 → #96 → #97 → #98, plus #94 → #97) and
   M4 nearly one (#99 → #100 → {#101, #102}; #102 → #103 → #104). Longest path from M2: #92 → #93 → #94 → #95 → #96 → #97 →
   #99 → #100 → #102 → #103 → #104 = 11 tickets (10 inside M3/M4). Levers, in order: (a) harden and run PAPER rounds for
   ticket k+1 while ticket k is in review (no code dependency); (b) fill W slots with M4/M5 harness work that has no M3
   dependency (Lighthouse runner, preview drain/fixture routes, `PublicAssetUrl`, M34-3/4/8/10); (c) optional edge
   re-pointing after a split (e.g. 102a "stamping service" needs only #85; 95a "rounds config" needs only #88 + #72): the
   frontier still waits on the native parent unless the Orchestrator re-points the GitHub edge to the child (REST
   `dependencies/blocked_by`, T2 only) and records the change in the ledger. Default: do not re-point.
2. **M34-2 Define each machine's enum in full, up front** (F2 in issues-M6-M8.md §0.1: drizzle runs all pending migrations
   in one transaction, so `ALTER TYPE … ADD VALUE` followed by any DDL use of the new value — partial-index predicate,
   CHECK, default, backfill — fails on every fresh PGlite and preview DB). First ticket of each machine defines all values:
   `physical_artwork_status` (#93: requested, dispatched, received, discrepancy, verified, on_exhibition, retained,
   returned; M8 auction values must never appear in DDL), `judging_round_status` (95a: draft, open, locked, cancelled),
   `round_entry_source` (95a: verified_entries, round_finalists), `round_outcome` (#97), `results_release_status` (99a),
   `certificate_type` + `certificate_status` + `certificate_render_status` (100a; add `volunteer_service` to
   `certificate_type` now, unused until #124, because #124's CHECK would otherwise reference a value added later),
   `stamp_variant` (#102), `gallery_item_status` (103a), `social_queue_status` (#104, incl. `removed`). Extensions of
   existing enums (`file_asset_purpose` by #94/#100/#101/#102; consent purposes and role scope type by 95b;
   `competition_status` by 99a if absent) must never be referenced by any DDL, now or later.
3. **M34-3 Worker-version skew on previews** (M1 finding 6; issues-M0.md #61: one shared `worker-preview` serves every
   `foa_pr_<n>` with the code the owner last deployed). New handlers here: #93 reminder + acknowledgement, #94 retain at
   window close, 99a scheduled publish + revalidation, 100a issuing, 100c PDF render (worker-media), #101 ZIP + reissue
   message, #102 stamping (worker-media), 103b unpublish + purge, #104 withdrawal consumer. Seam 1 is unaffected (in-process
   drain). Seam 2: #97's journey needs no worker if `lockRound` is synchronous (make it so). #101's journey (publish → QR
   valid → revoke) needs publish + issuing on the preview. Mitigations, in order: (1) `approveResults` with
   `publishAt ≤ now` publishes in the same request; the certificate validity path (rows, numbers, status `issued`) runs in
   the general `worker`, never in `worker-media`; PDF rendering is off the journey path; (2) a preview-only drain route
   (`APP_ENV=preview` only, secret-guarded, drains this DB's outbox/jobs with the PR's code, skips worker-media job types) —
   a harness decision owned by #61/#57; runtime check on `M0`: `grep -rn "drain" src/app/api`; if absent the Orchestrator
   files one M0 harness ticket before #101 starts; (3) otherwise R-WORKER: the owner redeploys `worker-preview` from the
   `M4` tip and the journey is accepted on the milestone-branch preview only.
4. **M34-4 Journey re-runnability.** Preview DBs persist across pushes to the same PR (code-infra.md §5), so #97's journey
   (scores, locks a round) and #101's (publishes, revokes) meet their own earlier state on every re-run. Each journey must
   build a fresh world per run: preferred, a preview-only fixture route built on #57's seed builders (same guard as the
   capture-mailbox route); fallback, the preview seed creates 20 journey fixtures `JRNY-01..20` and the journey claims the
   first unused one. `e2e.yml` changes only apply after the owner merges them to `main`, so journeys may use only the base
   URL + bypass cookie. Runtime check at claim: `ls tests/e2e/support`, `grep -rn "APP_ENV" src/app/api`.
5. **M34-5 One outcome model for six consumers** (#98 finalists, 99a snapshot, 100a certificate types, 103a recognition,
   #131 auction eligibility, #119 milestones). #97 defines it and records an ADR (`docs/adr/`, next free number; created
   lazily per `docs/agents/domain.md`). Recommended: per `round_entry`: `outcome round_outcome` {winner, runner_up, finalist,
   special_mention, none}, `award_position smallint null` (1–3 under ranked_123), `advances boolean` (= outcome ∈ {winner,
   runner_up, finalist}, stored for #98), `suitable_for_auction boolean` (independent). Certificate mapping (100a, final
   round only): winner → winner, runner_up → runner_up, finalist → finalist, special_mention → participation only (R-FOA).
6. **M34-6 Return window before results exist.** #94 ("within 30 days of results") lands in M3; results instants come from
   99a (M4). #94 declares the event type `results.published` {competitionId, releaseId, publishedAt} and consumes it to open
   the window and schedule the retain job; Seam 1 emits it directly; 99a emits it for real. No schema coupling; before the
   event the window is closed (request refused, "not open yet").
7. **M34-7 Consent-gated public read models need #82/#83 exports.** 99b (results page), 100b (verify page credit), 103a
   (gallery), #104 (queue) need: `canUse(subject, purpose, competition)`, the public-credit resolver (minor: first name +
   last initial; school/city per-field opt-in), the `consent.withdrawn` outbox event, and #83's rule that an institution
   declaration never covers public use. Runtime check on the `M1` tip: `grep -rn "consent.withdrawn\|canUse\|Credit"
   src/server`. If the resolver is not a shared export, 99b extracts it into the Consent module (H16) and later tickets
   import it.
8. **M34-8 Public images before a CDN exists.** Stamped public copies live in the R2 public bucket behind a CDN host. Until
   R-R2CDN (and M0's non-prod R2 residue) is done, previews have no public host. Requirement for 103a (first public-image
   ticket): a branded `PublicAssetUrl` builder whose base is env `PUBLIC_ASSET_BASE_URL`; when unset outside production, a
   fallback route `/media/p/[...key]` streams ONLY files whose purpose starts `stamped_` (404 for anything else). `next.config.ts`
   has no `images.remotePatterns` (code-ui.md §6): stamped copies are pre-sized, so render `<img>` (or `next/image`
   `unoptimized`) with explicit width/height and a srcset of stamped sizes. CSP `img-src` must allow the CDN host (#65).
9. **M34-9 PDF renderer = Gotenberg 9.** Owner ruling on #55: Gotenberg 9.x, exact tag pinned, ≥ 9.8.0 (not 8, as #55's
   body still says). #100's "`worker-media` renders each certificate to PDF" therefore means: worker-media builds the HTML
   (template + QR SVG + embedded fonts) and posts it to the Gotenberg 9 Chromium HTML route on the compose network. Verify
   the route and form fields in Gotenberg 9 docs at runtime (Context7/web), never from memory. The repo's fonts are latin
   only (`src/lib/fonts.ts`); names in Devanagari or other scripts need embedded Noto subsets (OFL). Fixture: one
   Devanagari name.
10. **M34-10 No Lighthouse runner yet** (issues-M6-M8.md F5). 99b and 103a carry "Lighthouse mobile ≥ 90". First Lighthouse
    AC is #70; runtime check `grep -ril lighthouse .github package.json tests`. If still absent, the Orchestrator blocks those
    ACs on one harness ticket instead of letting a runner improvise; local fallback: `pnpm build && pnpm start` with seeded
    Postgres, Lighthouse CLI, JSON attached to the PR.
11. **M34-11 New dependencies** (exact pins via `saveExact: true`; pnpm 12 fails installs whose install scripts are not in
    `allowBuilds`; version at least 2 weeks old; licence in the PR body): a QR encoder (e.g. `qrcode` or `uqr`, 100a); a ZIP
    writer without install scripts (e.g. `fflate`, #101); test-only `jsqr` to decode the QR after rasterising the SVG with the
    existing devDependency `@resvg/resvg-js`; `sharp` in worker-media is #85's decision (`allowBuilds.sharp: false` already,
    prebuilt `@img/sharp-*`).
12. **M34-12 Role gaps.** "FOA verifier" (#94) is not in the spec's role list: reuse whatever #92 decided (runtime check on
    `M2`: `grep -rn "verifier" src/server`). Judges need a round scope (spec digest §5: "+ round scope for judges, #95"),
    extending #59's scope type (H8; F2 if it is an enum). "An admin can override" (#97) = staff_admin or super_admin, not
    competition_manager. Results approver (99a) = any second staff member holding `results.approve` (default:
    competition_manager scoped to the competition, staff_admin, super_admin), never the preparer.
13. **M34-13 Blind read model scope.** Spec: judges see "the entry code, category, age group and the work". Title,
    description and statement are not listed and can contain names: excluded by default (showing a title needs an FOA
    decision, R-FOA). Essays are "the work" and may contain names: shown as submitted, no auto-redaction (flag in PR body).
    Signed URLs must contain no participant id, registration number or original file name.
14. **M34-14 Phones.** Playwright projects are `desktop` (Desktop Chrome) and `mobile` (Pixel 7); no WebKit. iPhone Safari has
    no Fullscreen API for non-video elements, so #96's "full-screen" viewer must be a full-viewport `<dialog>` (`100dvh`),
    not `requestFullscreen`; videos use `playsinline`. iOS is untested in CI: say so in the PR body.
15. **M34-15 Old spec line map** (SPEC.md at 8d06f2e): §6.10 physical artwork 757–826 (transition table, checklist, custody,
    return policy); §7.1–7.5 judging 942–1181 (rubric math, round model, COI, scoring, aggregation, tie-breaks, machines);
    §7.6 results 1182–1223; §7.7 certificates 1224–1281; §7.9 stamping 1305–1346; §7.10 gallery 1347–1388; §7.11 social
    1389–1420. Ticket + #55 win on conflict; never copy Prisma names; old-spec extras (prize fulfilment, normalisation,
    partitions, takedown records, essay cards) are out of scope unless an AC needs them.
16. **M34-16 Data inventory (R-RET).** New personal-data fields: dispatcher and return requester (#93/#94), condition photos
    (may show a name on the back, #94), judge invitation email, COI statements (may name third parties), judge comments
    (95b/#96), results snapshot rows (99a), certificate name snapshots, PDFs, share images, ZIP bundles (#100–#102), gallery
    report details, reporter contact and IP hash (103c), captions with credits (#104). Each ticket appends entries to the
    inventory registry (H5).
17. **M34-17 Messages.** Every new message event needs a template + event→message map row (#69, H9) and inherits guardian
    routing for minors (#81). New SMS-capable events append to the DLT residue (G2). Judge invitations go to an email that
    may not be a user yet: reuse #74's coordinator-invitation pattern (random 32-byte token stored as SHA-256, expiry), not a
    `notify()` audience.

## 1. Dependency table (verified counts, inferred edges)

| # | n | Title (short) | native blocked_by (count: inferred edges) | extraBlockers (ledger) | blocks (count: inferred) |
|---|---|---|---|---|---|
| 93 | 38 | Request, dispatch, receive physical artwork | 1: #92 | #61 #62 #69 #70 #73 #74 #81 #84 | 2: #94 + 1 external (cand. #131 or #133; P2: #95) |
| 94 | 39 | Verify artwork, custody, "physically ready" | 1: #93 | #63 #85 #92 (role) #62 | 2: #95 #97 (P2: #95 #97) |
| 95 | 40 | FOA rounds, judge onboarding, assignment | 2: #94 #88 (P2: #93 #94) | #57 #59 #60 #64 #69 #72 #74 #81 #92 (+#88 under P2) | 1: #96 |
| 96 | 41 | Blind scoring | 1: #95 | #63 #85 #86 #88 | 1: #97 |
| 97 | 42 | Rankings, round lock, outcomes; M3 Seam 2 | 2: #96 #94 | #57 #59 #60 #72 + M34-3/M34-4 harness | 2: #98 #99 |
| 98 | 43 | Chained judging levels | 1: #97 | — | 0 |
| 99 | 44 | Results approval, scheduled publish, results page | 2: #97 #82 (alt #81 or #69) | #60 #61 #65 #69 #70 #72 #81 #83 (+ the other of #81/#82) + Lighthouse runner | 5: #100 #103 + 3 of {#119 #120 #131 #134} (P2: #100 + all 4) |
| 100 | 45 | Certificates with QR verification | 1: #99 | #57 #61 #63 #69 #73 #81 #85 #89 #91 #97 | 3: #101 #102 #124 |
| 101 | 46 | Revoke, reissue, bulk ZIP; M4 Seam 2 | 1: #100 | #60 #61 #63 #69 #74 #75 #81 + M34-3/M34-4 harness | 0 |
| 102 | 47 | Logo stamping, certificate share image | 1: #100 | #63 #85 | 1: #103 |
| 103 | 48 | Public gallery with consent gating | 3: #102 #82 #99 (P2: #102 #82 #85) | #57 #62 #63 #65 #83 #89 #97 (+ the other of #85/#99) + Lighthouse runner + M34-8 | 1: #104 |
| 104 | 49 | Social-media export queue | 1: #103 | #82 #102 | 0 |

Fit check. **M3 (P1):** blocked_by sum 8 = 6 internal edges (93→94, 94→95, 94→97, 95→96, 96→97, 97→98) + 2 incoming
(#92→93, #88→95); blocking sum 8 = 6 internal + 2 outgoing (#97→99, #93→one of #131/#133). #95 blocks only 1, so #97's
second blocker cannot be #95: it is #94 (or #93 with #94's second edge going to M8). **M3 (P2), equally consistent:** 7
internal (adds 93→95, drops #88→95) + 1 incoming (#92→93); outgoing only #97→99. **M4 (P1):** blocked_by sum 9 = 6 internal
(99→100, 99→103, 100→101, 100→102, 102→103, 103→104) + 3 incoming (#97→99, #82→99, #82→103); blocking sum 10 = 6 internal + 4
outgoing (#99→3 of {#119, #120, #131, #134}, #100→#124). **M4 (P2):** #103 ← #85 instead of #99; #99 → all four M6/M8
candidates. #98 blocks 0 (verified), so #99's second blocker is not #98. #82 → {#99, #103} matches M1's "#82 blocks #83 + 2
later" count. The Orchestrator's runtime edge query settles P1/P2.

Gates (native + extra closure, for the frontier): **M3 gate** = #57–#65, #69, #70, #72, #73, #74, #75, #81, #84, #85, #86,
#88, #92 all `factory:merged-trunk` into their milestone branches and merged forward into `M3`. **M4 gate** = M3 gate + #82,
#83, #89, #90, #91, #97.

## 2. Per-ticket analysis

### #93 (ordinal 38) — M3: Request, dispatch and receive physical artwork
- **Depends-on:** native #92 (inferred: "The track starts only after an entry is verified by FOA"). Extra: #70 (competition
  physical-artwork rule), #73 (codes module for `{comp}-A-{6}`), #69 (templates, `notify`), #84 (deadline reminders as named
  schedules), #74/#75 (coordinators of the institution registration are the audience), #81 (guardian routing; under-13s have
  no login), #61 (jobs), #62 (settings). **Blocks:** #94 + 1 external (candidate #131 auction lots or #133 delivery; P2: #95).
- **AFK class:** B.
- **Human residue:** R-ARTWORK-LOGISTICS (FOA facility address, packaging instructions, who pays shipping, dispatch window
  days; seeded as clearly marked sample values; production refuses placeholders); R-DLT append (3 SMS-capable events);
  R-RET append (dispatcher identity).
- **Ports/providers:** none new. Clock, JobQueue (reminder), outbox/`notify` (#69), codes module (#73), settings accessor
  (#62). Courier integrations are out of scope (manual tracking numbers).
- **DB:** enum `physical_artwork_status` with all 8 M3 values (M34-2); `physical_artwork` (uuidv7 id; `entry_id` unique FK;
  competition_id; `artwork_code` unique, `^[A-Z]{3,6}\d{2}-A-[0-9A-HJKMNP-TV-Z]{6}$`; status; `sender_kind` enum
  `artwork_sender_kind` institution|participant; institution_registration_id null; registration_id; requested_by,
  requested_at; `dispatch_deadline` timestamptz; instructions_snapshot, foa_address_snapshot, `shipping_payer` foa|sender
  snapshot; courier_name, tracking_number, dispatched_by, dispatched_at; received_by, received_at; storage_location null for
  #94); module-owned `artwork_competition_config` (competition_id pk, packaging_instructions, shipping_payer, dispatch_days)
  instead of new columns on `competition` (avoids H17); optional `artwork_shipment` (courier, tracking, dispatched_by/at) +
  `physical_artwork.shipment_id` if the PAPER round picks grouping. Settings: `org.foaFacilityAddress`,
  `artwork.dispatchDays` (14), `artwork.dispatchReminderLeadHours` (72). Events: `artwork.requested`, `artwork.dispatched`,
  `artwork.received`; named schedule `artwork-dispatch-reminder` (handler no-ops unless status is still `requested`).
- **Routes/pages:** `/admin/artwork` (board by status; "Request artwork" for a competition's FOA-verified entries, bulk
  select), `/admin/artwork/[artworkCode]` (detail; mark received; find by code or tracking number), `/institution/artwork`
  (coordinator: requested works per registration, dispatch form), `/dashboard/artwork` (participant/guardian: instructions,
  dispatch form). Place under the layouts that exist on the `M2` tip.
- **Messages namespaces:** `artwork` (sender-facing), `adminArtwork`.
- **Size:** L — new module, full enum, 3 actors, 3 messages + reminder schedule, 4 pages, seed.
- **Design uncertainty:** 2 — flow is explicit. Open: per-artwork vs shipment-grouped dispatch (a school posting 15 works in
  one parcel); `requested → received` when the sender never recorded dispatch (recommend allowed for staff, flagged
  "dispatch not recorded"); who acts for a 13–17 participant (recommend teen or guardian may record dispatch, messages go to
  the guardian); manual request "for the chosen entries" (ticket) vs automatic on verification (old spec) — follow the ticket.
- **Risk flags:** minors (guardian routing), personal data, F2 enum, worker skew (reminder, acknowledgement).
- **Test plan:** Seam 1 — competition manager requests artwork for 3 FOA-verified entries in a physical-rule competition → 3
  unique codes matching the regex; refused for an unverified entry, for a competition without the physical rule, and for a
  second request on the same entry; drain → institution-route coordinators and an individual adult receive
  `artwork.requested` with code, packaging instructions, FOA address, IST deadline and shipping payer; minor individual →
  guardian receives it, the child does not; sender records courier + tracking → `dispatched`, audit row; staff marks
  received → drain → acknowledgement to the dispatcher; fake clock at deadline − 72 h with status `requested` → one reminder
  (drain twice = one message); dispatched before that instant → no reminder; transition table: requested→dispatched
  (sender), dispatched→received (staff), requested→received (staff, per decision); every other pair refused, including
  received→dispatched and dispatched→requested; authz: request (competition manager ✓, coordinator ✗), dispatch (the
  responsible coordinator/participant/guardian ✓, another institution's coordinator ✗), receive (staff ✓, coordinator ✗).
  Seam 2 — none required. Axe pages: the 4 pages above.
- **File-conflict hotspots:** H15 (physical artwork enum + transition table, owned here), H9, H10, H7, H8, H1–H3, H6 (seed
  builder `physicalArtwork`), H26, H27.
- **Tournament:** NO (uncertainty 2, no charter flag). PAPER round recommended (per-artwork vs shipment aggregate), because
  #94 and #131 extend this module.

### #94 (ordinal 39) — M3: Verify physical artwork and record its custody
- **Depends-on:** native #93. Extra: #63 (private uploads, scan gate, signed URLs), #85 (derived display copy for the
  side-by-side check), #92 (verifier role decision, M34-12), #62 (return window setting). **Blocks:** #95, #97.
- **AFK class:** A.
- **Human residue:** none ticket-specific (30-day window is a spec default); R-RET append (condition photos).
- **Ports/providers:** ObjectStorage + MalwareScanner through Files (#63), new purpose `artwork_condition_photo` (private,
  or the evidence bucket if #63 created one); Clock; JobQueue (retain job).
- **DB:** `artwork_verification` (artwork_id unique, verified_by, verified_at, code_matches_label, creator_confirmed,
  matches_digital, consent_documents_ok (bools), condition enum `artwork_condition` excellent|good|fair|damaged,
  condition_notes, width_mm, height_mm, depth_mm null, material); `artwork_photo` (artwork_id, file_asset_id, kind
  front|back|detail, created_by); `artwork_discrepancy` (artwork_id, reason enum mismatch|damage|wrong_creator|
  missing_documents|other, notes, raised_by/at, resolved_by/at, resolution; partial unique "one open per artwork" WHERE
  resolved_at IS NULL — no enum literal in the predicate); `artwork_custody_event` (append-only, UPDATE/DELETE rejected by
  trigger like the audit log: artwork_id, kind received|stored|moved|exhibited|retained|returned, location, actor_user_id
  null = system, at); `physical_artwork.storage_location` (current; free text, optional `FACILITY/ROOM/RACK/SHELF`
  pattern); `artwork_return_request` (artwork_id unique, requested_by, requested_at, status open|fulfilled|withdrawn);
  `artwork_results_window` (competition_id pk, results_published_at, closes_at) written by the `results.published` consumer
  (M34-6). Setting `artwork.returnWindowDays` (30).
- **Module API:** `isPhysicallyReadyForJudging(entryId)` plus set-based `physicallyReadyEntryIds(tx, competitionId)` (or an
  SQL fragment) so #95/#97/#98 pool queries avoid N+1. True iff status ∈ {verified, on_exhibition, retained}; no artwork
  row → false.
- **Routes/pages:** `/admin/artwork/[artworkCode]/verify` (derived image side by side, checklist, photo upload with
  `capture="environment"`, dimensions, material, storage), `/admin/artwork/discrepancies` (queue), custody log +
  exhibition/retain/return actions on `/admin/artwork/[artworkCode]`; "Ask for it back" on `/dashboard/artwork/[artworkCode]`
  and the institution artwork page.
- **Messages namespaces:** `adminArtwork`, `artwork` (both extended; serial with #93).
- **Size:** L — verification form + photos, discrepancy flow, custody log, return requests with a window, readiness API.
- **Design uncertainty:** 3 — discrepancy as status + record (the transition-table AC names it) vs flag; window anchor
  before #99 (M34-6); retain automatic at window close (recommended, system actor, audited) vs manual; readiness API shape
  consumed by #95, #97, #98, #131; who may request a return (recommend adult participant, guardian, and the institution's
  coordinator on the school route).
- **Risk flags:** auth/security (private photos, signed URLs), minors (guardians' return requests), personal data. No new
  enum values (all defined by #93).
- **Test plan:** Seam 1 — verifier verifies a received artwork with 2 photos, dimensions, material, storage → `verified`,
  custody event, audit row; refused with < 2 photos (default; hardening may set 1), missing dimensions, or a photo still
  scanning/quarantined; raise discrepancy → `discrepancy`; verify refused while open; readiness false while open; resolve →
  `received` → verify succeeds; readiness truth table over all 8 statuses + no row; photo signed URL: participant ✗,
  coordinator ✗, verifier ✓, expired after `clock.advance(expiry + 1 s)`; return window: emit `results.published` at T →
  guardian request at T + 29 d ✓, at T + 31 d ✗, before T ✗; drain at T + 30 d → verified/on_exhibition works without an
  open request become `retained` (system-actor audit), the one with a request does not; staff records return → `returned`;
  transition table covers verification, discrepancy, exhibition (verified⇄on_exhibition, retained→on_exhibition,
  on_exhibition→retained), retained and returned; all other pairs refused; custody table rejects UPDATE/DELETE; authz:
  verifier ✓ / coordinator ✗ (verify), this child's guardian ✓ / another guardian ✗ (return request). Seam 2 — none.
  Axe pages: verify page, discrepancy queue, extended detail page, return-request page.
- **File-conflict hotspots:** H15, H21 (`file_asset_purpose`), H9, H10, H7, H8, H5, H1–H3, H6, H26, H27.
- **Tournament:** YES, 2 contenders (uncertainty 3). Angles: (a) status-centric — discrepancy and return as statuses on
  `physical_artwork` with thin side tables; (b) custody-event-first — append-only custody/discrepancy events, current status
  materialised from them. Judge on: readiness query cost and correctness, transition-table completeness, cost of adding
  #131's auction states.

### #95 (ordinal 40) — M3: FOA rounds, judge onboarding and assignment
- **Depends-on:** native 2 (P1: #94 "physically ready" + #88 published rubrics; P2: #93 + #94). Extra: #72 (award schemes),
  #92 (FOA-verified pool), #59 (scoped roles; round scope), #64 (versioned documents for conduct/confidentiality), #69
  (messages), #74 (invitation pattern), #81 (guardian links → automatic conflicts), #57 (email OTP sign-in for judges), #60
  (step-up if sending invitations counts as a role grant). **Blocks:** #96.
- **AFK class:** B.
- **Human residue:** R-LEGALCOPY append (judge code of conduct + confidentiality terms; seeded sample documents);
  R-JUDGE-VETTING (police verification of in-person judges — a physical round is in-person — FOA leadership, pilot
  prerequisite; platform records nothing more unless FOA asks); R-FOA (conflict-of-interest policy wording).
- **Ports/providers:** Email through the invitation pattern; Clock; Consent module (documents).
- **DB:** enum `judging_level` (city_district, state, national, global); `judging_round_status` (draft, open, locked,
  cancelled — full set); `round_entry_source` (verified_entries, round_finalists); `judging_round` (id, competition_id, name,
  level, status, `judges_physical` bool, award scheme for this round (copied from #72's planned-round scheme, default
  ranked_123), entry_source, `source_round_id` null self-FK (#98), created_by, opened_at); `judging_round_rubric` (round_id,
  discipline, rubric_id = pinned published version from #88; one per enabled discipline); `judge_invitation` (round_id,
  email (PD), token_hash, invited_by, expires_at, status invited|accepted|declined|revoked|expired, accepted_user_id); role
  `judge` with scope (round, id) through #59's grant API (audited); `judge_onboarding` (round_id, judge_user_id,
  conduct_consent_id, confidentiality_consent_id, coi_declared_at, coi_none, coi_statement) — documents as consent rows with
  purposes `judge_conduct` / `judge_confidentiality` (H16) or a dedicated agreement table (tournament); `judge_conflict`
  (round_id, judge_user_id, institution_id null, entry_id null, source declared|automatic|staff, created_by; CHECK exactly
  one target); `round_entry` (round_id, entry_id, admitted_by/at; unique) = pool; `round_assignment` (round_id,
  judge_user_id, entry_id, assigned_by/at; unique triple; FK to round_entry).
- **Routes/pages:** `/admin/judging/rounds`, `/admin/judging/rounds/new`, `/admin/judging/rounds/[id]` (tabs: settings,
  judges & invitations, conflicts, pool, assignments); `/judge` (landing), `/judge/invitations/[token]` (accept/decline
  after sign-in), `/judge/rounds/[id]/onboarding` (conduct, confidentiality, conflicts). `/judge` is already disallowed in
  `src/app/robots.ts`.
- **Messages namespaces:** `adminJudging`, `judging` (judge-facing).
- **Size:** XL — round configuration + machine; invitations, onboarding, scoped role grant; conflicts, pool, assignment.
- **Design uncertainty:** 3 — conflict model under blindness (judge declares institutions + free text; staff turn named
  people into entry-level conflicts; automatic conflicts from institution membership and guardianship; the judge is never
  told why an entry is missing); documents as consents vs own table; invitation as role grant (step-up at invite?); rubric
  pinning per discipline; one `open` state for assignment and scoring (recommended) vs two.
- **Risk flags:** auth/security (token → scoped role grant, IDOR across rounds), minors/safeguarding (in-person judging of
  children's work; vetting residue), personal data (judge emails, COI statements), F2 (scope type, consent purposes).
- **Test plan:** Seam 1 — competition manager creates a round (national, physical, ranked_123) → `draft`; creation refused
  while an enabled discipline lacks a published rubric; `openRound` → `open`; transition table for the states introduced:
  draft→open, draft→cancelled, open→cancelled allowed; open→draft and anything from cancelled refused; invite by email →
  drain → capture fake has the link; accept while signed in with the invited email → `judge` role scoped to (round, id),
  audit row; accept signed in as another email refused; expired token (fake clock) and replayed token refused; judge with the
  role but no onboarding → sees no entries, assignment refused; after conduct + confidentiality (document versions recorded)
  + conflict "institution X" → assigning an entry of X refused with code `conflict` and no participant data, an entry of Y
  allowed; automatic conflicts: judge who coordinates institution Z or is guardian of participant P is refused for those
  entries without declaring; physical round admits only `physicallyReadyEntryIds` (seed: verified ✓, discrepancy ✗, no
  artwork ✗); non-physical round admits FOA-verified entries regardless; judge of round A cannot read round B; authz:
  competition manager ✓ / content manager ✗ (create), invited judge ✓ / member ✗ (onboarding), manager ✓ / judge ✗ (assign).
  Seam 2 — none required. Axe pages: the 6 pages above.
- **File-conflict hotspots:** H22 (judging schema + module, owned here), H23 (judge layout, owned here), H8 (`can()` + round
  scope), H16 (if consent purposes), H9, H5, H1–H3, H6, H19.
- **Split (XL → 3):** 95a "FOA rounds: create/configure (level, pinned rubrics, award scheme, physical rule), round status
  machine, admin round screens" (M–L; ACs 1, 6; blockers = #95's) → 95b "Judge invitations and onboarding: token accept,
  round-scoped judge role, conduct + confidentiality + conflict declaration" (L; ACs 2, 3; after 95a) → 95c "Round pool and
  assignment: declared + automatic conflict refusals, physically-ready admission" (M; ACs 4, 5; after 95b + #94).
- **Tournament:** 95a NO (uncertainty 2). 95b YES, 2 contenders (auth/security, L): (a) #74's invitation pattern + consent
  rows for the documents; (b) a judge-onboarding aggregate with its own machine (invited → accepted → onboarded) and one gate
  `canJudge(judge, round)`; judge on grant safety, proof of "no entry before onboarding", reuse. 95c YES, 2 contenders
  (uncertainty 3): (a) institution-level conflicts + staff entry-level resolution stored as rows; (b) conflict as a pure
  function over (judge, entry) facts (declared institutions, memberships, guardianships, staff flags) evaluated at assignment
  and at read time.

### #96 (ordinal 41) — M3: Blind scoring
- **Depends-on:** native #95. Extra: #85 + #86 (derived image copies, video transcode + poster, sanitised essay text), #63
  (signed URLs), #88 (criterion ranges). **Blocks:** #97.
- **AFK class:** A.
- **Human residue:** none ticket-specific (showing titles to judges = R-FOA decision; default hidden, M34-13).
- **Ports/providers:** ObjectStorage signed URLs; no new port.
- **DB:** `score_sheet` (round_id, entry_id, judge_user_id, comment, complete bool (every criterion has a value), version
  int, updated_at; unique triple; FK to `round_assignment`); `criterion_score` (score_sheet_id, criterion_key, value
  smallint; pk sheet+criterion); optional append-only `score_sheet_revision` so the audit log gets a row on completion and on
  every change after completion, not one per keystroke.
- **Read model:** `blindEntryView` = allow-list projection {entryCode, discipline, category label, age-group label, media:
  [{kind image|video|essay, signedUrl, width, height, posterUrl}]}; the query module imports nothing from the
  registration/profile/institution schema (import-boundary test or lint rule).
- **Routes/pages:** `/judge/rounds/[roundId]` (assigned entries, progress, filter by category/status),
  `/judge/rounds/[roundId]/entries/[entryCode]` (viewer + rubric form, prev/next). Viewer: full-viewport `<dialog>`, zoom by
  buttons, keyboard (+/−/0) and pinch, pan by drag, Escape returns focus; `<video controls playsinline preload="metadata">`;
  essay text from the sanitiser (M34-14). Works without JS: the form posts a server action with an explicit Save button;
  JS adds debounced autosave with an `aria-live` "Saved" status.
- **Messages namespaces:** `judging` (extended: dashboard, scoring, viewer, autosave).
- **Size:** L.
- **Design uncertainty:** 3 — autosave protocol (per-criterion upsert vs whole sheet with optimistic version); the "scored"
  definition #97 locks on (recommend complete = all criteria present, no separate submit); viewer without a heavy library;
  blind scope (M34-13).
- **Risk flags:** minors/safeguarding (the blind read model protects children's identity), auth/security
  (assignment-scoped access, IDOR by entry code, signed-URL leakage), personal data.
- **Test plan:** Seam 1 — judge sees exactly their 2 assigned entries of 5 in the round; `getBlindEntry` on an unassigned
  entry refused with the same shape as a missing one (no existence leak); field-by-field test: serialise the view for an
  entry whose participant is "Aarav Sharma", school "St. Mary's", city "Pune", with guardian email and phone → the JSON
  contains none of those strings and its key set equals the allow-list exactly; signed URLs point at derived copies (purpose
  ≠ original), contain no participant id, registration number or original file name, and expire (fake clock); save 7 of max
  10 → returned after reload; 11, −1 and 7.5 (integer criterion) refused; partial save → incomplete; all criteria →
  complete; comment autosaves; concurrent save with a stale version handled per the chosen protocol with no lost update
  across criteria; save on a `locked` round refused (value exists in the enum); judge before onboarding refused; authz:
  assigned judge ✓, unassigned judge of the same round ✗, competition manager ✗ (scoring). Seam 2 — axe on both pages, both
  projects, including the open dialog; viewer zoom in/out and Escape; video `currentTime > 0` after a click on mobile (Pixel
  7); covered inside #97's journey or `tests/e2e/judging-viewer.spec.ts`. Axe pages: 2 pages + open viewer state.
- **File-conflict hotspots:** H22, H23, a generic viewer in `src/components/media-viewer/` + a `/styleguide` block (styleguide
  page is append-only), H8, H1–H3, H6 (judge with assignments and derived images in non-prod storage).
- **Tournament:** YES, 3 contenders (minors high risk, L, uncertainty 3). Angles: (a) simplest-thing — allow-list DTO in the
  use case, per-criterion server action; (b) deep-module-first — a `BlindJudging` module exporting only `listAssignments`,
  `getBlindEntry`, `saveScore`, branded `BlindEntryView`, import-boundary test; (c) risk-first — a database view with no join
  to profile tables, assignment-joined access, whole-sheet optimistic save. Judge on: security/minors dimensions, strength of
  the no-PII test, autosave UX and accessibility, viewer JS size.

### #97 (ordinal 42) — M3: Rankings, round lock and outcomes (M3 Seam 2 owner)
- **Depends-on:** native #96 + #94. Extra: #72 (award scheme), #59 (audit), #60 (override is a staff action; preview TOTP
  helper), #57 (capture-mailbox helper), M34-3/M34-4 harness. **Blocks:** #98, #99.
- **AFK class:** A.
- **Human residue:** none ticket-specific (FOA confirms the default tie-break rule: R-FOA, non-blocking).
- **Ports/providers:** Clock. Aggregation is a pure module.
- **DB:** `judging_round` + locked_at, locked_by, lock_override bool, lock_override_reason; `round_entry` + score as exact
  rational (`final_score_num`, `final_score_den` bigint) or numeric(12,6), rank smallint, tie_break_note; enum
  `round_outcome` + `outcome`, `award_position`, `advances`, `suitable_for_auction`, tagged_by, tagged_at (M34-5); trigger
  rejecting INSERT/UPDATE/DELETE on `score_sheet`/`criterion_score` of a locked round (defence in depth); event
  `judging_round.locked` (consumed by #98).
- **Aggregation (settle in hardening, record in the outcome ADR):** sheet total = 100 × Σ wᵢ·(sᵢ − minᵢ)/(maxᵢ − minᵢ) ÷ Σ wᵢ;
  entry score = mean of complete sheets; exact BigInt rationals, displayed to 2 dp; ranked per (category, age group); stated
  tie-break chain (default): (1) higher mean normalised score on the highest-weight criterion, then the next weight (rubric
  order breaks equal weights); (2) higher median sheet total; (3) shared rank (1, 2, 2, 4). The rule text is stored on the
  round and shown on the rankings page. Fixture weights: `src/content/judging.ts` RUBRIC (theme 30, creativity 25, technique
  25, presentation 20).
- **Routes/pages:** `/admin/judging/rounds/[id]/rankings` (per partition, progress, unscored list), lock dialog (override form
  for staff admins), `/admin/judging/rounds/[id]/outcomes` (after lock; prefilled from the award scheme).
- **Messages namespaces:** `adminJudging` (extended).
- **Size:** L (XL if the journey harness lands here: optional split 97a logic + UI, 97b Seam 2 journey).
- **Design uncertainty:** 3 — formula and exactness; tie-break chain; outcome model for 6 consumers (M34-5); ranking frozen at
  lock vs live when readiness changes later (recommend frozen over entries ready at lock; views still filter unready entries
  and flag them).
- **Risk flags:** auth/security (admin override, immutability), results integrity (public outcomes for children), Seam 2
  infra (M34-3, M34-4).
- **Test plan:** Seam 1 — hand-computed fixture: 4 entries × 3 judges × 4 criteria (max 10) with expected totals to 2 dp and
  ranks, including a tie separated by step 1 and a tie surviving to shared rank; incomplete sheets excluded from the mean;
  lock refused with 1 unscored assignment (error gives a count, no participant data); staff admin override with reason →
  `locked`, audit row with the reason and the unscored assignment ids; override without reason refused; competition manager
  override refused; after lock `saveScore` refused and a raw SQL update refused by the trigger; outcomes taggable only on a
  locked round; winner/runner-up prefill follows the award scheme; physical round: an entry whose artwork moves to
  `discrepancy` disappears from the rankings and outcomes views; transition table: open→locked (complete), open→locked
  (override), draft→locked and locked→open refused; authz: manager ✓ / judge ✗ (rankings), staff admin ✓ / manager ✗
  (override), manager ✓ / content manager ✗ (tag). Seam 2 — `tests/e2e/m3-blind-scoring.spec.ts`: fresh fixture (M34-4);
  judge signs in by OTP through the capture mailbox; dashboard lists only assigned entries and none of the seeded
  participant names; opens the viewer; scores every criterion of each entry; reload shows saved values; competition manager
  signs in (OTP + preview TOTP), locks the round, sees "Locked"; axe on every page visited, both projects. Axe pages:
  rankings, outcomes, lock dialog.
- **File-conflict hotspots:** H22, H8, H9, H1–H3, H6, `tests/e2e/support/*` (shared with #57, #60), new ADR file.
- **Tournament:** YES, 2 contenders (uncertainty 3). Angles: (a) pure `rankRound(sheets, rubric, rule)` over exact rationals,
  snapshot stored at lock; (b) SQL aggregation (numeric + window functions) with tie-break in TS. Judge on: fixture match,
  determinism, explainable tie-breaks, ergonomics for #98/99a.

### #98 (ordinal 43) — M3: Chained judging levels
- **Depends-on:** native #97. Extra: none beyond #97's closure. **Blocks:** none natively; 99a's "final round" uses the chain
  when present (final = the round no other round sources from).
- **AFK class:** A. **Human residue:** none.
- **Ports/providers:** none.
- **DB:** uses `judging_round.entry_source` / `source_round_id` from 95a (adds them if 95a did not); CHECK source_round_id <>
  id; consumer of `judging_round.locked` inserts `round_entry` rows into dependent rounds for entries with `advances = true`
  that pass physical readiness when the dependent round judges physical work (idempotent on round_id + entry_id).
- **Routes/pages:** "Entry source" on round settings (FOA-verified entries | finalists of round …);
  `/admin/judging/competitions/[code]/levels` (chain view, optional).
- **Messages namespaces:** `adminJudging` (extended).
- **Size:** M.
- **Design uncertainty:** 2 — materialise on lock (recommended: explicit, auditable) vs derive the pool live; "finalist"
  comes from #97's model; re-sourcing an open round (recommend refused).
- **Risk flags:** data integrity (cycles, cross-round leakage).
- **Test plan:** Seam 1 — B.source = A while A is open → B's pool empty; lock A with 3 advancing → drain → B's pool is exactly
  those 3; nothing flows from an unlocked A; B judges physical work and one advancing artwork is not ready → excluded; B keeps
  its own rubric version, award scheme and judges; the same entry scored differently in A and B → each ranking uses only its
  own sheets; A.source = A refused; A→B→C then A.source = C refused; two concurrent edits that would close a loop → exactly
  one succeeds (row lock or serializable); re-sourcing an open round refused; authz: manager ✓ / judge ✗ / content manager ✗.
  Seam 2 — none. Axe pages: round settings (changed), chain view.
- **File-conflict hotspots:** H22, H9 (consumer registration), H1.
- **Tournament:** NO (uncertainty 2, no charter flag).

### #99 (ordinal 44) — M4: Results approval, scheduled publishing and public results page
- **Depends-on:** native #97 + 1 (P1 #82; alt #81 or #69). Extra: #60 (step-up), #61 (scheduled job, internal revalidate
  route), #69 + #81 (prize messages, guardian routing), #70 (public competition pages, cache pattern), #72 (prize text per
  award), #65 (CSP), #82/#83 (credit resolver, public-display consent, `consent.withdrawn`; M34-7), #98 when merged,
  Lighthouse runner (M34-10). **Blocks:** #100, #103 + 3 of {#119, #120, #131, #134}.
- **AFK class:** B.
- **Human residue:** R-APPROVERS (FOA names ≥ 2 staff with 2FA who can prepare/approve; ops, non-blocking); R-FOA (prize,
  trophy and medal descriptions and delivery wording per competition); R-SAFEGUARD + R-DPDP append (public credits of
  minors); R-DLT append (prize SMS); R-WORKER (scheduled publish handler).
- **Ports/providers:** Clock, JobQueue (publish at instant), `notify`, step-up guard, revalidation (internal route or
  `revalidateTag`/`updateTag` per `node_modules/next/dist/docs/01-app/02-guides/` — read before coding).
- **DB:** enum `results_release_status` (draft, pending_approval, approved, published, rejected — full set);
  `results_release` (id, competition_id, source_round_id, version smallint default 1, status, snapshot jsonb (ordered:
  entry_id, entry_code, category, age group, outcome, award_position, award label), snapshot_hash (sha256 of canonical
  JSON), publish_at, prepared_by/at, approved_by/at, rejection_reason, published_at; CHECK approved_by <> prepared_by;
  partial unique "one live release per competition" WHERE status IN ('draft','pending_approval','approved') — literals from
  the same CREATE TYPE, F2-safe); `competition_status` gains `results_published` only if #71 did not define it (no DDL use).
  Events: `results.approval_requested`, `results.published` {competitionId, releaseId, publishedAt} (consumed by #94, 100a,
  later #119, #120, #134), `results.prize_awarded` per winner. Credits are computed at read time, never stored, so a
  withdrawal applies on the next render; the `consent.withdrawn` consumer revalidates the results cache tag.
- **Routes/pages:** `/admin/results` (competitions with a locked final round), `/admin/results/[competitionCode]` (prepare,
  preview, publish time in IST, submit), `/admin/results/[competitionCode]/approve` (second staff, step-up, approve/reject
  with reason); public `/competitions/[slug]/results` (per discipline → category: positions, special mentions, finalists;
  consented credits only; never city (unless opted in), age or DOB; "Name withheld" without public-display consent; before
  publish "Results will be announced on …" with no embargoed data in HTML or the flight payload). Competition detail page
  links to results once published (touches H25).
- **Messages namespaces:** `adminResults`, `results` (public). Prize message bodies are template seed rows (#69).
- **Size:** XL.
- **Design uncertainty:** 3 — snapshot + hash (recommended; re-verified at approve and at publish) vs live outcomes; publish
  job idempotency and stale-hash rejection; rendering (cache-tagged prerender revalidated on publish and on consent change vs
  dynamic) under #65's CSP and Lighthouse; final round with/without #98; inline publish-now path (M34-3).
- **Risk flags:** auth/security (two-person rule, step-up, embargo leakage), minors/safeguarding (public credits), CSP
  (public page), infra (worker skew; revalidation into previews behind Vercel protection).
- **Test plan:** Seam 1 — prepare from a locked final round → `draft` with snapshot; refused for an unlocked round or while
  another live release exists; submit → `pending_approval` → drain → approvers receive `results.approval_requested`; the
  preparer approving refused; second staff without fresh step-up refused (fake clock beyond the step-up window); with
  step-up → `approved`, publish_at T; drain at T − 1 s → not published, public read model empty; drain at T → published once
  (drain twice = one `results.published`, one set of prize messages), `published_at = T`; snapshot tampered after approval →
  publish job rejects (stale hash) and the release becomes `rejected`; public read model: adult with consent → full credit
  per resolver; minor default "Asha K."; school only with display_school; city only with display_city; no consent → "Name
  withheld" with award and entry code; JSON contains no DOB, age, guardian data or asset key; withdrawal → drain → withheld;
  positions 1–3 receive the prize message with #72's prize text; minor winner → guardian receives it, child does not;
  transition table: draft→pending_approval→approved→published, pending_approval→rejected, approved→rejected, rejected→draft
  (decide), published→anything refused; authz: competition manager ✓ / content manager ✗ (prepare), staff admin with step-up
  ✓ / preparer ✗ / finance ✗ (approve). Seam 2 — axe on 3 admin pages + public page; Lighthouse mobile ≥ 90 (perf + a11y) on
  `/competitions/[slug]/results`; the page is in 103d's crawl. Axe pages: 4.
- **File-conflict hotspots:** H25 (`src/app/competitions/[slug]/**`; results is a new child route), H17 (`competition_status`),
  H30 (`results.published` consumers), H9, H10, H8, H16 (resolver import/extraction), H32, H3.
- **Split (XL → 2):** 99a "Results release: prepare from the locked final round, two-person approval with step-up,
  scheduled publish, results machine, `results.published`, prize messages" (L; ACs 1, 2, 3, 5, 6) → 99b "Public results page
  with consented credits, revalidation on publish and on consent withdrawal, Lighthouse" (M–L; AC 4 + Lighthouse; after 99a).
  100a needs only 99a; #103 needs 99b if its native edge is #99.
- **Tournament:** 99a YES, 2 contenders (auth/security, L): (a) snapshot-and-hash release aggregate, publish job re-verifies
  the hash; (b) live-derived results with a release row that pins only the round lock and the publish time. 99b YES, 2
  contenders (minors + CSP, rendering uncertainty 3): (a) `"use cache"` + `cacheTag("results:<competitionId>")` prerender,
  revalidated by the worker; (b) static shell + DB section streamed inside Suspense. Judge on: embargo-leak test, Lighthouse,
  build output (route stays prerendered), CSP, credit correctness.

### #100 (ordinal 45) — M4: Certificates with QR verification
- **Depends-on:** native #99 (needs 99a). Extra: #89 + #91 (school-round outcomes per registration; owner comment on #89),
  #97 (round outcomes), #73 (codes), #63 (private files, signed URLs), #85 (worker-media exists), #61 (jobs), #69 + #81
  ("certificate ready" message, guardian downloads), #57/#58 (Postgres rate limiter for `/verify`). **Blocks:** #101, #102,
  #124 (volunteer certificates).
- **AFK class:** B.
- **Human residue:** R-CERT-DESIGN (FOA approves artwork per type, wording, signatories' names/titles and signature images;
  seed uses the logo master and a signatory marked "sample"); R-GOTENBERG (owner deploys worker-media + the Gotenberg 9
  sidecar, exact tag ≥ 9.8.0, from the compose file this ticket writes; T1 runners cannot reach the VPS); R-FOA (special-
  mention certificate: default none; `YY` = issue year in IST); R-RET append.
- **Ports/providers:** NEW `PdfRenderer` port (fake records template id + data and returns deterministic bytes; production
  adapter: worker-media → Gotenberg 9 HTTP, M34-9); QR encoder library (not a port, M34-11); ObjectStorage (private purpose
  `certificate_pdf`); JobQueue; Clock; rate limiter.
- **DB:** enum `certificate_type` (participation, school_merit, finalist, winner, runner_up, volunteer_service (unused until
  #124, M34-2)); `certificate_status` (issued, revoked, superseded); `certificate_render_status` (pending, rendered, failed);
  `certificate` (id, `number` unique matching `CERTIFICATE_NUMBER` in `src/content/sample/certificate.ts`
  (`^FOA-C-\d{2}-[0-9A-HJKMNP-TV-Z]{10}$`), type, status, competition_id, registration_id null (null only for
  volunteer_service, CHECK written without enum literals), participant_profile_id, entry_id null, round_id null, award_label
  null, name_snapshot (full name for the PDF, PD), template_version, render_status, pdf_file_id null, render_attempts,
  issued_at, source_release_id; revoked_at/by/reason and superseded_by_id added now for #101 (one migration on this table);
  unique (registration_id, type, round_id) NULLS NOT DISTINCT for idempotency). Events `certificate.issued`,
  `certificates.ready` (per recipient). The verify page shows the live public credit (resolver), not a stored one.
- **Issue rules (settle in hardening; record in an ADR):** consumer of `results.published` runs
  `issueCertificates(competitionId, releaseId)` in the general worker: participation for every confirmed registration whose
  entry reached `submitted` (individual route) or that took part in a school round (#89/#91 query; shortlist-only students
  without a digital entry included); school_merit per school position (label = position); finalist/winner/runner_up from the
  release snapshot (winner gets winner only); withdrawn and disqualified excluded. Rows, numbers and `issued` happen in the
  general worker (M34-3); `certificate.render` jobs go to worker-media.
- **Routes/pages:** `/verify` (number form; plain GET to `/verify/[number]`, works without JS), `/verify/[number]` (trim,
  uppercase, Crockford O→0 and I/L→1; issued → "Valid" + public credit, competition, year, type, award label, issue date;
  unknown and malformed → one "unknown" page; revoked/superseded wired by #101; `robots: { index: false }`; `/verify` already
  disallowed in `robots.ts`; 30 requests/min/IP; dynamic inside Suspense; no inline scripts); `/dashboard/certificates`
  (participant; guardian sees each linked child) → `/api/certificates/[id]/pdf` (`can()`, then 302 to a short-lived signed
  URL, `Cache-Control: no-store`); `/admin/certificates` (staff list by competition, render status, retry failed).
- **Messages namespaces:** `certificates` (dashboard), `verify` (public), `adminCertificates`.
- **Size:** XL.
- **Design uncertainty:** 3 — eligibility across routes and scopes; validity separate from rendering; template technology;
  live vs snapshot credit on `/verify`; meaning of `YY`.
- **Risk flags:** minors (public verify page, children's PDFs), auth/security (download authz; public lookup endpoint —
  10 Crockford chars = 50 bits, plus rate limit), CSP (public dynamic page), infra (Gotenberg sidecar, worker skew), new
  dependency (QR encoder).
- **Test plan:** Seam 1 — seeded competition with 6 registrations (2 adult individuals, 1 minor individual, 3 institution
  students incl. one shortlist-only without a digital entry), school positions, a final-round snapshot with 1 winner, 1
  runner-up, 1 finalist; drain after `results.published` → exactly the expected (registration, type) set (table-driven);
  numbers unique and regex-valid; drain again and re-run the job by hand → no new rows; QR: the renderer fake received an SVG;
  rasterise with `@resvg/resvg-js`, decode with `jsqr` → `${APP_URL}/verify/<number>`; verify read model: issued → valid with
  public credit (minor "Asha K."), competition, type; unknown → unknown; lowercase input and O-for-0 normalise to valid; no
  DOB, age, city, school (unless opted in), guardian data or registration number; 31st lookup in a minute refused (fake
  clock); download: participant ✓, guardian of that child ✓, another participant ✗, coordinator ✗ (until #101's ZIP), staff ✗
  per "nobody else" (confirm in hardening); render failure → `failed` after N retries, certificate still valid, admin retry
  re-enqueues; certificate transition table (issued→revoked and issued→superseded only through #101's use cases; revoked and
  superseded terminal); authz per use case. Seam 2 — axe on `/verify`, `/verify/[number]` (valid and unknown),
  `/dashboard/certificates`, `/admin/certificates`. Journey: #101. Axe pages: 4 (+1 state).
- **File-conflict hotspots:** H13 (certificates module, owned here), H21 (`file_asset_purpose`, worker-media job registry),
  H29 (compose + Dockerfile: Gotenberg 9 service; never `docker compose down -v`, project name `foa-vps`), H30, H9, H8, H32,
  H26, H5, H3, `src/env.schema.ts` (Gotenberg URL for the worker).
- **Split (XL → 3):** 100a "Certificates module: eligibility and issuing on results-published, numbers, validity machine,
  idempotency, PdfRenderer port + fake, admin list" (L; ACs 1, 2 (number), 5, 6) → 100b "Public verification page with QR
  target, normalisation, rate limit, no-PII view" (M; ACs 2 (QR), 3; after 100a) ∥ 100c "Certificate template and PDF
  rendering in worker-media (Gotenberg 9 adapter, fonts, compose service), participant/guardian downloads" (L; AC 4 + render
  path; after 100a).
- **Tournament:** 100a YES, 2 contenders (uncertainty 3): (a) one `issueCertificates` computing the full expected set and
  inserting the difference; (b) per-source issuers (school round, rounds, registrations) behind an `EligibleCertificateSource`
  interface. 100c YES, 2 contenders (uncertainty 3): (a) server-rendered HTML/CSS → Gotenberg Chromium; (b) SVG template →
  Gotenberg (or resvg → PDF). Judge on: logo master only, Devanagari rendering, determinism, PDF size. 100b NO (M,
  uncertainty 2).

### #101 (ordinal 46) — M4: Revoke, reissue and bulk-download certificates (M4 Seam 2 owner)
- **Depends-on:** native #100 (all of 100a–c). Extra: #74/#75 (coordinator scope over institution registrations), #63 (signed
  links), #61, #69 + #81 (reissue message to participant or guardian), #57 + #60 (journey helpers), M34-3/M34-4 harness.
  **Blocks:** none.
- **AFK class:** A.
- **Human residue:** R-WORKER only if M34-3 option (2) is absent; R-RET append (bundles).
- **Ports/providers:** ObjectStorage (ZIP write, signed link), JobQueue, `notify`; ZIP library (M34-11).
- **DB:** `certificate` columns from 100a + `reissued_from_id`; corrections = new row with corrected `name_snapshot` and/or
  award label, reason required; enum `certificate_bundle_status` (pending, ready, failed, expired); `certificate_bundle` (id,
  institution_id, competition_id, requested_by, status, file_asset_id, certificate_count, expires_at (default 7 days),
  created_at); purpose `certificate_bundle`. Events `certificate.revoked`, `certificate.reissued`,
  `certificate_bundle.ready`.
- **Routes/pages:** `/admin/certificates/[number]` (revoke with reason; reissue with corrected name/award label + reason),
  `/institution/certificates` (per competition list, "Download all as ZIP", bundle status), `/api/certificate-bundles/[id]`
  (`can()` → signed URL redirect). Verify page shows "Revoked" for revoked and superseded (superseded adds "replaced by a
  reissued certificate").
- **Messages namespaces:** `adminCertificates` (extended), `institutionCertificates` (new).
- **Size:** L — 2 use cases + ZIP job + journey.
- **Design uncertainty:** 2 — correctable fields (name spelling, award label; never type); ZIP contents (valid only) and file
  names (codes, no names); streaming from storage vs in memory (stream; cap per bundle).
- **Risk flags:** auth/security (cross-institution leakage, signed-link lifetime), minors (children's PDFs in bulk), new
  dependency (ZIP), worker skew (journey).
- **Test plan:** Seam 1 — revoke without reason refused; with reason → `revoked`, audit row, verify read model "revoked"; a
  stamped share image (#102) is deleted/invalidated — tested by whichever of #101/#102 merges second; reissue → new
  regex-valid number, old → `superseded` (verify "revoked" + note), new valid, new render enqueued, drain → adult participant
  or minor's guardian receives the reissue message; reissuing a revoked certificate refused; ZIP: coordinator of I requests
  → `pending` → drain → `ready` with exactly I's valid certificates; coordinator of J cannot request or fetch I's bundle (same
  shape as not found); signed link expires (fake clock); `expires_at` passed → `expired`; empty set refused (decide);
  transition tables: certificate issued→revoked, issued→superseded, terminal states refused; bundle pending→ready|failed,
  ready→expired; authz: manager ✓ / coordinator ✗ (revoke, reissue), coordinator of I ✓ / participant ✗ (bundle). Seam 2 —
  `tests/e2e/m4-certificates.spec.ts` on the PR preview with a fresh fixture (M34-4): competition manager prepares results
  from a locked final round; staff admin approves with step-up (preview TOTP) and publish time = now; certificates issued
  (M34-3); the journey opens the certificate's verify URL (read from `/admin/certificates`; QR payload equality is proven in
  Seam 1) → "Valid"; manager revokes with a reason → verify page "Revoked"; axe on every page visited, both projects. Axe
  pages: certificate detail, institution certificates.
- **File-conflict hotspots:** H13 (serial after #100), H21, H9, H8, H27, H3, `tests/e2e/support/*`.
- **Tournament:** YES by rule (auth + minors, L) — rule-triggered, low yield (uncertainty 2); 2 contenders: (a) bundle built on
  each request; (b) bundle cached per (institution, competition, certificate-set hash), rebuilt on change. First candidate to
  downgrade to PAPER when budget tightens.

### #102 (ordinal 47) — M4: Logo stamping and shareable certificate image
- **Depends-on:** native #100 (certificate data for the share image; 100a suffices technically). Extra: #85 (worker-media,
  media-processor port + fake, derived copies, metadata stripping), #63 (purposes, public/private buckets). **Blocks:** #103.
- **AFK class:** B.
- **Human residue:** R-BRAND-STAMP (FOA design sign-off of placement, size, opacity, contrast thresholds and the tiles-only
  small-size rule — #17 approved the derivations, not their placement); R-GOTENBERG if the share card uses Gotenberg.
- **Ports/providers:** media-processor port from #85 extended with a stamp/composite operation (input: derived source file,
  variant, logo variant, geometry; output: bytes, width, height); production adapter sharp in worker-media; fake records
  inputs and returns a deterministic image description; ObjectStorage (public bucket for gallery/social, private for the
  certificate share).
- **Logo set:** only `public/brand/foa-logo-watermark.png` (colour), `foa-logo-watermark-white.png`,
  `foa-logo-watermark-black.png`, and the tiles-only derivation (`tilesOnly` in `scripts/brand-logo.ts`) when the stamped
  logo would be narrower than a threshold (default 96 px) — bundled into the worker-media image with checksums, never redrawn
  or recoloured. Contrast: pure `pickLogoVariant(regionLuminanceStats, logoWidthPx)` — colour on light/mid-tone, white on
  dark, black on very light (README guidance), thresholds as code constants with a test table.
- **Variants:** gallery (long edge ≤ 2048 px, no upscaling, 480 px thumbnail cut from the stamped output), social (1080×1080,
  contain on a brand background), certificate_share (1080×1350 card: credit, competition, award, number, QR). Settings hash
  covers geometry, logo checksum and pipeline version.
- **DB:** enum `stamp_variant` (gallery, gallery_thumb, social, certificate_share); `stamped_derivative` (source_file_id,
  variant, logo_variant colour|white|black|tiles, settings_hash, output_file_id, created_at; unique (source_file_id, variant,
  settings_hash)); purposes `stamped_gallery`, `stamped_social`, `certificate_share`; `certificate.share_file_id` null; job
  `stamp.render` (worker-media).
- **Routes/pages:** share button on `/dashboard/certificates` → `/api/certificates/[id]/share` (`can()` → signed URL). No admin
  page.
- **Messages namespaces:** `certificates` (extended).
- **Size:** L.
- **Design uncertainty:** 3 — certificate share-card rendering path (sharp + SVG text with embedded font subsets vs Gotenberg
  screenshot vs resvg); contrast algorithm and placement; idempotency key; which name the share image shows (recommend the
  public credit by default, since it is made for social media).
- **Risk flags:** brand/legal (registered mark), minors (share image carries a child's credit), metadata leakage, infra
  (worker-media dependencies, fonts), worker skew.
- **Test plan:** Seam 1 — `stamp(derivedFileId, "gallery")` → the processor fake received the derived copy (an original's id
  is refused), output stored as `stamped_gallery` in the public-bucket fake; repeat → same derivative, one processor call;
  dark region → white logo, light → colour, very light → black, narrow logo → tiles; only the 4 approved assets are ever
  passed (ids/checksums against a brand registry); social output 1080×1080; participant downloads the share image (private,
  signed URL); child's guardian ✓, another participant ✗; revoked certificate → share download refused (with #101); no
  metadata: an adapter contract test runs the real sharp adapter on a fixture JPEG carrying EXIF GPS + XMP and asserts the
  output has none (`sharp(out).metadata()` exif/xmp/iptc undefined), following #85's EXIF precedent — if the Orchestrator
  forbids adapter tests, prove it in Seam 2 by downloading a share image on the preview and parsing EXIF in Playwright; authz
  per use case. Seam 2 — axe on `/dashboard/certificates` with the share button. Axe pages: dashboard certificates (changed).
- **File-conflict hotspots:** H21 (worker-media job registry and purposes; shared with #85, #86), H13 (share column), H29
  (Dockerfile worker-media target: assets + fonts), new `src/server/stamping/**` (owned), H1–H3.
- **Split:** not required (L). Only if the Orchestrator re-points #103's edge (M34-1): 102a "Stamping service: gallery and
  social variants" (after #85) and 102b "Certificate share image" (after 100a + 102a).
- **Tournament:** YES, 2 contenders (uncertainty 3): (a) sharp-only — share card as SVG (embedded font subsets + QR SVG)
  rasterised by sharp, then composited; (b) HTML card via Gotenberg screenshot, composited by sharp. Judge on: brand fidelity,
  Devanagari credit rendering, determinism, infra footprint, metadata proof.

### #103 (ordinal 48) — M4: Public gallery with consent gating (crawl owner)
- **Depends-on:** native 3 (P1 #102 + #82 + #99; P2 #102 + #82 + #85). Extra: #83 (institution declaration never covers
  public use), #97 + #89 (recognition from FOA outcomes and school positions), #63 (public bucket), #62 (SLA setting), #65
  (CSP `img-src`), #57/#58 (rate limiter for reports), Lighthouse runner (M34-10), `PublicAssetUrl` (M34-8), the other of
  #85/#99. **Blocks:** #104.
- **AFK class:** B.
- **Human residue:** R-R2CDN (FOA R2 account: public bucket, custom CDN domain in Cloudflare, purge token scoped to the zone;
  env `PUBLIC_ASSET_BASE_URL`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_PURGE_TOKEN` in Vercel and the worker); R-SLA (counsel
  confirms the withdrawal time limit; default: off public pages within 15 min, CDN purge within 15 min, hard limit 24 h);
  R-MODERATION (FOA safeguarding: report reasons, reviewer, response time); R-SAFEGUARD append; R-RET append (reports).
- **Ports/providers:** NEW `CdnPurger` port (purge by URL list; Cloudflare adapter; fake records purges; non-prod adapter
  logs a no-op when no CDN is configured); ObjectStorage public bucket; JobQueue (high-priority unpublish/purge); rate
  limiter; consent read API + `consent.withdrawn` consumer; cache tags `gallery`, `gallery:<entryCode>`.
- **DB:** enum `gallery_item_status` (draft, published, hidden, unpublished — hidden = moderator, unpublished =
  consent/system); `gallery_item` (entry_id unique, competition_id, status, title ≤ 120, story ≤ 500 (through #111's
  sanitiser if merged, else plain text), recognition label (from #97/#89), age-category label, credit computed live (never
  stored), stamped_image_id, thumb_id, picked_by, published_at, hidden_at/by/reason, unpublished_at, unpublished_reason
  consent_withdrawn|moderator|disqualified); `gallery_report` (gallery_item_id, reason unsafe|identifies_child|
  not_their_work|other, details ≤ 1000 (PD possible), contact_email null (PD), ip_hash (salted sha256), status
  open|actioned|dismissed, handled_by/at, created_at); `cdn_purge` (urls jsonb, reason, requested_at, deadline_at,
  completed_at, attempts, last_error). Settings `gallery.withdrawalPurgeMinutes` (15), `gallery.reportsPerIpPerHour` (5).
- **Routes/pages:** public `/gallery` (filters: competition, discipline, age category, recognition; cursor paging),
  `/gallery/[entryCode]` (stamped image, title, credit, category, recognition, story, report link; gone/404 when not
  published), `/gallery/[entryCode]/report` (no login, rate-limited, honeypot; confirmation shows no details); `/admin/gallery`
  (eligible entries, pick, edit title/story, publish, hide), `/admin/gallery/reports` (queue, hide at once, dismiss). Add
  `/gallery` to `ROUTES` + `nav.links` label + sitemap (list page only; item pages of minors never in the sitemap), remove
  `/gallery` from the unbuilt list in `src/lib/routes.test.ts`; the home `Gallery` section (`src/app/page.tsx` 267–278,
  `GalleryFrames`) shows featured published items, keeping the placeholder frames when there are none.
- **Messages namespaces:** `gallery` (public + report form), `adminGallery`; `home` gallery strings (H31).
- **Size:** XL.
- **Design uncertainty:** 3 (4 for the purge pipeline) — public images on previews (M34-8); prerender + revalidation inside the
  SLA while the preview worker may be stale; live credit (recommended) vs snapshot; meaning of "approved display name"
  (content manager approves the resolver's output; manual edits may only shorten it); home page replacement; report abuse
  with no captcha until #113 (M5).
- **Risk flags:** minors/safeguarding (public children's work, withdrawal SLA, reports), CSP (public pages, CDN host),
  auth/security (public report endpoint, moderation actions), personal data (reports), infra (CDN, worker skew), performance
  (Lighthouse, 170 KB initial JS per prerendered page).
- **Test plan:** Seam 1 — eligible list contains only entries with valid public-display consent: adult individual with
  consent ✓, minor with guardian OTP consent ✓, school-route student covered only by the institution declaration ✗ (#83),
  withdrawn ✗; picking an ineligible entry refused; publish → public read model shows title, credit per resolver (minor "Asha
  K.", school/city only with opt-ins), age category, recognition, story; read-model JSON contains none of the entry's original
  or private-derivative storage keys (search every seeded key) and only URLs built by `PublicAssetUrl` for `stamped_*` files;
  emit `consent.withdrawn` (public display) at T → drain → unpublished, read model excludes it, cache tags revalidated (fake),
  `CdnPurger` fake received the item's stamped URLs with completion ≤ T + 15 min; purge failure → retried within the
  deadline, alert event once the deadline passes; visitor report → open report, audit row, content managers' inbox item; 6th
  report from one IP within an hour refused; content manager hides → hidden at once, read model excludes it, purge enqueued,
  audit row; unhide only while consent is still valid; authz: content manager ✓ / member ✗ (pick, publish, hide), anonymous
  visitor ✓ (report). Seam 2 — axe on `/gallery`, `/gallery/[entryCode]`, report form + confirmation, `/admin/gallery`,
  `/admin/gallery/reports`; Lighthouse mobile ≥ 90 on `/gallery` and one item page; crawl (103d): visit `/gallery`, every
  item page, every published `/competitions/[slug]/results`; collect every `img[src]`, `srcset`, `og:image`, `a[href]` to
  media; assert each resolves under the stamped public base and that every seeded original key, requested on the public
  base, returns 4xx. Axe pages: 6.
- **File-conflict hotspots:** H24 (gallery module, owned here), H4 (`ROUTES`, nav labels, `routes.test.ts`), H31 (home gallery,
  shared with #111), H32, H12/H28 (CSP, `next.config.ts`), H16 (withdrawal consumers), H9, H8, H7, H5, H3, H6 (published
  items need stamped files in non-prod storage).
- **Split (XL → 4):** 103a "Gallery curation and public gallery pages from the database: consent-gated picking, stamped images
  only, credits, original-key test, routes/sitemap/home, Lighthouse" (L; ACs 1, 2, 4, 7) → 103b "Consent withdrawal
  unpublishes and purges the CDN copy within the time limit (CdnPurger port)" (M; AC 3; after 103a) ∥ 103c "Visitor reports and
  immediate hide, audit-logged, moderation queue" (M; AC 5; after 103a) → 103d "Seam 2 crawl: no public gallery or results URL
  resolves to an original asset" (S–M; AC 8; after 103a + 99b).
- **Tournament:** 103a YES, 3 contenders (minors high risk, L, uncertainty 3): simplest-thing (dynamic DB pages inside
  Suspense, live credit); deep-module-first (`Gallery` module exporting only `publicGalleryView` built from branded
  `PublicAssetUrl`, cache-tagged prerender); risk-first (a fully public projection table `gallery_public_item` rebuilt on every
  consent event; pages read only that table). 103b YES, 2 contenders (uncertainty 4): (a) synchronous unpublish in the consumer
  + purge job with a deadline row and retries; (b) purge queue table drained by a high-priority pg-boss schedule with an SLA
  monitor. 103c NO (M, uncertainty 2). 103d NO.

### #104 (ordinal 49) — M4: Social-media export queue
- **Depends-on:** native #103. Extra: #102 (social variant), #82 (social-media purpose + withdrawal event). **Blocks:** none.
- **AFK class:** A.
- **Human residue:** R-SOCIAL-TAKEDOWN (FOA policy for items already posted by hand when consent is withdrawn: the platform
  alerts content managers; people take the post down); R-FOA (default caption wording). Both non-blocking.
- **Ports/providers:** ObjectStorage (stamped social image), consent read API, `consent.withdrawn` consumer.
- **DB:** enum `social_queue_status` (pending, posted, removed); `social_queue_item` (gallery_item_id, caption ≤ 2200,
  status, queued_by/at, posted_by/at, removed_at, removed_reason consent_withdrawn|manual|gallery_unpublished; partial unique
  on gallery_item_id WHERE status <> 'removed', literal from the same CREATE TYPE). Withdrawal of social-media consent — and
  of public display, since items come from published gallery items (recommended) — moves pending items to `removed`; posted
  items stay `posted` and raise a content-manager inbox alert.
- **Routes/pages:** `/admin/social` (tabs pending/posted; add from published gallery items with social consent),
  `/admin/social/[id]` (edit caption, download image, copy caption + credit, mark posted).
- **Messages namespaces:** `adminSocial`.
- **Size:** M.
- **Design uncertainty:** 2 — download format (image download + copy-to-clipboard island recommended, no ZIP); default caption
  template; whether public-display withdrawal also removes (recommended yes).
- **Risk flags:** minors/safeguarding (social use of children's work), personal data (credits in captions).
- **Test plan:** Seam 1 — queue a published item with social-media consent → `pending` with a default caption containing the
  resolver credit; item without social consent refused; minor without guardian social consent refused; caption of 2200 chars
  ✓, 2201 refused; download gives the stamped social derivative (never an original; key assertion as in #103); mark posted →
  `posted`, audit row; withdrawal of social consent at T → drain → pending item `removed` and gone from the queue view; posted
  item stays and content managers get an inbox alert; public-display withdrawal → `removed` (if adopted); transition table:
  pending→posted, pending→removed allowed; posted→removed and anything from removed refused; authz: content manager ✓ /
  competition manager ✗ / member ✗. Seam 2 — axe on both pages. Axe pages: 2.
- **File-conflict hotspots:** H24 (neighbour; own `social.ts` schema file), H16, H9, H8, H3, H19.
- **Tournament:** NO (size M, uncertainty 2).

## 3. Human residue for M3/M4 (deduped; one `ready-for-human` + `factory:needs-human` child each)

| Id | Item | Owner | Tickets | Blocks merge? | Wizard |
|---|---|---|---|---|---|
| R-ARTWORK-LOGISTICS | FOA facility address, packaging instructions, who pays shipping, dispatch window | FOA leadership | #93 | no (sample values; prod refuses placeholders) | no |
| R-JUDGE-VETTING | Police verification of in-person judges before the pilot's physical round | FOA leadership | #95 (95b) | no (pilot prerequisite; list in M3 Merge Danger) | no |
| R-LEGALCOPY (append) | Judge code of conduct and confidentiality terms | counsel + FOA | #95 (95b) | no (sample docs) | no |
| R-APPROVERS | ≥ 2 staff accounts with 2FA able to prepare/approve results | FOA + owner | #99 (99a) | no | no |
| R-CERT-DESIGN | Certificate artwork per type, wording, signatories, signature images | FOA (design sign-off) | #100 (100c) | no (sample signatory) | no |
| R-GOTENBERG | Deploy worker-media + Gotenberg 9 (exact tag ≥ 9.8.0) on the VPS from the committed compose file | owner | #100 (100c), #102 | no (fake in Seam 1; PDFs absent on previews until done) | yes |
| R-BRAND-STAMP | Stamp placement, size, opacity, contrast thresholds, tiles-only threshold | FOA (design sign-off, per #17) | #102 | no | no |
| R-R2CDN | R2 public bucket, CDN custom domain, Cloudflare purge token, env vars in Vercel + worker | owner + FOA | #103 (103a, 103b) | no (fallback route outside production; production gallery needs it) | yes |
| R-SLA | Counsel confirms the consent-withdrawal time limit (default 15 min / hard 24 h) | counsel | #103 (103b) | no | no |
| R-MODERATION | Report reasons, reviewer, response time for gallery reports | FOA safeguarding lead | #103 (103c) | no | no |
| R-SOCIAL-TAKEDOWN | Takedown policy for manually posted items after consent withdrawal | FOA | #104 | no | no |
| R-SAFEGUARD (append) | Safeguarding sign-off of public credits, gallery and verify page | FOA DSL + owner | #99, #100, #103 | M4 milestone PR merge | no |
| R-DPDP (append) | Public credits of minors under DPDP | counsel | #99, #103 | no | no |
| R-DLT (append) | DLT templates for new SMS-capable events (artwork, results, certificates) | FOA + owner | #93, #99, #100, #101 | no (SMS off) | partial |
| R-RET (append) | Retention of every new inventory field (M34-16) | counsel | all 12 | no | no |
| R-WORKER (append) | Redeploy `worker-preview`/staging workers from the milestone tip so new handlers run | owner | #93, #94, #99–#104 | only if M34-3 option (2) is absent: blocks #101's journey | yes |
| R-FOA (append) | Tie-break rule, special-mention certificate, judges seeing titles, essay names, caption wording, prize texts | FOA leadership | #96, #97, #99, #100, #104 | no (defaults) | no |

## 4. File-conflict hotspots (serialize-on-conflict keys for M3/M4)

New codes (H1–H21 as defined in issues-M6-M8.md §0.3):

| Code | File(s) | Owner ticket | Merge rule |
|---|---|---|---|
| H22 | `src/server/db/schema/judging.ts`, `src/server/judging/**` | 95a | Serial natively (#95 → #96 → #97 → #98). |
| H23 | `src/app/judge/layout.tsx` + judge navigation | 95b | Serial natively (95b → #96). |
| H24 | `src/server/gallery/**`, schema `gallery.ts` (+ `social.ts`) | 103a | Serial natively (#103 → #104). |
| H25 | `src/app/competitions/[slug]/**` (results child route, "View results" link) | #70 | 99b adds a child route; serialize with any open M1 competitions-page work. |
| H26 | Participant dashboard navigation (`/dashboard`: artwork, certificates) | #78 | Append one link per ticket; merge queue. |
| H27 | Institution dashboard navigation (`/institution`: artwork, certificates) | #75 | Append; merge queue. |
| H28 | `next.config.ts` images + CSP `img-src` (CDN host) | #63/#65 | Serialize with H12 holders (103a). |
| H29 | `Dockerfile` worker-media target, `docker/workers.yml`/compose (Gotenberg 9) | #61/#85 | Serialize (100c, #102). Never `docker compose down -v` (fixed project `foa-vps`). |
| H30 | `results.published` consumer list (#94, 100a, later #119, #120, #134) | 99a | Append consumers via H9 registry. |
| H31 | Home gallery: `src/app/page.tsx` (267–278), `src/app/_components/home-layout.ts`, `src/components/showcase/gallery-frames.tsx`, `messages/en-IN/home.json` | 103a | Serialize with M5 #111 (CMS home sections). |
| H32 | `src/app/sitemap.ts`, `src/app/robots.ts` (+ tests) | #70 | Append (99b results, 103a gallery); `/verify` stays disallowed. |

Per-ticket key usage (who touches what):

| Key | Tickets | Rule |
|---|---|---|
| H15 physical artwork enum + table | #93 (creates), #94; later #131, #133 | serial natively |
| H22 judging schema/module | 95a, 95b, 95c, #96, #97, #98 | serial natively |
| H13 certificates module + `/verify` | 100a (creates), 100b, 100c, #101, #102; later #124 | 100b ∥ 100c both edit `certificate` reads only; schema changes only in 100a and #101 → serialize those two |
| H21 `file_asset_purpose` + worker-media job registry | #94, 100a, 100c, #101, #102 | append; merge queue; F2 (no DDL use) |
| H16 consent read API / withdrawal consumers | 99b, 103a, 103b, #104 (+95b if consent purposes) | append consumer; resolver extracted once (99b) |
| H9 event types + templates | #93, #94, 95b, #97, 99a, 100a, #101, 103b, 103c, #104 | append; merge queue |
| H10 named schedules | #93, #94, 99a | append |
| H8 `can()` actions (+ round scope) | all 12 | append; 95b changes the scope type → wave alone |
| H7 settings keys | #93, #94, 103b, 103c | append |
| H4 `ROUTES`, nav, `routes.test.ts` | 103a (+ 99b only if results get a nav entry: recommended not) | merge queue; sitemap test re-run |
| H12/H28 CSP + `next.config.ts` | 103a (CDN `img-src`), 100b/99b (no inline scripts, check only) | serialize |
| H29 Docker/compose | 100c, #102 | serialize |
| H1/H2/H3 schema barrel, migrations, messages registry | all | merge queue regenerates SQL (charter 9); one namespace file per ticket |
| H5 data inventory | all with PD (M34-16) | append; inventory test arbitrates once #114 lands |
| H6 seed builders | all | per-module builder file + one registry line |
| `tests/e2e/support/*` | #97, #101 (journeys), 103d (crawl) | append helpers; journey files are new per ticket |

## 5. Milestone summaries

### 5.1 M3 — physical artwork and FOA judging (#93–#98)
- **By AFK class:** A = 4 (#94, #96, #97, #98); B = 2 (#93, #95); C = 0.
- **By size:** M = 1 (#98); L = 4 (#93, #94, #96, #97); XL = 1 (#95). After the split: 6 tickets → 8 work units (#93, #94,
  95a, 95b, 95c, #96, #97, #98).
- **Design uncertainty:** 3 = #94, #95, #96, #97; 2 = #93, #98.
- **Tournaments:** 5 BUILD tournaments, 11 contenders: #94 (2), 95b (2), 95c (2), #96 (3), #97 (2). No tournament: #93
  (PAPER round), 95a, #98.
- **Risk-flag frequency:** auth/security 4 (#94, #95, #96, #97); minors/safeguarding 4 (#93, #94, #95, #96); personal data 4
  (#93, #94, #95, #96); F2 enum ownership 2 (#93, 95a); infra/worker skew 3 (#93, #94, #97 journey); money, encryption, CSP 0.
- **Internal ordering (rolling waves):** strictly serial by native edges: #93 → #94 → 95a → 95b → 95c → #96 → #97 → #98 (95c
  also waits for #94, already merged by then). Overlap levers: harden + PAPER/BUILD tournament for ticket k+1 while ticket k is
  in review; meanwhile fill W slots with M5 tickets whose blockers are merged and with M4 harness items (M34-3 drain route,
  M34-4 fixture route, M34-10 Lighthouse runner, M34-8 `PublicAssetUrl`). Critical path inside M3: 8 units.
- **Seam 2:** #97 journey (blind scoring + lock; no worker needed if lock is synchronous). M3 DoD: physical artwork and round
  transition tables pass; blind read-model no-PII test; ranking fixture; journey green on the PR preview and on the `M3`
  branch preview.
- **Milestone PR `M3 → main`:** stacked on `M2` until the owner merges `M2`; `Closes #93` … `Closes #98`; Merge Danger lists
  R-JUDGE-VETTING (in-person judging must not start before vetting), R-LEGALCOPY (judge terms) and R-WORKER (reminder,
  acknowledgement and retain handlers need a worker redeploy on staging).

### 5.2 M4 — results, certificates, stamping, gallery, social export (#99–#104)
- **By AFK class:** A = 2 (#101, #104); B = 4 (#99, #100, #102, #103); C = 0.
- **By size:** M = 1 (#104); L = 2 (#101, #102); XL = 3 (#99, #100, #103). After splits: 6 tickets → 12 work units (99a,
  99b, 100a, 100b, 100c, #101, #102, 103a, 103b, 103c, 103d, #104).
- **Design uncertainty:** 3 = #99, #100, #102, #103 (103b purge pipeline 4); 2 = #101, #104.
- **Tournaments:** 8 BUILD tournaments, 17 contenders: 99a (2), 99b (2), 100a (2), 100c (2), #101 (2, rule-triggered, low
  yield), #102 (2), 103a (3), 103b (2). No tournament: 100b, 103c, 103d, #104.
- **Risk-flag frequency:** minors/safeguarding 6 (#99, #100, #101, #102, #103, #104); auth/security 4 (#99, #100, #101, #103);
  CSP 3 (#99, #100, #103); infra/worker skew 5 (#99, #100, #101, #102, #103); new dependencies 3 (#100 QR, #101 ZIP, test-only
  `jsqr`); brand/legal 1 (#102); money, encryption 0.
- **Internal ordering (parent-level native edges; children inherit the parent's blockers):** M4-1 99a → M4-2 99b ∥ 100a →
  M4-3 100b ∥ 100c → M4-4 #101 ∥ #102 (both wait for all of #100's children) → M4-5 103a (after #102, 99b, #82) → M4-6 103b ∥
  103c → M4-7 103d ∥ #104 (#104 waits for all of #103's children). Critical path: 99a → 100a → 100c → #102 → 103a → 103b →
  #104 = 7 units; with edge re-pointing (M34-1) #102 can start after 100a, and 102a after #85 alone.
- **Seam 2:** #101 journey (publish → QR valid → revoke → revoked) gated by M34-3/M34-4; 103d crawl over gallery and results
  URLs; Lighthouse on `/competitions/[slug]/results`, `/gallery`, one gallery item (M34-10).
- **Milestone PR `M4 → main`:** stacked on `M3`; `Closes #99` … `Closes #104`; Merge Danger lists R-R2CDN (production gallery
  cannot serve images without the public bucket + CDN), R-GOTENBERG (PDFs and share images are not produced until deployed),
  R-SAFEGUARD sign-off (public children's work), R-CERT-DESIGN, R-APPROVERS.

### 5.3 Cross-milestone dependencies
- **Into M3:** native #92 → #93 and (P1) #88 → #95. Technical extras (ledger): #61, #62, #69, #70, #73, #74, #81, #84 → #93;
  #63, #85, #92 → #94; #57, #59, #60, #64, #69, #72, #74, #81, #92 → #95; #63, #85, #86, #88 → #96; #57, #59, #60, #72 → #97.
- **Into M4:** native #97 → #99, (P1) #82 → #99, #82 → #103. Extras: #60, #61, #65, #69, #70, #72, #81, #83 → #99; #57, #61,
  #63, #69, #73, #81, #85, #89, #91, #97 → #100; #74, #75 → #101; #85 → #102; #83, #89, #97 → #103.
- **Out of M3/M4 (native, inferred targets):** #93 → 1 (#131 or #133); #99 → 3 of {#119, #120, #131, #134}; #100 → #124.
  Verify with `dependencies/blocking` before scheduling M6/M8.
- **Contracts created here that later tickets build on (state them in the PR bodies and the milestone PR):**
  `physical_artwork_status` + `isPhysicallyReadyForJudging` (#93/#94 → #131 auction eligibility, #133 artwork → auctioned);
  outcome model incl. `suitable_for_auction` (#97 → #131, #119); `results.published` event (99a → #94, 100a, #119, #120,
  #134); certificates module, `/verify` page and `PdfRenderer` port (#100 → #124 volunteer certificates with
  `volunteer_service` already in the enum, #133 thank-you letters); stamping service (#102 → #129, #130, #131 public
  images); `PublicAssetUrl`, original-asset crawl and `CdnPurger` (#103 → #129 adoption pages, #131 lots, every later
  consent-withdrawal consumer).
