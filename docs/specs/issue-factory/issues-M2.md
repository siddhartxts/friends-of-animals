# M2 ticket analysis: #84 to #92 (milestone M2: announcements, reminders, digital submission, rubrics, school round, FOA digital verification)

Inputs: `research/open-M2.json` (9 tickets), `research/spec-55.md`, `research/spec55.md` (digest), `research/open-M1.json`,
`open-M3..M8.json`, `research/issues-M0.md` (Seam 1 harness contract, section 3), `research/issues-M6-M8.md` (hotspot codes
H1-H21, residue codes G1-G5, fact F2), `research/code-{app,infra,ui}.md`, the 8 owner comments on #84-#86 and #88-#92 (GitHub
MCP `issue_read get_comments`, 2026-11-19), dependency counts from `gh api -X GET search/issues`
(`issue_dependencies_summary`), and the repo at `/home/user/friends-of-animals` (HEAD `3da7347`, read-only). Analysed
2026-11-19.

Legend. AFK class: **A** fully agent-doable against fakes/ports (residue is non-blocking defaults/copy); **B** agent-doable
core plus human residue that gates an acceptance criterion or Seam 2; **C** mostly human. Size in agent effort: S < 1 h,
M 1-3 h, L 3-8 h, XL > 8 h (split into 2-4 children per charter decision 11). Design uncertainty 1-5 = how many credible,
materially different designs exist (>= 3 = real architectural choice). Risk flags: **A** auth/security, **$** money/ledger,
**K** minors/safeguarding, **E** encryption, **C** CSP, **V** infra/VPS, **PD** personal data. Tournament per charter decision 5:
yes when uncertainty >= 3, or a charter risk flag (A, $, K, E, C) and size >= L. "explicit" = stated in the ticket body or an
owner comment; "native" = a GitHub blocked-by edge (counts verified, edges inferred, 0.2); "inferred" = required by the
acceptance criteria but not stated.

---

## 0. Verified facts the rest of this file relies on

### 0.1 Ordinal mapping (ordinal n = issue #(55+n))

| Ordinal | Issue | Title | Evidence |
| --- | --- | --- | --- |
| 29 | #84 | M2: Announcements and deadline reminders to registrants | #69 body: "Reminders arrive with the announcements ticket" |
| 30 | #85 | M2: Image submission by an individual participant | #63 body: "Derived copies and metadata stripping come with submissions (30)" |
| 31 | #86 | M2: Video and essay submissions | "Extends entry submission to the other disciplines" |
| 32 | #87 | M2: Coordinator submits for students and certifies conduct | #85 body: "Video, essay and coordinator submission come later" |
| 33 | #88 | M2: Published rubrics gate the school round | |
| 34 | #89 | M2: School round: positions, shortlist and finalise | |
| 35 | #90 | M2: Overdue, closed-on-behalf and reopened school rounds | #89 body: "Overdue rounds, closing on the school's behalf and reopening come in the next ticket" |
| 36 | #91 | M2: Shortlist-only submission scope | #89 body: "The shortlist-only scope comes after that" |
| 37 | #92 | M2: FOA verification of digital entries | |

No M2 body cites another ticket by ordinal number; the chain is by prose ("next ticket", "after that", "come later"). All 9
are open, sub-issues of #55, labelled `ready-for-agent`, milestone field `null` (group by the `M2:` title prefix). Comment
count: 1 each except #87 (0); every comment is an owner decision record (0.3).

### 0.2 Native GitHub dependencies (counts exact, edges inferred)

