# dag.md: global work-unit plan (units, edges, conflicts, waves, budget)

Input to the execution spec. Built 2026-11-19 from `research/issues-M*.md`, `dep-counts.json`, `code-{app,server,infra}.md`,
`platform.md` and CHARTER.md (Verified, Skill-invocation and History sections win). Numbers come from the re-runnable model
`docs/specs/issue-factory/dagmodel.py` (`cd docs/specs/issue-factory && python3 -I dagmodel.py dep-counts.json dagout.json`) unless marked "est.".
"Trunk" = the unit's milestone branch `M<k>`. AH = agent-hour (one Opus agent active for 60 min).

## 1. Work units (79 tickets → 119 units; 118 to implement)

### 1.1 Legend and mapping rules
- Unit id = issue number, or issue + letter for a split child (proposals in issues-M*.md; child issue created at the parent's
  hardening, parent labelled `factory:split`, branch `ticket/<child-issue>-<slug>`).
- `size·tourn·judges`: M 1-3 h, L 3-8 h (no S/XL remain); N no tournament, P PAPER only, B2/B3 PAPER then BUILD with 2/3
  contenders; 3 judges if flagged auth/security, money, minors, encryption or CSP, else 1.
- `← blockers` = native fit (column 3) mapped to units ∪ inferred `extraBlockers` from issues-M*.md, transitively reduced
  (196 shown of 495 union edges; same closure). A native edge from a split parent resolves to the child issues-M*.md names
  as provider (#60 ← 59a, #71/#72 ← 70a, #78/#79 ← 77a, 100a ← 99a, #68 ← 63a), else to its last child (ledger only).
  Serialization-only pairs are conflicts (§3), not edges: 72 after 71, 79 after 78, 108 after 107, 92 before 91a.
- Folded harness items: Lighthouse runner → 70b (reused by 99b 103a 125a 127 129 131); preview drain route → 61a; preview
  fixture route → 97 if absent (M34-4); `PublicAssetUrl` → 103a; preview-DB migration fingerprint and form kit → 57a.

### 1.2 Unit table (column 3: native blocked-by fit and its count; ✓ = equals `tb` in dep-counts.json)
| M | Ticket | Native fit | Units: id label size·tourn·judges ← blockers |
|---|---|---|---|
| M0 | #57 Email OTP sign-up/sign-in | — 0✓ | 57a harness L·P·3 ← — ; 57b OTP L·B3·3 ← 57a ; 57c sessions M·N·3 ← 57b |
| M0 | #58 Phone OTP sign-in | 57 1✓ | 58 L·B2·3 ← 57b |
| M0 | #59 Scoped roles, can(), audit log | 57 1✓ | 59a backend L·B2·3 ← 57b ; 59b UI L·N·3 ← 59a |
| M0 | #60 Staff 2FA gate, step-up | 59 1✓ | 60 L·B2·3 ← 59a |
| M0 | #61 Outbox and VPS worker | 57 1✓ | 61a outbox L·B2·1 ← 57b ; 61b worker runtime L·N·1 ← 61a |
| M0 | #62 Runtime settings | 60 1✓ | 62 M·N·3 ← 60 |
| M0 | #63 Private uploads, scan, signed delivery | 59,61 2✓ | 63a storage L·B2·3 ← 59a,61a ; 63b scanner L·N·3 ← 63a ; 63c prefixes+Seam2 M·N·3 ← 63b |
| M0 | #64 Consent documents | 59,61 2✓ | 64 L·B2·3 ← 59a,61a |
| M0 | #65 CSP public + signed-in | 57 1✓ | 65 L·B3·3 ← 57b |
| M0 | #66 Error tracking, uptime, logs | — 0✓ | 66a app Sentry M·N·1 ← 57a ; 66b worker/uptime M·N·1 ← 61b,66a |
| M0 | #67 Restore drill | — 0✓ | **done on `M0`** (9c69f10): reconcile only, label `factory:merged-trunk`, no runner |
| M0 | #68 Nightly R2 to B2 copy | 63 1✓ | 68 M·N·1 ← 63a,66a |
| M1 | #69 Templates, inbox, channel prefs | 61 1✓ | 69 L·B2·3 ← 58,62,64 |
| M1 | #70 Competitions from the DB | 60 1✓ | 70a module+admin L·N·3 ← 60 ; 70b public pages M·B2·3 ← 70a,65 |
| M1 | #71 Scheduled status changes | 70,61 2✓ | 71 L·B2·1 ← 70a,61a |
| M1 | #72 Fees, awards, attached consent | 70,64 2✓ | 72 L·B2·3 ← 70a,64 |
| M1 | #73 Institution registration, ID | 59,69 2✓ | 73 L·P·3 ← 69 |
| M1 | #74 Institution coordinators | 73 1✓ | 74 L·P·3 ← 73 |
| M1 | #75 Institution registers, enrols | 74,71 2✓ | 75a institution reg M·N·3 ← 74,71 ; 75b enrolment L·B2·3 ← 75a |
| M1 | #76 CSV student import | 75 1✓ | 76 M·N·3 ← 75b |
| M1 | #77 Bulk fee payment | 75,72 2✓ | 77a payments core L·B3·3 ← 75b,72 ; 77b Razorpay L·N·3 ← 77a,65 ; 77c journey M·N·3 ← 77b,76 |
| M1 | #78 Adult registration, dashboard | 77 1✓ | 78 L·P·3 ← 77a |
| M1 | #79 Offline payments, review | 77 1✓ | 79 L·P·3 ← 77a,63a |
| M1 | #80 Refunds, cancel refunds all | 79,60 2✓ | 80a refunds L·B3·3 ← 79 ; 80b cancel M·N·3 ← 80a |
| M1 | #81 Guardians and minors | 78,69 2✓ | 81a guardians L·B3·3 ← 78 ; 81b minor reg L·B2·3 ← 81a |
| M1 | #82 Per-purpose guardian consent | 81,72 2✓ | 82 L·B3·3 ← 81b |
| M1 | #83 Consent by code link / form | 82,75,63 3✓ | 83a code link L·B3·3 ← 82,63a,65 ; 83b signed form L·B2·3 ← 82,63a |
| M2 | #84 Announcements, reminders | 69,75,78,81 4✓ | 84a announce L·B2·3 ← 81b ; 84b reminders L·B2·3 ← 85b |
| M2 | #85 Individual image submission | 63,78,71 3✓ | 85a derivatives L·B3·3 ← 63b ; 85b entries L·B2·3 ← 85a,65,81b |
| M2 | #86 Video and essay submissions | 85 1✓ | 86a video L·B2·3 ← 85b ; 86b essay+sanitiser M·B2·3 ← 85b |
| M2 | #87 Coordinator submits, certifies | 85,74 2✓ | 87 M·N·3 ← 85b |
| M2 | #88 Rubrics gate school round | 71 1✓ | 88 L·B2·1 ← 71,69 |
| M2 | #89 School round shortlist | 87,88,69 3✓ | 89a picks L·B2·3 ← 88,87 ; 89b finalise M·N·3 ← 89a |
| M2 | #90 Overdue/reopened rounds | 89 1✓ | 90 L·B2·1 ← 89b,84b |
| M2 | #91 Shortlist-only scope | 89 1✓ | 91a scope L·P·3 ← 89b ; 91b journey M·P·3 ← 91a |
| M2 | #92 FOA digital verification | 89,71 2✓ | 92 L·P·3 ← 89b |
| M3 | #93 Physical artwork dispatch | 92 1✓ | 93 L·P·3 ← 92,84b |
| M3 | #94 Verify artwork, custody | 93 1✓ | 94 L·B2·3 ← 93 |
| M3 | #95 FOA rounds, judges | 94,88 2✓ | 95a rounds M·N·3 ← 94 ; 95b onboarding L·B2·3 ← 95a ; 95c assignment M·B2·3 ← 95b |
| M3 | #96 Blind scoring | 95 1✓ | 96 L·B3·3 ← 95c,86a,86b |
| M3 | #97 Rankings, lock, outcomes | 96,94 2✓ | 97 L·B2·3 ← 96 |
| M3 | #98 Chained judging levels | 97 1✓ | 98 M·N·1 ← 97 |
| M4 | #99 Results approval, page | 97,82 2✓ | 99a release L·B2·3 ← 97,83a,83b ; 99b page M·B2·3 ← 99a,70b |
| M4 | #100 Certificates with QR | 99 1✓ | 100a module L·B2·3 ← 99a,91a ; 100b verify M·N·3 ← 100a ; 100c PDF L·B2·3 ← 100a |
| M4 | #101 Revoke/reissue/ZIP certs | 100 1✓ | 101 L·P·3 ← 100b,100c |
| M4 | #102 Logo stamping, share image | 100 1✓ | 102 L·B2·3 ← 100b,100c |
| M4 | #103 Consent-gated gallery | 102,82,99 3✓ | 103a pages L·B3·3 ← 102,99b ; 103b purge M·B2·3 ← 103a ; 103c reports M·N·3 ← 103a ; 103d crawl M·N·3 ← 103a |
| M4 | #104 Social export queue | 103 1✓ | 104 M·N·3 ← 103b,103c,103d |
| M5 | #105 Ledger, automatic postings | 80 1✓ | 105 L·B3·3 ← 80a |
| M5 | #106 One-time donations | 105 1✓ | 106a core L·B2·3 ← 105,81b ; 106b donate page L·B2·3 ← 106a,77b |
| M5 | #107 Recurring donations | 106 1✓ | 107 L·B2·3 ← 106b |
| M5 | #108 Offline donations, 80G | 106,63 2✓ | 108 L·P·3 ← 106b |
| M5 | #109 Budgets, period lock, export | 105,60 2✓ | 109a lock L·B2·3 ← 105 ; 109b budgets M·N·3 ← 109a |
| M5 | #110 Transparency page | 106,109 2✓ | 110a page L·B2·3 ← 106a,109a,65 ; 110b journey M·N·3 ← 110a,106b,109b |
| M5 | #111 CMS pages, home, impact | 64 1✓ | 111a core L·B3·3 ← 60,64,65 ; 111b home L·B2·3 ← 111a |
| M5 | #112 Blog and stories | 111,85 2✓ | 112a posts L·B2·3 ← 111a,85a ; 112b public blog L·B2·3 ← 112a,111b |
| M5 | #113 Contact inbox | 69,59 2✓ | 113 L·B2·3 ← 69,65 |
| M5 | #114 Data inventory, retention | 62,61 2✓ | 114 L·B3·3 ← 73 |
| M5 | #115 Rights requests, grievances | 81,63 2✓ | 115a requests L·P·3 ← 114,81b,63a ; 115b export/erase L·B3·3 ← 115a,82 |
| M5 | #116 Safeguarding, breach log | 69 1✓ | 116a reports L·B3·3 ← 69 ; 116b breach M·N·3 ← 81b |
| M5 | #117 Admin queues, reports | 80,92,93,99,100 5✓ | 117a queues M·N·3 ← 80b,103c ; 117b reports L·P·3 ← 100a,105 |
| M5 | #118 Umami analytics | — 0✓ | 118 M·P·3 ← 65 |
| M6 | #119 Community timeline | 99 1✓ | 119 L·B2·3 ← 114,100a |
| M6 | #120 Post-competition invites | 119,99 2✓ | 120 M·N·3 ← 121,123,125a |
| M6 | #121 Clubs | 119,73 2✓ | 121 M·N·3 ← 119 |
| M6 | #122 Ambassadors | 119,62 2✓ | 122 M·N·3 ← 119 |
| M6 | #123 Volunteer applications | 81,59 2✓ | 123 L·P·3 ← 81b,114 |
| M6 | #124 Volunteer hours, certificates | 123,119 2✓ | 124 L·B2·3 ← 123,119,100b,100c |
| M6 | #125 Events | 111,69,59 3✓ | 125a publish M·N·3 ← 111a,114 ; 125b waitlist L·B2·3 ← 125a,84b ; 125c check-in M·N·3 ← 125b,119 |
| M6 | #126 Campaign messages | 64,69 2✓ | 126 L·B2·3 ← 119 |
| M7 | #127 NGO directory, verification | 59,60 2✓ | 127 L·P·3 ← 63a,75b,114 |
| M7 | #128 Directory distance search | 127 1✓ | 128 M·N·3 ← 127 |
| M7 | #129 Adoption listings | 127 1✓ | 129 L·N·1 ← 127,85a,111a |
| M7 | #130 Adoption applications | 129,69 2✓ | 130 L·B2·3 ← 129,81b |
| M8 | #131 Auction lots | 92,60 2✓ | 131 L·B2·3 ← 103a |
| M8 | #132 Bidding, anti-sniping | 131 1✓ | 132 L·B3·3 ← 131,114 |
| M8 | #133 Auction payment, letters | 132,105 2✓ | 133a payment L·B3·3 ← 132,109a ; 133b letters M·N·3 ← 133a |
| M8 | #134 Feedback surveys | 69,75 2✓ | 134 L·B2·3 ← 117b,114 |
| M8 | #135 Objective reports, metrics | 117 1✓ | 135a social M·N·3 ← 117a,117b ; 135b participation M·N·3 ← 117a,117b,121,122,125c ; 135c objectives M·N·3 ← 124,134,135a,135b,110a,107,108 |

## 2. Dependency edges checked against dep-counts.json
- Native fit: 125 edges = Σ`tb` 125 = Σ`bl` 125. For all 80 issues (#55, #57-#135) the fit's blocked-by count equals `tb`
  and its induced blocking count equals `bl`: **no count mismatches**. The fit is count-exact, not unique.
- Where the global solve overrides a research file (the runtime read overrides the fit):
  1. issues-M6-M8.md says #119-#135 have no native edges (its `is:blocked` search returned 0): wrong, they have 30
     (10 internal: #119→120,121,122,124; #123→124; #127→128,129; #129→130; #131→132; #132→133; 20 from M0-M5).
  2. #68 ← #63, not #61 (#61's 5 slots: #63 #64 #69 #71 #114); settles M0 (2/5) vs M1 (3/4) external #61/#63 counts at 3/4.
  3. #92 ← #89 #71 (M2's candidates #85/#60/#78 are saturated). #117 ← #80 #92 #93 #99 #100 is forced (#73 #89 #103
     saturated), so #99 → only #119 #120 in M6-M8, #100 → #117 (not #124), #93 → #117, and #109 ← #60 (not #80).
  4. #105 → #106 #109 #133 (M5's alternative), so #108 ← #106 #63; #111 → #112 #125, so #113 ← #69 #59.
  5. Picked from file candidates: #70 ← #60, #73 ← #59, #80 ← #60, #81 ← #69, #82 ← #72, #83 ← #75, #85 ← #71, #87 ← #74,
     #89 ← #69, #95 ← #94 #88 (P1), #99 ← #97 #82, #103 ← #102 #82 #99 (P1).
  6. Low confidence (count-preserving swaps among #59/#60/#64/#69/#81/#99 consumers fit equally): #120-#127, #130, #131, #134.
  7. Errors: issues-M1.md counts 24 units (is 22); M0-M2 files say `factory/trunk` (now `M0`…`M8`); native edges omit
     technical prerequisites (#58, #84 block nothing natively; #79 needs #63): §1.2 carries them.
- Runtime replacement (bootstrap 4): `for n in $(seq 57 135); do gh api
  repos/siddhartxts/friends-of-animals/issues/$n/dependencies/blocked_by --jq '[.[].number]'; done` where REST works
  (T2; the cloud proxy blocks GraphQL), else GitHub MCP `issue_read`, else the owner pastes the loop's JSON into the ledger.
  Replace column-3 edges, keep extras, rerun the model, log each added/removed edge in the ledger.

## 3. Conflict groups
### 3.1 Exclusive (never two in flight; the scheduler never puts two in one wave)
| Id | Files | Units |
|---|---|---|
| X1 harness | `src/test/{harness,db}.ts`, `src/test/fakes/*`, `src/server/deps.ts`, `vitest.config.ts` | 57a 58 61a 63a 128 |
| X2 proxy | `src/proxy.ts` (slug sets, staff gate, nonce) | 57b 58 60 65 70b 112b |
| X3 root layout | `src/app/layout.tsx` (theme script, Sentry client, Umami) | 65 66a 118 |
| X4 CSP/headers | `next.config.ts`, `src/lib/security-headers.ts` (+test), CSP source registry | 65 63a 70b 77b 103a 106b 118 128 |
| X5 site header | `src/components/site-header.tsx`, `header-nav.tsx` | 57b 59b 69 73 78 81a |
| X6 VPS compose | `docker/workers.yml`, `docker/README.md`, worker Dockerfile targets | 61b 63b 66b 68 85a 86a 100c 102 |
| X7 role enum | role registry/enum migration (#59); value in its own migration (F2) | 92 95b 115a 116a |
| X8 CI | `.github/workflows/ci.yml` (Postgres service) | 132 |
| X9 competitions | `schema/competitions.ts`, competition use cases, admin pages | 70a 71 72 80b |
| X10 payments | `schema/payments.ts`, gateway dispatcher | 77a 77b 78 79 80a 106a 133a |
| X11 school round | `src/server/modules/school-round/**` (order 89b → 91a → 90) | 89a 89b 90 91a |
| X12 home/gallery | `src/app/page.tsx`, `_components/home-layout.ts`, gallery frames | 111b 103a |

### 3.2 Merge-ordered (parallel build; one merge at a time; the later PR merges the trunk tip, regenerates its migration, reruns gates)
Registries resolved by the merge queue for every unit: schema and seed barrels (`merge=union`), `messages.ts`/`nav.json`/
`routes.ts`/`sitemap.ts` (sorted-list union; JSON never union), `can()` table, settings, event→template map, job/schedule
registry, data inventory (append-only; its coverage test arbitrates after 114). Module groups:

| Id | Shared module | Merge order |
|---|---|---|
| Q1 | registration schema + `registration_status` | 75b → 76 → 77a → 78 → 81a → 81b → 82 → 83a, 83b |
| Q2 | entries status table + submit use cases (H22/H23) | 85b → 87 → 86a → 86b; 92 → 91a |
| Q3 | certificates module (H13) | 100a → 100b ∥ 100c → 101, 102 → 124 |
| Q4 | ledger posting API (H34) | 105 → 109a → 106a → 107 → 108 → 133a |
| Q5 | donations, receipts (H35/H37) | 106a → 106b → 107 → 108 → 110a |
| Q6 | CMS core + public rewiring (H38/H39) | 111a → 111b → 112a → 112b; 110a, 116a, 125a rebase on 111b |
| Q7 | consent schema + withdrawal consumers (H16) | 64 → 72 → 82 → 83a, 83b → 99b, 103b, 115b, 126, 130 |
| Q8 | gallery module (H24) | 103a → 103b ∥ 103c → 103d → 104 |

### 3.3 Global merge-queue constraints
- One merge queue for all branches (priority = longest downstream path) and one schema slot across all milestone branches
  (code-server.md §10 rule 4); ≈ 80 of 118 units change schema (est.).
- Cross-milestone migrations: a cascade that brings a migration into an `M<k>` already holding its own regenerates `M<k>`'s
  own migrations on top (code-server.md §10 procedure); the fingerprinted preview-DB name gives `M<k>` a fresh database.
  ≈ 90 such cascades of ≈ 350 cascade merges (est.; `M5` holds 111a from W4). Before handoff, re-stamp migrations across
  `M0`…`M8` in milestone order so `main` applies each milestone after the previous one.
- Enum rule F2: a value added in a migration is never used by DDL in the same PR (92, 95b, 115a, 116a, 124, 131, 133b).
  VPS: W ≤ 6 while 61b, 63b, 85a run there (M0 F9); ≤ 10 concurrent preview E2E runs.

## 4. Rolling-wave plan (W = 6)
Waves are scheduling levels; a unit starts when its blockers merge, so waves overlap (§7.3). Priority = longest downstream
path; X groups exclusive; W0 = 57a alone. First claims cut `M1` and `M2`-`M5` in order at W4 (70a, 111a/118), `M6` W8, `M7` W10, `M8` W29.

| Wave | Units by milestone branch | AH | Cum | Why grouped |
|---|---|---|---|---|
| W0 | `M0` 57a | 10 | 10 | Seam 1 harness every unit imports; W = 1 (charter). Dry run part 1 |
| W1 | `M0` 57b 66a | 22 | 32 | Only W0 dependents; 57b (X2/X5) and 66a (X3) are file-disjoint. Dry run part 2 |
| W2 | `M0` 59a 61a 65 57c | 49 | 81 | Everything needing only 57b; 58 waits (X2 held by 65, X1 by 61a) |
| W3 | `M0` 60 64 63a 61b 59b | 58 | 139 | 59a/61a dependents; 63a takes X1+X4 after 65; 61b creates `docker/workers.yml` |
| W4 | `M0` 58 62 63b; `M1` 70a; `M5` 111a 118 | 60 | 199 | 58 once X1/X2 free; 70a cuts `M1`; 111a, 118 need only M0 units |
| W5 | `M0` 63c; `M1` 69 71 70b; `M2` 85a; `M5` 111b | 70 | 269 | 69 needs 58+62+64; 71 ∥ 70b after 70a; 85a after 63b (X6) |
| W6 | `M1` 73 72; `M2` 88; `M5` 112a 113 116a | 81 | 350 | 69/70a consumers; 72 after 71 (X9); CMS and public-form starters |
| W7 | `M0` 66b; `M1` 74; `M5` 114 112b | 45 | 395 | Institution chain; 114 needs 73; 66b after 61b (X6) |
| W8 | `M0` 68; `M1` 75a; `M6` 125a | 15 | 410 | Frontier narrows to the M1 chain; 125a cuts `M6` |
| W9 | `M1` 75b | 13 | 424 | Critical path; nothing else ready |
| W10 | `M1` 77a 76; `M7` 127 | 33 | 456 | 75b dependents (merge 76 first: dashboard); 127 cuts `M7` |
| W11 | `M1` 78; `M7` 129 128 | 24 | 480 | 78 after 77a (X10); M7 lane fills slots |
| W12 | `M1` 81a 79 | 27 | 508 | 78 dependents; 79 after 78 (X10) |
| W13 | `M1` 81b 80a | 31 | 538 | Minors chain; refunds |
| W14 | `M1` 82 77b 80b; `M2` 85b; `M5` 105; `M6` 123 | 72 | 611 | 81b/80a unblock entries, consent, ledger, volunteers |
| W15 | `M1` 83a 83b; `M2` 87 84b 86a 86b | 71 | 681 | Entries fan-out (Q2 order 87 → 86a → 86b); consent collection |
| W16 | `M2` 89a; `M5` 106a 109a 115a; `M6` 125b; `M7` 130 | 77 | 759 | School round; finance and privacy after 105/114 |
| W17 | `M2` 89b 84a; `M5` 106b 110a 115b 109b | 68 | 827 | Finalise round; donate page; transparency |
| W18 | `M2` 92 91a; `M5` 107 108 110b 116b | 54 | 881 | 92 merges before 91a (global critical path; overrides M2's local order); 107 → 108 (Q5) |
| W19 | `M1` 77c; `M2` 90 91b; `M3` 93 | 34 | 915 | 93 cuts `M3`; M2 tail (91b gated by G6/G7); M1 journey |
| W20-W25 | `M3` W20 94, W21 95a, W22 95b, W23 95c, W24 96, W25 97 | 70 | 986 | M3 strict native chain, width 1 (95b holds X7; 96 needs 86a/86b; 97 owns the M3 journey): pre-harden + PAPER the next unit; re-point lever 95a ← 88, 72 |
| W26 | `M3` 98; `M4` 99a | 18 | 1004 | 97 dependents; 99a cuts `M4` |
| W27 | `M4` 100a 99b | 21 | 1025 | 99a dependents |
| W28 | `M4` 100c 100b; `M5` 117b; `M6` 119 | 42 | 1067 | Certificate children in parallel (Q3); 119 needs 99a+100a+114 |
| W29 | `M4` 102; `M6` 124 121 122 125c; `M8` 134 | 56 | 1123 | 102 after all #100 children; M6 fan-out from 119; 134 cuts `M8` |
| W30 | `M4` 103a 101; `M6` 126 120 | 46 | 1170 | Gallery; 120 needs 121, 123, 125a |
| W31 | `M4` 103c 103b 103d; `M8` 131 | 32 | 1201 | Gallery children (Q8); auction chain starts (131 needs 103a) |
| W32 | `M4` 104; `M5` 117a; `M8` 132 | 28 | 1229 | 132 alone on X8; 117a needs 103c |
| W33 | `M8` 133a 135a 135b | 28 | 1257 | 133a (X10, Q4); reports after 117a/117b |
| W34 | `M8` 133b 135c | 10 | 1267 | Close M8 |

## 5. Critical path
- 35 units = 35 waves (W0-W34): 57a > 57b > 59a > 60 > 62 > 69 > 73 > 74 > 75a > 75b > 77a > 78 > 81a > 81b > 85b > 87 >
  89a > 89b > 92 > 93 > 94 > 95a > 95b > 95c > 96 > 97 > 99a > 100a > 100c > 102 > 103a > 131 > 132 > 133a > 133b.
- 292 h wall (12.2 days) at §7.2 durations; 422 AH (33 % of unit AH). Unconstrained W = 6 finishes Day 14.7 (queue waits).
- Levers: (1) harden + PAPER unit k+1 while k is in review (M34-1a); (2) ledger re-point 95a ← {88, 72, 93} and 102 ←
  {100a, 85a} (M34-1c): 33 units, 273 h, 396 AH; (1)+(2) = 236 h (9.8 days); (3) on-path B2 → P where uncertainty ≤ 3
  (−2 h each); (4) on-path units head the merge queue. W9 and W20-W25 are width 1 (usage valley Days 10-12).

## 6. Totals
| Item | Count | Basis |
|---|---|---|
| Open tickets | 79 (#57-#135) | 78 to implement; #67 done on `M0` (9c69f10) |
| Split tickets → child issues/units | 31 → 71 | issues-M*.md proposals (#66 split for residue); created at parent hardening |
| Work units | 119 (118 to implement) | 48 unsplit + 71 children; L 79, M 39 |
| Tournament mix (118) | N 38, P 16, B2 47, B3 17 | 80 PAPER rounds (P + every B) |
| Prototype branches | 145 = 47×2 + 17×3 | `proto/<issue>-<letter>`; 145 `proto-archive/*` tags; deletion list in handoff |
| Ticket branches = ticket PRs | 118 each (+≈ 6 `-r2` respins, est.) | `ticket/<issue>-<slug>` → draft PR into `M<k>`, merge commit `Merge #<n>: <title>` |
| Milestone PRs | 9 | #136 reused (`M0`) + `M1`…`M8`, stacked |
| Human-residue issues | ≈ 66 | M0 16, M1 9, M2 3, M3+M4 10, M5 10, M6 7, M7 5, M8 6 (deduped R-/G- codes) |
| Follow-up issues | cap 3/unit, 40 total; expect ≈ 30 | overflow → "Factory backlog"; + 3 meta issues (dashboard, backlog, handoff) |
| Sessions | ≈ 136 runner + 1 Orchestrator (+≈ 2 context handoffs, est.) | 118 attempts + 15 % retries |
| Workflow runs | ≈ 690 | per unit N 3, P 4, B 6 (§7.1) × 1.15 + 35 harden batches + 9 retros |
| Agents spawned | ≈ 2,900 (≈ 24 per unit) | §7.1 × 1.15 |
| Final-review judges | 108 units × 3 + 10 units × 1 = 334; ≈ 11 tie-breaks | 1-judge units: 61a 61b 66a 66b 68 71 88 90 98 129 |
| Skeptics; tournament judgments | ≈ 630; 160 PAPER + 196 pairwise | 1 per AC (L ≈ 6, M ≈ 4); B2 2 orders × 1 pair, B3 2 × 3 pairs |
| Agent-hours | ≈ 1,550 | §7 |

Judges by risk: flagged = 3 judges (median; safety dimensions take the minimum; pass mean ≥ 3.25); unflagged (infra or
personal data only) = 1 judge (mean ≥ 3.0); spread ≥ 2 adds a tie-break judge; plus 1 skeptic per acceptance criterion.

## 7. Effort and usage
### 7.1 Per-stage model (one unit; I = implementation hours: M 2, L 5)
| Stage | Runs in | WF runs | Agents | AH |
|---|---|---|---|---|
| Harden + oracle | Orchestrator WF, one per wave | 1/wave | 2 | 0.4 |
| PAPER round (P, B2, B3) | Orchestrator WF | 1 | 3 designers + 2 judges | 0.9 |
| BUILD round (B2, B3) | runner WF, `isolation:'worktree'` | 1 | 2 / 3 implementers | 0.6·I each |
| Pairwise judging (B2, B3) | Orchestrator WF | 1 | 2 / 6 judgments | 0.2 each |
| Implement or finish winner (TDD) + local gates/Seam 2 | runner session + WF | 1 | 2-3 | I (0.4·I after BUILD) + 0.2 |
| Final review | Orchestrator WF | 1 | j judges + 1 skeptic/AC | 0.2·j + 0.1/AC |
| Fix loop | runner WF | ≈ 1 | 1-2 | 0.25·I + 0.1·j |
| PR, CI, merge queue, cascade | Orchestrator | 0 | 0-1 | 0.4 |
| Runner session overhead | runner | — | 1 session | 0.4 |
| **Per unit** | | N 3, P 4, B 6 | M·N·1 12; L·N·3 16; L·P·3 21; L·B2·3 24; L·B3·3 29 | 4.6; 9.2; 10.1; 13.5; 17.3 |

Units 1,267 AH (M0 181, M1 254, M2 155, M3 85, M4 118, M5 265, M6 90, M7 37, M8 82; per wave: §4) + 15 % retries 190 +
Orchestrator 4 AH/day 66 + closing 25 (migration re-stamp, 9 retros, handoff) ≈ **1,550 AH**.

### 7.2 Assumptions (Day 1 replaces U1-U3 with measurements)
- U1 One 7-day window = 900 AH at 100 % (planning value, unmeasured). Day-17 finish needs A7 ≥ ≈ 870 (850 → Day 17.6,
  900 → Day 16.4, 1,000 → Day 15.1; above ≈ 1,100 the critical path binds at Day 14.7).
- U2 `seven_day` = 0.45 at Day 1 00:00 IST (0.30 at the 2026-11-19 probe + research since); resets Mon 23 and Mon 30 Nov
  07:00Z = 12:30 IST (`resetsAt` 1795417200). Window A = Day 1 → Day 4 12:30, B → Day 11 12:30, C → end.
- U3 One 5-hour window ≥ 70 AH at 100 % (peak day 214 AH ≈ 45 AH per window).
- U4 Throttle at 85 %: no new dispatch when `five_hour` ≥ 0.85, when `seven_day` + AH committed to in-flight units would pass
  0.85, or when ahead of the pace line 0.85 × elapsed window share + 0.12; in-flight units finish; pause all at ≥ 0.97.
- U5 24/7: runners are cloud sessions; the Orchestrator self-wakes (`send_later` ≤ 30 min, PR events). U6 wall per unit:
  M 4.5 h, L 7.5 h, +0.75 h PAPER, +2 h BUILD; merge queue 0.5 h/unit, serial. U7 15 % of units retried (AH × 1.15).
  U8 Day-0 owner steps done by Day 1 00:00 IST; a deferred preview E2E gate does not block merges.

### 7.3 Day by day (A7 = 900, throttled simulation; "waves started" = levels of units claimed that day)
| Day | Date | Window | AH | Cum AH | Waves started | Merged | Milestone done |
|---|---|---|---|---|---|---|---|
| 1 | Fri 20 Nov | A | 41 | 41 | W0-W1 (dry run, ≤ 3 in flight) | 3 | |
| 2 | Sat 21 Nov | A | 140 | 181 | W2-W7 | 10 | |
| 3 | Sun 22 Nov | A | 152 | 333 | W4-W8 | 11 | M0 |
| 4 | Mon 23 Nov | A → B 12:30 | 132 | 465 | W6-W8 | 8 | |
| 5 | Tue 24 Nov | B | 90 | 555 | W8-W11 | 9 | |
| 6 | Wed 25 Nov | B | 80 | 635 | W12-W19 | 6 | |
| 7 | Thu 26 Nov | B | 214 | 849 | W14-W18 | 15 | M1, M7 |
| 8 | Fri 27 Nov | B | 103 | 952 | W15-W17 | 8 | |
| 9 | Sat 28 Nov | B | 103 | 1,055 | W17-W18 | 9 | |
| 10 | Sun 29 Nov | B | 59 | 1,114 | W19-W21 | 4 | M2 |
| 11 | Mon 30 Nov | B → C 12:30 | 31 | 1,145 | W22-W24 | 3 | |
| 12 | Tue 1 Dec | C | 51 | 1,196 | W25-W26 | 3 | M3 |
| 13 | Wed 2 Dec | C | 84 | 1,280 | W27-W29 | 5 | |
| 14 | Thu 3 Dec | C | 134 | 1,414 | W29-W31 | 12 | M6 |
| 15 | Fri 4 Dec | C | 91 | 1,504 | W32-W34 | 10 | M4, M5 |
| 16 | Sat 5 Dec | C | 39 | 1,543 | W34; migration re-stamp, retros, HUMAN-HANDOFF | 2 | M8 |
| 17 | Sun 6 Dec | C | 0-40 | ≤ 1,585 | buffer: retries above 15 %, residue-gated journeys | | |

Window use: A 361 AH (0.45 → 0.85), B 766 AH (0.85; throttled Days 5-6, 8-9), C ≈ 415 AH (0.46; ≈ 350 AH slip buffer).

### 7.4 Calibration and descoping ladder
Day 1 measures A7 = AH_dry / Δ`seven_day` (AH_dry = dry-run agent active minutes ÷ 60, ≈ 41; Δ ≈ 4.6 % if A7 = 900). Steps apply in order.

| Step | Change | Total AH | A7 needed | Apply if Day-1 Δ |
|---|---|---|---|---|
| 0 | plan as written | ≈ 1,550 | ≈ 870 | ≤ 4.7 % |
| 1 | BUILD → PAPER except 23 high-risk units (57b 58 59a 60 63a 65 77a 80a 81a 82 83a 85a 96 103a 105 106a 109a 111a 114 115b 116a 132 133a) | ≈ 1,400 | ≈ 790 | ≤ 5.2 % |
| 2 | B3 → B2 for those 23 | ≈ 1,325 | ≈ 745 | ≤ 5.5 % |
| 3 | 1 skeptic per 2 ACs; 1 judge for M-size N units (est.) | ≈ 1,265 | ≈ 710 | ≤ 5.8 % |
| 4 | W 6 → 4 (no AH saving; flattens peaks when U3 binds) | — | — | `five_hour` ≥ 0.85 twice a day |
| 5 | defer M6-M8 (22 units) to a second run; list them in HUMAN-HANDOFF (est.) | ≈ 1,060 | ≈ 600 | > 5.8 % |

## 8. Day-1 dry run: 57a, then 57b ∥ 66a
- First three units of the real plan (no throwaway work): 57a must run first (W0); 57b and 66a are the only units whose
  blockers are W0 and are file-disjoint (X2/X5 vs X3).
- They cover every pipeline shape: 57a = PAPER, 3 judges, harness checks (issues-M0.md §3.8), rubric calibration (anchors
  2b92b98 good, e58a346 weak, 3 planted defects on local `calib/57-*`); 57b = PAPER → BUILD-3, `proto/57b-a|b|c` pushed,
  pairwise judging both orders, `proto-archive/*` tags, auth min-aggregation, skeptics, Seam 2 "deferred" path (R0-1/R0-2);
  66a = single implementation, 1 judge, split-child creation (#66 → 66a/66b) and a residue child.
- W = 6 on Day 2 only if: three merge commits on `M0`, green CI on each final SHA, #136 body updated; `pnpm test` ≤ 15 s
  with the template-clone harness; judges pass 2b92b98, fail e58a346, catch ≥ 2 of 3 planted defects; the guard blocks a
  push to `main` and a `merge_pull_request` with base `main`; ledger rebuilt from GitHub equals the dashboard; Δ`seven_day`
  measured and the §7.4 step chosen. Otherwise Day 2 runs at W = 2 while the factory is fixed.

## 9. Global prerequisites, in order
Day 0, owner:
1. Merge PR #137 (`.claude/skills`) into `main`, then `main` into `M0` (fallback: Orchestrator merges
   `claude/stoic-thompson-ukn0dx` into `M0`).
2. Approve Vercel MCP `authorize_team_access` for team `bitacu1`.
3. Vercel env (R0-1): `BETTER_AUTH_SECRET` (Preview, staging, Production; distinct), `CAPTURE_MAILBOX_TOKEN` (Preview,
   staging) + GitHub Actions secret.
4. Merge to `main` the `e2e.yml` change passing `CAPTURE_MAILBOX_TOKEN` to Playwright (R0-2); without it the preview gate
   stays "deferred" and Seam 2 runs locally on port 3100.
5. Confirm #136 stays the `M0` milestone PR and no other session builds M0 tickets (R0-3).
6. Pre-approve the skill fallback: if bootstrap 3 fails, flip `disable-model-invocation` to false for `triage`,
   `implement`, `handoff`, `retro` in one commit on `M0`.
7. Runner environment: `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS=8`; network for registries, nodejs.org and the
   Playwright CDN; permission mode `auto`.
8. VPS: read-only `GITHUB_TOKEN` in `/etc/foa/sweeper.env` (≈ 120 PR plus fingerprinted DBs exceed 60 calls/h); report
   `df -h /var/lib/docker` and the preview-DB count (code-infra.md §9).
9. Before M2 (non-blocking now): encryption keys (R0-4), non-prod R2 + CORS (R0-5 = G7), workers deploy (R0-6 = G6).

Bootstrap, Orchestrator (Day 1, before 57a):
1. `bash .cursor/cloud-install.sh && export PATH=/usr/local/bin:$PATH && bash .cursor/cloud-start.sh`;
   `pnpm exec playwright install --with-deps chromium`; read the git remote name; `pnpm check` green on `M0`.
2. Usage probe: record `five_hour`, `seven_day`, `resetsAt` (U2).
3. Skill smoke test: a runner session whose prompt starts with `/implement` on a no-op (owner step 6).
4. Read native edges (§2), diff against §1.2, rerun the model, write the result to the ledger.
5. Reconcile branches, PRs, assignees and the #136 body; label #67 `factory:merged-trunk`.
6. Create the 12 `factory:*` labels, the pinned "Factory status" dashboard (ledger in its second comment), "Factory backlog".
7. One bootstrap commit on `M0`: hardened guard (`.claude/settings.json` + hook: allow pushes to `ticket/*`, `proto/*`,
   `M[0-8]`; deny `main`, `production`, other force-pushes, `.env*` except `.env.example`, `docker`, `gh repo delete`;
   `mcp__github__merge_pull_request` needs base ≠ `main`; fail closed); `.gitattributes` `merge=union` for
   `src/server/db/schema/index.ts` and `src/server/seed/index.ts`; `vercel.json` `"git": {"deploymentEnabled":
   {"proto/**": false}}` after verifying the key in Vercel docs.
8. Calibration: local `calib/57-*` branches with 3 planted defects.
9. Child issues for #57 (57a/b/c) and #66 (66a/b); 57a's hardened ACs add the template-clone PGlite harness,
   `src/components/form/`, the preview-DB migration fingerprint (§3.3) and the `.gitattributes` check.
10. Wave 0: claim 57a (W = 1); 57b and 66a follow its merge (§8).
