# issues-M6-M8.md: ticket analysis for M6 (community, volunteers, events, campaigns), M7 (NGO directory, adoption), M8 (auctions, surveys, reports)

Source: `open-M6.json`, `open-M7.json`, `open-M8.json`, `spec-55.md`, `raw-open.json`, repo at `3da7347` (read-only).
Analysed 2026-11-19. 17 tickets: #119–#135 = ordinals 64–80 (ordinal n = issue #(55+n); verified: #56 = ordinal 1, the
closed CI ticket; #57 = ordinal 2). None of these 17 bodies cite another ticket by ordinal or number: every dependency below
is inferred from the body text, the spec's module list and the M0–M5 ticket bodies. Native GitHub dependencies:
`gh api -X GET search/issues -f q='repo:siddhartxts/friends-of-animals is:issue is:open is:blocked'` returned
`total_count 0` (same for `is:blocking`) on 2026-11-19. The Orchestrator re-runs both queries at plan time. All 17 are
sub-issues of #55, labelled `ready-for-agent`, with 0 comments.

## 0. Shared facts, conventions and codes used below

### 0.1 Verified repo facts that change how these tickets are built
| # | Fact | Evidence | Consequence |
|---|---|---|---|
| F1 | No tables exist yet. `src/server/db/schema/index.ts` is `export {}`; only migration is `drizzle/0000_enable_pg_trgm.sql`. | file contents | Every module named below is created by M0–M5 tickets first. Runtime check at claim: `ls src/server` and `src/server/db/schema/` on `factory/trunk`. |
| F2 | drizzle's pg migrator runs ALL pending migrations in ONE transaction (`node_modules/drizzle-orm/pg-core/dialect.js`, `migrate()` → `session.transaction`). | grep | `ALTER TYPE … ADD VALUE` followed by any use of the new value (partial-index predicate, default, CHECK, data backfill) in the same migrate run fails with "unsafe use of new value". Fresh PGlite test DBs and new preview DBs always run every migration in one go. Applies to #124, #131, #133 (enum extensions). Rule: never reference a value added in the same migration set; add values in a migration that nothing else in the same PR's DDL uses, or define the full enum up front. |
| F3 | PGlite 0.5.16 ships `cube` and `earthdistance` contrib extensions. Probe: `new PGlite({extensions:{cube, earthdistance}})`, `CREATE EXTENSION cube; CREATE EXTENSION earthdistance;`, `earth_distance(ll_to_earth(19.076,72.8777), ll_to_earth(18.5204,73.8567))` = 120.3 km (Mumbai–Pune). | probe script in scratchpad `probe/ed.mjs` | #128's "If PGlite can't load it" branch is moot. `src/test/db.ts` must add `cube` + `earthdistance` to `extensions`. |
| F4 | `src/lib/security-headers.ts:37` sends `Permissions-Policy: camera=(), microphone=(), geolocation=()`; `security-headers.test.ts:14` asserts it. | grep | #128's "browser's location" search is blocked by the current header. #128 must allow `geolocation=(self)` (preferably only on `/ngos`) and update the test. |
| F5 | No Lighthouse runner exists (`grep -ril lighthouse` hits only page copy in `src/app/donate` and `src/app/impact`). e2e has Playwright + axe (`tests/e2e/smoke.spec.ts`, helper `expectRendersAccessibly`). | grep | Lighthouse ACs on #125, #127, #128, #129, #131 need a runner added earlier (first Lighthouse AC is in #70). Runtime check at claim: `grep -ril lighthouse .github package.json tests`. If still absent, the runner does NOT build one ad hoc: the Orchestrator files/uses one harness ticket and blocks the Lighthouse AC on it. |
| F6 | `src/lib/routes.ts` comment: "Spec modules that aren't built yet (gallery, transparency, login, events, volunteer, adopt, NGOs, auctions) stay out." Labels live in `messages/en-IN/nav.json` under `nav.links.<id>`; header, footer and sitemap read `ROUTES`. | file | Public pages proposed: `/events`, `/volunteer`, `/ngos`, `/adopt`, `/auctions`. Each adds a `ROUTES` entry + nav label (hotspot H4). |
| F7 | `src/i18n/messages.ts`: one namespace per file, "each agent edits its own"; a new namespace must be imported and added to `NAMESPACES` + `messages` or `messages.test.ts` fails. `oxlint react/jsx-no-literals` forbids literal UI strings. | file, `code-ui.md` | Each ticket below owns its own namespace (named per ticket) so parallel tickets never edit the same JSON file. |
| F8 | `cacheComponents: true`; public pages must stay prerendered; clock reads through `cachedNow()`; initial JS ≤ 170 KB gzipped per prerendered page (`scripts/check-build.ts`); Vitest runs `environment: "node"`. | `code-ui.md` §7 | Live bid refresh (#132), geolocation (#128), filters (#129) are small client islands inside Suspense. |
| F9 | Encrypted column type first appears in #75 (ord 20: "Dates of birth, phones and addresses are stored encrypted"); #81 reuses it; #108 for PAN. Data inventory is a "note" until #114 (ord 59) makes it code with a test that fails on any un-inventoried personal-data column. | `raw-open.json` | Every M6–M8 ticket with personal data depends on #75 (type) and #114 (inventory registry + test). |
| F10 | `vercel-build` = `pnpm db:migrate && next build && pnpm check:build`. Preview DBs `foa_pr_<n>` are created `TEMPLATE foa_seed` on the VPS Postgres 18. | `package.json`, README | A PR preview build runs the real migrations on the production-like cluster: it is the agent-visible check that `CREATE EXTENSION earthdistance` works there (#128). |

### 0.2 Route and naming conventions (runtime-checked)
- Signed-in user pages live under `/dashboard/...` (participant dashboard from #78); staff pages under `/admin/...` (role admin
  from #59). README line 146 says route groups under `src/app/` are "still to come": at claim time the runner runs
  `ls src/app` on `factory/trunk` and places pages in the route groups that exist (e.g. `(account)`, `(staff)`), keeping the
  URL paths below.
- Every signed-in page sets `robots: { index: false }`. Tokenised public pages (`/unsubscribe/[token]`, `/surveys/[token]`)
  are also noindex and never echo personal data.
- Status enums are named `<entity>_status` (spec "Schema shape"). Non-status kinds that later tickets extend (timeline entry
  kind) use `text` + a zod registry, not a Postgres enum, to dodge F2.
- Use-case names below are proposals (`as(actor).<useCase>`); the hardening agent may rename.
- "Person" (subject of timeline, milestones, invitations): under-13s have a participant profile and no login (#81), so
  subject keys reference the participant profile when one exists. Adult members with no participant profile need a subject
  too: resolving this is #119's main design question (see #119).

### 0.3 File-conflict hotspot codes (referenced per ticket)
| Code | File(s) | Owner ticket | Merge rule |
|---|---|---|---|
| H1 | `src/server/db/schema/index.ts` barrel | F1 | Append one re-export line; merge queue resolves. |
| H2 | `drizzle/*.sql`, `drizzle/meta/*` | charter decision 9 | Regenerated by merge queue. Hand-written SQL (extensions, partial indexes with `NULLS NOT DISTINCT`, GiST, triggers) must be `drizzle-kit generate --custom` files the queue preserves and re-numbers, never regenerates. |
| H3 | `src/i18n/messages.ts` | F7 | Append import + `NAMESPACES` entry + spread; merge queue resolves. |
| H4 | `src/lib/routes.ts`, `messages/en-IN/nav.json` | F6 | Append entry/label; merge queue resolves; sitemap test re-run. |
| H5 | Data inventory registry (#114) | #114 | Append entries; inventory test is the arbiter. Path at runtime: `grep -rl "retention" src/server`. |
| H6 | Seed builders + preview seed command (`scripts/seed.ts` per README:288, builders from #57) | #57 | Each ticket adds its own builder file; one-line registration in the seed entry point. |
| H7 | Settings registry/typed accessor (#62) | #62 | Append keys with defaults; description marks "confirm with FOA/counsel". |
| H8 | `can()` policy action table (#59) | #59 | Append actions; authorization tests prove each. |
| H9 | Outbox event-type union + worker consumer registry (#61) + event→template mapping seed (#69) | #61/#69 | Append; templates seeded per event. |
| H10 | pg-boss named schedule registry (#61/#84) | #84 | Append schedule names. |
| H11 | `src/test/db.ts` (`createTestDb` extensions) | harness | Serialize: harness file. Only #128. |
| H12 | `src/lib/security-headers.ts` + test (shared with #65 CSP, #118 Umami) | #65 | Serialize with any open CSP/header ticket. Only #128. |
| H13 | Certificates module: schema, type enum, PDF template registry, `/verify` page (#100/#101) | #100 | Serialize. #124. |
| H14 | Payments module (batch items, webhook dispatcher) + ledger categories/accounts (#77/#105) | #77/#105 | Serialize. #133a. |
| H15 | Physical artwork status enum + transition table (#93/#94) | #94 | Serialize. #131, #133b. |
| H16 | Consent purposes enum/registry + withdrawal-consumer registry (#64/#82) | #64/#82 | Append purpose + consumer; F2 applies if purposes are an enum. #123, #126, #130, #131. |
| H17 | Competitions schema + admin form (#70/#72) | #70 | Serialize. #133a (proceeds policy column). |
| H18 | `.github/workflows/ci.yml` | #56 | Serialize. #132 (Postgres service for the concurrency test). |
| H19 | Dashboard and admin navigation/shell (menus listing sections) | #59/#78 | Append one link per ticket. |
| H20 | Community timeline-kind registry + milestone writer (#119) | #119 | Append kind; no enum (0.2). #120, #121, #122, #124, #125c. |
| H21 | Files derivative purposes / `worker-media` job registry (#85/#102) | #85 | Append purpose. #129, #130, #131. |

### 0.4 Global human residue (deduped once, appended to by many tickets)
| Code | Residue | Where it goes |
|---|---|---|
| G1 | Counsel confirms the retention period of every new inventory field (defaults marked "confirm with counsel"). | Append rows to the single residue child created under #114. |
| G2 | DLT templates for every new SMS-capable message (SMS stays off until DLT approval; email + in-app cover). | Append to the DLT residue child (from #58/#69, #18). |
| G3 | Legal/safeguarding copy sign-off batch (consent documents, disclaimers, terms). | One `ready-for-human` child per milestone, listing the documents. |
| G4 | Razorpay live mode/KYC (#18). | Existing provider residue; #133a appends "auction payments". |
| G5 | FOA leadership product decisions that have spec defaults (spec "Open questions → For FOA"). | One child per milestone listing setting keys and their defaults. |

Design rule that removes residue: tokenised links (#126 unsubscribe, #134 surveys) use random 32-byte tokens stored as
SHA-256 hashes in the database, not HMAC signatures, so no new production secret has to be provisioned.

### 0.5 Field legend
AFK: **A** fully agent-doable against fakes; **B** agent core + human residue; **C** mostly human. Size: S ≤ 1 table, ≤ 3
use cases, no public page; M 2–3 tables or one state machine, ≤ 6 use cases; L several tables, 2+ actors, state machine(s),
jobs or public pages; XL more than one L's worth, split into 2–4 children. Design uncertainty 1–5 (≥ 3 = real
architectural choice). Tournament per charter rule 5: yes when uncertainty ≥ 3, or risk-flagged (auth/security,
money/ledger, minors/safeguarding, encryption, CSP) and size ≥ L.

---

## M6: community, engagement, clubs, ambassadors, volunteers, events, campaigns

### #119 (ordinal 64) M6: Community membership and engagement timeline
- **Depends on:** hard (inferred): #99 (results-published event; body: "Results publishing feeds the first three"), #81
  (guardian–child links for "a guardian sees the timeline of each linked child"), #61 (outbox consumers, in-process drain),
  #59 (`can()`, audit, member/guardian/community manager roles), #114 (inventory registry), #57 (harness, seed). Via #99:
  #89 (school positions → school winner), #97 (finalist outcomes), #100 (certificate eligibility query to reuse).
- **AFK:** A.
- **Human residue:** G1 only (member profile fields). G5: whether 13–17-year-olds join on their own login or need a
  guardian action (default: teens join themselves; under-13 joined by the guardian on the child's behalf).
- **Ports/providers:** none new. Uses outbox/jobs, clock.
- **New tables/columns:** `community_member` (id, subject ref, user_id, display_name, about ≤ 280 chars, joined_at, left_at,
  status enum `community_member_status`: active, left); `engagement_milestone` (id, subject ref, kind enum
  `engagement_milestone_kind`: participant, school_winner, foa_finalist, community_member, volunteer, ambassador,
  competition_id null, achieved_at, source_key) with unique (subject, kind, competition_id) `NULLS NOT DISTINCT` (hand-written
  SQL, H2) for replay idempotency; `timeline_entry` (id, subject ref, kind text from registry, occurred_at, ref_type, ref_id,
  label params jsonb without personal data, source_key unique).
- **Events:** consumes `results.published`; emits `community.member_joined`, `engagement.milestone_recorded`.
- **Routes:** `/dashboard/community` (join, profile), `/dashboard/timeline`, `/dashboard/children/[childId]/timeline`
  (guardian), `/admin/community/members` (community manager list; creates the `/admin/community` layout + menu that
  #120–#122, #126 append to).
- **Messages namespaces:** `community` (new).
- **Use cases:** `joinCommunity`, `updateMemberProfile`, `leaveCommunity`, `getTimeline(subject)`, `listMembers`,
  `recordMilestone` + `recordTimelineEntry` (internal, exported as the module's write seam for #120–#125),
  `rebuildMilestonesFromPublishedResults` (idempotent backfill).
- **Size:** L: three tables, an event consumer that reads results/school-round/judging data, a guardian read path, and the
  write seam five later tickets call.
- **Design uncertainty:** 3. (a) Subject identity for adult members without a participant profile (always create a profile vs
  a `subject_user_id`/`subject_profile_id` pair with an exactly-one CHECK). (b) Timeline as a projection table vs a union
  query over modules (projection chosen above; replay safety through `source_key`). (c) The pilot ran before M6 (spec: pilot
  after M5), so its `results.published` events were already consumed: the backfill use case is required or the pilot cohort
  has no milestones; the body does not say so.
- **Risk flags:** minors/safeguarding (minors' timelines, guardian access), personal data.
- **Test plan:** Seam 1: join → membership + community_member milestone + audit row; publish results for a seeded
  competition → school_winner/foa_finalist/participant milestones on the right subjects only; replay the same outbox event →
  no duplicates; run the backfill twice → identical counts; timeline ordering by occurred_at with ties broken by id; guardian
  reads linked child (allowed), unlinked child (refused); member reads another member (refused); community manager lists
  members (allowed), member (refused). Seam 2: a spec visiting `/dashboard/community`, `/dashboard/timeline` as a seeded
  member and the child timeline as a seeded guardian, with `expectRendersAccessibly`. axe: all four pages.
- **Hotspots:** H1, H2 (NULLS NOT DISTINCT index), H3, H5, H6, H8, H9 (results.published consumer list shared with #100,
  #120, #134), H19, H20 (creates it).
- **Split:** no.
- **Tournament:** yes, 2 entrants: (a) projection table + `profile-always` subject; (b) dual-key subject + deep `Timeline`
  module with a typed writer registry. Judges weight extension cost for #120–#125.

### #120 (ordinal 65) M6: Post-competition invitations
- **Depends on:** hard (inferred): #119 (accept adds milestone; join), #99 (results-published trigger), #69 (templates,
  delivery), #64 (consent to messages), #82 (guardian's communications consent per child), #81 (guardian routing), #61.
  Inferred blockers so accept actions never point at unbuilt features: #121 (start a club), #123 (volunteer), #125a (events
  and campaigns listing). Claim #120 only after those merge.
- **AFK:** B.
- **Human residue:** G5: spec open question "whether post-competition invitations ship with the pilot" → setting
  `community.invitations.enabled` default `false`; FOA decides and flips it. FOA approves invitation template wording (G3).
  Running the pilot backfill on production is an owner action after release: `ready-for-human` child with the exact admin
  path and expected counts. G2 if SMS is ever enabled for invitations.
- **Ports/providers:** email, in-app (through Notifications). No new port.
- **New tables/columns:** `community_invitation` (id, subject ref, recipient_user_id, trigger enum
  `community_invitation_trigger`: results_published, pilot_backfill, competition_id null, consent_basis_id, sent_at,
  outbox_event_id) with unique (subject, trigger, competition_id) `NULLS NOT DISTINCT` (one per participant per competition;
  one per person for the backfill); `community_invitation_action` (invitation_id, action enum
  `community_invitation_action_kind`: join_community, volunteer, start_club, join_campaigns, attend_events, taken_at,
  unique (invitation_id, action)).
- **Events:** consumes `results.published`; emits `community.invitation_sent`, `community.invitation_accepted`.
- **Routes:** `/invitations/[invitationId]` (signed-in, recipient only; no token auth), `/admin/community/invitations`
  (stats + backfill trigger with step-up).
- **Messages namespaces:** `invitations` (new).
- **Use cases:** `sendResultsInvitations` (consumer), `runPilotInvitationBackfill` (community manager or super admin,
  step-up, audit with counts), `getInvitation`, `takeInvitationAction`.
- **Size:** M: two tables, one consumer, one backfill, one accept page.
- **Design uncertainty:** 2. Consent rule must be explicit: adult → own consent to messages (#64); minor → guardian's
  communications consent for that child (#82) and delivery to the guardian. Volunteer action hidden for subjects under the
  volunteer minimum age; start_club hidden unless the subject is linked to a verified institution.
- **Risk flags:** minors/safeguarding (contacting families of minors), personal data (consent gating).
- **Test plan:** Seam 1: publish results with 3 adults, 2 minors (one guardian with two children), 1 adult without consent →
  exactly 5 invitations, minors' to the guardian, none to the non-consenting adult; backfill run twice → second run sends 0;
  accept join_community → community_member milestone; accept volunteer → action row + redirect target; flag off → nothing
  sent; authorization: recipient opens invitation (allowed), other member (refused); backfill by member (refused).
  Seam 2: `/invitations/[id]` for a seeded invitation. axe: both pages.
- **Hotspots:** H3, H6, H7, H8, H9 (second `results.published` consumer), H20, `/admin/community` menu (H19).
- **Split:** no.
- **Tournament:** no.

### #121 (ordinal 66) M6: Clubs
- **Depends on:** hard (inferred): #119 (timeline entries for join/leave), #73 (verified institution), #74 (teachers =
  institution coordinators/admins), #75 (students linked to an institution through enrolment), #81 (teen logins), #62
  (setting), #69 (decision messages), #59.
- **AFK:** A.
- **Human residue:** G5 confirm "one club per institution" default (spec already states it). G3 optional: FOA safeguarding
  view on club member visibility (default below is strict).
- **Ports/providers:** none new.
- **New tables/columns:** `club` (id, institution_id, name, applicant_user_id, applicant_kind: student | teacher, status enum
  `club_status`: applied, approved, declined, withdrawn, suspended, closed, decided_by, decided_at, decision_reason);
  `club_membership` (id, club_id, member subject ref, joined_at, left_at, status enum `club_membership_status`: active,
  left; partial unique (club_id, subject) WHERE status = 'active').
- **Settings:** `clubs.maxPerInstitution` default 1.
- **Events:** emits `club.applied`, `club.approved`, `club.declined`, `club.member_joined`, `club.member_left`.
- **Routes:** `/clubs/apply` (signed-in), `/dashboard/clubs`, `/dashboard/clubs/[clubId]`, `/admin/community/clubs`,
  `/admin/community/clubs/[clubId]` (members + activity feed).
- **Messages namespaces:** `clubs` (new).
- **Use cases:** `applyForClub`, `withdrawClubApplication`, `approveClub`, `declineClub`, `suspendClub`, `closeClub`,
  `joinClub`, `leaveClub`, `listClubMembers`, `getClubActivity`.
- **Size:** M: two tables, one state machine, one setting, timeline writes.
- **Design uncertainty:** 2. Approval must lock the institution row (`SELECT … FOR UPDATE`) before counting approved clubs, or
  two approvals race past the cap. Default visibility: members see the club name and member count, not other members' names;
  only the community manager (and the institution's coordinators) see the member list.
- **Risk flags:** minors/safeguarding (club members are mostly minors), personal data.
- **Test plan:** Seam 1: application for an unverified institution refused; approval when the institution already has 1
  approved club refused, allowed after setting = 2; full `club_status` transition table (every allowed and forbidden pair);
  join/leave each writes a timeline entry; member of another institution cannot join; authorization: community manager
  approves (allowed), coordinator approves (refused), student applies (allowed), under-13 profile without login (no path).
  Seam 2: pages render for seeded student and community manager. axe: all five pages.
- **Hotspots:** H1, H3, H6, H7, H8, H9, H19, H20.
- **Split:** no.
- **Tournament:** no.

### #122 (ordinal 67) M6: Ambassadors
- **Depends on:** hard (inferred): #119 (membership age, milestones, ambassador milestone write), #62 (thresholds), #69
  (decline message "tells the applicant"), #59. Soft: #124 writes the volunteer milestone the default rule reads; no code
  dependency.
- **AFK:** B.
- **Human residue:** G5: FOA sets the thresholds (spec open question "ambassador and volunteer thresholds") and the minimum
  age. Proposed setting keys, each marked "confirm with FOA": `ambassador.minMembershipDays`, `ambassador.minAgeYears`,
  `ambassador.requiredMilestonesAny` (proposed default `["foa_finalist","volunteer"]`).
- **Ports/providers:** none new.
- **New tables/columns:** `ambassador_application` (id, user_id, motivation ≤ 1000 chars, eligibility_snapshot jsonb,
  status enum `ambassador_application_status`: submitted, approved, declined, withdrawn, decided_by, decided_at,
  decline_reason; partial unique (user_id) WHERE status = 'submitted').
- **Events:** emits `ambassador.applied`, `ambassador.approved` (→ milestone + timeline), `ambassador.declined` (→ message).
- **Routes:** `/dashboard/ambassador` (eligibility explanation + apply), `/admin/community/ambassadors`,
  `/admin/community/ambassadors/[applicationId]`.
- **Messages namespaces:** `ambassadors` (new).
- **Use cases:** `getAmbassadorEligibility`, `applyForAmbassador`, `withdrawAmbassadorApplication`, `approveAmbassador`,
  `declineAmbassador` (reason required).
- **Size:** M: one table, a cross-module eligibility evaluator, review screens, messages.
- **Design uncertainty:** 2. Eligibility is a pure function of (settings, membership, milestones, DOB) → unit-testable table.
  Re-check eligibility at approval and store both snapshots.
- **Risk flags:** personal data (motivation text, eligibility snapshot); minors if minAge < 18.
- **Test plan:** Seam 1: eligibility truth table (each threshold failing alone); ineligible apply refused with the failing
  rule named; threshold changed in settings changes the outcome without a deploy; approve → ambassador milestone + timeline
  entry; decline without reason refused, with reason → message in applicant's inbox; full transition table; authorization:
  community manager decides (allowed), staff admin (refused unless policy grants), member decides own (refused).
  Seam 2: `/dashboard/ambassador` for eligible and ineligible seeded members. axe: all three pages.
- **Hotspots:** H1, H3, H6, H7, H8, H9, H19, H20.
- **Split:** no.
- **Tournament:** no.

### #123 (ordinal 68) M6: Volunteer applications
- **Depends on:** hard (inferred): #59 (volunteer role grant, policy), #60 (step-up: #60 requires step-up before granting
  roles), #62 (age settings), #64 (versioned consent documents for the declaration and code of conduct), #81 (guardian links,
  teen logins, guardian approval channel), #75 (encrypted DOB type), #69, #114. Not #119 (can run in parallel with it).
- **AFK:** B.
- **Human residue:** G3: FOA's Designated Safeguarding Lead and counsel approve the text of the volunteer safeguarding
  declaration and the volunteer code of conduct (published as consent documents; the agent seeds placeholder versions
  marked "To be confirmed" that the production build rejects). Counsel open question "background checks for judges and
  volunteers": a `ready-for-human` child (police verification is a process, not code). G5: confirm min age 14 and guardian
  approval under 18 (spec defaults). G1, G2.
- **Ports/providers:** none new (Notifications for guardian request and outcome).
- **New tables/columns:** `volunteer_application` (id, applicant_user_id, applicant subject ref, date_of_birth encrypted
  when not already on the profile, interests enum array `volunteer_interest[]`: technology, content, outreach,
  competition_management, social_media, community_building, availability jsonb (zod: weekdays × morning/afternoon/evening +
  note ≤ 280), status enum `volunteer_application_status`: awaiting_guardian, guardian_declined, submitted, approved,
  declined, withdrawn, guardian_user_id, guardian_decided_at, safeguarding_consent_id, conduct_consent_id, decided_by,
  decided_at, decline_reason; partial unique (applicant_user_id) WHERE status IN ('awaiting_guardian','submitted')).
  Consent purposes `volunteer_safeguarding_declaration`, `volunteer_code_of_conduct` (H16).
- **Settings:** `volunteers.minAgeYears` = 14, `volunteers.guardianApprovalBelowAgeYears` = 18.
- **Events:** emits `volunteer.application_submitted`, `volunteer.guardian_approval_requested`,
  `volunteer.application_approved` (role granted), `volunteer.application_declined`.
- **Routes:** `/volunteer` (public info + apply CTA; `ROUTES` entry, H4), `/volunteer/apply`, `/dashboard/volunteer`,
  `/dashboard/children/[childId]/volunteer` (guardian approve/decline), `/admin/volunteers/applications`,
  `/admin/volunteers/applications/[applicationId]`.
- **Messages namespaces:** `volunteer` (new).
- **Use cases:** `applyToVolunteer`, `decideAsGuardian`, `withdrawVolunteerApplication`, `approveVolunteer` (step-up;
  requires both current-version consents; grants global `volunteer` role through #59's grant path with audit),
  `declineVolunteer`, `listVolunteerApplications`.
- **Size:** L: guardian branch, age rules on encrypted DOB, two consent documents, a role grant from a non-role-admin use
  case, public page, four actors (applicant, guardian, community manager, super admin).
- **Design uncertainty:** 2. The role grant must go through the same audited grant function as #59 with the community
  manager as actor and `can('volunteer.approve')` deciding, not the super-admin-only role screen rule.
- **Risk flags:** minors/safeguarding (vetting people who work near children), auth/security (role grant outside the role
  admin screen, step-up), personal data (DOB encrypted).
- **Test plan:** Seam 1: DOB giving age 13 years 364 days on the fake clock's today refused; exactly 14 accepted; 14–17 →
  awaiting_guardian, guardian approves → submitted, declines → guardian_declined; approval without either consent refused;
  approval with stale document version refused; approval grants `volunteer` and writes an audit row; approval without
  recent step-up refused; full transition table; authorization: community manager approves (allowed), member (refused),
  another child's guardian decides (refused). Seam 2: `/volunteer` public page, apply form as a seeded adult, guardian
  approval page. axe: all six pages; Lighthouse on `/volunteer` (spec-wide rule for new public pages).
- **Hotspots:** H1, H3, H4, H5, H6, H7, H8, H9, H16, H19.
- **Split:** no.
- **Tournament:** yes (rule: minors/safeguarding + auth, size L), 2 entrants: (a) application-centric state machine with
  guardian sub-state; (b) separate `guardian_approval` request entity reusable by #125/#130. Uncertainty itself is 2.

### #124 (ordinal 69) M6: Volunteer tasks, hours and certificates
- **Depends on:** hard (inferred): #123 (volunteer role), #119 (timeline + volunteer milestone), #100 (certificate pipeline:
  numbering `FOA-C-{YY}-{10}`, QR, PDF renderer port, `/verify` page), #61, #69. Soft: #101 (revoke/reissue path so
  volunteer certificates can be revoked).
- **AFK:** B.
- **Human residue:** G3: FOA approves the volunteer-service certificate wording and layout (an official document carrying the
  logo). Otherwise none.
- **Ports/providers:** PDF renderer (fake at port), clock.
- **New tables/columns:** `volunteer_task` (id, title, description, interest `volunteer_interest`, due_at, status enum
  `volunteer_task_status`: draft, open, assigned, in_progress, done, cancelled, created_by); `volunteer_task_assignment`
  (task_id, volunteer_user_id, assigned_at, unassigned_at); `volunteer_hours_entry` (id, task_id, volunteer_user_id, minutes
  int CHECK > 0 AND ≤ 1440, worked_on date, note, status enum `volunteer_hours_status`: submitted, approved, rejected,
  decided_by, decided_at, reject_reason). Certificates (H13): `volunteer_service` certificate type and a non-registration
  subject (nullable registration reference + volunteer subject + `approved_minutes_snapshot`). If #100's type is a Postgres
  enum, F2 applies: add the value in a migration that no DDL in the same PR references.
- **Events:** emits `volunteer.hours_approved` (first one → volunteer milestone, every one → timeline entry),
  `volunteer.certificate_requested` → certificate issuing job.
- **Routes:** `/dashboard/volunteer/tasks`, `/dashboard/volunteer/hours`, `/dashboard/volunteer/certificate`,
  `/admin/volunteers/tasks`, `/admin/volunteers/tasks/new`, `/admin/volunteers/tasks/[taskId]`, `/admin/volunteers/hours`
  (approval queue). Reuses the public verification page from #100.
- **Messages namespaces:** `volunteerWork` (new).
- **Use cases:** `createTask`, `publishTask`, `assignTask`, `unassignTask`, `startTask`, `completeTask`, `cancelTask`,
  `logHours`, `approveHours`, `rejectHours`, `getApprovedTotal`, `requestVolunteerCertificate`.
- **Size:** L: three tables, two state machines, a cross-module certificate extension, timeline/milestone writes.
- **Design uncertainty:** 3. Generalising the certificate subject (registration-bound in #100) without breaking
  registration certificates and the verify page; certificate policy for growing totals (one certificate per request with a
  snapshot, older ones stay valid, vs reissue that revokes the old number).
- **Risk flags:** personal data; minors (14–17 volunteers' certificates and hours).
- **Test plan:** Seam 1: full `volunteer_task_status` table; submitted and rejected hours excluded from total and
  certificate; certificate job twice → one certificate; QR resolves to `/verify` showing valid and no personal data beyond
  the certificate; first approval → volunteer milestone once, later approvals → no second milestone; existing registration
  certificate tests still pass unchanged; authorization: community manager approves hours (allowed), volunteer approves own
  (refused), volunteer logs on unassigned task (refused). Seam 2: volunteer pages and the verify page for a seeded volunteer
  certificate. axe: all pages.
- **Hotspots:** H1, H2 (enum value), H3, H6, H8, H9, H13 (serialize with any open certificate ticket), H19, H20.
- **Split:** no.
- **Tournament:** yes, 2 entrants: (a) polymorphic certificate subject in the existing table; (b) separate
  `volunteer_certificate` table sharing the number sequence and a verification read model that unions both.

### #125 (ordinal 70) M6: Events: publish, register, waitlist and check-in
- **Depends on:** hard (inferred): #119 (attendance timeline entry), #69 (change notices), #84 (named reminder schedules,
  timing in settings), #111 (the one rich-text sanitiser; spec puts "events and campaigns" in the CMS module; #111 says "events
  come in later tickets"), #81 (notices about minors go to guardians), #59, #61, #114. Soft: #63 (cover image).
- **AFK:** B.
- **Human residue:** G3: FOA safeguarding rule for in-person events with minors (e.g. guardian attendance, photo consent at
  venues) as policy text shown on registration. G2 for SMS reminders. G1.
- **Ports/providers:** none new (Notifications, jobs, clock).
- **New tables/columns:** `event` (id, kind enum `event_kind`: event, campaign, slug unique, title, summary, description
  sanitised, starts_at, ends_at, venue_name, address, city, pin_code, online_url, capacity int null (null = unlimited),
  audience enum `event_audience`: members, signed_in, registration_opens_at, registration_closes_at, waitlist_enabled,
  status enum `event_status`: draft, published, cancelled, completed, created_by, published_at);
  `event_registration` (id, event_id, attendee subject ref, registered_by_user_id (guardian for a child), status enum
  `event_registration_status`: registered, waitlisted, cancelled, checked_in, no_show, waitlisted_at, promoted_at,
  checked_in_at, checked_in_by; partial unique (event_id, attendee) WHERE status <> 'cancelled').
- **Settings:** `events.reminderOffsetsMinutes` (proposed `[1440, 120]`, confirm with FOA).
- **Events (outbox):** `event.published`, `event.changed`, `event.cancelled`, `event.registration_created`,
  `event.waitlist_promoted`, `event.attendee_checked_in`; schedule `event.reminder` (H10).
- **Routes:** public `/events`, `/events/[slug]` (prerendered, revalidated on publish/change; `ROUTES` + nav, H4);
  `/dashboard/events`; `/admin/events`, `/admin/events/new`, `/admin/events/[eventId]`,
  `/admin/events/[eventId]/registrations`, `/admin/events/[eventId]/check-in`.
- **Messages namespaces:** `events` (new; shared by #125a/b/c, which are strictly sequential).
- **Size:** XL: public pages with Lighthouse, two state machines, capacity/waitlist concurrency, reminders and change notices,
  check-in, timeline, seed. Split below.
- **Design uncertainty:** 3. Who may register (members only vs any signed-in user; under-13s through a guardian); campaign vs
  event modelling; waitlist promotion under concurrency (lock the event row; promote in the cancelling transaction).
- **Risk flags:** minors/safeguarding (attendee lists and in-person events with children), personal data.
- **Split (3 children, serial a → b → c):**
  - **#125a Events and campaigns: publish and public pages** (M). `event` table, `event_status` table test, admin
    create/edit/publish/cancel/complete, public list and detail, Lighthouse ≥ 90, seed. Deps: #111, #59, #114 (address
    inventory if a person's address is ever stored; venue addresses are not personal data). Tournament: no.
  - **#125b Registration, waitlist, auto-promotion, change notices, reminders** (L). `event_registration`, registration table
    test, capacity enforcement, promotion in order, `event.reminder` named schedule checked at run time, change notices on
    edit/cancel, guardian routing. Deps: #125a, #69, #84, #81. Tournament: yes (uncertainty 3 + minors, size L), 2 entrants:
    (a) row lock `FOR UPDATE` on `event` + position by `waitlisted_at, id`; (b) counter column with conditional UPDATE +
    position computed at read.
  - **#125c Check-in, attendance timeline, M6 Seam 2 journey** (M). Check-in screen, `checked_in`/`no_show` transitions
    (no_show set by a job at `ends_at`), timeline entry. Deps: #125b, #119. Tournament: no.
- **Test plan:** Seam 1: capacity 2, three registrations → third waitlisted; cancel one → waitlisted promoted, promotion
  message sent; two waitlisted, two cancellations → promoted in waitlist order; advance fake clock to 24 h before → drain →
  reminders only to registered (not cancelled/waitlisted); event time changed → change notice to all active registrants and
  reminders rescheduled; check-in → timeline `event_attended`; both transition tables; minor registered by guardian →
  notices to guardian; authorization: content manager and community manager publish (allowed), member (refused); member
  checks in others (refused). Seam 2 (owned by #125c, the M6 milestone journey): seeded member registers for a seeded full
  event → sees "waitlisted"; staff cancels a seeded registration → member sees "registered"; staff checks member in →
  member's `/dashboard/timeline` shows the attendance. axe on every page visited; Lighthouse ≥ 90 on `/events` and
  `/events/[slug]`.
- **Hotspots:** H1, H3, H4, H5, H6, H7, H8, H9, H10, H19, H20 (#125c).
- **Tournament:** #125b only (see split).

### #126 (ordinal 71) M6: Campaign messages to consented segments
- **Depends on:** hard (inferred): #64 (consent to messages + withdrawal event), #82 (guardian communications consent per
  child), #81 (guardian routing), #69 (templates, channels, inbox), #61 (outbox, batched jobs), #119 (segment by engagement
  milestone; the body's example list includes it), #59. Segment-by-competition/city data from #70/#75/#78 is transitive.
- **AFK:** B.
- **Human residue:** Email deliverability for bulk sends on the real SES account: production access, sending quota,
  DKIM/SPF/DMARC on the sending domain, bounce/complaint handling (FOA paperwork #18 → appended to that residue). G3: FOA
  approves the campaign footer and unsubscribe copy; counsel confirms DPDP basis for outreach to guardians. Promotional SMS
  needs a separate DLT promotional template and DND scrubbing: campaigns stay email + in-app (`campaigns.smsEnabled` =
  false); enabling SMS is a G2 child.
- **Ports/providers:** email port extended with custom headers (`List-Unsubscribe`, `List-Unsubscribe-Post:
  List-Unsubscribe=One-Click`, RFC 8058). Runtime check: whether the SES adapter (#57) can set custom headers
  (SESv2 `Content.Simple.Headers`); if not, send raw MIME. Capture adapter must record headers so tests assert them.
- **New tables/columns:** `audience_segment` (id, name, definition jsonb validated by zod: `roles[]`, `cities[]`,
  `competitionIds[]`, `milestones[]`; AND across fields, OR within; created_by); `campaign_message` (id, segment_id,
  template_id, subject/body snapshot, channels, status enum `campaign_message_status`: draft, sending, sent, cancelled,
  previewed_recipient_count, sent_count, skipped_no_consent_count, created_by, sent_at); `campaign_delivery` (campaign_id,
  recipient_user_id, about_subject ref null, consent_basis_id, outbox_event_id, status, unique (campaign_id,
  recipient_user_id)); `unsubscribe_token` (token_hash unique, recipient_user_id, consent_basis_id, campaign_id, used_at).
- **Events:** emits `campaign.send_requested` (worker expands deliveries in batches), `campaign.delivery_skipped`;
  consumes `consent.withdrawn` (drops queued deliveries).
- **Routes:** `/admin/community/campaigns`, `/admin/community/campaigns/new`, `/admin/community/campaigns/[campaignId]`,
  `/admin/community/segments`, `/admin/community/segments/[segmentId]`; public `/unsubscribe/[token]` (GET confirm page,
  POST withdraw; noindex; shows a masked address only) and route handler `POST /api/unsubscribe/[token]` (one-click).
- **Messages namespaces:** `campaigns` (new).
- **Use cases:** `createSegment`, `previewSegmentCount`, `draftCampaign`, `sendCampaign` (audit with counts, no personal
  data), `cancelCampaign`, `unsubscribe(token)`.
- **Size:** L: four tables, segment DSL, guardian substitution with dedupe, consent re-check at delivery, header extension,
  public tokenised endpoint.
- **Design uncertainty:** 3. Segment DSL shape; guardian dedupe (a guardian of two children in the segment gets one
  message); which consent an unsubscribe withdraws (the `consent_basis_id` that authorised that delivery); consent evaluated
  at preview, at expansion and again at delivery.
- **Risk flags:** personal data (DPDP consent), minors (messages about minors), auth/security (unauthenticated token
  endpoint, one-click POST without CSRF token by RFC design, token entropy and hashing).
- **Test plan:** Seam 1: segment never contains a person without current consent (property test over seeded mixes);
  consent withdrawn between `sendCampaign` and drain → skipped and counted; unsubscribe via token → consent withdrawn,
  withdrawal outbox event, later sends exclude the person; reused token → idempotent; unknown token → generic page, no
  enumeration; minor in segment → delivery to guardian, guardian with two children → one delivery; every email in the
  capture mailbox carries both List-Unsubscribe headers and a body link; audit row has counts and no addresses; template
  without `{unsubscribeUrl}` refused; authorization: community manager sends (allowed), content manager (refused unless
  policy grants), member (refused). Seam 2: `/unsubscribe/[token]` with a seeded token on the preview. axe: all six pages.
- **Hotspots:** H1, H3, H6, H8, H9, H16 (withdrawal consumer), email port + capture adapter (#57 files: serialize with any
  open notifications ticket), H19.
- **Split:** no.
- **Tournament:** yes, 2 entrants: (a) segment as stored SQL-builder over a recipients view; (b) segment evaluated in a deep
  `Audience` module returning `(recipient, subject, consent_basis)` triples reused by #134.

---

## M7: NGO directory and adoption

### #127 (ordinal 72) M7: NGO directory listings and verification
- **Depends on:** hard (inferred): #59 (organisation scope type; "Each role is scoped either globally or to one institution,
  competition or organisation"), #60 (staff gate), #63 (private files for documents), #75 (encrypted columns for phones and
  addresses), #69 (outcome messages), #114. Pattern reuse: #73 (verify/reject/suspend with reason).
- **AFK:** B.
- **Human residue:** G5: FOA's verification checklist (which documents prove an NGO, shelter or rescuer is genuine, e.g.
  registration certificate, AWBI recognition, ID for individuals) as a staff-facing checklist text. G3/counsel: publishing
  individual rescuers' and foster caregivers' contact details (default: public contact only with the owner's explicit
  per-field choice; home address never public, only city and pin code). G1.
- **Ports/providers:** storage + scanner (Files), Notifications.
- **New tables/columns:** `directory_listing` (id, slug unique, type enum `directory_listing_type`: ngo,
  rescue_organisation, shelter, independent_rescuer, foster_caregiver, name, description sanitised, services enum array
  `directory_service[]` (proposed: rescue, shelter, veterinary_care, ambulance, adoption, fostering, feeding,
  sterilisation, education; confirm with FOA), address encrypted, city, state, pin_code, contact_phone encrypted,
  contact_email, website, public_contact_fields text[], status enum `directory_listing_status`: pending_verification,
  verified, rejected, suspended, withdrawn, status_reason, status_changed_by, status_changed_at, owner_user_id);
  `directory_listing_document` (listing_id, file_asset_id, kind enum `directory_document_kind`).
- **Events:** emits `directory.listing_submitted`, `directory.listing_verified` (grants `organisation_representative`
  scoped to the listing), `directory.listing_rejected`, `directory.listing_suspended`.
- **Routes:** public `/ngos/[slug]` (verified only; Lighthouse); `/ngos/register` (signed-in); `/dashboard/organisation`,
  `/dashboard/organisation/edit`; `/admin/directory`, `/admin/directory/[listingId]`. The `/ngos` index is owned by #128 so
  no page is built twice.
- **Messages namespaces:** `directory` (new; #128 extends it serially).
- **Use cases:** `registerListing`, `uploadListingDocument`, `verifyListing`, `rejectListing`, `suspendListing`,
  `reinstateListing`, `updateListing` (organisation representative, own listing only), `getPublicListing`,
  `listListingsForReview`.
- **Size:** L: two tables, a state machine with reasons, a scoped role grant, private documents, encrypted fields, a public
  page with Lighthouse.
- **Design uncertainty:** 2. Decide whether edits to a verified listing go live at once (audited) or name/type/document
  changes return it to review; record the choice in the transition table.
- **Risk flags:** auth/security (scoped role grant on approval; scope-mismatch tests), encryption (address/phone), personal
  data (individual rescuers), files (documents staff-only).
- **Test plan:** Seam 1: pending/rejected/suspended listings absent from every public read; verify/reject/suspend without
  reason refused, with reason → audit row; representative of listing A edits listing B → refused; document signed URL:
  staff admin allowed, owner and other members refused (body: "visible only to staff"); transition table; public read model
  never exposes the encrypted address or non-public contact fields; authorization: staff admin verifies (allowed), community
  manager (refused). Seam 2: register as a seeded member, staff verifies, public page renders. axe: all six pages;
  Lighthouse ≥ 90 on `/ngos/[slug]`.
- **Hotspots:** H1, H3, H4, H5, H6, H8, H9, H19.
- **Split:** no.
- **Tournament:** yes (rule: auth + encryption, size L), 2 entrants: (a) single `directory_listing` aggregate; (b)
  `organisation` entity (reusable scope target) + `directory_listing` as its public projection. Uncertainty itself is 2.

### #128 (ordinal 73) M7: Directory search by service and distance
- **Depends on:** hard (inferred): #127.
- **AFK:** B.
- **Human residue:** Dataset licence: India Post's "All India Pincode Directory" on data.gov.in (Government Open Data
  Licence – India, attribution required) is the expected source; the owner confirms licence and attribution text for
  `/credits` (G3). If the runner cannot download it (network or API-key gate), a `ready-for-human` child with a `wizard`
  script: download CSV → run `pnpm tsx scripts/import-pincodes.ts <csv>` against staging/production. Extension availability
  on production Postgres 18: verified by the PR preview build (F10); no human step unless that build fails.
- **Ports/providers:** none new. Browser Geolocation API (client island; coordinates rounded to 3 decimals ≈ 110 m, never
  stored or logged).
- **New tables/columns:** migration (custom SQL, H2): `CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS
  earthdistance;` (both trusted extensions since PG 13, so the migration role needs no superuser; preview build confirms);
  `pincode_location` (pin_code char(6) PK, latitude double precision, longitude double precision, district, state, source,
  source_version, imported_at) + GiST index on `ll_to_earth(latitude, longitude)`; GIN index on
  `directory_listing.services`. Listing location = its pin code's centroid (join at query time; no stored coordinates, which
  also keeps individual rescuers' homes imprecise).
- **Settings:** `directory.radiusOptionsKm` (proposed `[5, 10, 25, 50]`), `directory.defaultRadiusKm` (10).
- **Routes:** public `/ngos` (search form + results; shell prerendered, results inside Suspense keyed on searchParams
  `service`, `pin`, `lat`, `lng`, `radius`; `ROUTES` + nav, H4; Lighthouse).
- **Messages namespaces:** `directory` (extends #127's file; serial).
- **Use cases:** `searchDirectory({service?, pin? | lat,lng, radiusKm})` (public actor), `resolvePincode`.
- **Size:** M: one table, one extension migration, one query, one public page, one import script with a fixture.
- **Design uncertainty:** 2. Query shape: `earth_box(ll_to_earth(:lat,:lng), :r) @> ll_to_earth(p.latitude,p.longitude)` to
  use the index, then `earth_distance(...) <= :r ORDER BY earth_distance, listing.id`.
- **Risk flags:** infra (database extension), personal data (visitor location), security headers (F4: Permissions-Policy).
- **Test plan:** Seam 1 (on PGlite with `cube` + `earthdistance`, F3): only verified listings within radius, nearest first;
  pin search ≡ coordinate search at that pin's centroid (same ids, same order); ordering equals a hand-computed fixture using
  earthdistance's sphere radius 6378168 m (state the radius in the fixture; haversine with a different radius drifts);
  service filter; unknown pin → typed error, not empty results; suspended listing disappears. Import script test: fixture CSV
  with duplicate post offices per pin → one centroid row; rows with `NA` or out-of-India coordinates (lat 6–37.1, lng
  68–97.5) dropped; re-run idempotent. Header test: `geolocation=(self)` on `/ngos` only, `geolocation=()` elsewhere.
  Seam 2: search a seeded pin on the preview → seeded verified listings in order. axe on `/ngos` (empty, results, error
  states); Lighthouse ≥ 90.
- **Hotspots:** H2 (custom extension migration), H4, H7, H11 (`src/test/db.ts`: add `cube`, `earthdistance`), H12
  (`src/lib/security-headers.ts` + test), `/credits` page content (attribution).
- **Split:** no.
- **Tournament:** no.

### #129 (ordinal 74) M7: Adoption listings
- **Depends on:** hard (inferred): #127 (only verified directory listings create), #63 + #85 (Files derivatives via
  `worker-media`: derived copies, metadata stripping), #111 (sanitiser for conditions/notes rich text), #59. Not #128:
  run in parallel; "location" filter = state, city, pin code (a distance filter is a backlog item, not this ticket).
- **AFK:** A.
- **Human residue:** none ticket-specific. The disclaimer sentence is given in the body; counsel review folds into G3.
- **Ports/providers:** storage, scanner, media processor (fakes at port).
- **New tables/columns:** `adoption_listing` (id, directory_listing_id, slug unique, name, species enum `adoption_species`:
  dog, cat, rabbit, bird, other, sex enum `animal_sex`: female, male, unknown, age_estimate_months int, size enum
  `animal_size`: small, medium, large, breed, colour, sterilised bool, vaccination_notes, health_notes, conditions
  sanitised, pin_code, city, state, status enum `adoption_listing_status`: draft, published, on_hold, adopted, withdrawn,
  published_at, closed_at, created_by); `adoption_listing_photo` (id, adoption_listing_id, file_asset_id (private
  original), position, alt_text). Derivative purpose `adoption_photo` (H21) → public derived copies only.
- **Events:** emits `adoption.listing_published`, `adoption.listing_closed`; consumes `directory.listing_suspended` (public
  read model hides that organisation's adoption listings; no status change needed if the read filters on directory status).
- **Routes:** public `/adopt`, `/adopt/[slug]` (Lighthouse; `ROUTES` + nav, H4; `src/app/adopt/layout.tsx` renders the
  FOA-facilitates disclaimer so every adoption page carries it); `/dashboard/organisation/adoptions`,
  `/dashboard/organisation/adoptions/new`, `/dashboard/organisation/adoptions/[listingId]`.
- **Messages namespaces:** `adoption` (new).
- **Use cases:** `createAdoptionListing`, `updateAdoptionListing`, `addListingPhoto`, `publishAdoptionListing`,
  `holdAdoptionListing`, `withdrawAdoptionListing`, `browseAdoptableAnimals(filters)`, `getAdoptableAnimal`.
- **Size:** L: two tables, a state machine, the photo derivative pipeline, filters, two public pages with Lighthouse, an
  owner dashboard.
- **Design uncertainty:** 2.
- **Risk flags:** files (originals never public), personal data low (animal data; the contact shown is the organisation's).
- **Test plan:** Seam 1: unverified or suspended directory listing creates → refused; public read models expose only
  derived-copy keys (assert no original key, mirroring #103's test); filter fixture (species × age band × city) returns the
  hand-listed ids; suspending the directory listing hides its animals; transition table; authorization: representative of
  the owning listing (allowed), another representative (refused), member (refused). Unit: adoption layout element tree
  contains the disclaimer. Seam 2: `/adopt` filters and `/adopt/[slug]` for seeded animals, each page asserting the
  disclaimer text; extend the original-asset crawl (#103) to `/adopt`. axe: all five pages; Lighthouse ≥ 90 on public pages.
- **Hotspots:** H1, H3, H4, H6, H8, H9, H19, H21.
- **Split:** no.
- **Tournament:** no.

### #130 (ordinal 75) M7: Adoption applications and coordinator workflow
- **Depends on:** hard (inferred): #129, #127 (listing owner contact), #69 (messages at each step), #64 (versioned consent
  document for success-story publication; H16), #59 (adoption coordinator role), #75 (encrypted applicant phone/address),
  #81 (adult check), #114. Soft: #112 (if success stories reuse CMS stories).
- **AFK:** B.
- **Human residue:** G3/counsel: notice and consent text for sharing the applicant's contact details with the listing
  organisation at the contact step, and the success-story consent document. G5: FOA staffs the adoption coordinator role and
  confirms adopters must be adults (proposed setting `adoption.minAdopterAgeYears` = 18, confirm with FOA). G1.
- **Ports/providers:** Notifications; Files (optional story photo, derived copy only).
- **New tables/columns:** `adoption_application` (id, adoption_listing_id, applicant_user_id, answers jsonb (zod: home type,
  other animals, experience, availability), phone encrypted, address encrypted, sharing_consent_id, status enum
  `adoption_application_status`: submitted, under_review, in_contact, adopted, not_matched, declined, withdrawn,
  listing_closed, coordinator_user_id, outcome_reason, decided_at; partial unique (adoption_listing_id, applicant_user_id)
  WHERE status IN ('submitted','under_review','in_contact')); `adoption_story` (id, application_id unique,
  adoption_listing_id, text sanitised, photo_file_asset_id null, consent_id, status enum `adoption_story_status`: draft,
  published, withdrawn, published_at).
- **Events:** emits `adoption.application_submitted`, `adoption.application_status_changed` (applicant + owner messages),
  `adoption.adopted` (closes listing; other open applications → listing_closed with a message); consumes
  `consent.withdrawn` (story → withdrawn).
- **Routes:** `/adopt/[slug]/apply` (signed-in), `/dashboard/adoptions`, `/dashboard/adoptions/[applicationId]`,
  `/dashboard/organisation/adoptions/[listingId]/applications` (owner sees an applicant's contact only from in_contact on),
  `/admin/adoptions`, `/admin/adoptions/[applicationId]`, public `/adopt/stories` (published stories; Lighthouse per
  spec-wide rule).
- **Messages namespaces:** `adoptionApplications` (new).
- **Use cases:** `applyToAdopt`, `withdrawApplication`, `startReview`, `putInContact` (records the share in the audit log),
  `recordOutcome` (adopted | not_matched | declined, reason), `submitSuccessStory`, `publishSuccessStory` (requires current
  consent), `getMyApplications`.
- **Size:** L: two tables, a state machine, three actors, third-party data sharing, consent-gated publication.
- **Design uncertainty:** 3. Data shared with the listing organisation and when; success-story placement (own read model vs a
  CMS story draft from #112); auto-closing sibling applications.
- **Risk flags:** personal data (applicant address/phone shared with a third party), encryption, consent.
- **Test plan:** Seam 1: applicant sees own status at each step; coordinator moves submitted → under_review → in_contact →
  adopted; adopted → listing status adopted and every other open application → listing_closed with messages to those
  applicants; story publish without consent refused, consent withdrawn → story unpublished; owner sees applicant contact
  only after in_contact; applicant and owner each get one message per step (capture adapters); under-18 applicant refused;
  transition table; authorization: adoption coordinator (allowed), representative moves status (refused), another
  applicant reads the application (refused). Seam 2 (the M7 milestone journey): search `/ngos` by a seeded pin → open a
  seeded verified listing → `/adopt` → apply as a seeded adult → coordinator records adopted → listing shows closed and
  disappears from `/adopt`. axe on every page visited.
- **Hotspots:** H1, H3, H5, H6, H8, H9, H16, H19, H21 (story photo).
- **Split:** no.
- **Tournament:** yes (uncertainty 3; encryption + personal data, size L), 2 entrants: (a) coordinator-centric workflow with
  owner read-only; (b) three-party workflow where the owner confirms the outcome.

---

## M8: auctions, feedback surveys, reports and social metrics

Spec gate: "M8: auctions (after the pilot's physical artwork is verified)". This is a product gate, not a code dependency:
#131 adds setting `auctions.enabled` (default false); FOA turns it on (G5).

### #131 (ordinal 76) M8: Auction lots from consented artwork
- **Depends on:** hard (inferred): #94 (physical artwork statuses verified/on exhibition/retained, discrepancy, return request;
  body of #94: "Auction states come in M8"), #82 (auction-of-artwork consent purpose + withdrawal event; public-credit
  resolver), #83 (accepted signed paper forms count as verified guardian consent), #70 (competition `auction permission`
  scope flag), #97 + #99 (award/outcome shown on the lot), #102/#103 (stamped derived image), #73 (code generator for
  `LOT-{YY}-{5}`), #61 (open/close schedules), #59, #60.
- **AFK:** B.
- **Human residue:** G5 (FOA leadership, spec open question "auctioning minors' work and the creator share"): whether minors'
  work is auctioned at all; `auctions.enabled` flip after pilot artwork is verified. G3/counsel: copyright in minors' work,
  auction consent document wording (must state the creator share), whether auction consent alone covers showing the artwork
  image publicly on lot pages (default here: auction consent required; public-display consent not additionally required;
  counsel confirms).
- **Ports/providers:** jobs, clock; Stamping/derived images (existing).
- **New tables/columns:** `auction_lot` (id, lot_code unique, physical_artwork_id, entry_id, story sanitised, award_label,
  base_price_paise bigint, reserve_price_paise bigint CHECK ≥ base, currency char(3) 'INR', opens_at, closes_at,
  artwork_status_before_listing (`physical_artwork_status`), status enum `auction_lot_status`, cancelled_reason, created_by;
  partial unique (physical_artwork_id) WHERE status IN active states). Define the full `auction_lot_status` enum now (draft,
  scheduled, open, closed, awaiting_payment, sold, unsold, relisted, cancelled) with #132/#133 transitions forbidden in the
  table until they land, so later tickets add no enum values (F2). Add `auction_listed`, `auctioned` to
  `physical_artwork_status` (H15; F2: no DDL in this PR may reference them).
- **Settings:** `auctions.enabled` (false).
- **Events:** emits `auction.lot_created`, `auction.lot_opened`, `auction.lot_closed`, `auction.lot_cancelled`; schedules
  `auction.lot.open`, `auction.lot.close` (close handler re-reads `closes_at`: #132 extends it); consumes
  `consent.withdrawn` (purpose auction → cancel every lot not sold, restore artwork status).
- **Routes:** public `/auctions`, `/auctions/[lotCode]` (open + upcoming lots; Lighthouse; `ROUTES` + nav, H4);
  `/admin/auctions`, `/admin/auctions/lots/new` (from an eligible artwork), `/admin/auctions/lots/[lotId]`.
- **Messages namespaces:** `auctions` (new; #132 and #133 extend it serially).
- **Use cases:** `listEligibleArtwork`, `createLot`, `scheduleLot`, `cancelLot`, `openLot`/`closeLot` (job actors),
  `browseLots`, `getLot`.
- **Size:** L: cross-module eligibility (artwork custody, consent, competition flag, return requests), a state machine,
  artwork status coupling with restore, consent-withdrawal consumer, public pages.
- **Design uncertainty:** 3. Eligibility must also exclude artwork with an open discrepancy or a family return request (#94)
  and competitions without auction permission (#70), neither named in the body. Credit for minors: first name + initial
  regardless of opt-ins; school/city only with the guardian's opt-in (confirm).
- **Risk flags:** minors/safeguarding (sale of minors' work, credit cap), money (prices as bigint paise), consent.
- **Test plan:** Seam 1: create refused for each ineligible case (no auction consent; unverified guardian consent; status
  received; open discrepancy; return requested; competition without auction permission); minor credit never longer than
  first name + initial (property test over seeded names); withdraw auction consent → scheduled/open lot cancelled, artwork
  back to its pre-listing status (each of verified, on_exhibition, retained); close with no bids → unsold → status restored;
  lot code format/alphabet; public pages never expose original asset keys; full transition table; authorization: auction
  manager (allowed), competition manager (refused), member (refused). Seam 2: `/auctions` and `/auctions/[lotCode]` for
  seeded lots; extend the original-asset crawl to auction pages. axe: all five pages; Lighthouse ≥ 90 on public pages.
- **Hotspots:** H1, H2 (enum values), H3, H4, H6, H7, H8, H9, H10, H15 (serialize with #133b), H16, H19, H21.
- **Split:** no.
- **Tournament:** yes, 2 entrants: (a) lot as owner of artwork custody state (artwork status set via #94's module API);
  (b) artwork module owns all custody transitions and the lot only requests them.

### #132 (ordinal 77) M8: Bidding with outbid alerts and anti-sniping
- **Depends on:** hard (inferred): #131, #81 (minor detection: guardian links, DOB), #75 (encrypted DOB/phone for bidder
  profile), #69 (outbid message), #62 (increment, anti-sniping window), #61 (close schedule), #114.
- **AFK:** B.
- **Human residue:** G3/counsel: auction terms of sale (a bid is binding; reserve not disclosed; FOA's right to cancel) shown
  before the first bid. G5: minimum increment and anti-sniping window defaults.
- **Ports/providers:** none new.
- **New tables/columns:** `auction_bid` (id, lot_id, bidder_user_id, amount_paise bigint, placed_at, unique (lot_id,
  amount_paise)); `auction_lot` columns: current_bid_paise, current_bidder_user_id, bid_count, original_closes_at,
  extension_count, version int; `bidder_profile` (user_id PK, full_name, date_of_birth encrypted, phone encrypted,
  terms_accepted_version, declared_at).
- **Settings:** `auctions.minIncrementPaise`, `auctions.antiSnipingWindowMinutes` (a bid within the window moves
  `closes_at` to placed_at + window, per body "extends the closing time by the configured window"),
  `auctions.pollIntervalSeconds` (5).
- **Events:** emits `auction.bid_placed`, `auction.outbid` (to the previous high bidder, not on a self-raise),
  `auction.lot_extended`; extends #131's cancellation path to message bidders.
- **Routes:** `/auctions/[lotCode]` (bid form island, signed-in); `GET /api/auctions/[lotCode]/state` (no-store JSON:
  current bid, bid count, closes_at, bidder pseudonyms "Bidder 1…n" per lot; no names); `/dashboard/bids`,
  `/dashboard/bidder-profile`.
- **Messages namespaces:** `auctions` (extends).
- **Use cases:** `saveBidderProfile`, `placeBid`, `getLotState`, `listMyBids`.
- **Size:** L: concurrency-correct bidding, anti-sniping with rescheduling, live refresh, adult gating, personal data.
- **Design uncertainty:** 4. PGlite is a single in-process connection, so `Promise.all` of two bids serialises and a race test
  passes vacuously. Correctness must come from the design (row lock `FOR UPDATE`, or compare-and-swap on `version`, or
  `unique (lot_id, amount_paise)` + serializable retry) and be proven on real Postgres: an opt-in suite against a throwaway
  local Postgres (`.cursor/cloud-start.sh` starts one; CI needs a `postgres` service container in `ci.yml`, H18) firing N
  parallel bids from separate connections. Live refresh: polling vs SSE on Vercel functions.
- **Risk flags:** money (binding bids, bigint paise), auth/security (adult gate, pseudonymous public state), concurrency,
  personal data (bidder DOB/phone encrypted).
- **Test plan:** Seam 1: bid < current + increment refused; first bid < base refused; deterministic interleave test (two bids
  computed from the same snapshot → exactly one accepted); bid at closes_at − window + 1 s → closes_at extended; advance the
  fake clock past the original close → lot still open; drain the close job → closes at the extended time; previous high
  bidder receives one outbid message, self-raise sends none; signed-in teen with guardian link refused; adult without bidder
  profile refused; `/state` contains no names or user ids; authorization: adult member bids (allowed), minor (refused),
  auction manager bidding on own lot (refused). Real-Postgres suite: 20 concurrent bids at the same amount → one stored,
  final current_bid equals max accepted. Seam 2 (M8 bidding journey): adult A bids, adult B outbids, A's inbox shows the
  outbid message, seeded minor sees bidding refused. axe on every page visited.
- **Hotspots:** H1, H3, H5, H6, H7, H8, H9, H10 (close schedule shared with #131), H18 (ci.yml), H19.
- **Split:** no.
- **Tournament:** yes, 3 entrants (money + concurrency, uncertainty 4): (a) `SELECT … FOR UPDATE` on the lot row; (b)
  optimistic CAS on `version` with bounded retry; (c) append-only bid log + unique amount + `SERIALIZABLE` retry. Judges run
  the real-Postgres suite on all three.

### #133 (ordinal 78) M8: Auction payment, delivery and thank-you letters
- **Depends on:** hard (inferred): #132, #77 (Payments: gateway port, batches, idempotent signed webhooks), #79 (capture for
  something no longer payable → needs-review, never auto-refund), #105 (ledger postings via outbox), #109 (no posting into a
  locked period), #94 (artwork → `auctioned`), #69, #81 (letters for minors to guardians), #73 (school contact: authorised
  person/principal), #100 (PDF renderer port, for the letter), #70/#72 (competition definition gains the proceeds policy).
- **AFK:** B.
- **Human residue:** G4: Razorpay live keys/KYC for real auction payments. Accountant (spec "For the accountant"): GST on
  auction sales (spec: no GST invoices at launch) and the ledger treatment of a creator share (liability until paid out);
  the creator-share payout itself is a manual finance process (child issue). G5: payment window length and whether the
  thank-you letter states the sale price (default: no price). G3: thank-you letter wording.
- **Ports/providers:** payment gateway (fake with webhook simulator), PDF renderer (fake), Notifications.
- **New tables/columns:** `auction_payment_offer` (id, lot_id, bid_id, bidder_user_id, amount_paise, offered_at, expires_at,
  status enum `auction_payment_offer_status`: open, paid, expired, superseded, payment_batch_id); payment batch item gains a
  payable reference for auction lots (H14: generalise from registration-only items); competition column
  `auction_creator_share_bps int NOT NULL DEFAULT 0 CHECK 0..10000` (H17); ledger categories/accounts `auction_proceeds`
  (income) and `creator_share_payable` (liability) seeded; `auction_delivery` (lot_id unique, buyer_user_id, recipient_name,
  address encrypted, phone encrypted, status enum `auction_delivery_status`: pending_dispatch, dispatched, delivered,
  receipt_confirmed, courier_name, tracking_number, dispatched_at, delivered_at, receipt_confirmed_at, confirmed_by);
  `auction_thank_you_letter` (lot_id, recipient kind: creator | guardian | school, recipient_user_id or institution_id,
  file_asset_id, sent_at, unique (lot_id, recipient kind)).
- **Settings:** `auctions.paymentWindowHours` (confirm with FOA).
- **Events:** consumes `auction.lot_closed` (bid ≥ reserve → awaiting_payment + offer; else unsold), `payment.captured`
  (auction payable → offer paid, lot sold, `auction.lot_sold`); emits `auction.payment_offered`,
  `auction.payment_offer_expired`, `auction.lot_sold` (→ ledger posting, artwork `auctioned`, delivery record, letters);
  schedule `auction.payment_offer.expire` (H10).
- **Routes:** `/auctions/pay/[offerId]` (signed-in winner only; creates the gateway order), `/dashboard/bids` (won lots: pay,
  delivery status, confirm receipt), `/admin/auctions/deliveries`, `/admin/auctions/lots/[lotId]/delivery`; competition
  admin form gains the creator-share field.
- **Messages namespaces:** `auctions` (extends).
- **Size:** XL: money core (offers, expiry cascade, capture, ledger split) plus fulfilment and letters. Split below.
- **Design uncertainty:** 4. Expiry cascade (next distinct bidder with a bid ≥ reserve, excluding the defaulter, else relist
  vs unsold); polymorphic payment items without breaking registration batches; ledger split with a creator share while
  keeping "exactly one posting" per capture; late capture after expiry.
- **Risk flags:** money/ledger (webhook idempotency, one posting, period lock), minors (creator share for minors, letters to
  guardians), personal data (buyer address encrypted), auth (winner-only checkout).
- **Split (2 children, serial a → b):**
  - **#133a Auction payment window, next-bidder fallback, capture and ledger posting** (L). Offers, expiry job, relist/unsold,
    payment batch item generalisation, webhook path, one balanced posting (Dr gateway clearing; Cr `auction_proceeds` for
    FOA's share; Cr `creator_share_payable` when share > 0), late capture → needs-review, creator-share competition column.
    Deps: #132, #77, #79, #105, #109, #72. Tournament: yes, 3 entrants (money): (a) offer entity + payment batch of one; (b)
    lot-level payment state with a gateway payment link per offer; (c) generic "payable" interface in Payments that auction
    implements.
  - **#133b Delivery tracking and thank-you letters** (M). `auction_delivery`, artwork `auctioned`, buyer address capture,
    receipt confirmation, letter PDF via renderer port to creator or guardian and to the school (individual-route entries:
    creator only). Deps: #133a, #94, #100, #81, #73. Tournament: no.
- **Test plan:** Seam 1: captured auction payment → exactly one ledger posting, debits = credits; with creator share 25 % the
  posting splits per policy (rounding rule stated: share = floor(amount × bps / 10000), remainder to FOA); replayed
  webhook → no second posting, no state change; advance fake clock past the window → drain → offer expired, next bidder
  offered (defaulter's other bids skipped); no eligible next bidder → lot relisted/unsold per rule and artwork status
  restored; capture arriving after expiry → batch needs-review, no refund; posting into a locked period refused → posted in
  the open period; delivery transitions through receipt_confirmed (table test); letters: adult creator gets one, minor's
  guardian gets one (not the minor), school gets one, individual-route entry → no school letter; letter files private,
  delivered by signed link; authorization: winner pays (allowed), other bidder opens the offer (refused), auction manager
  updates delivery (allowed), finance (refused unless policy grants). Seam 2 (M8 payment journey, Razorpay test mode as in
  #77): seeded closed lot with an open offer → winner pays with a test card → `/dashboard/bids` shows paid and delivery
  pending. Seed every lot state instead of time travel; preview has no fake clock. axe on every page visited.
- **Hotspots:** H1, H2, H3, H6, H7, H8, H9, H10, H14 (serialize with any open payments/ledger ticket), H15, H17, H19.
- **Tournament:** #133a only (see split).

### #134 (ordinal 79) M8: Feedback surveys
- **Depends on:** hard (inferred): #99 (results-published gate), #64 + #82 (consent), #81 (guardian routing), #69, #74
  (coordinators), #75/#78 (participants of a competition), #117 (CSV export helper), #114, #59. Soft: #126's audience module
  if built first (reuse recipient resolution).
- **AFK:** A.
- **Human residue:** none ticket-specific (survey content is staff-authored at runtime). G1.
- **Ports/providers:** Notifications. No new port.
- **New tables/columns:** `survey` (id, competition_id, title, audiences: participants/guardians/coordinators flags,
  identified bool default false, include_free_text_in_export bool default false, status enum `survey_status`: draft, open,
  closed, opens_at, closes_at, created_by); `survey_question` (survey_id, position, kind enum `survey_question_kind`:
  rating_1_5, single_choice, multiple_choice, free_text, prompt, options jsonb, required); `survey_invitation` (id,
  survey_id, recipient_user_id, role, token_hash unique, sent_at, responded_at; unique (survey_id, recipient_user_id));
  `survey_response` (id, survey_id, respondent_user_id null (set only when identified), submitted_on date); `survey_answer`
  (response_id, question_id, value jsonb). Anonymous responses use a random (UUIDv4) id and a date only: a UUIDv7 id or a
  timestamp would re-link a response to `survey_invitation.responded_at`.
- **Events:** emits `survey.opened` (→ invitations), `survey.responded`.
- **Routes:** public `/surveys/[token]` (noindex; no sign-in), `/dashboard/surveys`, `/dashboard/surveys/[surveyId]`,
  `/admin/competitions/[competitionId]/surveys`, `/admin/surveys/[surveyId]` (builder), `/admin/surveys/[surveyId]/results`,
  `GET /admin/surveys/[surveyId]/export` (CSV; step-up: spec story 20 "data exports").
- **Messages namespaces:** `surveys` (new).
- **Use cases:** `createSurvey`, `editSurveyQuestions`, `openSurvey` (refused before results publish), `closeSurvey`,
  `getSurveyByToken`, `submitSurveyResponse` (token or signed-in), `getSurveyResults`, `exportSurveyResults`.
- **Size:** L: five tables, tokenised public answering, anonymity design, aggregation fixtures, export rules.
- **Design uncertainty:** 3. Anonymous-by-default storage that still enforces "once per person"; guardian of two children
  answers once; free-text answers may contain personal data typed by the respondent, so they are excluded from exports unless
  the survey says otherwise.
- **Risk flags:** personal data, minors (guardian routing), auth/security (unauthenticated token endpoint).
- **Test plan:** Seam 1: invitations only to people linked to the competition with consent; minors → guardians; second
  submit by token or dashboard → refused; token after close → refused; aggregated results equal a hand-computed fixture
  (counts per option, mean rating to 2 dp, distribution); export of an anonymous survey contains no names, emails, ids or
  free text; identified survey export contains respondent identity; open before results published → refused;
  authorization: competition manager builds and exports (allowed), coordinator exports (refused), member reads results
  (refused). Seam 2: answer a seeded survey through `/surveys/[token]` on the preview. axe: all seven pages.
- **Hotspots:** H1, H3, H5, H6, H8, H9 (third `results.published`-adjacent consumer), H19, CSV helper from #117.
- **Split:** no.
- **Tournament:** yes, 2 entrants: (a) invitation-ledger anonymity (responded_at on invitation, unlinked response); (b)
  per-survey pseudonymous respondent key (HMAC of user id with a per-survey salt) enabling once-only without identity.

### #135 (ordinal 80) M8: Objective reports and social metrics
- **Depends on:** hard (inferred): #117 (Reports module, admin home, CSV export, small-count suppression pattern), #119
  (engagement), #121, #122 (engagement ladder), #124 (volunteer hours), #125c (attendance), #73/#75/#78 (participation,
  institution partnerships), #106/#107/#108 + #110 (donations; must equal transparency figures for published periods, the
  #110 invariant), #134 (participant feedback), #59, #60. This is the last ticket: the M8 release PR waits on M6 through it.
- **AFK:** B.
- **Human residue:** G5: FOA leadership defines each objective metric precisely and who "FOA leadership" is in roles (no
  such role in the spec's role list; default access matrix below). Social metrics are typed in by content managers by design
  (automatic social posting and APIs are out of scope): operational, not build residue.
- **Ports/providers:** none new.
- **New tables/columns:** `social_metric_snapshot` (id, channel enum `social_channel`: instagram, facebook, youtube, x,
  linkedin, other, recorded_for date, followers int, posts int, reach int, impressions int, engagements int, recorded_by,
  created_at; unique (channel, recorded_for)). Reports are read models (queries or SQL views), no new personal-data columns.
- **Access matrix (default, confirm with FOA):** objectives overview → staff admin, super admin; donations → + finance;
  community, volunteers, events → + community manager; social → + content manager (also writes snapshots).
- **Routes:** `/admin/reports/objectives`, `/admin/reports/objectives/[report]` (participation, engagement, institutions,
  volunteers, donations, social, feedback), `/admin/reports/social`, `/admin/reports/social/new`,
  `GET /admin/reports/objectives/[report]/export` (CSV, aggregated only).
- **Messages namespaces:** `objectiveReports` (new), `socialMetrics` (new; child a).
- **Size:** XL: seven fixture-verified reports spanning eight modules, period selection, trend display, CSV, role matrix.
  Split below.
- **Design uncertainty:** 2 (metric definitions are FOA's call, recorded as settings/docs).
- **Risk flags:** personal data (re-identification through small aggregates; apply #117's small-count suppression), auth
  (role access).
- **Split (3 children):**
  - **#135a Social metric snapshots and trend** (S/M). Table, record/list/trend use cases, accessible trend (chart with a
    `TableScroller` table fallback; dataviz rules). Deps: #117, #59, #60. Runs as soon as #117 is merged (parallel with M6).
    Tournament: no.
  - **#135b Participation, engagement and institution-partnership reports** (M). Deps: #117, #119, #121, #122, #125c, #73,
    #75, #78. Tournament: no.
  - **#135c Volunteer, donations and feedback reports, objectives overview, CSV for all seven** (M). Deps: #124, #110,
    #106–#108, #134, #135a, #135b. Tournament: no.
- **Test plan:** Seam 1: each report equals a hand-computed fixture over a seeded world for two periods (period boundaries in
  IST, stored UTC); donations report total equals the transparency total for each published period; social snapshot
  recorded twice for the same channel/day → refused (or upsert, decide); trend ordered by date; CSV contains only aggregate
  rows and suppressed small counts; authorization per the access matrix (each report: one allowed, one refused role).
  Seam 2: render each report page for a seeded staff admin. axe: all pages.
- **Hotspots:** H3, H6, H8, H19, Reports module files from #117 (serialize with any open reports ticket).
- **Tournament:** no.

---

## Summary per milestone

### M6 (8 tickets → 10 work items after splitting #125)
| Issue | Ord | Size | AFK | Unc | Tournament | Hard deps inside M6–M8 |
|---|---|---|---|---|---|---|
| #119 | 64 | L | A | 3 | yes (2) | — |
| #120 | 65 | M | B | 2 | no | #119, #121, #123, #125a |
| #121 | 66 | M | A | 2 | no | #119 |
| #122 | 67 | M | B | 2 | no | #119 |
| #123 | 68 | L | B | 2 | yes (2, rule) | — |
| #124 | 69 | L | B | 3 | yes (2) | #119, #123 |
| #125a | 70 | M | B | 2 | no | — |
| #125b | 70 | L | B | 3 | yes (2) | #125a |
| #125c | 70 | M | B | 2 | no | #125b, #119 |
| #126 | 71 | L | B | 3 | yes (2) | #119 |
- **Start set once M0–M5 deps are merged:** #119, #123, #125a run together (no shared schema files, separate namespaces).
  Then #121, #122, #126 (after #119), #124 (after #119 + #123), #125b (after #125a); then #125c, then #120 last.
- **Critical path:** #125a → #125b → #125c (M + L + M), and #119 → #124; #120 closes the milestone.
- **Serialize:** none of the M6 tickets share a schema file if each owns `<module>.ts`; shared registries (H5–H10, H19,
  H20) are append-only and resolved in the merge queue. #121/#122/#120/#126 share the `/admin/community` menu (created by
  #119): append-only.
- **Seam 2 milestone journey:** #125c (register for a full event → waitlisted → promoted → checked in → timeline).
- **Human residue children (deduped):** volunteer safeguarding declaration + code of conduct text (DSL/counsel); volunteer
  and judge background checks (counsel, process); ambassador thresholds + min age; invitations go/no-go flag
  (`community.invitations.enabled`) + invitation copy + production pilot backfill run; event safeguarding rule for minors;
  campaign bulk-email deliverability on SES (production access, DKIM/SPF/DMARC, bounces) + campaign footer copy + DPDP
  outreach basis; volunteer certificate wording. Plus G1 retention rows (member profile, volunteer application, event
  registration, campaign delivery) and G2 DLT templates (reminders, invitations).
- **M6 is independent of M7 and of most of M8:** it needs only M0–M5.

### M7 (4 tickets)
| Issue | Ord | Size | AFK | Unc | Tournament | Hard deps inside M6–M8 |
|---|---|---|---|---|---|---|
| #127 | 72 | L | B | 2 | yes (2, rule) | — |
| #128 | 73 | M | B | 2 | no | #127 |
| #129 | 74 | L | A | 2 | no | #127 |
| #130 | 75 | L | B | 3 | yes (2) | #129 |
- **Order:** #127 → (#128 ∥ #129) → #130. #128 and #129 share only H4 (routes/nav) and the `ROUTES` sitemap test.
- **Critical path:** #127 → #129 → #130 (L + L + L).
- **Serialize:** #128 touches harness `src/test/db.ts` (H11) and `src/lib/security-headers.ts` (H12): serialize with any
  open harness or CSP/header ticket anywhere in the factory, not just M7.
- **Verified de-risking:** PGlite loads `cube` + `earthdistance` (F3); the preview build proves the extension on the VPS
  Postgres (F10). Remaining blocker for #128's browser-location path: the global `geolocation=()` header (F4).
- **Seam 2 milestone journey:** #130 (pin search → listing → adoption apply → coordinator outcome → listing closed).
- **Human residue children:** NGO verification checklist (FOA); publishing individual rescuers' contacts (counsel);
  pin-code dataset licence/attribution + download/import wizard if the runner cannot fetch it; adoption data-sharing notice
  and success-story consent text (counsel); adoption coordinator staffing + adult-only adopter rule (FOA). Plus G1 rows.
- **M7 is independent of M6 and M8:** it needs only M0–M5 (#59, #60, #63, #64, #69, #75, #81, #85, #111, #114).

### M8 (5 tickets → 8 work items after splitting #133 and #135)
| Issue | Ord | Size | AFK | Unc | Tournament | Hard deps inside M6–M8 |
|---|---|---|---|---|---|---|
| #131 | 76 | L | B | 3 | yes (2) | — |
| #132 | 77 | L | B | 4 | yes (3) | #131 |
| #133a | 78 | L | B | 4 | yes (3) | #132 |
| #133b | 78 | M | B | 2 | no | #133a |
| #134 | 79 | L | A | 3 | yes (2) | soft #126 |
| #135a | 80 | S/M | B | 2 | no | — |
| #135b | 80 | M | B | 2 | no | #119, #121, #122, #125c |
| #135c | 80 | M | B | 2 | no | #124, #134, #135a, #135b |
- **Order:** auction chain #131 → #132 → #133a → #133b is strictly serial (shared `auctions` namespace, lot table, close
  schedule). #134 and #135a run in parallel with it (and with M6/M7). #135b/#135c wait for M6 and #134.
- **Critical path:** #131 → #132 → #133a → #133b (L + L + L + M), the longest chain in M6–M8 and the highest-risk one: start it
  as soon as M3–M5 deps (#94, #82, #83, #97, #99, #102, #103, #77, #79, #105, #109) are merged.
- **Serialize:** #131/#133b on H15 (artwork status enum, F2); #133a on H14 (payments/ledger) and H17 (competitions); #132
  on H18 (`ci.yml` Postgres service for the real concurrency suite).
- **Seam 2 milestone journeys:** #132 (bid, outbid alert, minor refused) and #133a (winner pays in Razorpay test mode). Seed
  every lot/offer state; previews have no fake clock, so no time-travel controls are added.
- **Human residue children:** auctioning minors' work + creator share (FOA leadership, spec open question); `auctions.enabled`
  flip after pilot artwork verification; copyright in minors' work + auction consent wording + whether auction consent covers
  public lot images (counsel); auction terms of sale (counsel); GST on auction sales + creator-share ledger treatment +
  payout process (accountant/finance); Razorpay live (G4); payment window + letter price disclosure (FOA); objective metric
  definitions + "leadership" role mapping (FOA). Plus G1 rows (bidder profile, delivery address, survey invitations).
- **Release dependency:** the M8 release PR cannot open until #135c merges, which needs M6 complete (#119, #121, #122, #124,
  #125c) and #134.

### Cross-milestone totals (M6–M8)
- 17 tickets → 22 work items (3 XL split: #125 → 3, #133 → 2, #135 → 3).
- AFK: A = 4 (#119, #121, #129, #134); B = 13; C = 0. Every B ticket merges against fakes; its residue is a labelled child.
- Tournaments (charter rule 5): 11 work items (#119, #123, #124, #125b, #126, #127, #130, #131, #132, #133a, #134); 3-entrant
  tournaments: #132, #133a.
- Risk flags: minors/safeguarding 11; money/ledger 3 (#131, #132, #133); encryption 5 (#123, #127, #130, #132, #133);
  auth/security 7 (#123, #126, #127, #132, #133, #134, #135); infra 2 (#128 extension, #132 CI Postgres).
- Parallelism: once M0–M5 are merged, three independent lanes start at once: M6 (#119, #123, #125a), M7 (#127), M8 (#131,
  #134, #135a).
- Enum-extension hazard (F2): #124 (certificate type), #131 (artwork status), and any ticket that adds a consent purpose to
  an enum (#123, #126, #130). The merge queue's regenerated migrations must keep each `ADD VALUE` in a migration that no DDL
  in the same PR references.
