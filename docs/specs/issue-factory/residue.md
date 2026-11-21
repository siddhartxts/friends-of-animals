# Human-residue register (HR), residue child issues, Day-0 owner checklist

Sources: `research/issues-M0.md` .. `issues-M6-M8.md` (per-ticket "Human residue" + roll-ups), `spec55.md` §8 providers and
non-code prerequisites, `history-a.md` (closed #12 #13 #18 #23 #27 leftovers, rules R3 R13 R16), `history-b.md` B16,
`code-infra.md` §5 §9, `code-server.md` §11, `platform.md` §7 §8, `CHARTER.md`. Verified 2026-11-19: all 80 open issues carry only
`ready-for-agent`; no open issue covers any HR item, so every HR item needs a child (closed #18 #23 #27 are refiled, never reopened).

## 1. Rules the register encodes
- **Residue NEVER blocks merging a ticket into `M<k>`.** The agent-doable part merges behind ports, fakes, capture adapters,
  settings flags and env-optional adapters (provider env vars are required only when `APP_ENV=production`). Residue blocks only:
  - `S2` Seam 2 on the PR preview: the preview E2E gate is recorded `deferred` (never `passed`); Seam 2 runs locally on
    `next start` (port 3100) meanwhile; the journey is never disabled or weakened.
  - `FLAG:<key>` a runtime setting or env-gated feature stays off (e.g. `sms.enabled`, `org.has80G`, `auctions.enabled`).
  - `REL-main(Mk)` the owner's merge of milestone PR `M<k> -> main` (deploys the PUBLIC staging site `shipped-it.dev`); listed under
    "Don't merge until" in that PR's Merge Danger section.
  - `REL-prod` production go-live / pilot; `assertNoPlaceholdersInProduction` already fails a production build on placeholders.
- IDs are in urgency order: **HR-01 unblocks production first** (rank = ID number). Tier: `D0` before the run starts; `W1`/`W2` before
  that wave's Seam 2; `LL` long lead, FOA starts it on Day 0 whatever its rank; `M<k>` act during milestone k; `M<k>+` recurs per
  milestone; `P` pilot / go-live; `X` cosmetic. Owner values: owner dev / FOA leadership / accountant / legal (= counsel).
- Wiz = `yes` when a walkable path exists for the owner-dev part; the Orchestrator generates it with the `wizard` skill as
  `docs/factory/wizards/hr-NN.sh` on the milestone branch. No secret value ever appears in an issue, PR, transcript or wizard log.

## 2. Register (67 items, deduplicated)

| ID | Item | Type | Owner | Tickets | Blocks | Wiz | Tier |
|---|---|---|---|---|---|---|---|
| HR-01 | `BETTER_AUTH_SECRET` (>=32 random bytes, distinct Preview / staging / Production) + `CAPTURE_MAILBOX_TOKEN` (Preview, staging) in Vercel; GitHub Actions secret `CAPTURE_MAILBOX_TOKEN` (R0-1) | secret/env var | owner dev | #57, then journeys #59 #63 #77 #91 #97 #101 #103 #110 | S2 from #57; REL-prod | yes | D0 |
| HR-02 | Merge to `main` a PR adding `CAPTURE_MAILBOX_TOKEN: ${{ secrets.CAPTURE_MAILBOX_TOKEN }}` to the "Run Playwright" step of `e2e.yml` (e2e runs from `main` only); same for any later journey env (R0-2, R2-3) | secret/env var | owner dev | #57; #91 only if 91b needs a new env | S2 (fallback `workflow_dispatch --ref`: no commit status) | no | D0 |
| HR-03 | Read-only `GITHUB_TOKEN=` in `/etc/foa/sweeper.env` (0600): unauthenticated sweeper is capped at 60 calls/h (~55 PR DBs) | VPS ops | owner dev | every PR (preview DBs) | S2 (stale DBs exhaust pg-nonprod's 200 slots) | yes | D0 |
| HR-04 | Vercel setting "Run up to one build per branch" (API refused it in #12; seed now runs in the build) | provider account | owner dev | #57 (all previews) | S2 (racing builds on rapid pushes) | yes | D0 |
| HR-05 | Key ring `FIELD_ENCRYPTION_KEYS` (versioned), blind index `FIELD_HMAC_KEY`, `PII_HASH_KEY` (#75 duplicate hash) per environment; offline backup (lost key = lost data); rotation policy (R0-4, R-KEYS) | secret/env var | owner dev | #58 #73 #75 #76 #78 #81 #83 #108 | S2 (Preview keys); REL-main(M0) staging keys; REL-prod | yes | W1 |
| HR-06 | Non-prod R2 buckets on an interim owner Cloudflare account (prefixes `staging/`, `pr-<n>/`, `br-<hash>/`, private + public), bucket-scoped token, CORS `PUT` from `https://friends-of-animals-*-bitacu1.vercel.app` and `https://shipped-it.dev` (R0-5, G7, R2-2, G14 non-prod) | provider account | owner dev | #63 #85 #86 #91 #103 #112 | S2 (#63 signed-URL, #91 journeys); REL-main(M0) | yes | W2 |
| HR-07 | Apply agent-written SQL for roles `foa_worker` / `staging_worker` / `nonprod_worker` (own schema `pgboss`), worker secrets in `/etc/foa/secrets`, `docker compose -f docker/workers.yml up -d`, CPU/memory caps (F9), confirm `worker-preview` attaches to a new `foa_pr_<n>` and lets go after the sweep (R0-6) | VPS ops | owner dev | #61 #66 #69 #71 | S2 (welcome email, worker-backed journeys); REL-main(M0) | yes | M0 |
| HR-08 | ClamAV sidecar (~1-1.5 GB RAM) + scan job, R2 creds in worker env, `docker/scripts/preview-dropped.d/` hook purging `pr-<n>/` | VPS ops | owner dev | #63 #85 #86 #91 | S2 (uploads never reach `clean`); REL-main(M0) | yes | M0 |
| HR-09 | Razorpay test mode: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel Preview + staging; webhook `https://shipped-it.dev/api/webhooks/razorpay` (payment/order/refund); Subscriptions + `subscription.*` events (R-RAZORPAY, R-RZP-E2E, G10) | provider account | owner dev | #77 #78 #79 #80 #106 #107 #110 #133 | S2 (77c/110b run on the fallback adapter, recorded as such) | yes | M1 |
| HR-10 | Per milestone: rebuild ONLY `worker-preview` from the `M<k>` tip in a separate checkout (`docker compose -f <checkout>/docker/workers.yml up -d --build --wait worker-preview`; never `down`/`-v`, never check out `M<k>` in `/srv/foa`) (R-WORKER, R5-1) | VPS ops | owner dev | #69 #71 #80; #84 #90; #93 #94; #99-#104; #105-#116; M6-M8 handlers | S2 (#101 if no in-request drain; #110b) | yes | M1+ |
| HR-11 | Production domain: FOA's domain onto Vercel through Cloudflare DNS (Cloudflare invite to owner); fixes passkey RP id, CORS origins, CDN and SES identity hosts | DNS | FOA leadership + owner dev | #57 #60 #63 #103 | REL-prod | yes | LL |
| HR-12 | SES `ap-south-1` production: AWS account in FOA's name (CERT-In name = PAN), sending domain DKIM/SPF/DMARC, sandbox exit + bulk quota, bounce/complaint handling, IAM key limited to `ses:SendEmail`, keys in Vercel Production + prod worker | provider account | FOA leadership + owner dev | #57 #61 #69 #126 | REL-prod (email OTP = production sign-in) | yes | LL |
| HR-13 | FOA Cloudflare R2 production account: private, public, evidence (object lock) buckets, per-bucket tokens, CORS, public CDN custom domain, zone-scoped purge token; `PUBLIC_ASSET_BASE_URL`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_PURGE_TOKEN` in Vercel + worker (R-R2CDN, G14 prod) | provider account | FOA leadership + owner dev | #63 #68 #103 #112 | REL-prod | yes | LL |
| HR-14 | DLT via MSG91: Principal Entity, header `FOAIND` (Rs 5,900), every SMS template incl. URL whitelisting, `dlt_template_id` per template, promotional template + DND scrub only for campaign SMS; MSG91 auth key + sender id in Vercel Production (R-DLT, G2) | DLT/regulatory | FOA leadership + owner dev | #58 #69 #74 #83; #84-#92; #93 #99-#101; #106 #107; #120 #123 #125 #126 | FLAG:`sms.enabled`, `campaigns.smsEnabled` | no | LL |
| HR-15 | Razorpay live: NGO KYC, signatory video KYC, domestic INR only, Subscriptions live; live keys + webhook secret in Vercel Production (G4, #18) | KYC/payments | FOA leadership + owner dev | #77 #80 #106 #107 #133 | REL-prod (live payments) | yes | LL |
| HR-16 | Income-tax registration (12A/80G, now Income-tax Act 2025; Form 105, up to ~9 months): number, validity, approved receipt wording (G9) | DLT/regulatory | FOA leadership + accountant | #62 #106 #108 | FLAG:`org.has80G` | no | LL |
| HR-17 | Appointments, each enrolled with 2FA and granted a production role: super admin(s), 2 distinct finance approvers, DSL + deputy, grievance officer, >=2 results approvers, `foa_verifier` staff, adoption coordinator, "FOA leadership" report readers (G11, R-APPROVERS) | FOA decision | FOA leadership | #59 #60 #92 #94 #99 #109 #115 #116 #130 #135 | REL-main(M5); REL-prod | no | LL |
| HR-18 | Run `pnpm admin:bootstrap-super-admin --email <e>` against production with migrator `DIRECT_URL` for HR-17's names (no runner touches production) | VPS ops | owner dev | #59 | REL-prod | yes | P |
| HR-19 | M0 defaults: OTP 6 digits / 10 min / 5 attempts, 5 codes per email + 20 per IP per 15 min, member 30 d / staff 12 h sessions, step-up 10 min, lost-second-factor recovery, `org.has80G`=false, `org.fcraEnabled`=false, CSP Report-Only N days on staging then enforce | FOA decision | owner dev + FOA leadership | #57 #60 #62 #65 | REL-prod (defaults ship) | no | M0 |
| HR-20 | M0 legal copy: privacy notice, terms, messages-consent document, sign-up notice (seeds = drafts from `src/content/legal/*.ts`) | legal copy | legal + FOA leadership | #57 #64 | REL-prod (placeholder guard) | no | M0 |
| HR-21 | FOA facts replacing `SITE.org` placeholders: email, phone, address, socials, grievance contact, school-conduct guidelines link | FOA decision | FOA leadership | #84 #87 #111 #115 | REL-prod (placeholder guard) | no | M0 |
| HR-22 | Sentry org + projects, DSNs for app (staging, Production) and workers, source-map auth token | provider account | owner dev | #66 #68 | REL-prod | yes | M0 |
| HR-23 | Uptime provider + account, alert target, checks (`/api/health`, TCP `db.shipped-it.dev:6432`, worker heartbeat), forced-failure test, silencing procedure | provider account | owner dev | #66 | REL-prod | yes | M0 |
| HR-24 | 365-day logs: Vercel log drain + store, VPS container logs shipped there (today json-file 50 MB x 5), provider/self-host + cost | provider account | owner dev | #66 | REL-prod | yes | M0 |
| HR-25 | Off-site backups: B2 account, bucket, bucket-scoped key, SSE, R2 read access, retention window (30 d proposed), restore runbook on real buckets, pgBackRest repo2 (refiles #27) | provider account | owner dev + FOA leadership | #68 | REL-prod (RPO 15 min / RTO 4 h need it, else FOA accepts VPS-loss risk in writing) | yes | M0 |
| HR-26 | After M0 reaches `main`: `git -C /srv/foa pull && sudo /srv/foa/docker/scripts/install-systemd.sh` (restore-drill timer) + alert on failed `foa-restore-drill` | VPS ops | owner dev | #67 | REL-prod | yes | M0 |
| HR-27 | Per milestone after `M<k> -> main`: no CSP violations on staging, Seam 2 journeys pass on staging (DoD), forced Sentry/uptime alert fires, Umami page views (M5+) | VPS ops | owner dev | #65 #66 #118; journey owners | REL-prod | yes | M0+ |
| HR-28 | Per milestone before `M<k> -> main`: real devices (iPhone, iOS 16.0-16.3, OS font scaling, Lighthouse x3 on a phone), as #54's "Still manual" | design sign-off | owner dev | every UI ticket | REL-main(Mk) (owner judgement) | no | M0+ |
| HR-29 | Hygiene from #12/#13: rotate DB passwords written via an agent session, `vercel logout` on the VPS, Hostinger disk-encryption question, Static IPs decision | secret/env var | owner dev | closed #12 #13 | REL-prod | yes | M0 |
| HR-30 | DPDP rulings: verifiable parental consent (OTP, code link, signed form), own-login age 13, school as joint fiduciary, minors' public credit, children's data residency (R2 vs S3 Mumbai; B2 has no India region), audit retention vs erasure, 365-day IP logs, erasure exceptions + teens filing alone, withdrawal SLA (15 min / 24 h), cookieless analytics, outreach basis (R-DPDP, R-SLA) | DLT/regulatory | legal | #57 #59 #63 #66 #68 #75 #81-#83 #99 #103 #115 #118 #126 | REL-prod | no | M0 |
| HR-31 | Retention periods marked "to confirm" for every inventoried PD field; financial floor 8 y after FY end (G1, R-RET) | DLT/regulatory | legal + accountant | #73 #74 #75 #78 #79 #81 #83; M2-M8 PD tickets; #114 | REL-prod | no | M1 |
| HR-32 | M1 safeguarding sign-off: guardian, teen (13-17), minor (<13) account flows; code-link and signed-form consent | safeguarding policy | FOA leadership | #81 #83 | REL-main(M1) | no | M1 |
| HR-33 | M1 legal copy: "required by law" message list, competition terms, per-purpose consent documents, printable signed form | legal copy | legal + FOA leadership | #69 #72 #82 #83 | REL-prod (placeholder guard) | no | M1 |
| HR-34 | M1 defaults: fee amounts (data entry), refund policy, award schemes, institution verification checklist, auction consent offered to minors, signed-form reviewer + turnaround | FOA decision | FOA leadership | #72 #73 #80 #82 #83 | REL-prod (defaults ship) | no | M1 |
| HR-35 | Deploy `worker-media` (sharp HEIF + ffmpeg) with CPU/memory/pids limits; EICAR + HEIC smoke upload on staging (G6, R2-1) | VPS ops | owner dev | #85 #86 #102 #112 | S2 (#91 journey); REL-main(M2) | yes | M2 |
| HR-36 | M2 copy: announcement/reminder templates, entry messages, conduct certification, judging attestation, judging framework, shortlist-only declarations, shortlist results, overdue/close-on-behalf, verified/sent-back; ffmpeg licence note | legal copy | FOA leadership + legal | #84 #86-#92 | REL-prod | no | M2 |
| HR-37 | M2 defaults: file types/sizes (20 MB), video 200 MB / 3 min, essay 1500 words + PDF only, reminders [72h, 24h], resubmission 7 d, positions, reopen rules, shortlist-only consents, announcement = service message | FOA decision | FOA leadership | #84-#86 #88-#92 | REL-prod (defaults ship) | no | M2 |
| HR-38 | Police verification of in-person judges and volunteers (process, not code) (R-JUDGE-VETTING) | safeguarding policy | FOA leadership | #95 #123 | REL-prod (pilot physical round) | no | M3 |
| HR-39 | M3 legal copy: judge code of conduct, confidentiality terms, conflict-of-interest wording | legal copy | legal + FOA leadership | #95 | REL-prod | no | M3 |
| HR-40 | M3 defaults: artwork logistics (facility address, packaging, shipping payer, dispatch window; placeholders refused in production), tie-break rule, judges see titles (default hidden) | FOA decision | FOA leadership | #93 #96 #97 | REL-prod (placeholder guard) | no | M3 |
| HR-41 | Deploy Gotenberg 9 (exact tag >= 9.8.0) beside worker-media from the committed compose file (R-GOTENBERG) | VPS ops | owner dev | #100 #101 #102; M5 PDFs | S2 (#101 journey PDFs); REL-main(M4) | yes | M4 |
| HR-42 | Certificate sign-off: artwork per type, wording, signatories' names/titles, signature images (#100); volunteer certificate wording + layout (#124) (R-CERT-DESIGN) | design sign-off | FOA leadership | #100 #124 | REL-prod (sample signatory) | no | M4 |
| HR-43 | Logo stamping: placement, size, opacity, contrast thresholds, tiles-only small sizes (#17 approved derivations, not placement) (R-BRAND-STAMP) | design sign-off | FOA leadership | #102 | REL-prod | no | M4 |
| HR-44 | M4 safeguarding: minors' public credits, gallery, QR verify page, report reasons/reviewer/response time, takedown of hand-posted social items (R-SAFEGUARD, R-MODERATION, R-SOCIAL-TAKEDOWN) | safeguarding policy | FOA leadership | #99 #100 #103 #104 | REL-main(M4) | no | M4 |
| HR-45 | M4 copy: prize/trophy/medal texts, results and certificate messages, default social caption | legal copy | FOA leadership | #99 #101 #104 | REL-prod | no | M4 |
| HR-46 | M4 defaults: special-mention certificate (default none), `YY` = IST issue year, essay names shown as submitted | FOA decision | FOA leadership | #96 #100 | REL-prod (defaults ship) | no | M4 |
| HR-47 | Accountant batch (G8): FY token `2627`, receipt layout + "no goods or services" line, chart of accounts + public labels, export (CSV journal vs Tally), foreign-contribution test, cash/tax receipts + PAN thresholds, settlement fees, transparency contents, no-GST line | DLT/regulatory | accountant | #105 #106 #108 #109 #110 #114 | REL-prod (donations go-live) | no | M5 |
| HR-48 | M5 safeguarding: public report form, DSL-only queue, breach process, Quick-exit target (#14 open check) (R5-2) | safeguarding policy | FOA leadership | #113 #116 | REL-main(M5) | no | M5 |
| HR-49 | Breach + incident: DPB/CERT-In channel, pre-approved breach notices, SJPU/police escalation contacts, 24x7 on-call (G15) | safeguarding policy | legal + FOA leadership | #116 | REL-prod | no | M5 |
| HR-50 | M5 copy: four legal pages (counsel), donate flow, thank-you/refund/receipt-link templates, recurring messages, CMS seed content, contact acknowledgement, child-friendly safeguarding form, rights-request templates, breach notices | legal copy | legal + FOA leadership | #106-#108 #110 #111 #113 #115 #116 | REL-prod (placeholder guard) | no | M5 |
| HR-51 | M5 defaults: donation presets/min/max, guest donations, recurring bounds, approval threshold Rs 50,000 / 7 d, budget granularity, contact routing + rate limits, request due days, queue SLAs, home sections, impact counters, blog vs story | FOA decision | FOA leadership | #106 #107 #109 #111-#113 #115 #117 | REL-prod (defaults ship) | no | M5 |
| HR-52 | Umami: ingress (Caddy 443 + DNS-01 or Cloudflare Tunnel), DNS + tunnel token, `umami.sql` on pg-prod, `docker compose -f docker/analytics.yml up -d --wait`, two websites, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (+`UMAMI_ORIGIN`) in staging + Production, backup check (G12) | VPS ops | owner dev | #118 | FLAG (no script while env unset); REL-prod | yes | M5 |
| HR-53 | Captcha: keep the self-hosted check (default) or choose Turnstile; if Turnstile, site key + secret in Vercel and CSP sources (G13) | FOA decision | owner dev | #113 | FLAG (Turnstile only) | yes | M5 |
| HR-54 | Pilot prerequisites: written acceptance of availability/VPS-loss risk, pen-test vendor, real rubrics entered, finance opening balances | FOA decision | FOA leadership | #55 (pilot after M5) | REL-prod (pilot) | no | P |
| HR-55 | M6 safeguarding: volunteer declaration + code of conduct (DSL + counsel), rule for in-person events with minors, club member visibility | safeguarding policy | FOA leadership + legal | #121 #123 #125 | REL-main(M6) | no | M6 |
| HR-56 | M6 copy: invitation template, campaign footer + unsubscribe, volunteer messages | legal copy | FOA leadership | #120 #123 #126 | REL-prod | no | M6 |
| HR-57 | M6 defaults: teens join on own login, one club per institution, ambassador thresholds + min age, volunteers 14+ with guardian under 18 | FOA decision | FOA leadership | #119 #121 #122 #123 | REL-prod (defaults ship) | no | M6 |
| HR-58 | Invitations go/no-go, then the owner runs the pilot backfill on production via the admin path and checks the expected counts | FOA decision | FOA leadership + owner dev | #120 | FLAG:`community.invitations.enabled` | yes | M6 |
| HR-59 | Pin-code data: confirm India Post "All India Pincode Directory" (GODL-India) licence + `/credits` attribution; if the runner cannot fetch it, `pnpm tsx scripts/import-pincodes.ts <csv>` on staging/production | legal copy | owner dev | #128 | REL-main(M7) | yes | M7 |
| HR-60 | DB admin: `CREATE EXTENSION cube, earthdistance` for `*_migrator` only if #128's preview build fails; refresh `foa_seed` only if #57 chose template seeding | VPS ops | owner dev | #128 #57 | S2 (conditional); REL-main(M7) | yes | M7 |
| HR-61 | M7 copy: rescuer/foster contact publishing rule, adoption contact-sharing notice, success-story consent, disclaimer review | legal copy | legal | #127 #129 #130 | REL-prod | no | M7 |
| HR-62 | M7 defaults: NGO verification checklist, adopter min age 18, adoption coordinator staffing | FOA decision | FOA leadership | #127 #130 | REL-prod (defaults ship) | no | M7 |
| HR-63 | Auctions: whether minors' work is auctioned, creator share, copyright in minors' work; flip after pilot artwork is verified | FOA decision | FOA leadership + legal | #131 #132 #133 | FLAG:`auctions.enabled` | no | M8 |
| HR-64 | Accountant (auctions): GST on auction sales, creator-share liability treatment, manual payout process | DLT/regulatory | accountant | #133 | FLAG:`auctions.enabled` | no | M8 |
| HR-65 | M8 copy: auction consent wording (states creator share), terms of sale, thank-you letter | legal copy | legal + FOA leadership | #131 #132 #133 | FLAG:`auctions.enabled` | no | M8 |
| HR-66 | M8 defaults: min increment, anti-sniping window, payment window, price in thank-you letter (default no), objective metrics + "leadership" role mapping | FOA decision | FOA leadership | #132 #133 #135 | REL-prod (defaults ship) | no | M8 |
| HR-67 | Favicon: may the O tile with the paw stand alone? (refiles #23; trademark approval) | design sign-off | FOA leadership | closed #23 | nothing (three-tile favicon stays) | no | X |

Counts: 67 items. Blocks: S2 13 (HR-01..10, 35, 41, 60), FLAG 8 (HR-14, 16, 52, 53, 58, 63-65), REL-main 14 (HR-05..08, 17,
28, 32, 35, 41, 44, 48, 55, 59, 60), REL-prod 42; several carry more than one; none blocks a merge into `M<k>`. Owner: owner dev
32, FOA leadership 38, legal 12, accountant 4 (co-owned rows counted per owner). Wizard-able: 28.

Research code map: R0-1 HR-01 · R0-2 HR-02 · R0-3 Day-0 D0-8 · R0-4/R-KEYS HR-05 · R0-5/G7/R2-2 HR-06 · R0-6 HR-07/08 ·
R-RAZORPAY/R-RZP-E2E/G10 HR-09 · R-WORKER/R5-1 HR-10 · G6/R2-1 HR-35 · R-GOTENBERG HR-41 · R-R2CDN/G14 HR-06/13 · R-DLT/G2 HR-14 ·
G4 HR-15 · G9 HR-16 · G11/R-APPROVERS HR-17 · G1/R-RET HR-31 · R-DPDP/R-SLA HR-30 · R-SAFEGUARD/R5-2/R-MODERATION/R-SOCIAL-TAKEDOWN
HR-32/44/48/55 · G15 HR-49 · G12 HR-52 · G13 HR-53 · G8 HR-47/64 · R-LEGALCOPY/R-LEGALMSG/G3 HR-20/33/36/39/45/50/56/61/65 ·
R-FOA/G5 HR-19/34/37/40/46/51/57/62/66 · R-ARTWORK-LOGISTICS HR-40 · R-CERT-DESIGN HR-42 · R-BRAND-STAMP HR-43 · R-JUDGE-VETTING HR-38.
Not residue: operational data entry after release (real competitions, rubrics, budgets, social metrics typed in), Hindi
proofreading (English only at launch), #67's merge path (it is the M0 milestone PR itself).

## 3. Residue child issues the Orchestrator creates
- Labels: exactly `ready-for-human` + `factory:needs-human`; never `ready-for-agent` (keeps children out of the frontier).
- Title: `HR-NN (M<k>): <imperative summary>`, `M<k>` = first milestone the item blocks or recurs in. The `HR-` prefix keeps
  children out of the `M<k>:` title-prefix grouping. Grouped children use the lowest HR id; per-milestone children of one HR id
  (HR-10, HR-27) are keyed `HR-NN/M<k>`.
- Dedupe before create: GitHub MCP `list_issues` (state open, labels `ready-for-human`) and match `HR-NN` in titles; on T2
  `gh api -X GET search/issues -f q='repo:siddhartxts/friends-of-animals is:issue is:open "HR-NN" in:title'`; also keyword
  searches (off-site, favicon, DLT, Razorpay, SES) for human-filed issues (history R3). A match is appended to, never duplicated.
- Parent: `sub_issue_write` (method `add`) under the Parent column's issue; "dashboard" = the pinned "Factory status" issue.
  Never attach to #55 (never edit #55). Every affected ticket's status comment links the child; every `REL-main(Mk)` child goes
  into milestone PR M<k>'s Merge Danger as "Don't merge until HR-NN (#n)".
- Append: when a later ticket hits an existing HR id, the Orchestrator adds a `- #n: <what>` line under "Appended by" (edit
  in place) and one comment; uncapped (charter rule 11), deduped by HR id.
- Close: the Orchestrator closes a child (`state_reason: completed`) only when its done-check passes; the owner may close
  earlier by ticking every box. `docs/factory/HUMAN-HANDOFF.md` lists open children in HR-id order.

Body template (every child; footer mandatory):
```markdown
<!-- factory:residue {"id":"HR-13","milestone":"M0","type":"provider account","owner":"FOA leadership + owner dev","blocks":["REL-prod"],"tickets":[63,68,103,112],"wizard":"docs/factory/wizards/hr-13.sh"} -->
**Human residue HR-13** · Owner: FOA leadership + owner dev · Blocks: REL-prod · Tickets: #63 #68 #103 #112
### What only a human can do
<register item expanded into numbered steps; secrets are typed into the provider or Vercel UI, never into this issue>
### Done when
- [ ] <one box per step>
### How the Orchestrator verifies
<done-check from the table below; names only, never values>
### Wizard
`bash docs/factory/wizards/hr-13.sh` on branch `M<k>` (or "none: decision / copy / ruling")
### Appended by
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

| Key | HR | Title | Parent | Create when | Done-check |
|---|---|---|---|---|---|
| C-01 | 01, 02 | `HR-01 (M0): Turn on Seam 2 for previews: auth secrets, capture token, e2e.yml` | #57 | bootstrap, if check fails | Vercel MCP `filter_project_envs` lists both names per target; `git show origin/main:.github/workflows/e2e.yml \| grep -q CAPTURE_MAILBOX_TOKEN` |
| C-02 | 03, 04 | `HR-03 (M0): Keep previews healthy: sweeper token and one build per branch` | dashboard | bootstrap, if unticked | owner ticks; open-PR preview DBs dropped within 2 h of PR close (owner `journalctl` line) |
| C-03 | 05 | `HR-05 (M0): Provision field-encryption and PII hash keys per environment` | #58 | bootstrap | key names in Preview + staging (Production before REL-prod) |
| C-04 | 06 | `HR-06 (M0): Create non-production R2 buckets, token and CORS` | #63 | bootstrap | 63c journey green on its preview |
| C-05 | 07, 08, 26 | `HR-07 (M0): Deploy M0 workers, ClamAV and the restore-drill timer on the VPS` | #61 | 61b merges into M0 | welcome email in a preview's capture mailbox; EICAR upload ends `quarantined`; owner pastes the timer line |
| C-06 | 09 | `HR-09 (M1): Connect Razorpay test mode to previews and staging` | #77 | #77 hardened | 77c green with gateway `razorpay-test` stated in the PR |
| C-07 | 10 | `HR-10 (M<k>): Redeploy worker-preview from the M<k> tip` (one per milestone with new handlers, <= 8) | first handler ticket of M<k> | last handler ticket a journey needs merges | that journey green on the milestone-branch preview |
| C-08 | 11, 12 | `HR-11 (M0): Put FOA's domain on Vercel and set up SES email` | #57 | bootstrap | owner ticks; production smoke OTP email after REL-prod |
| C-09 | 13 | `HR-13 (M0): Open FOA's Cloudflare R2 account and production buckets` | #63 | bootstrap | names of the 3 env vars in Production |
| C-10 | 14 | `HR-14 (M0): Register FOA with DLT via MSG91 and register every SMS template` | #58 | bootstrap; templates appended | every template row ticked with its `dlt_template_id` |
| C-11 | 15, 16 | `HR-15 (M1): FOA paperwork: Razorpay live KYC and income-tax registration (refiles #18)` | #77 | bootstrap | owner ticks; G9 details entered in settings by FOA staff |
| C-12 | 17, 18 | `HR-17 (M0): Name FOA staff, enrol their 2FA, bootstrap production roles` | #59 | bootstrap | owner ticks after the bootstrap command |
| C-13 | 19 | `HR-19 (M0): Confirm M0 identity, session, settings and CSP defaults` | #57 | #57 hardened | owner replies "confirmed" or lists changes (each change = a follow-up ticket) |
| C-14 | 20 33 36 39 45 50 56 61 65 | `HR-NN (M<k>): Approve M<k> legal and FOA copy` (9) | first copy ticket of M<k> | that ticket merges into M<k> | production build of `M<k>` tip with `APP_ENV=production` passes the placeholder guard (owner-run) |
| C-15 | 21 | `HR-21 (M0): Supply FOA facts that replace the SITE.org placeholders` | #111 | bootstrap | same placeholder-guard check |
| C-16 | 22, 23, 24 | `HR-22 (M0): Set up Sentry, uptime alerts and 365-day logs` | #66 | 66a merges | forced alert received (owner ticks); DSN names in staging + Production |
| C-17 | 25 | `HR-25 (M0): Off-site backups to B2 and pgBackRest repo2 (refiles #27)` | #68 | #68 merges | owner pastes restore-runbook result line |
| C-18 | 27, 28 | `HR-27 (M<k>): Release checks for M<k>: real devices before merge, staging after` (9) | dashboard | M<k> PR leaves draft | owner ticks both halves |
| C-19 | 29 | `HR-29 (M0): Finish the security hygiene left from #12 and #13` | dashboard | bootstrap | owner ticks |
| C-20 | 30 | `HR-30 (M0): Counsel rulings under DPDP: consent, minors, residency, logs` | #64 | bootstrap; tickets append | each question answered in a comment |
| C-21 | 31 | `HR-31 (M1): Confirm retention periods in the data inventory` | #114 | first inventory row merges (#73) | every `toConfirm: true` row confirmed |
| C-22 | 32 44 48 55 | `HR-NN (M<k>): Safeguarding sign-off for M<k>` (4) | #81 / #99 / #116 / #123 | that ticket merges | DSL sign-off comment |
| C-23 | 34 37 40 46 51 57 62 66 | `HR-NN (M<k>): Confirm M<k> product defaults` (8) | first ticket with defaults | that ticket merges | owner/FOA reply; changed defaults = follow-up tickets |
| C-24 | 35 | `HR-35 (M2): Deploy worker-media on the VPS` | #85 | 85a merges | HEIC upload on a preview reaches `submitted` |
| C-25 | 38 | `HR-38 (M3): Police-verify in-person judges and volunteers` | #95 | #95 hardened | FOA ticks |
| C-26 | 41 | `HR-41 (M4): Deploy Gotenberg 9 beside worker-media` | #100 | 100c merges | #101 journey downloads a PDF on the preview |
| C-27 | 42, 43, 67 | `HR-42 (M4): FOA design sign-off: certificates, logo stamping, favicon (refiles #23)` | #100 | #100 hardened | FOA approval comment per item |
| C-28 | 47, 64 | `HR-47 (M5): Accountant rulings for donations, ledger, transparency and auctions` | #105 | #105 hardened | each ruling answered |
| C-29 | 49 | `HR-49 (M5): Breach channel, notice templates, escalation contacts, on-call` | #116 | #116 hardened | FOA + counsel tick |
| C-30 | 52 | `HR-52 (M5): Deploy Umami and set its website id` | #118 | #118 merges | page view visible after REL-main(M5) (owner) |
| C-31 | 53 | `HR-53 (M5): Turnstile keys and CSP sources` | #113 | only if #113 picks Turnstile | key names in Vercel |
| C-32 | 54 | `HR-54 (M5): FOA pilot prerequisites` | dashboard | M5 PR opens | FOA ticks |
| C-33 | 58 | `HR-58 (M6): Decide post-competition invitations; run the pilot backfill` | #120 | #120 merges | owner pastes backfill counts |
| C-34 | 59, 60 | `HR-59 (M7): Pin-code data licence and import; earthdistance on the servers` | #128 | #128 hardened | staging pin search returns results |
| C-35 | 63 | `HR-63 (M8): Decide auctions of minors' work and the creator share; enable auctions` | #131 | #131 hardened | FOA ruling comment; owner flips `auctions.enabled` |

Child count: 30 standing (C-31 only if Turnstile) + up to 38 per-milestone (C-07 <= 8, C-14 9, C-18 9, C-22 4, C-23 8) = <= 68.

## 4. Day-0 owner checklist (before "Execute docs/specs/issue-factory-spec.md from section 0")
Must (the run starts degraded without them):
- [ ] D0-1 Merge PR #137 (adds `.claude/skills`, 39 skills) into `main`, then merge `main` forward into `M0` ("Merge main (<sha>) into
      M0"). Or reply "fallback": the Orchestrator merges `claude/stoic-thompson-ukn0dx` into `M0`. Check: `git ls-tree -d origin/M0:.claude/skills | wc -l` >= 39.
- [ ] D0-2 Approve Vercel MCP `authorize_team_access` for team `bitacu1`. Check: `get_project friends-of-animals` returns the project.
- [ ] D0-3 HR-01: set `BETTER_AUTH_SECRET` (Preview, staging, Production; distinct; `openssl rand -base64 48`), `CAPTURE_MAILBOX_TOKEN`
      (Preview, staging) in Vercel, and `gh secret set CAPTURE_MAILBOX_TOKEN` (same value as Preview).
- [ ] D0-4 HR-02: merge the `e2e.yml` change to `main` (the Orchestrator prepares branch `ci/e2e-capture-token` -> `main` at
      bootstrap if absent; only the owner merges). Until merged, the preview E2E gate is `deferred`.
- [ ] D0-5 Skill decision: (a) allow one commit on `M0` setting `disable-model-invocation: false` for `triage`, `implement`, `handoff`,
      `retro`; or (b) keep them disabled. No answer = (b), revisited after the Day-0 `/implement` smoke test.
- [ ] D0-6 Cloud environments: set `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS=8` on the runner environment and `6` on the
      Orchestrator's; runner setup script `bash .cursor/cloud-install.sh`. Approve the `create_environment`/`update_environment`
      prompt now so no prompt appears during the run. Check: `echo $CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` in a runner.
- [ ] D0-7 Start the Orchestrator: model `claude-opus-5-5`, permission mode `auto`, ultracode on, effort `xhigh`, only this repo
      attached (single-repo sessions load `.claude/settings.json` hooks).
- [ ] D0-8 Confirm: PR #136 stays the M0 milestone PR (do not close it); nobody else is building M0 tickets; the prototype
      tournaments instruction supersedes the earlier "no throwaway prototypes" decision.
Recommended on Day 0 (deadline in brackets):
- [ ] D0-9 HR-03 sweeper token [before 50 open PRs]; D0-10 HR-04 one build per branch [before wave 1].
- [ ] D0-11 Repo admin: `delete_branch_on_merge=true`; rulesets on `main` (require PR, block force-push and deletion) and on
      `production` (block creation/updates). Check: `gh api repos/siddhartxts/friends-of-animals/rulesets`.
- [ ] D0-12 HR-05 Preview + staging keys [before #58's Seam 2, wave 1]; D0-13 HR-06 non-prod R2 bucket [before #63c, wave 2].
- [ ] D0-14 Start FOA's long-lead clock: send FOA leadership the provider request pack (last copy at 8d06f2e
      `docs/foa/provider-setup-request.md`) covering HR-11..HR-17 (domain, SES/AWS, R2, DLT, Razorpay KYC, tax status, appointments).
- [ ] D0-15 Decide whether the Orchestrator may set Preview-only random secrets via Vercel MCP `create_project_env`. Default NO
      (rule R13; #12 lesson): every secret stays owner-entered.