`gh api -X GET search/issues -f q='repo:siddhartxts/friends-of-animals is:issue is:open'` returns
`issue_dependencies_summary` per issue. GitHub search exposes counts only (`is:blocked`, `is:blocking`, `blocking:<n>` return
0; `blocked-by:85` returns #55, i.e. free text). Sum of M2 `blocked_by` = 18, sum of M2 `blocking` = 12.

| Issue | Ord | blocked_by | blocking | Count-consistent candidate blockers | Count-consistent candidate blocked |
| --- | --- | --- | --- | --- | --- |
| #84 | 29 | 4 | 0 | #69, #75, #78, #81 (alternatives in the set: #71, #62, #77) | none |
| #85 | 30 | 3 | 3 | #63, #78 + one of #81 / #73 / #71 | #86, #87 + one of #89 / #92 / #102 / #103 |
| #86 | 31 | 1 | 0 | #85 (only credible blocker) | none |
| #87 | 32 | 2 | 1 | #85 + one of #75 / #74 | #89 |
| #88 | 33 | 1 | 2 | #71 ("The scheduled status flip refuses the move") | #89, #95 ("FOA rounds reuse these rubrics later") |
| #89 | 34 | 3 | 3 | #87, #88 + one of #85 / #69 / #75 | #90, #91 + one of #92 / #100 |
| #90 | 35 | 1 | 0 | #89 (body: "next ticket") | none |
| #91 | 36 | 1 | 0 | #89 (body: "after that") | none |
| #92 | 37 | 2 | 3 | #89 + one of #85 / #60 / #78 | #93, #95 + one of #117 / #103 / #131 |

Two count-exact solutions exist for the M2-internal block: (a) #85 -> #92 and #89 has one M1 blocker; (b) #85 -> #89 and
#92 has one non-M2 blocker. Both give 7-8 internal edges, 10-11 incoming, 4-5 outgoing. Runtime check the Orchestrator runs
at plan time (VPS runner with `gh`, or GraphQL `issue(number:<n>){ blockedBy(first:20){ nodes{ number state } } }`):

```bash
for n in 84 85 86 87 88 89 90 91 92; do
  printf '#%s blocked_by=' "$n"
  gh api "repos/siddhartxts/friends-of-animals/issues/$n/dependencies/blocked_by" --jq '[.[].number]'
done
```

If edges cannot be read, schedule on the UNION of the candidate sets above and the inferred hard dependencies in section 3
(conservative; costs at most one wave of latency per ticket).

### 0.3 Owner decisions recorded on the tickets (binding; quote these into the hardened ticket)

| Ticket | Decision (owner = binding; defaults = owner-approved defaults) |
| --- | --- |
| #84 | (owner) Announcement audience: individual participants (their guardian if under 18), coordinators of every confirmed institution registration, guardians of every enrolled student (or the student, if an adult). Reminders go only to the people who owe the deadline. |
| #85 | (defaults) No draft state: entry created in `processing` once the upload is confirmed; Entry ID assigned at creation; confirmation sent at `submitted`. Replacement is a pending replacement: the current file stays live until the new one passes scan and processing. An infected entry can be retried before the deadline. One entry per registration. A guardian can submit for their ward. |
| #86 | (default) A typed essay goes straight to `submitted`. Replacing an essay can switch between text and document. |
| #88 | (owner) Status flips are scheduled jobs. A flip refused for a missing rubric tells the competition manager and re-runs automatically when the last missing rubric is published (if its date has passed). An individuals-only competition still goes through school judging with zero rounds; the rubric guard still applies. |
| #89 | (owner) Under all-participants scope, finalising moves shortlisted entries straight to `submitted_to_foa` using the files already uploaded. (defaults) Every confirmed institution registration gets a round, even with zero entries. Finalising needs a panel of >= 1, the conduct certification and the judging-certification attestation. Positions optional per category, up to the setting (default 3). Only `submitted` entries can be shortlisted; entries that never reached `submitted` become `not_shortlisted`. The module exposes a query for school-round outcomes per registration (M4 #100 needs it). |
| #90 | (owner) Close on behalf applies the coordinator's saved draft shortlist and positions; with no picks every entry is not shortlisted; families get the usual messages; it emits `school_round.closed_on_behalf`, not shortlist-finalised. (owner) The school judging -> FOA judging flip is scheduled; refused while any round is unfinished (manager told); re-runs automatically when the last round finishes. (defaults) Reopen only during school judging; reverts every entry of the round (none may be FOA-verified); keeps picks as a draft; no family messages on reopen; after re-finalise only families whose outcome changed are messaged; a closed-on-behalf round can also be reopened. |
| #91 | (defaults) Shortlist-only applies only to the school route; individuals always submit digitally. A created entry reaches `submitted_to_foa` only once its upload is processed AND its round is finalised; a failed upload leaves it `school_shortlisted` until the coordinator uploads again. "Not shortlisted" messages go by registration; no `not_shortlisted` entry rows are created. |
| #92 | (default) No separate `resubmitted` state: resubmitting returns the entry to `submitted_to_foa`, history kept. Resubmission deadline = send-back time + N days, a runtime setting (default 7). Once it passes, the entry stays `sent_back`. |

### 0.4 Repository facts that change how M2 is built

| # | Fact | Evidence | Consequence for M2 |
| --- | --- | --- | --- |
| R1 | No app modules exist: `src/server/` holds only `db/`; schema barrel is `export {}`; one migration `drizzle/0000_enable_pg_trgm.sql`. | `ls src/server`, file | Every M2 ticket builds on M0/M1 code that does not exist yet. At claim, the runner lists `src/server/modules/` and `src/server/db/schema/` on `factory/trunk` and adopts the names found there (the harness contract in `issues-M0.md` section 3 is the expected shape: `createWorld()`, `world.as(actor)`, `world.clock`, `world.drain()`, `world.fakes`, `world.seed`, `registerFake`, `registerSeeder`). |
| R2 | drizzle 0.45.4 `pg-core/dialect.js` `migrate()` runs ALL pending migrations inside ONE `session.transaction`. | lines 44-72 of the installed file | `ALTER TYPE ... ADD VALUE` followed by any use of the value (partial-index predicate, default, CHECK, backfill) in the same migrate run fails ("unsafe use of new value"). Fresh PGlite test DBs and every new `foa_pr_<n>` preview DB run every migration in one go. M2 extends three enums across 7 tickets (finding F2). |
| R3 | `sharp` 0.35.5 is already in the lockfile (Next's image optimizer) with `allowBuilds: sharp: false` in `pnpm-workspace.yaml` (prebuilt `@img/sharp-*` binaries). sharp docs: prebuilt binaries support JPEG, PNG, WebP, AVIF, TIFF, GIF, SVG; "support for patent-encumbered HEIC images using hevc compression requires the use of a globally-installed libvips compiled with support for libheif, libde265 and x265". | `pnpm-workspace.yaml`, lockfile, sharp docs (Context7 `/lovell/sharp`) | #85's "A HEIC photo is accepted" cannot be met with stock sharp. worker-media needs either a global libvips with libheif + libde265 (Docker build, sharp built from source in that image only) or a WASM HEIC decoder feeding prebuilt sharp. Flipping `allowBuilds: sharp: true` repo-wide would change the Vercel build: forbidden (finding F3). |
| R4 | No `worker-media` exists: `docker/` holds only `compose.yml` (Postgres, PgBouncer), crowdsec, scripts, systemd. No ffmpeg, no media deps in `package.json`. | `ls docker`, `grep` | #85 creates the `worker-media` service (Dockerfile + service entry in the workers compose file #61 creates); #86 adds ffmpeg to it. Deploying it on the VPS is owner residue (G6). |
| R5 | `src/content/judging.ts` exports `RUBRIC` (theme 30, creativity 25, technique 25, presentation 20) and `JUDGING_LEVELS` (SCHOOL active, NATIONAL active); `messages/en-IN/showcase.json` has `judging.rubric*` copy; `messages/en-IN/schools.json` describes the school judging guide, panel, 1st/2nd/3rd, shortlist upload and the conduct confirmation. | files | #88 seeds default draft criteria from `RUBRIC` and drafts the judging-framework text from existing site copy (FOA sign-off is residue). Public showcase copy stays; it must not contradict the published rubric model. |
| R6 | `src/content/sample/model.ts`: `COMPETITION_STATUSES` = DRAFT, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, IN_PROGRESS, SCHOOL_JUDGING, FOA_JUDGING, RESULTS_PENDING_APPROVAL, RESULTS_PUBLISHED, ARCHIVED, CANCELLED; dates include `submissionOpensAt`, `submissionClosesAt`, and `shortlistSubmissionClosesAt` set "if and only if schools take part", strictly after `submissionClosesAt`. | file | Likely shape of #70/#71's competition model. An individuals-only competition has no shortlist deadline, so #90's SCHOOL_JUDGING -> FOA_JUDGING flip needs a rule for that case (finding F7). Runtime check: real enum and date columns on trunk after #71. |
| R7 | No rich-text sanitiser exists (`grep -ril "sanitiz\|dompurify\|sanitize-html" src package.json` = 0). Spec: "one rich-text sanitiser for all rendering" (CMS module, #111, M5). #86 (M2) is the first ticket that needs it. | grep, spec, #86 body, #111 body | #86 builds THE sanitiser; #111 reuses it (finding F4). |
| R8 | `src/i18n/messages.ts` lists every namespace three times; `messages.test.ts` requires one file per namespace with one top key named after the file; `react/jsx-no-literals` bans literal copy; signed-in routes go to `src/lib/app-routes.ts` (created by #57), not `ROUTES`. | `code-app.md` sections 5, 7 | Each M2 ticket owns its own namespace(s) so parallel tickets never edit the same JSON file (proposals per ticket below). |
| R9 | `e2e.yml` runs from `main` with only `PLAYWRIGHT_BASE_URL` + `VERCEL_AUTOMATION_BYPASS_SECRET`; previews have real wall-clock time; the shared non-prod worker (#61) and ClamAV (#63) run on the VPS. | `code-infra.md` sections 3-5 | The M2 Seam 2 journey (#91) needs the VPS media/scan pipeline live for previews and a preview-only way to move a competition between phases (finding F9). |
| R10 | `next.config.ts` `images` has no `remotePatterns`; signed R2 URLs cannot go through `next/image` until a ticket adds a host-scoped pattern. | `code-ui.md` section 6 | Entry thumbnails and video posters (#85, #86, #92) render with plain `<img>`/`<video>` from signed URLs, or the ticket adds a scoped `remotePatterns` (hotspot with #63, #103). |

---

## 1. Findings the Orchestrator must act on

**F1. Native edges are unreadable from search; schedule on the union.** Run the 0.2 check at plan time. Until edges are
known, gate each M2 unit on its "hard deps" list in section 3, which already contains every count-consistent candidate.

**F2. Define each M2 enum's full value set in its first ticket.** R2 makes incremental `ADD VALUE` fragile, and seven tickets
touch the entry machine. Rule for hardening: 85b creates `entry_status` with all nine M2 values (`processing`, `submitted`,
`rejected`, `failed`, `school_shortlisted`, `not_shortlisted`, `submitted_to_foa`, `foa_verified`, `sent_back`); 89a creates
`school_round_status` with all four (`open`, `overdue`, `finalised`, `closed_on_behalf`); #88 creates `rubric_status`
(`draft`, `published`, `superseded`). Later tickets add allowed transitions to the transition table (code), never enum
values. The transition-table AC ("every allowed and forbidden transition introduced here") is met per ticket by the rows it
adds; unreachable values are covered as forbidden from every state until their ticket lands. M3+ values (physical, judging)
must be added in a migration that no other DDL in the same PR references. Record this as an ADR in 85b
(`docs/adr/NNNN-entry-status-values-up-front.md`).

**F3. HEIC decode strategy is a real blocker for #85's AC.** See R3. Contenders for 85a's tournament: (a) worker-media image
built on Debian with `libvips-dev` + `libheif` + `libde265` and sharp compiled from source against it inside that image only
(`SHARP_FORCE_GLOBAL_LIBVIPS=1`, `npm rebuild sharp` in the Docker stage, repo `allowBuilds` untouched); (b) a WASM decoder
(`heic-decode` / libheif-js) converting HEIC to raw RGBA, then prebuilt sharp encodes derivatives with metadata dropped:
testable in Vitest on CI and on T1 runners with no Docker; (c) ffmpeg decode (ffmpeg is coming to worker-media in #86
anyway). Judges require a real-adapter contract test that decodes a committed HEIC fixture with GPS EXIF and proves the
derivatives carry no EXIF/XMP/IPTC (parse with `exifr`), runnable by `pnpm test` without Docker, or explicitly placed in a
worker-media image test target that the Orchestrator runs on a T2/VPS runner. Never "skip if binary missing".

**F4. #86 owns the single rich-text sanitiser.** The spec places it in CMS (#111, M5). #86b creates
`src/server/rich-text/sanitize.ts` (server-only; profiles: `essay` now, `cms` added by #111) with an XSS corpus test; #111
extends the profile, never forks it. #84a uses structured plain-text fields (no HTML), so it needs no sanitiser and has no
dependency on #86.

**F5. #84's reminders need Entries, which arrive one ordinal later.** "A participant or coordinator who hasn't met a deadline
(submission, school round)" needs the entries table (#85) and school rounds (#89/#90) to evaluate "owes the deadline". Split
#84: 84a announcements (needs only M1), 84b the reminder mechanism plus the first reminder `entry_submission_due` (after
85b). #90 registers `school_round_shortlist_due` and the overdue notice on 84b's registry. #93 (M3 dispatch reminder) and
#125 (M6 event reminders) reuse it. #84 natively blocks nothing, so delaying 84b costs nothing.

**F6. Separate entry status from file-version status in 85b.** #85 needs a pending replacement while the entry stays
`submitted`; #91 needs an entry that stays `school_shortlisted` while its upload is processing or failed; #92 needs a
resubmitted file to be processed before the entry returns to the queue. Model `entry_file` rows with their own
`entry_file_status` (`pending`, `processing`, `live`, `rejected`, `failed`, `superseded`). Entry status `processing` /
`rejected` / `failed` describe only an entry that has never had a live file. Getting this wrong forces #91 to restructure
#85's schema (a migration on a shared enum and table: R2 hazard).

**F7. Ownership of the judging status flips.** #71 says "Later tickets add the school-judging and FOA-judging states". Assign:
#88 adds the scheduled IN_PROGRESS -> SCHOOL_JUDGING flip (at `submissionClosesAt`, unless #71 already scheduled it: runtime
check `grep -rn "school_judging\|SCHOOL_JUDGING" src/server` on trunk at claim) plus the generic transition-guard and
blocked-flip mechanism; #90 adds the SCHOOL_JUDGING -> FOA_JUDGING flip (at `shortlistSubmissionClosesAt`; for an
individuals-only competition with no shortlist deadline, run it immediately after entering school judging, since zero rounds
means the gate passes) and registers its guard on #88's mechanism. Individual-route entries move to `submitted_to_foa` at
`submissionClosesAt` (#92, scheduled job), independent of the competition flip.

**F8. "FOA verifier" is not in the spec's role list.** #92 adds a staff role `foa_verifier` (2FA required, global scope; #94
reuses it). If #59 made roles a Postgres enum, adding the value is an R2 hazard: add it in a migration nothing else in the
PR references. Hotspot H30.

**F9. The M2 Seam 2 journey (#91) is gated on VPS residue and needs a preview phase control.** On a preview, uploads reach
`submitted` only if the shared non-prod `worker`, ClamAV and `worker-media` are deployed and pointed at preview DBs (G6) and a
non-prod R2 bucket with CORS for preview origins exists (G7; already residue R0-5 of #63). Time cannot be faked on a preview,
so "submission and shortlisting end to end" needs either (a) a preview-only competition phase control (staff-only action that
moves a competition's dates/status forward; refuses unless `APP_ENV` is `preview` or `local`; covered by a test proving it is
unreachable with `APP_ENV=production`) or (b) seed data with competitions parked in each phase plus a second competition per
scope. Raise G6/G7 at M2 start (or earlier, with #63's residue) so 91b does not stall. A 91b that cannot pass E2E for lack of
G6/G7 goes `factory:needs-human`; never disable the journey.

**F10. Blind-judging leak through essay documents.** #96 (M3) requires that judges see no participant PII. Uploaded essay
documents carry author metadata (PDF Info/XMP `Author`, DOCX `docProps/core.xml` `dc:creator`). #86's AC strips metadata only
from video derivatives. Recommendation for 86b hardening: accept PDF only in M2 (FOA confirms; residue G5), and have
worker-media produce a PDF derivative with Info/XMP removed (`pdf-lib`, pure JS); judges and verifiers view only the
derivative. DOCX can follow once Gotenberg exists (#100). If the hardening agent keeps DOCX, file a follow-up (cap rules,
charter decision 11) against #96.

**F11. CSP sources M2 needs (coordinate with #65's builder).** Browser direct PUT to R2 (`connect-src` for the R2 endpoint),
client-side image preview (`img-src blob:`), video playback from signed URLs (`media-src` for the signed host), HEIC preview
fallback (none: HEIC does not render in most browsers; show a file-name chip). Each lands in #65's source registry, not in
ad-hoc headers. Hotspot H32.

**F12. worker-media shares the VPS with production Postgres.** ffmpeg transcodes (#86) and HEIC decodes (#85) are CPU-heavy.
`code-infra.md` section 2 item 4: containers can take 7 CPU / 14.5 GB. 85a must ship `cpus`/`mem_limit` (and `pids_limit`)
for `worker-media` in the compose file, pg-boss concurrency 1 per container for media jobs, and a per-job timeout; the owner
accepts the limits when deploying (G6).

**F13. Recipients without accounts.** Guardians of school-enrolled students (#75 stores guardian contact on an
institution-managed participant profile) and adult students may have no user account. #84a/#87/#89b/#91a/#92 message them.
In-app inbox delivery is possible only for account holders; contact-only recipients get email (and SMS when enabled).
Hardened ACs must say so; the Notifications module (#69/#81) must already support contact-addressed messages (runtime check
on trunk: the principal message of #75 is the precedent). If it does not, the first M2 ticket that needs it (84a) adds it.

**F14. "Category" is defined by #70.** Shortlist size, positions and limits are "per category". Runtime check on trunk after
#70: the category key (discipline x age group, or an explicit `competition_category` table). 89a and 91a key picks and limits
by that key; hardening records it in GLOSSARY.md ("Category").

**F15. Concurrency between reopen (#90) and verification (#92).** Both mutate entries of one school round. Both use cases take
`SELECT ... FOR UPDATE` on the `school_round` row (verification of a school-route entry locks its round first), so a verify
and a reopen of the same round serialize. Seam 1 cannot prove a race; the judge checks the lock order in review, and a
PGlite test proves that after a verify, reopen is refused, and after a reopen, verify of a reverted entry is refused.

---

## 2. Shared M2 conventions

### 2.1 State machines introduced in M2 (allowed transitions; owning unit)

`entry_status` (all values created by 85b, F2):

| From | To | Trigger | Unit |
| --- | --- | --- | --- |
| (none) | `processing` | upload confirmed (image, video, document) | 85b |
| (none) | `submitted` | typed essay saved | 86b |
| (none) | `school_shortlisted` | coordinator creates a shortlist-only entry in the school round | 91a |
| `processing` | `submitted` | first file passes scan and processing | 85b |
| `processing` | `rejected` | first file infected | 85b |
| `processing` | `failed` | first file processing failure (corrupt image in 85b; video/doc in 86a/86b) | 85b, 86a |
| `rejected`, `failed` | `processing` | retry upload before the submission deadline | 85b |
| `submitted` | `school_shortlisted` | finalise, institution route, all-participants scope | 89b |
| `school_shortlisted` | `submitted_to_foa` | same finalise transaction (all-participants); or processed AND round finalised (shortlist-only) | 89b, 91a |
| `processing`, `rejected`, `failed`, `submitted` | `not_shortlisted` | finalise / close on behalf, institution route, all-participants | 89b, 90 |
| `submitted` | `submitted_to_foa` | submission deadline job, individual route | 92 |
| `submitted_to_foa` | `foa_verified` / `sent_back` | verifier decision | 92 |
| `sent_back` | `submitted_to_foa` | resubmission (after the new file is live, if changed) before the resubmission deadline | 92 |
| `school_shortlisted`, `submitted_to_foa`, `not_shortlisted` | the status before finalise | reopen (only during school judging, no entry of the round verified) | 90 |

Forbidden examples every table must include: `processing` -> `school_shortlisted`; `submitted` -> `foa_verified`;
`rejected` -> `submitted`; any transition out of `foa_verified` in M2; individual-route entry -> `school_shortlisted` /
`not_shortlisted`; `not_shortlisted` -> `submitted_to_foa` without reopen; any replacement or retry after the deadline;
`sent_back` -> `submitted_to_foa` after the resubmission deadline.

`school_round_status` (all values created by 89a): (none) -> `open` (competition enters SCHOOL_JUDGING, 89a); `open` ->
`finalised` (89b); `open` -> `overdue` (shortlist deadline job, 90); `overdue` -> `finalised` (school finalises late, 90);
`overdue` -> `closed_on_behalf` (manager with reason, 90); `finalised` / `closed_on_behalf` -> `open` or `overdue` (reopen;
`overdue` if the shortlist deadline has passed: hardening decision, 90). Forbidden: `open` -> `closed_on_behalf`;
`finalised` -> `overdue`; any reopen outside SCHOOL_JUDGING.

`rubric_status` (#88): (none) -> `draft`; `draft` -> `published`; `published` -> `superseded` (a newer version of the same
discipline is published). Forbidden: `published` -> `draft`; any edit of a `published`/`superseded` rubric or its criteria.

Competition transitions added in M2: IN_PROGRESS -> SCHOOL_JUDGING guarded by "every enabled discipline has a published
rubric" (#88); SCHOOL_JUDGING -> FOA_JUDGING guarded by "no unfinished school round" (#90). Unfinished = `open` or `overdue`.

### 2.2 Events, templates and settings added in M2 (proposed names; hardening may rename)

| Name | Kind | Unit |
| --- | --- | --- |
| `competition.announcement_sent` | event -> fan-out job; template `announcement` (email, in-app, SMS short form) | 84a |
| `reminder.entry_submission_due` | named reminder; template `reminder_entry_submission`; setting `reminders.entry_submission_due.offsets` | 84b |
| `entry.submitted`, `entry.rejected`, `entry.failed`, `entry.replacement_live` | events; templates `entry_received`, `entry_file_rejected`, `entry_processing_failed` | 85b, 86a |
| `competition.transition_blocked` | event; template `competition_transition_blocked` (to competition managers) | 88 |
| `rubric.published` | event; triggers re-run of a blocked flip | 88 |
| `school_round.opened` | event (rounds created on entering SCHOOL_JUDGING) | 89a |
| `school_round.shortlist_finalised` | event (ONLY emitted by `finaliseSchoolRound`); templates `entry_school_shortlisted`, `entry_not_shortlisted` | 89b |
| `school_round.overdue`, `school_round.closed_on_behalf`, `school_round.reopened` | events; templates `school_round_overdue`; reminder `school_round_shortlist_due` (setting `reminders.school_round_shortlist_due.offsets`) | 90 |
| `registration.not_shortlisted` | template for shortlist-only scope (by registration) | 91a |
| `entry.foa_verified`, `entry.sent_back`, `entry.resubmitted` | events; templates `entry_foa_verified`, `entry_sent_back`; setting `entries.resubmission_days` (default 7) | 92 |

Reminder offsets have no spec default. Proposed default `[72h, 24h]`, described in the settings registry as "confirm with
FOA" (G5).

### 2.3 File-conflict hotspot codes

Global codes (same meaning as `issues-M6-M8.md` 0.3): **H1** schema barrel `src/server/db/schema/index.ts`; **H2**
`drizzle/*.sql` + `drizzle/meta/*` (merge queue regenerates; hand-written SQL kept as `--custom` files); **H3**
`src/i18n/messages.ts`; **H6** seed builders + preview seed entry point; **H7** settings registry (#62); **H8** `can()` action
table (#59); **H9** outbox event union + worker consumer registry + event->template map seed (#61/#69); **H10** pg-boss named
schedule / reminder registry (owner #84); **H17** competitions schema + admin form (#70/#72); **H19** dashboard/admin/
institution navigation and `src/lib/app-routes.ts`; **H21** Files derivative purposes / `worker-media` job registry (owner
#85).

M2-specific codes:

| Code | File(s) (proposed paths) | Owner | Touched by | Merge rule |
| --- | --- | --- | --- | --- |
| H22 | `src/server/modules/entries/status.ts` + `status.test.ts` (transition table) | 85b | 86a, 86b, 89b, 90, 91a, 92 | Serialize merges; enum values never change after 85b (F2). |
| H23 | `src/server/modules/entries/use-cases/{submit-entry,replace-entry-file}.ts`, discipline rule registry `entries/rules.ts` | 85b | 86a, 86b, 87, 91a, 92 | Serialize merges in dependency order; prefer adding per-discipline handlers in new files. |
| H24 | competition status transitions + guard/blocked-flip registry `src/server/modules/competitions/status.ts` | #71 (machine), #88 (guards) | 88, 90, 92 (deadline job registration) | Serialize; guards register from their own module files. |
| H25 | `src/server/modules/school-round/**` (status, picks, finalise) | 89a | 89b, 90, 91a | Serialize: 89a -> 89b -> 91a -> 90. |
| H26 | `src/app/dashboard/entries/**`, participant dashboard registration row | 85b | 86a, 86b, 92 | Per-discipline form components in new files; merge queue rebases. |
| H27 | `src/app/institution/competitions/[ref]/**` + coordinator nav | #75 (page), 87 (submissions) | 87, 88, 89a, 89b, 90, 91a, 92 | New subfolders per ticket; one nav line each. |
| H28 | `docker/workers.yml` (from #61b) + `docker/worker-media/**` | #61b, 85a | 85a, 86a, #63b, #66b, #68, #100, #102 | Serialize merges. |
| H29 | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` `allowBuilds` | merge queue | 85a, 86a, 86b | Merge queue re-runs `pnpm install` and commits the lockfile; `allowBuilds` repo-wide stays `sharp: false` (R3). |
| H30 | role registry/enum (#59) | #59 | 92 (`foa_verifier`) | Append; R2 rule if enum. |
| H31 | Files access rules (`can()` resources for signed delivery) | #63 | 85b, 87, 92 | Append resource rules. |
| H32 | CSP source registry (#65) | #65 | 85b, 86a | Append sources; header tests re-run. |
| H33 | Notification recipient resolution / guardian routing (#69/#81) | #69/#81 | 84a, 87, 89b, 91a, 92 | Reuse; extend only via 84a (F13). |

### 2.4 Residue codes

G1 counsel retention confirmation (data inventory rows); G2 DLT templates for new SMS-capable messages; G3 legal/FOA copy
sign-off batch for the milestone; G5 FOA product defaults batch for the milestone (codes from `issues-M6-M8.md` 0.4). Added
here: **G6** VPS deploy of `worker-media` (and confirmation that the shared non-prod `worker` + ClamAV from #61b/#63b serve
preview DBs and staging), with CPU/memory limits accepted by the owner (F12); **G7** non-production R2 bucket, token and CORS
for browser PUT from preview and staging origins (same item as #63's R0-5; dedupe).

---

## 3. Per-ticket analysis

### #84 (ordinal 29): M2: Announcements and deadline reminders to registrants

- **Depends on:** explicit: #69 (Notifications module: email, SMS, in-app inbox; #69 body "Reminders arrive with the
  announcements ticket"), #61 (pg-boss: "Reminders are named schedules in pg-boss"), #62 ("Reminder timing lives in runtime
  settings"), #81 (owner comment: guardian if under 18; AC "Messages about a minor go to the guardian"). Native (4,
  candidates): #69, #75, #78, #81. Inferred hard: #75 (confirmed institution registrations, enrolled students and guardian
  contacts), #78 (confirmed individual registrations), #77 (institution registration "confirmed" after bulk payment), #70
  (competition), #71 (deadline instants and the reschedule-on-edit pattern: "Changing a date before it passes moves the
  transition to the new instant. The old job does nothing"), #59 (competition-manager role, audit), #57 (harness). 84b
  additionally: 85b (Entries, F5).
- **Blocks:** none natively. Inferred: #90 (coordinator reminder before the shortlist deadline), #93 (dispatch-deadline
  reminder), #125 (event reminders).
- **AFK class:** A.
- **Human residue:** G2 DLT templates for the announcement SMS and reminder SMS (SMS stays off until DLT; email + in-app
  cover). G5: reminder offsets (proposed default `[72h, 24h]`); whether an announcement is a service message (follows channel
  preference, ignores communications consent: proposed default) or needs the communications consent from #64/#82 (counsel/FOA
  ruling, non-blocking). G3: default announcement template wording. FOA help-contact facts (`SITE.org` values are
  placeholders; `assertNoPlaceholdersInProduction` blocks production until #62/#111 replace them): the composer takes help
  contacts as a typed field, so no placeholder is baked in.
- **Ports / providers:** Email, SMS (capture adapters outside production, fakes in Seam 1), in-app inbox (internal), JobQueue
  (pg-boss delayed jobs / schedules), Clock, Settings. No new provider.
- **New tables / columns (proposed):**
  - 84a: `announcement` (id UUIDv7, competition_id FK, status enum `announcement_status` (`draft`, `sent`), subject, event_at
    timestamptz null, confirmed_theme, permitted_materials, duration_text, submission_steps, physical_artwork_requirements,
    deadlines_text, help_contacts, extra_text (all plain text, length-capped by zod), created_by, created_at, updated_at,
    sent_by, sent_at, recipient_count int). Delivery idempotency through Notifications' message log with dedupe key
    `announcement:<id>:<recipient-key>` (recipient key = user id, or a keyed hash of the contact address for contact-only
    recipients, so a guardian with two enrolled children gets one copy). If #69's message log has no dedupe key, add a unique
    `(dedupe_key)` column there (H9/H33, coordinate).
  - 84b: `reminder_job` (id, competition_id, reminder_name text, offset_iso text, deadline_at timestamptz (snapshot at
    scheduling), fire_at timestamptz, pgboss_job_id uuid null, status enum `reminder_job_status` (`scheduled`, `fired`,
    `cancelled`, `superseded`), created_at); unique `(competition_id, reminder_name, offset_iso, deadline_at)`. Code registry
    `ReminderDefinition { name, deadlineOf(competition), offsetsSetting, owes(ctx, competitionId) -> Recipient[], template }`
    (H10). Settings keys per reminder (H7).
  - Audit: `announcement.sent` (counts only in `after`, no recipient list).
- **Use cases (proposed):** 84a `createAnnouncement`, `updateAnnouncement`, `previewAnnouncement` (renders email + in-app for a
  sample recipient; sends nothing), `sendAnnouncement`, `listAnnouncements`; worker consumer `fanOutAnnouncement`. 84b
  `scheduleCompetitionReminders` (on publish and on deadline change), worker handler `runReminder` (re-reads the deadline; no-op
  if it changed, F5/#71 pattern; evaluates `owes` at run time).
- **Routes / pages:** `/admin/competitions/[code]/announcements` (list), `/admin/competitions/[code]/announcements/new`,
  `/admin/competitions/[code]/announcements/[id]` (edit, preview, send with a confirmation dialog showing the recipient
  count). Recipients read it in `/dashboard/inbox` (#69). 84b: no page (offsets appear in #62's settings screen if that
  screen is registry-driven; runtime check).
- **Messages namespaces:** `adminAnnouncements` (composer, preview, send confirmation, recipient-count text). 84b: none (template
  copy lives where #69 seeds templates; runtime check: DB seed file vs messages).
- **Size:** XL. Two independent mechanisms (announcement composer + audience resolution + fan-out; reminder registry +
  scheduling + reschedule + run-time obligation check), each with its own UI/settings, templates, seed and authz tests.
  Split.
- **Design uncertainty:** 3. Fan-out: one outbox event per recipient written in the send transaction vs one event and a
  batched worker fan-out job with dedupe keys (thousands of recipients per competition); contact-only recipients (F13);
  structured fields vs free text; reminders: per-instance delayed pg-boss jobs with run-time checks vs a periodic cron sweeper
  over a delivery log; offsets read at schedule time vs at run time (settings change behaviour).
- **Risk flags:** K (messages about minors must reach guardians, never the minor, including 13-17-year-olds with own
  logins), PD (bulk use of guardian contacts), E (reads encrypted contact columns from #75/#81).
- **Test plan:**
  - Seam 1 (84a): world with a competition having 2 confirmed adult individuals, 1 confirmed minor individual (13-17, own
    login) + guardian, 1 confirmed institution registration with a coordinator and 3 enrolled students (one adult, two minors
    with guardian contacts, two siblings sharing one guardian), 1 pending (unconfirmed) registration. `as(competitionManager)
    .sendAnnouncement`, `world.drain()`: `fakes.email.sent` holds exactly one message per expected recipient (adults,
    guardians, coordinator, sibling guardian once), none to the minor or the unconfirmed registrant; inbox rows exist for
    account holders only; audit row `announcement.sent` with counts; `previewAnnouncement` sends nothing; re-running the drain
    (simulated retry) sends no duplicates; SMS port receives nothing while `sms.enabled` is false and the expected messages
    when true. Authz: competition manager passes; content manager, coordinator, participant fail.
  - Seam 1 (84b): `world.clock.set(deadline - 72h - 1m)`, drain: nothing; advance past `deadline - 72h`, drain: reminder to
    registrants without a `submitted`-or-later entry (or `processing`: hardening decides, proposed "counts as met"), none to
    those with one; an entry submitted between scheduling and run time suppresses the reminder (checked at run time); editing
    the deadline (+2 days) then advancing to the old fire time sends nothing, the new fire time sends; under shortlist-only
    scope (#70 flag) school-route students owe no submission deadline; coordinator receives one reminder covering their
    students. Authz on `scheduleCompetitionReminders` if exposed (system-only: user actors fail).
  - Seam 2: none required by the ticket (milestone journey is #91). `tests/e2e/84-announcements.spec.ts`: signed-in seeded
    competition manager visits the three admin pages, axe each.
  - axe: the three admin announcement pages (desktop + mobile projects), plus one run with `.dark` on `<html>` (UI rubric U2).
- **Conflict hotspots:** H9, H10 (owner), H7, H8, H19, H33, H6; #71's scheduling module (reschedule hook) H24.
- **Split (XL):**
  - **84a** "Announcements to confirmed registrants" (L): `announcement` table, composer/preview/send, audience resolution with
    guardian routing and dedupe, fan-out job, template, audit, seed (one sent + one draft announcement on PAWS26), axe. Deps:
    #69, #75, #77, #78, #81, #70, #59, #61.
  - **84b** "Reminder schedules and the submission reminder" (L): registry, `reminder_job`, settings keys, schedule on publish
    and on deadline change, run-time `owes` check, `entry_submission_due`, seed (inbox reminder messages). Deps: 85b, #61, #62,
    #69, #71, #81.
- **Tournament:** 84a yes (K + L), 2 contenders: per-recipient outbox events in the send transaction (simplest-thing) vs one
  event + batched worker fan-out with a recipient resolver module (deep-module-first). 84b yes (uncertainty 3), 2 contenders:
  per-instance delayed jobs with deadline snapshot (risk-first) vs cron sweeper every 15 min over `reminder_job` rows
  (simplest-thing). Judges weigh: exactly-once delivery under retries, reschedule correctness, fake-clock testability with
  #61's drain.

### #85 (ordinal 30): M2: Image submission by an individual participant

- **Depends on:** explicit: #63 (Files: "scan gate"; #63 defers derived copies and metadata stripping to this ticket),
  #61 (worker; `worker-media`), confirmed registration (#78 "confirmed individual participant", participant dashboard), owner
  comment "A guardian can submit for their ward" (#81). Native (3, candidates): #63, #78 + one of #81 / #73 / #71. Inferred
  hard: #73 (Codes generator for `{comp}-E-{6}`), #71/#70 (submission window instants), #69 (confirmation message), #59
  (`can()`, audit), #57 (harness, seed), #65 (CSP sources for direct upload, F11).
- **Blocks:** native 3 (candidates #86, #87 + one of #89 / #92 / #102 / #103). Inferred: #84b, #86, #87, #89, #91, #92, #96
  (judges view derivatives), #102 (stamping runs in worker-media on derivatives), #103 (gallery uses derived copies), #131.
- **AFK class:** B (code fully agent-doable against fakes; a real image on a preview reaches `submitted` only with G6 + G7).
- **Human residue:** G6 (deploy `worker-media`, accept CPU/memory limits, F12); G7 (non-prod bucket, shared with #63). G5:
  per-discipline file types and size limits (proposed defaults: drawing/painting/art/craft/photography accept JPEG, PNG, HEIC,
  HEIF, WebP up to 20 MB; confirm with FOA). G1: retention for originals, derivatives, entry text fields. G2: DLT template for
  "entry received" SMS.
- **Ports / providers:** new `MediaProcessor` port (85a: `processImage(input: {key, contentType}) -> {derivatives:[{kind,
  key, width, height, bytes, contentType}], sniffedType}`; in-memory fake registered with `registerFake('mediaProcessor', ...)`
  that can be told to fail; sharp-based adapter in worker-media). Existing: ObjectStorage, MalwareScanner (#63), JobQueue,
  Clock, Codes, Email/in-app (Notifications).
- **New tables / columns (proposed):**
  - 85a (Files module): `file_derivative` (id, file_asset_id FK, kind text registry (`thumb_320`, `display_1600`, later
    `poster`, `transcode_mp4`, `pdf_clean`, `stamped_*`), storage_key, content_type, width int null, height int null,
    duration_ms int null, bytes bigint, created_at), unique `(file_asset_id, kind)`; `file_asset` gains
    `processing_status` (if #63's status enum lacks processed states: add values per R2 rule) or derivatives readiness is
    derived from rows. Media jobs on a dedicated pg-boss queue `media` that only `worker-media` subscribes to (H21).
  - 85b (Entries module, new): `entry` (id, code text unique `{comp}-E-{6}`, competition_id, registration_id UNIQUE (one entry
    per registration, owner), participant_profile_id, route (reuse #75/#78 route enum), discipline (reuse #70 enum),
    category_key (F14), title (<= 120), description (<= 500), statement null (<= 1500), status `entry_status` (all 9 values,
    F2), created_by_user_id, submitted_at null, created_at, updated_at); `entry_file` (id, entry_id, file_asset_id null,
    kind enum `entry_file_kind` (`image`, `video`, `document`, `text`), text_html null (86b), status `entry_file_status`
    (`pending`, `processing`, `live`, `rejected`, `failed`, `superseded`), uploaded_by_user_id, upload_completed_at,
    became_live_at, created_at), partial unique `(entry_id) WHERE status = 'live'` (drizzle `uniqueIndex().where()`, generated,
    not custom; the value `live` exists in the same CREATE TYPE, so R2 does not bite); `entry_transition` (id, entry_id,
    from_status null, to_status, actor_kind, actor_user_id null, reason null, at) (history for #90 revert and #92 "history is
    kept"); `competition_entry_rule` (competition_id, discipline, accepted_types text[], max_bytes bigint, max_duration_s
    int null, max_words int null) owned by Entries with code defaults in `entries/rules.ts`, so #70's competition schema (H17)
    is not edited.
  - Settings: none new (deadline comes from the competition).
- **Use cases (proposed):** 85b `startEntryUpload` (validates rule, presigns through Files), `completeEntryUpload` (creates the
  entry in `processing` with Entry ID on first upload, or a `pending` replacement), worker consumer on Files' scan/processing
  outcome `applyEntryFileOutcome`, `getMyEntries`, `getEntry`; 85a worker handler `processImageAsset`.
- **Routes / pages:** `/dashboard/entries` (list with Entry IDs and statuses), `/dashboard/entries/new?registration=<number>`
  (submit), `/dashboard/entries/[code]` (detail, replace, retry); entry link on the participant dashboard registration row
  (#78 page, H26). Guardian sees the ward's entries from the same pages (scoped by guardian link).
- **Messages namespaces:** `entries` (form labels, limits text, statuses, errors: wrong type, too large, infected, deadline
  passed, processing).
- **Size:** XL. Two deep pieces: (a) media pipeline (port, fake, sharp adapter with HEIC decode, EXIF/XMP/IPTC strip with
  orientation baked, derivative sizes, worker-media Dockerfile + compose service + queue), (b) Entries module (3-4 tables,
  status machine with transition table, Entry ID, pending replacement, deadline enforcement, browser + server checks,
  notifications, dashboard pages, seed). Split.
- **Design uncertainty:** 4. HEIC route (F3); derivatives as `file_derivative` rows vs derived `file_asset` rows (reuses
  access rules, costs a self-FK); entry vs file-version state model (F6); when an upload "counts" against the deadline
  (`completeEntryUpload` before the deadline with processing finishing after: proposed accept); browser-side HEIC type
  detection (`file.type` is often empty for HEIC: fall back to extension; server sniffs magic bytes `ftypheic`/`ftypheix`/
  `ftypmif1` with `file-type`); where size limits are enforced (presign `Content-Length` + post-upload HEAD, per #63).
- **Risk flags:** K (children's photos; EXIF GPS is a safeguarding leak), A (untrusted uploads, scan gate, signed delivery,
  "hidden from staff until scan passes"), C (direct-upload `connect-src`, `img-src blob:`, F11), V (worker-media on the prod
  VPS, F12), PD.
- **Test plan:**
  - Seam 1 (85b): confirmed adult participant `startEntryUpload` + storage fake PUT + `completeEntryUpload` -> entry
    `processing` with code matching `^[A-Z]{3,6}\d{2}-E-[0-9A-HJKMNP-TV-Z]{6}$`; `drain()` (scanner fake clean, media fake ok)
    -> `submitted`, `fakes.email` has the confirmation, dashboard query shows the code; scanner fake infected -> `rejected`,
    participant told, staff list (`competition manager` query) never shows it; retry before deadline -> `processing` ->
    `submitted`; while `processing`, staff queries exclude it; wrong type / over limit refused at `startEntryUpload` and again
    at `completeEntryUpload` when HEAD mismatches; replacement: entry stays `submitted`, old file stays live until the new one
    is `live`, then old `superseded`; infected replacement leaves the old file live; `clock.set(deadline + 1s)`: replace and
    retry refused with `deadline_passed`; second entry for the same registration refused; guardian submits for ward passes;
    another participant's registration refused; coordinator and competition manager cannot use the individual path.
    Transition table: every pair over the 9 values (allowed rows above for 85b, all others forbidden). Authz per use case.
  - Seam 1 (85a, real adapter contract, F3): committed fixtures `fixtures/media/gps.jpg` (EXIF GPS + camera make),
    `fixtures/media/iphone.heic` (with GPS), `fixtures/media/rotated.jpg` (Orientation 6): derivatives decode, have expected
    dimensions, orientation baked, `exifr.parse(derivative)` returns no GPS/Make/Model/XMP/IPTC; corrupt file -> typed
    `media_decode_failed`. Fake passes the same contract suite (`contract.ts` pattern from #57).
  - Seam 2: none required (milestone journey in 91b). `tests/e2e/85-entries.spec.ts` visits `/dashboard/entries` and the submit
    page as a seeded adult participant with seeded entries in `submitted`, `processing`, `rejected`; axe each.
  - axe: `/dashboard/entries`, `/dashboard/entries/new`, `/dashboard/entries/[code]` (both themes).
- **Conflict hotspots:** H21 (owner), H22/H23/H26 (owner), H28, H29 (sharp/heic deps in worker-media only), H31, H32, H1, H2,
  H3, H6, H9, H19; #78's dashboard page; `src/test/db.ts` untouched.
- **Split (XL):**
  - **85a** "Image derivatives and metadata stripping in worker-media" (L): MediaProcessor port + fake + contract, sharp
    adapter with HEIC decode, derivative registry and `file_derivative`, `media` queue and worker-media entry point, Dockerfile
    + compose service with limits, docs in `docker/README.md`. Deps: #63, #61 (only M0). Can run during M1.
  - **85b** "Entries module and individual image submission" (L): everything Entries listed above. Deps: 85a, #63, #69, #71,
    #73, #78, #81, #59, #65.
- **Tournament:** 85a yes, 3 contenders (K + V + uncertainty 4; high risk): global-libvips Docker build (risk-first), WASM
  decode + prebuilt sharp (simplest-thing, CI-testable), ffmpeg decode shared with #86 (deep-module-first: one media
  toolchain). 85b yes (K + A + L, uncertainty 3), 2 contenders: entry + entry_file split with history table (deep-module-first)
  vs single entry row with `pending_file_asset_id` columns (simplest-thing); judges must check fit for #91 and #92 (F6).

### #86 (ordinal 31): M2: Video and essay submissions

- **Depends on:** explicit: #85 ("Everything else behaves as in image submission"; native, the only blocker), `worker-media`
  (85a). Inferred hard: 85b (Entries), 85a (port to extend); #63 (scan gate for documents). The sanitiser has no prior owner
  (F4).
- **Blocks:** none natively. Inferred: #96 (judges play videos from the transcoded copy, read essays), #111 (reuses the
  sanitiser), #103 (if video entries reach the gallery).
- **AFK class:** B for 86a (real transcoding on a preview needs G6 with ffmpeg); A for 86b.
- **Human residue:** G5: video size and length limits (proposed defaults 200 MB, 3 min; confirm), essay word limit (proposed
  1500 words; confirm), accepted document formats (proposed PDF only, F10). G6: worker-media image with ffmpeg deployed; CPU
  limits for transcodes (F12). G1: retention for video originals/derivatives and essay text. Optional counsel note: ffmpeg
  build licence (LGPL build without `--enable-gpl` codecs, or GPL static build) for the self-hosted worker image.
- **Ports / providers:** `MediaProcessor` extended: `probeVideo(key) -> {durationMs, width, height, codecs}`,
  `transcodeVideo(key) -> {mp4Key, posterKey}`, `cleanPdf(key) -> {pdfKey}` (86b); fake extended (configurable duration,
  failure); ffmpeg/ffprobe adapter in worker-media. MalwareScanner for documents. Sanitiser library (proposed `sanitize-html`,
  server-only, no DOM; alternative DOMPurify + a server DOM).
- **New tables / columns (proposed):** `entry_file.kind` gains use of `video`/`document`/`text` (values created in 85b);
  `entry_file.text_html` (sanitised), `entry_file.word_count`; `competition_entry_rule.max_duration_s` / `max_words` (columns
  created in 85b) get defaults for VIDEOGRAPHY / ESSAY; derivative kinds `transcode_mp4` (H.264 + AAC, `+faststart`, <= 1080p),
  `poster` (JPEG/WebP), `pdf_clean`. No new tables.
- **Use cases (proposed):** extend `startEntryUpload` / `completeEntryUpload` with the video and document rules;
  `saveEssayText` (creates entry straight in `submitted` or a replacement that goes `live` at once); worker handlers
  `processVideoAsset` (probe -> reject over length -> transcode -> poster -> strip metadata), `processDocumentAsset`.
- **Routes / pages:** same `/dashboard/entries/**` pages; per-discipline form components (`video-entry-form.tsx` with
  `<video>` `loadedmetadata` duration check on an object URL; `essay-entry-form.tsx` with a text area and a document option);
  detail page plays the transcoded copy via signed URL in `<video controls>` with the poster, captions not required.
- **Messages namespaces:** `entriesVideo`, `entriesEssay` (separate from `entries` so 86a and 86b never edit the same JSON,
  R8).
- **Size:** XL. Video pipeline (probe, transcode, poster, metadata strip, length checks client + server, failed state) and
  essay (the platform-wide sanitiser with an XSS corpus, text and document paths, switching on replace) are independent.
  Split.
- **Design uncertainty:** 3. Server-side length check happens after upload (probe in worker) -> entry `failed`/file
  `rejected` with reason "too long" vs a pre-upload server check (impossible without bytes); single PUT vs multipart for
  large phone videos on slow connections (proposed single PUT up to the limit; multipart as follow-up); transcode profile;
  essay format (plain text paragraphs vs minimal rich text) and editor weight vs the JS budget; sanitiser library and
  profile model (F4); document handling (F10).
- **Risk flags:** K (videos of children carry location atoms such as `com.apple.quicktime.location.ISO6709`), A (XSS via essay
  text, F4), C (`media-src` for signed URLs, F11), V (ffmpeg CPU on the prod VPS, F12), PD.
- **Test plan:**
  - Seam 1 (86a): media fake reports duration within limit -> entry `submitted`, detail query returns a signed URL to the
    `transcode_mp4` derivative and the poster, never the original; fake duration over the limit -> entry `failed` with reason
    `too_long`, participant told "try again"; fake transcode failure -> `failed`, retry before deadline -> `processing` ->
    `submitted`; over size refused at start and at complete. Real ffmpeg adapter contract (run where ffmpeg exists per F3's
    rule; fixture `fixtures/media/gps.mov`, 1 s): output mp4 plays (ffprobe codec h264/aac), `-map_metadata -1` result has no
    `location`/`creation_time`/`make`/`model` tags; poster decodes. Transition rows for `processing -> failed`, `failed ->
    processing`.
  - Seam 1 (86b): typed essay -> `submitted` at once, confirmation sent; XSS corpus (`<script>`, `onerror=`, `javascript:`
    URLs, `<svg onload>`, `<iframe>`, style/expression, encoded variants, mXSS strings) yields output with no executable
    content and matches snapshots; allowed formatting survives; word limit enforced; document path: scan clean -> `submitted`,
    infected -> `rejected`; replace text with document and back (owner comment); after deadline refused. Sanitiser is the only
    import path (oxlint `no-restricted-imports` for the library outside `src/server/rich-text/`).
  - Seam 2: none required. `tests/e2e/86-video-essay.spec.ts` visits the video and essay submit pages and a seeded entry detail
    page with a playable seeded video derivative; axe each.
  - axe: video and essay submit forms, entry detail with `<video>` (both themes).
- **Conflict hotspots:** H21, H22, H23, H26, H28 (ffmpeg in worker-media), H29 (sanitiser dep), H32; 86a vs 86b vs 87 share
  H23/H26: merge order 87 -> 86a -> 86b.
- **Split (XL):**
  - **86a** "Video entries: transcode, poster and limits" (L). Deps: 85a, 85b.
  - **86b** "Essay entries and the single rich-text sanitiser" (M). Deps: 85b. Optional early slice: the sanitiser module alone
    (S) can start right after #57 if a runner is idle; 86b then only integrates.
- **Tournament:** 86a yes (uncertainty 3, K + L), 2 contenders: probe-then-transcode single job (simplest-thing) vs two-stage
  jobs with a quick probe job that rejects early and a transcode job (risk-first). 86b yes (uncertainty 3, A), 2 contenders:
  `sanitize-html` allowlist with profiles (simplest-thing) vs AST pipeline (`rehype-parse` + `rehype-sanitize` schema per
  profile) (deep-module-first); judges run the shared XSS corpus against both.

### #87 (ordinal 32): M2: Coordinator submits for students and certifies conduct

- **Depends on:** explicit: "The same file rules, scan gate, metadata stripping and Entry IDs apply as for individual
  submission" (#85), coordinator dashboard and enrolled students (#75). Native (2, candidates): #85 + one of #75 / #74.
  Inferred hard: 85b, #74 (coordinator role scoped to institution), #75, #77 (enrolled student registrations confirmed after
  bulk payment), #81 (guardian routing: "the student's guardian (or the adult student) is told"), #69. 86a/86b are not
  required (the coordinator path reuses whatever disciplines exist at claim time; per-discipline handlers added later work for
  both paths if 85b keeps the actor-agnostic submit use case).
- **Blocks:** native 1: #89 (finalising requires the conduct certification). Inferred: #91 (coordinator upload path), #117
  (counts).
- **AFK class:** A.
- **Human residue:** G3: conduct-certification statement wording (FOA's guidelines; proposed draft from
  `messages/en-IN/schools.json` "confirm the competition and judging followed FOA's guidelines"); link target for "FOA's
  guidelines" document (FOA supplies; until then the judging framework page from #88). G2: DLT template for "entry received"
  SMS to guardians.
- **Ports / providers:** none new (Files, Notifications, Codes).
- **New tables / columns (proposed):** `conduct_certification` (id, institution_registration_id UNIQUE, certified_by_user_id,
  certified_at, statement_version text) in a new schema file `schema/conduct-certification.ts` (not in #75's registration
  file, avoiding H17-style conflicts); `entry.created_by_user_id` already distinguishes coordinator-on-behalf; optionally
  `entry.submitted_via` enum? No: derive from the actor's role at submission in `entry_transition.actor_*`. Audit
  `conduct.certified`.
- **Use cases (proposed):** reuse `startEntryUpload` / `completeEntryUpload` with `can(coordinator, 'entry.submit',
  {registration})` resolving institution scope; `listInstitutionEntries({institutionRegistrationId})` (every enrolled student
  with entry status); `certifyConduct`; query `isConductCertified(institutionRegistrationId)` exported for 89b.
- **Routes / pages:** `/institution/competitions/[ref]/submissions` (student list with entry status; per-student submit/replace
  links to `/institution/competitions/[ref]/submissions/[registrationNumber]`), `/institution/competitions/[ref]/conduct`
  (certify once; shows who and when after). One nav line (H27).
- **Messages namespaces:** `institutionSubmissions`, `conductCertification`.
- **Size:** M (upper). Reuses 85b's pipeline; adds one table, 3 use cases, 3 pages, one template, seed; authz matrix across
  institutions is the bulk of the tests.
- **Design uncertainty:** 2. Actor-agnostic submit use case with scope resolution vs separate coordinator use case; whether
  conduct certification may be given before the school round opens (proposed: any time after registration confirmation, once;
  no revoke in M2).
- **Risk flags:** K (minors' work and guardian messages), A (institution scoping: "A coordinator of another institution is
  refused"), PD.
- **Test plan:**
  - Seam 1: coordinator of institution X submits for each confirmed enrolled student (entries get codes; guardian of minors and
    the adult student receive "received" messages; minor gets nothing); coordinator of institution Y refused for X's students
    (`forbidden`); coordinator refused for an individual-route registration; unconfirmed (unpaid) enrolment refused (proposed);
    replace until deadline then refused; `certifyConduct` once -> audit row with actor and time; second call refused
    (`already_certified`); `listInstitutionEntries` returns every enrolled student including those with no entry. Authz:
    coordinator and institution admin of X pass (hardening confirms institution admin), participant, guardian, coordinator of
    Y, competition manager fail for `certifyConduct`.
  - Seam 2: none required. `tests/e2e/87-coordinator-submissions.spec.ts` visits both pages as the seeded coordinator; axe.
  - axe: `/institution/competitions/[ref]/submissions`, `.../submissions/[registrationNumber]`, `.../conduct`.
- **Conflict hotspots:** H23 (submit use case scope), H27, H31 (coordinator access to student entry files), H8, H6, H9, H33.
- **Split:** none.
- **Tournament:** no (uncertainty 2, size M). Risk flags K + A => 3-judge panel (charter decision 6), with a skeptic dedicated
  to cross-institution access.

### #88 (ordinal 33): M2: Published rubrics gate the school round

- **Depends on:** explicit: "The scheduled status flip refuses the move" (#71; native, the only blocker), competition manager
  (#59, #70), "Coordinators of registered institutions" (#74, #75), "The competition manager is told" (#69). Inferred hard:
  #70 (enabled disciplines), #71, #59, #69. Soft: #74/#75 (coordinator read path; M1, merged first in practice).
- **Blocks:** native 2: #89, #95 ("FOA rounds reuse these rubrics later"). Inferred: #90 (reuses the guard/blocked-flip
  mechanism), #96/#97 (scores per criterion, weights).
- **AFK class:** A.
- **Human residue:** G3: FOA judging framework text (agent drafts from `src/content/judging.ts` and `schools.json` /
  `showcase.json` copy; FOA signs off). Operational: competition managers enter the real rubrics in the app (not residue).
  G5: whether criterion weights must sum to 100 (proposed yes) and the default score range (proposed 0-10).
- **Ports / providers:** none new (JobQueue for the re-run, Notifications).
- **New tables / columns (proposed):** `rubric` (id, competition_id, discipline, version int, status `rubric_status`,
  replaces_rubric_id null, created_by, created_at, published_by null, published_at null); partial unique indexes `(competition_id,
  discipline) WHERE status = 'draft'` and `WHERE status = 'published'` (generated from the TS schema); `rubric_criterion`
  (id, rubric_id, position, key, label, description, weight int, min_score int, max_score int). Immutability of published
  rubrics: app-level refusal plus a `BEFORE UPDATE OR DELETE` trigger on both tables when the rubric is not `draft`
  (hand-written `drizzle-kit generate --custom` SQL, H2 rule). `competition_transition_block` (id, competition_id, from_status,
  to_status, reason_code, details jsonb, blocked_at, resolved_at null) shared with #90. Judging framework: static content
  `src/content/judging-framework.ts` (zod-parsed, like `src/content/judging.ts`) or messages namespace `judgingFramework`.
- **Use cases (proposed):** `createRubricDraft` (pre-filled from `RUBRIC` defaults), `updateRubricDraft`, `publishRubric`
  (supersedes the previous published version; emits `rubric.published`; re-runs a blocked flip if the guard now passes and
  the instant has passed), `startRubricRevision` (new draft from published), `listRubrics`, `getPublishedRubrics` (coordinator
  read); guard `everyEnabledDisciplineHasPublishedRubric` registered on the competition machine for IN_PROGRESS ->
  SCHOOL_JUDGING; system handler `attemptCompetitionTransition` writes `competition_transition_block` + emits
  `competition.transition_blocked` when refused.
- **Routes / pages:** `/admin/competitions/[code]/rubrics` (per discipline status), `/admin/competitions/[code]/rubrics/
  [discipline]` (edit draft, publish, start revision, version history); coordinator `/institution/competitions/[ref]/
  judging-guide` (framework + published rubric per discipline).
- **Messages namespaces:** `adminRubrics`, `judgingGuide`.
- **Size:** L. Two tables + block table, immutability trigger, guard + blocked-flip + automatic re-run (the pattern #90
  reuses), notification, two admin pages + one coordinator page, seed, transition tables (rubric + competition guard).
- **Design uncertainty:** 3. Generic guard registry on the competition machine vs a direct check (circular module
  dependency: competitions must not import judging; registry or event); re-run trigger (on `rubric.published` vs a retry job);
  where the SCHOOL_JUDGING flip lives (F7); framework as static content vs DB content.
- **Risk flags:** none of the charter's list (integrity only).
- **Test plan:**
  - Seam 1: manager creates, edits, publishes a rubric; editing a published rubric refused (use case) and a direct UPDATE
    raises (trigger, asserted via the use case's error mapping, not raw SQL); revision -> publish supersedes the old version.
    Competition with disciplines DRAWING + ESSAY, only DRAWING published: `clock.set(submissionClosesAt)`, `drain()` ->
    status stays IN_PROGRESS, a `competition_transition_block` exists, competition managers (scoped and global) got the
    message with the missing discipline named, audit row with system actor; publish ESSAY rubric -> `drain()` -> status
    SCHOOL_JUDGING without further clock movement; individuals-only competition also blocked then passes (owner comment).
    Coordinator of a registered institution reads published rubrics and the framework; coordinator of an unregistered
    institution refused; participant refused. Authz for every use case. Transition table: rubric machine; competition
    IN_PROGRESS -> SCHOOL_JUDGING allowed only with the guard satisfied.
  - Seam 2: none required. `tests/e2e/88-rubrics.spec.ts`: seeded manager visits rubric pages; seeded coordinator visits the
    judging guide; axe.
  - axe: two admin rubric pages, the coordinator judging-guide page.
- **Conflict hotspots:** H24 (guard registry owner), H17 (read-only use of enabled disciplines), H9, H8, H2 (custom trigger
  SQL), H27, H19, H6.
- **Split:** none.
- **Tournament:** yes (uncertainty 3), 2 contenders: guard registry + `competition_transition_block` table with event-driven
  re-run (deep-module-first) vs direct guard call in the flip handler with re-run by re-enqueuing the scheduled job on publish
  (simplest-thing). Judges weigh reuse by #90 and M4 results publishing.

### #89 (ordinal 34): M2: School round: positions, shortlist and finalise

- **Depends on:** explicit: "opens when the competition enters school judging" (#88 guard and flip), conduct certification
  (#87), entries (#85), Notifications (#69) with guardian routing (#81), shortlist size and positions "from the competition's
  settings" (#70 scope flags). Native (3, candidates): #87, #88 + one of #85 / #69 / #75. Inferred hard: 85b, #75 (confirmed
  institution registrations), #74 (coordinator), #70, #69, #81, #59.
- **Blocks:** native 3 (candidates #90, #91 + one of #92 / #100). Inferred: #90, #91, #92 (school-route entries reach FOA),
  #100 (owner comment: outcomes query), #119 (school winner milestone).
- **AFK class:** A.
- **Human residue:** G3: judging-certification attestation wording; family shortlisted / not-shortlisted message copy. G5:
  whether positions must be chosen from shortlisted entries (proposed yes, consistent with #91 where positions are attributes
  of shortlisted entries); panel member fields (proposed name + designation, no contact data). G2: DLT templates for the two
  family messages.
- **Ports / providers:** none new.
- **New tables / columns (proposed):** `school_round` (id, competition_id, institution_registration_id UNIQUE, status
  `school_round_status` (4 values, F2), opened_at, judging_certified_by null, judging_certified_at null, finalised_by null,
  finalised_at null, closed_by null, closed_at null, closed_reason null, reopened_at null); `school_round_panel_member` (id,
  round_id, full_name, designation, position); `school_round_pick` (round_id, entry_id UNIQUE, category_key, shortlisted
  boolean, position smallint null), unique `(round_id, category_key, position) WHERE position IS NOT NULL`;
  `school_round_transition` history (mirrors `entry_transition`). Picks persist as the draft (owner #90: close on behalf and
  reopen use saved picks). Limits read from the competition (shortlist size default 5, positions default 3).
- **Use cases (proposed):** 89a: system consumer `openSchoolRounds` (on entering SCHOOL_JUDGING: one round per confirmed
  institution registration, idempotent, zero-entry rounds included), `getSchoolRound`, `recordPanel` (replace list),
  `setShortlistPick` / `removeShortlistPick` (only `submitted` entries; per-category limit), `setPosition` / `clearPosition`,
  `listSchoolRoundOutcomes({registrationId | institutionRegistrationId})` (owner: #100). 89b: `certifyJudging`,
  `finaliseSchoolRound` (requires panel >= 1, `isConductCertified`, judging certification; single transaction: entries ->
  `school_shortlisted` -> `submitted_to_foa` (all-participants) or `not_shortlisted`; round -> `finalised`; emits
  `school_round.shortlist_finalised` with per-entry outcomes; audit), family message consumer.
- **Routes / pages:** `/institution/competitions/[ref]/school-round` (overview: status, deadline, entries by category with pick
  and position controls, panel form, certify-judging checkbox with attestation text, finalise button with confirmation and a
  summary of who will be shortlisted). Optional sub-pages if the page grows: `.../school-round/panel`.
- **Messages namespaces:** `schoolRound`.
- **Size:** XL. Two state machines touched (school round new, entry extended), 4 tables, ~10 use cases, event-driven round
  opening, a single-transaction finalise with notifications to families, the outcomes query, a dense coordinator page with
  forms for panel/picks/positions/certification, seed, transition tables, authz matrix. Split.
- **Design uncertainty:** 3 for 89a (pick storage model; category key, F14; positions within or independent of the shortlist;
  round creation trigger: event consumer vs lazy on first view), 2 for 89b (owner comments define finalise precisely).
- **Risk flags:** K (family messages, guardians for minors), PD (panel names). Integrity: "Finalising is the only way the
  shortlist-finalised event is emitted".
- **Test plan:**
  - Seam 1 (89a): advance to SCHOOL_JUDGING (published rubrics seeded), `drain()` -> a round per confirmed institution
    registration, including one with zero entries; none for an unconfirmed registration; coordinator records a panel of 2;
    picks 5 `submitted` entries in a category, sixth refused (`shortlist_full`); `processing`/`rejected` entry refused
    (`not_submitted`); positions 1-3 set, a 4th refused when the setting is 3, duplicate position refused; coordinator of
    another institution refused on every use case; outcomes query returns picks/positions per registration. School round
    transition rows for (none) -> `open`.
  - Seam 1 (89b): finalise refused without panel, without conduct certification, without judging certification (each a
    typed error); finalise succeeds -> picked entries `submitted_to_foa` (history shows `school_shortlisted` in between),
    others `not_shortlisted` including never-submitted ones; families get the right message, guardians for minors, minors get
    nothing; audit row; event emitted once; finalise twice refused. "Only way" check: a test iterates over every registered
    use case and job handler in the school-round and entries modules, runs the full M2 scenario, and asserts the outbox holds
    `school_round.shortlist_finalised` rows only from `finaliseSchoolRound` (outbox row carries the producing use case name
    if #61's outbox supports it; otherwise the judge enforces with `grep -rn "shortlist_finalised" src/server` = 1 producer
    file). Transition tables: school round `open -> finalised`; entry rows from 2.1 for 89b. Authz: coordinator passes; another
    institution's coordinator, participant, competition manager fail on `finaliseSchoolRound`.
  - Seam 2: none required (91b covers shortlisting end to end). `tests/e2e/89-school-round.spec.ts` visits the round page as the
    seeded coordinator (open round with picks); axe.
  - axe: `/institution/competitions/[ref]/school-round` in open and finalised states.
- **Conflict hotspots:** H25 (owner), H22, H24 (consumer of status change), H27, H9, H33, H8, H6.
- **Split (XL):**
  - **89a** "School round module: opening, panel, positions and shortlist picks" (L). Deps: #88, #87, 85b, #75, #74, #70.
  - **89b** "Certify judging and finalise the school round" (M). Deps: 89a, #87, #69, #81.
- **Tournament:** 89a yes (uncertainty 3), 2 contenders: one `school_round_pick` table with flags (simplest-thing) vs separate
  shortlist and position tables behind a `SchoolRound` aggregate with invariant checks in one place (deep-module-first). 89b no
  (uncertainty 2, size M); K flag => 3-judge panel.

### #90 (ordinal 35): M2: Overdue, closed-on-behalf and reopened school rounds

- **Depends on:** explicit: #89 (native, body "next ticket"), "The coordinator is reminded before the deadline" (84b
  reminder registry), the scheduled flip pattern (#71) and the guard/blocked-flip mechanism (#88). Inferred hard: 89b, 84b,
  #88, #71, #69, #59. Soft: #92 (the reopen guard "no entry FOA-verified or later" is tested best with a real verification;
  without #92 the test seeds a `foa_verified` entry through a seed builder, allowed because seed builders are shared test
  infrastructure).
- **Blocks:** none natively. Inferred: #95 (FOA rounds start after FOA_JUDGING), M3 overall (FOA_JUDGING state).
- **AFK class:** A.
- **Human residue:** G5: reminder offsets for the shortlist deadline (proposed `[72h, 24h]`); whether a reopened round past
  the deadline returns to `overdue` (proposed yes); whether a `sent_back` entry blocks reopen like `foa_verified` (proposed
  yes, F15/2.1). G3: overdue notice and close-on-behalf notice copy. G2: DLT templates.
- **Ports / providers:** none new (JobQueue schedules, Notifications).
- **New tables / columns (proposed):** none new beyond 89a's columns (`closed_by`, `closed_at`, `closed_reason`,
  `reopened_at`) and the `competition_transition_block` table (#88). Reverting entries reads `entry_transition` to restore the
  pre-finalise status (85b history). Reminder definitions `school_round_shortlist_due` registered on H10.
- **Use cases (proposed):** system handler `markOverdueSchoolRounds` (at `shortlistSubmissionClosesAt`, scheduled per
  competition, reschedules on edit), `closeSchoolRoundOnBehalf({roundId, reason})` (manager; only `overdue`; applies saved
  picks; emits `school_round.closed_on_behalf`; families messaged as on finalise), `reopenSchoolRound({roundId, reason?})`
  (manager; only during SCHOOL_JUDGING; refused if any entry of the round has a verification decision; reverts entries; keeps
  picks; no messages), re-finalise path messages only changed outcomes (stores last messaged outcome per entry or diffs
  `entry_transition`); guard `noUnfinishedSchoolRounds` for SCHOOL_JUDGING -> FOA_JUDGING with automatic re-run when the last
  round finishes; individuals-only rule (F7).
- **Routes / pages:** `/admin/competitions/[code]/school-rounds` (list of rounds with status, institution, deadline; close on
  behalf with a required reason; reopen); coordinator round page gains an overdue banner (edit of 89's page, H25/H27).
- **Messages namespaces:** `adminSchoolRounds`, plus `schoolRoundOverdue` for the banner (avoids editing `schoolRound`).
- **Size:** L. Scheduled overdue job, two manager use cases with revert logic, guard + re-run, reminder registration, changed-
  outcome messaging, admin page, transition tables.
- **Design uncertainty:** 3. Revert source (history table vs stored snapshot on finalise); changed-outcome detection; lock
  order with verification (F15); behaviour of reopen past the deadline; individuals-only flip timing.
- **Risk flags:** none of the charter's list (integrity, concurrency).
- **Test plan:**
  - Seam 1: `clock.advance` to `shortlistSubmissionClosesAt - 72h`, `drain()` -> coordinator of the unfinished round reminded,
    finalised school not; at the deadline -> round `overdue`, coordinator told, nothing finalised (entries unchanged), FOA flip
    refused + manager told + block row; overdue round finalised by coordinator -> flip re-runs -> FOA_JUDGING when it was the
    last; close on behalf without reason refused; with reason -> saved picks applied, families messaged, event
    `school_round.closed_on_behalf` (no shortlist-finalised row), audit; no picks -> all `not_shortlisted`; reopen during
    SCHOOL_JUDGING -> entries back to pre-finalise statuses, picks kept, no messages; change one pick and re-finalise -> only
    the two changed families messaged; reopen refused after one entry is `foa_verified` (via #92 or seed builder) and after the
    competition is FOA_JUDGING; reopen of a closed-on-behalf round allowed. Transition tables: school round rows for overdue,
    closed_on_behalf, reopen; competition SCHOOL_JUDGING -> FOA_JUDGING guarded. Authz: competition manager passes close/
    reopen; coordinator, content manager, verifier fail.
  - Seam 2: none required. `tests/e2e/90-school-rounds-admin.spec.ts` visits the admin list with seeded overdue and finalised
    rounds; axe.
  - axe: `/admin/competitions/[code]/school-rounds`, the coordinator page with the overdue banner.
- **Conflict hotspots:** H25, H24, H10, H22, H9, H8, H27, H19.
- **Split:** none.
- **Tournament:** yes (uncertainty 3), 2 contenders: revert from `entry_transition` history (deep-module-first, reuses 85b's
  history) vs a `school_round_finalisation` snapshot row storing per-entry before/after (simplest-thing, explicit diff for
  changed-outcome messages).

### #91 (ordinal 36): M2: Shortlist-only submission scope

- **Depends on:** explicit: #89 (native, body "after that"), coordinator upload path (#87), entries (#85), "required
  declarations and consents" (#82 guardian consent, #83 code link / signed form), digital submission scope flag (#70). Inferred
  hard: 89b, #87, 85b, #70. Soft: #82/#83 (consent status display). 91b: 91a, G6, G7, #57's Seam 2 support (capture mailbox
  read route, seeded accounts), #77 (M1 journey patterns).
- **Blocks:** none natively. Inferred: M2 release (owns the milestone's Seam 2 journey).
- **AFK class:** A for 91a; B for 91b (journey cannot pass without G6 + G7, F9).
- **Human residue:** G3: declaration wording the coordinator confirms (originality, permission to submit, physical work kept by
  school/student). Counsel/FOA (G5): which consents are "required" for a shortlist-only entry (proposed: participation consent,
  already required at confirmation, plus the institution declaration; public-use consents stay optional and gate the gallery
  later). 91b: G6, G7; if the journey needs any new secret in `e2e.yml`, the owner merges that change to `main` first (avoid:
  authorize the phase control with a seeded staff session, not a token).
- **Ports / providers:** none new. 91b: Playwright, axe, capture mailbox (Seam 2).
- **New tables / columns (proposed):** `entry_declaration` (id, entry_id, declaration_key, text_version, declared_by_user_id,
  declared_at); entry created with `school_round_pick` row (shortlisted = true, position) so positions and limits reuse 89a;
  readiness rule "processed AND finalised" implemented as one function evaluated on both events (file `live`, round finalised).
  91b: preview-only route `src/app/api/preview/competitions/[code]/phase/route.ts` or a staff-only server action on a
  non-production admin page; seed scenario builder `seedM2Journey` (two competitions: `all_participants` and `shortlist_only`).
- **Use cases (proposed):** 91a: scope guard in `startEntryUpload` (school route + shortlist-only + before school round =>
  `submission_not_open`), `createShortlistedEntry({registrationNumber, title, description, position, declarations, upload})`
  (coordinator; only during SCHOOL_JUDGING with an `open`/`overdue` round; within shortlist size), `promoteShortlistOnlyEntries`
  (consumer on file live / round finalised), finalise variant: "not shortlisted" message per enrolled registration without an
  entry. 91b: `advanceCompetitionPhaseForPreview` (refuses unless `APP_ENV` in `preview`/`local`; staff only; audit).
- **Routes / pages:** `/institution/competitions/[ref]/school-round/entries/new` (create shortlisted entry with hi-res upload,
  position, declarations) linked from the round page; 91b none user-facing beyond the preview control.
- **Messages namespaces:** `shortlistEntries`; 91b none.
- **Size:** XL. Domain change across entries and school round (guard, creation path, dual-condition promotion,
  registration-level messages, transition rows) plus the milestone Seam 2 journey covering both scopes end to end, with a new
  preview phase control and a seed scenario. Split.
- **Design uncertainty:** 2 for 91a (owner comments define behaviour; F6 settles the model); 3 for 91b (how to move time on a
  preview; journey data isolation across reruns on a persistent preview DB).
- **Risk flags:** 91a K (declarations and consents of minors), PD. 91b A (a preview-only control must be unreachable in
  production; test with `APP_ENV=production` returns 404/forbidden and the route is absent from the production build if
  feasible).
- **Test plan:**
  - Seam 1 (91a): shortlist-only competition: participant and coordinator `startEntryUpload` during submission refused;
    individual-route participant in the same competition can submit (scope applies to the school route only); in SCHOOL_JUDGING
    coordinator creates 5 shortlisted entries in a category (codes assigned), sixth refused; entry stays `school_shortlisted`
    while processing; media fake failure keeps it `school_shortlisted`, re-upload -> live; finalise -> processed entries
    `submitted_to_foa`, an unprocessed one moves when its file goes live; families of students without entries get
    `registration.not_shortlisted` once each; no `not_shortlisted` entry rows exist. Transition rows: (none) ->
    `school_shortlisted`, `school_shortlisted` -> `submitted_to_foa` (shortlist-only). Authz: coordinator passes; other
    institution's coordinator, participant, guardian fail.
  - Seam 2 (91b): `tests/e2e/m2-submission-scopes.spec.ts`, two describe blocks. All-participants: seeded adult participant signs
    in via capture mailbox, uploads a small JPEG, waits (poll, max 90 s) for `submitted` and the Entry ID; seeded coordinator
    uploads for a student; staff advances the competition to SCHOOL_JUDGING through the preview control; coordinator records
    panel, picks, positions, certifies, finalises; participant sees the outcome message in the inbox. Shortlist-only:
    coordinator sees submission closed for students, advances to school judging, creates a shortlisted entry with upload and
    declarations, finalises; a not-shortlisted guardian message appears in the capture mailbox. axe (`expectRendersAccessibly`)
    on every page visited, desktop + mobile projects. Journey creates its own uniquely-coded competition per run (seed builder
    via the preview control, or `test.info().workerIndex` + run id) so reruns on the same `foa_pr_<n>` DB do not collide.
  - axe: `/institution/competitions/[ref]/school-round/entries/new` (91a); every journey page (91b).
- **Conflict hotspots:** H22, H23 (scope guard), H25 (finalise variant), H27, H9, H6; 91b: `tests/e2e/support/*` (#57),
  `playwright.config.ts` (read-only), seed entry point.
- **Split (XL):**
  - **91a** "Shortlist-only scope: coordinator-created shortlisted entries" (L). Deps: 89b, #87, 85b, #70 (#82/#83 for consent
    display).
  - **91b** "M2 Seam 2 journey for both submission scopes" (M). Deps: 91a, 89b, 87, 85b; residue G6, G7.
- **Tournament:** 91a yes by rule (K + L; uncertainty 2), 2 contenders scoped to the promotion mechanism: event-driven
  promotion on both triggers (simplest-thing) vs a single readiness projection recomputed by one function with an idempotent
  consumer (deep-module-first). 91b yes (uncertainty 3, A), 2 contenders: preview phase control (risk-first) vs phase-parked
  seed competitions with no runtime control (simplest-thing; judges check it truly covers "end to end").

### #92 (ordinal 37): M2: FOA verification of digital entries

- **Depends on:** explicit: school route "shortlisted entries after the school round is finalised" (#89), individual route
  "after the submission deadline" (85b + a scheduled job), "the coordinator or participant is told" (#69, #81), "a set
  deadline" (owner: setting, #62). Native (2, candidates): #89 + one of #85 / #60 / #78. Inferred hard: 89b, 85b, #59 (new
  role, `can()`), #60 (staff 2FA for the new role), #62 (`entries.resubmission_days`), #69, #81, #71 (submission deadline
  schedule), #63 (signed delivery to the verifier).
- **Blocks:** native 3 (candidates #93, #95 + one of #117 / #103 / #131). Inferred: #93 ("The track starts only after an
  entry is verified by FOA"), #95 (round entry source = verified entries), #117 ("entries to verify" queue), #131, #90 (reopen
  guard reads verification decisions).
- **AFK class:** A.
- **Human residue:** operational: which staff hold `foa_verifier`, their 2FA enrolment (not a ticket blocker). G5:
  resubmission days (owner default 7, confirm), preset send-back reasons (proposed: file unreadable, wrong work, missing
  declaration, other with text). G3: verified / sent-back message copy. G2: DLT templates.
- **Ports / providers:** none new (Files signed delivery, Notifications, JobQueue).
- **New tables / columns (proposed):** `entry_verification` (id, entry_id, decision enum `entry_verification_decision`
  (`verified`, `sent_back`), reason_code null, reason_text null, decided_by_user_id, decided_at, resubmission_due_at null);
  history kept (one row per decision); role `foa_verifier` (H30, F8); setting `entries.resubmission_days` (H7). Scheduled job
  `forwardIndividualEntries` at `submissionClosesAt` per competition (H24 schedule registry; reschedules on edit).
- **Use cases (proposed):** `listVerificationQueue({competition?, route?})` (entries `submitted_to_foa`, oldest first, both
  routes; shows derivatives only), `getEntryForVerification` (signed URLs to display derivative and the clean PDF/transcode;
  original download only if hardening allows, F10), `verifyEntry`, `sendBackEntry({reasonCode, reasonText})`
  (resubmission_due_at = now + setting), `resubmitEntry` (participant, guardian or coordinator; before
  `resubmission_due_at`; optional file replacement through the pending-replacement path; entry returns to `submitted_to_foa`
  only when the new file is live), system `forwardIndividualEntries`. Verification of a school-route entry locks its
  `school_round` row first (F15).
- **Routes / pages:** `/admin/verification` (queue with filters by competition and route), `/admin/verification/[entryCode]`
  (view work, verify, send back with reason); participant `/dashboard/entries/[code]` gains a sent-back panel with the reason,
  deadline and resubmit form (H26); coordinator submissions page shows sent-back entries with resubmit (H27).
- **Messages namespaces:** `adminVerification`, `entryResubmission`.
- **Size:** L. New staff role, queue + detail pages, two decision use cases, resubmission path through pending replacement,
  scheduled forwarding for individual entries, setting, three templates, file access rules for the verifier, seed,
  transition rows, authz matrix.
- **Design uncertainty:** 2. Owner comments fix states and deadline; open points: verifier access to originals (F10),
  what "corrected" means without a new file (metadata-only resubmission: proposed allowed), processing at the submission
  deadline for individual entries (proposed: forwarded as soon as it becomes `submitted`, since the upload was confirmed
  before the deadline).
- **Risk flags:** A (new staff role with 2FA, signed access to minors' work), K (minors' entries, guardian messages), PD.
- **Test plan:**
  - Seam 1: individual entry `submitted` -> `clock.set(submissionClosesAt)`, `drain()` -> `submitted_to_foa` with no school
    round; school-route entries arrive after 89b finalise; verifier queue lists both routes and excludes `processing`/
    `rejected`; `verifyEntry` -> `foa_verified`, participant (or guardian/coordinator) told, audit; `sendBackEntry` without
    reason refused; with reason -> `sent_back`, `resubmission_due_at = now + 7d` (setting changed to 3 -> 3d), told;
    `resubmitEntry` with a new file -> stays `sent_back` until live, then `submitted_to_foa`, back in the queue, history has
    both decisions; `clock.advance(8d)` -> resubmit refused, entry stays `sent_back`; verifying an already verified entry
    refused; after a verify, #90's reopen of that round refused (or covered in #90 if 92 lands first). Transition rows:
    `submitted -> submitted_to_foa` (individual), `submitted_to_foa -> foa_verified|sent_back`, `sent_back ->
    submitted_to_foa`. Authz: `foa_verifier` with 2FA passes; verifier without second factor refused (`second_factor_required`
    from #60); competition manager (hardening decides; proposed fail), coordinator, participant fail on decisions; another
    family refused on `resubmitEntry`.
  - Seam 2: none required. `tests/e2e/92-verification.spec.ts` as a seeded verifier (2FA seeded per #60's preview mechanism;
    runtime check) visits the queue and a detail page; seeded participant views a sent-back entry; axe.
  - axe: `/admin/verification`, `/admin/verification/[entryCode]`, the participant sent-back panel.
- **Conflict hotspots:** H30, H22, H23 (resubmit), H24 (deadline job), H26, H27, H31, H7, H8, H9, H19.
- **Split:** none (optional if hardening grades XL: 92a queue + decisions + individual forwarding; 92b resubmission).
- **Tournament:** yes by rule (A + K + L; uncertainty 2), 2 contenders: verification as a sub-module of Entries writing
  `entry_verification` (simplest-thing) vs a separate Verification module owning queue/decisions and calling Entries through
  its public interface (deep-module-first; #94 physical verification reuses the shape).

---

## 4. Milestone summary

### 4.1 Counts

| AFK class | Units | Count |
| --- | --- | --- |
| A | 84a, 84b, 85b, 86b, 87, 88, 89a, 89b, 90, 91a, 92 | 11 |
| B | 85a (G6), 86a (G6), 91b (G6 + G7 gate the journey) | 3 |
| C | none | 0 |

Per original ticket: A = #84, #87, #88, #89, #90, #92; B = #85, #86, #91 (their media/journey halves).

| Size (original ticket) | Tickets |
| --- | --- |
| M | #87 |
| L | #88, #90, #92 |
| XL (split) | #84 (84a L, 84b L), #85 (85a L, 85b L), #86 (86a L, 86b M), #89 (89a L, 89b M), #91 (91a L, 91b M) |

After splits: 14 work units. Sizes: M = 86b, 87, 89b, 91b; L = 84a, 84b, 85a, 85b, 86a, 88, 89a, 90, 91a, 92.

Design-uncertainty scores: 85a = 4; 84a, 84b, 85b, 86a, 86b, 88, 89a, 90, 91b = 3; 87, 89b, 91a, 92 = 2.

Risk flags: K (minors/safeguarding) 84a, 84b, 85a, 85b, 86a, 87, 89a, 89b, 91a, 92; A (auth/security) 85b, 86b (XSS), 87
(scoping), 91b (preview control), 92 (new role); C (CSP) 85b, 86a; E 84a (reads encrypted contacts); V (infra) 85a, 86a;
$ none. PD everywhere.

### 4.2 Unit table (scheduling input)

| Unit | Child title (proposed) | Size | U | Flags | Tournament | Hard deps (M0/M1 + M2) |
| --- | --- | --- | --- | --- | --- | --- |
| 85a | Image derivatives and metadata stripping in worker-media | L | 4 | K V | yes, 3-way | #61 #63 |
| 84a | Announcements to confirmed registrants | L | 3 | K E | yes | #59 #61 #69 #70 #75 #77 #78 #81 |
| 88 | (#88 itself) Published rubrics gate the school round | L | 3 | - | yes | #59 #69 #70 #71 (#74 #75) |
| 85b | Entries module and individual image submission | L | 3 | K A C | yes | 85a #59 #63 #65 #69 #71 #73 #78 #81 |
| 87 | (#87 itself) Coordinator submits for students and certifies conduct | M | 2 | K A | no (3 judges) | 85b #69 #74 #75 #77 #81 |
| 86a | Video entries: transcode, poster and limits | L | 3 | K C V | yes | 85a 85b |
| 86b | Essay entries and the single rich-text sanitiser | M | 3 | A | yes | 85b |
| 84b | Reminder schedules and the submission reminder | L | 3 | K | yes | 85b #61 #62 #69 #71 #81 |
| 89a | School round module: opening, panel, positions, shortlist picks | L | 3 | K | yes | 88 87 85b #70 #74 #75 |
| 89b | Certify judging and finalise the school round | M | 2 | K | no (3 judges) | 89a 87 #69 #81 |
| 92 | (#92 itself) FOA verification of digital entries | L | 2 | A K | yes | 89b 85b #59 #60 #62 #63 #69 #71 #81 |
| 91a | Shortlist-only scope: coordinator-created shortlisted entries | L | 2 | K | yes | 89b 87 85b #70 (#82 #83) |
| 90 | (#90 itself) Overdue, closed-on-behalf and reopened school rounds | L | 3 | - | yes | 89b 84b 88 #71 (92 soft) |
| 91b | M2 Seam 2 journey for both submission scopes | M | 3 | A | yes | 91a + G6 G7 |

Tournaments: 12 of 14 units (13 extra contender implementations: 85a 3-way, the rest 2-way). No tournament: 87, 89b (single
implementation, 3-judge panel because of K/A flags). Where a unit is "yes" only by the risk rule with uncertainty 2 (91a,
92), scope the contest to the contested interface and its core use case; the winner implements the rest.

### 4.3 Internal ordering (rolling waves)

```text
early (during M1, as soon as #63 + #61a merge):  85a                    [no M1 dependency; frees the critical path]
optional early (idle runner, after #57):          86b sanitiser module alone (S)
wave M2-1 (as M1 deps merge):  84a (after #69 #75 #77 #78 #81), 88 (after #71), 85b (after 85a #73 #78 #81)
wave M2-2 (after 85b):         87, 86a, 86b, 84b                        [merge order 87 -> 86a -> 86b; 84b any time]
wave M2-3:                     89a (after 87 + 88) -> 89b
wave M2-4 (after 89b):         91a, 92 in parallel (merge 91a first), then 90 (after 92 merged + 84b)
wave M2-5:                     91b (after 91a; G6 + G7 cleared)  -> M2 release PR factory/trunk -> main
```

Critical path inside M2: #63 -> 85a -> 85b -> 87 -> 89a -> 89b -> 91a -> 91b (8 serial units). Parallel branches: 88 must merge
before 89a; 84b before 90; 92 before 90 (soft). Peak M2 concurrency: 4 (wave M2-2), well under W = 6.

Serialization rules (charter decision 4 applied to M2):

- 87, 86a, 86b share H22/H23/H26: build in parallel, merge one at a time in the order 87 -> 86a -> 86b (87 is on the critical
  path); each later PR rebases and regenerates migrations in the merge queue.
- 84a and 88 both append templates and event-map rows (H9) and admin nav lines (H19): parallel; merge queue unions.
- 85a and M0's #63b/#66b/#68 all edit `docker/workers.yml` (H28): serialize merges; 86a after 85a for `docker/worker-media/`.
- 89b, 91a, 90 all edit the school-round module (H25): serialize 89b -> 91a -> 90.
- 91a and 92 both add entry transitions (H22): merge 91a, then rebase 92.
- 88 and 90 both edit the competition guard registry (H24): 88 first (true by dependency).
- 92 edits the role registry (H30): if an M3 ticket (#94) or #59 follow-up is in flight, serialize.
- Enum rule F2: 85b, 89a, 88 own their enums' full value sets; any later PR that adds an enum value is sent back by the judge.

### 4.4 Human residue roll-up (children labelled `ready-for-human` + `factory:needs-human`, deduped)

Blocking an acceptance criterion or the milestone journey (raise at M2 start; ideally together with #63's residue in M0):

- R2-1 (G6) VPS: build and run `worker-media` (HEIC decode + ffmpeg) with the CPU/memory/pids limits from 85a/86a; confirm the
  shared non-prod `worker` and ClamAV serve every live `foa_pr_<n>` and staging. Blocks: 91b journey (uploads must reach
  `submitted`), any manual preview check of 85a/86a. Owner. `wizard` script: `git -C /srv/foa pull` + `docker compose -f
  /srv/foa/docker/workers.yml up -d --build --wait worker-media` + `docker stats --no-stream` check + one EICAR and one HEIC
  smoke upload against staging.
- R2-2 (G7) Non-production R2 bucket, scoped token, CORS allowing `PUT` from `https://friends-of-animals-*-bitacu1.vercel.app`
  and `https://shipped-it.dev`. Blocks 91b. Dedupe with #63's R0-5.
- R2-3 Only if 91b's design needs a new secret or env var in `e2e.yml`: owner merges that `e2e.yml` change to `main` first
  (e2e runs from `main`). Preferred design avoids it.

Non-blocking (tickets merge with defaults; batch per milestone):

- G5 FOA defaults (one child issue listing setting keys and defaults): per-discipline file types and sizes (85b), video size
  and length (86a), essay word limit and document formats (86b, F10), reminder offsets for submission and shortlist deadlines
  (84b, 90), resubmission days (92, default 7 from the owner), positions within the shortlist (89), reopen blocked by
  `sent_back` and reopen-past-deadline status (90), required consents for shortlist-only entries (91a), contact-only
  recipients get email/SMS only (F13), announcement treated as a service message (84a).
- G3 copy sign-off (one child issue): announcement template, reminder templates, entry received/rejected/failed messages,
  conduct certification statement (87), judging-certification attestation (89), shortlist-only declarations (91a), judging
  framework text (88), shortlisted/not-shortlisted family messages (89b, 91a), overdue/close-on-behalf notices (90),
  verified/sent-back messages and reason presets (92).
- G2 DLT templates for every new SMS-capable message above (append to the existing DLT child).
- G1 retention rows for: entry fields (title, description, statement), originals, derivatives, typed essay text, declarations,
  panel member names, verification reasons, announcement content.
- Operational (not tickets): assign `foa_verifier` to staff and enrol 2FA; competition managers enter real rubrics; FOA
  supplies its school-conduct guidelines document link.

### 4.5 Cross-milestone dependencies

Needed from M0: #57 (harness, seed, capture mailbox), #59 (roles, `can()`, audit), #60 (staff 2FA for `foa_verifier`), #61
(outbox, pg-boss schedules, in-process drain, workers compose file), #62 (settings: reminder offsets, resubmission days), #63
(Files: presign, scan gate, signed delivery), #64 (consent to messages), #65 (CSP source registry). Needed from M1: #69
(Notifications), #70 (competition, disciplines, categories, scope flags, shortlist size/positions), #71 (status machine and
scheduling pattern), #73 (Codes generator), #74 (coordinators), #75 (institution registration, enrolled students, guardian
contacts), #77 (confirmed institution registrations), #78 (confirmed individual registrations, participant dashboard), #81
(guardians, guardian routing), #82/#83 (consent status for 91a).

M2 feeds later milestones:

| M2 unit | Later tickets that need it | What |
| --- | --- | --- |
| 84b | #93 (dispatch reminder), #125 (event reminders) | reminder registry (H10) |
| 85a | #94 (condition photos reuse derivatives), #96 (judges view display copies), #100 (worker-media hosts PDF rendering), #102 (stamping in worker-media), #103 (gallery copies), #129 (adoption photos) | MediaProcessor port, derivative registry (H21), worker-media service |
| 85b | #92, #96, #117, #131 | Entries module, `entry_status`, history |
| 86a / 86b | #96 (play videos, read essays; F10 blind leak), #111 (sanitiser profiles, F4) | transcodes, sanitiser |
| 88 | #95, #96, #97, #98 | rubrics, guard/blocked-flip mechanism (also reusable for #99 results) |
| 89a / 89b | #100 (outcomes query, owner), #119 (school winner milestone) | school-round outcomes |
| 90 | #95 (FOA_JUDGING state) | SCHOOL_JUDGING -> FOA_JUDGING flip |
| 92 | #93, #94 (`foa_verifier` role), #95, #117, #131 | `foa_verified` entries, verifier role |

Cross-milestone hazards to carry forward: F2 enum rule for M3 entry/physical/judging statuses; F10 document metadata vs blind
judging (#96); F12 VPS CPU contention grows with #100 (PDF rendering) and #102 (stamping) in the same worker-media; F11 CSP
`media-src`/`img-src` for judge viewing (#96) and gallery (#103); F13 contact-only recipients recur in #93, #99, #100, #120.
