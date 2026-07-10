Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-20u19-generator-option-naming-and-fixture-registry — complete.
Generic scheduleBundle/discographyBundle options; registry fixtureDir matching.
Gosaki / pilot convert behavior unchanged. No FTP / deploy / DB write.
```

## G-20u19 generator option naming and fixture registry — complete

- **Options:** `scheduleBundle` / `discographyBundle` — legacy `gosakiScheduleBundle` / `gosakiDiscographyBundle` aliases accepted
- **Modules:** `site-generator-options.mjs` · `site-fixture-match.mjs`
- **Fixture:** `matchRegistryFixtureDir(siteDir, siteKey)` in Gosaki hook `matchFixture`
- **Legacy:** `isGosakiPianoFixture` deprecated in gosaki-only inject modules only
- **Gosaki:** 74 schedule events · August 14 cards · 4 discography releases (Supabase live)
- **Pilot:** null bundles · noop hooks · convert dry-run PASS
- **Regression:** `verify:current-active-regression` — **17** verifiers
- **Not executed:** FTP · deploy · DB write
- **Next:** G-20u20 Supabase CMS features

## G-20u17 post-build verifier registry — complete

- **Registry:** `packageProfiles.{profile}.postBuildVerifier` — `script` + `argsMode`
- **Module:** `post-build-verifier-registry.mjs` — `resolvePostBuildVerifierConfig`, `buildPostBuildVerifierArgs`
- **Build core:** imports registry module; `POST_BUILD_VERIFIERS` hardcoded map removed
- **Gosaki:** staging → `verify-manual-upload-package.mjs` (`package-dir-only`); production → `verify-g20i3-*` (`none`)
- **Pilot:** staging → `verify-site-package.mjs` (`site-package`)
- **Legacy:** `LEGACY_POST_BUILD_VERIFIER_FALLBACK` if registry field omitted
- **Fail fast:** unknown site/profile without config
- **Regression:** `verify:current-active-regression` — **17** verifiers (G-20u2–u14 + G-20u17–u19)
- **Not executed:** FTP · deploy · DB write
- **Next:** ~~G-20u19 option naming~~ (complete) · G-20u20 Supabase CMS features

## G-20u18 package.json / CLI default decoupling — complete

- **Generic:** `manual-upload:site-package` requires `--site-key` (no implicit gosaki defaults)
- **Legacy wrappers:** `manual-upload:package:gosaki:staging`, `manual-upload:package` alias
- **Freshness:** `verify:package-freshness:gosaki:staging` explicit; `:staging` alias retained
- **Convenience retained:** `build:gosaki:*`, `verify:gosaki:*`, `preflight:gosaki:*`, `url:staging:gosaki`
- **Verifier:** `verify-g20u18-package-json-cli-default-decoupling.mjs` (in `verify:current-active-regression`)
- **Upload rule:** rebuild at HEAD + preflight PASS before manual FTP
- **Not executed:** FTP · deploy · DB write

## G-20u16 remaining site-specific coupling audit — complete

- **Doc:** `remaining-site-specific-coupling-audit.md` — A–E tiers, G-20u1 delta, non-schedule inventory
- **Remaining C items:** ~~POST_BUILD_VERIFIERS map~~ · ~~manual-upload npm defaults~~ · ~~gosaki*Bundle naming~~ · ~~isGosakiPianoFixture in hook matchFixture~~ · `includeGosakiReadOnlyAdmin`, non-gosaki discography loader
- **Next order:** ~~u17 verifier registry~~ · ~~u18 defaults~~ · ~~u19 naming~~ → u20 Supabase CMS → u21 admin flag
- **Not executed:** refactor · FTP · deploy · DB write

## G-20u15 current active regression suite — complete

- **CLI:** `npm run verify:current-active-regression`
- **Script:** `verify-current-active-regression-suite.mjs` — **16** G-20u2–u14 + G-20u17–u18 verifiers sequential
- **Excluded:** G-20u1 audit · `verify-url-to-staging-pipeline.mjs` (G-7b+ mega) · G-20t3–t6 HEAD-pinned
- **Result:** 14/14 PASS at `3ae56b1`
- **Child HEAD pins:** G-20u2–u7/u9 normalized to NOTE (G-20t2 policy)
- **Not executed:** FTP · deploy · DB write · package regen · live preflight CLI
- **Doc:** `current-active-regression-suite.md`

## G-20u14 URL-to-staging pipeline site-aware — complete

- **CLI:** `npm run url:staging -- --site gosaki-piano --dry-run` (or `pilot-sample-static`)
- **Module:** `url-to-staging-site-registry.mjs` — `buildUrlToStagingConfigFromSite`
- **Convert:** replaced `isGosakiPianoFixture` with `loadSiteSupabaseDataForBuild({ siteKey })`
- **Plan:** convert step command includes `--site ${siteKey}`
- **Legacy:** `--config config/sites/gosaki-piano.url-to-staging.json` still works
- **Pilot:** `pilot-sample-static.url-to-staging.json` · noop hooks · null Supabase bundles
- **Not executed:** FTP · deploy · DB write · live crawl
- **Legacy verifier:** G-9c0b/G-9d historical FAILs fixed (sitemap filter → `sitemap-exclusions.mjs`; data pages → `site-generator-hooks.mjs`); `verify-url-to-staging-pipeline.mjs` **0 failed**
- **Manual steps:** `buildNextManualSteps` includes `--site`

## G-20u13 site-aware Supabase loaders — complete

- **Module:** `site-aware-supabase-loaders.mjs` — `loadSiteSupabaseDataForBuild`
- **Registry:** `supabaseSiteSlug` + `supabaseFeatures.schedule|discography`
- **Gosaki:** delegates to `loadGosakiScheduleDataForBuild` / `loadGosakiDiscographyDataForBuild`
- **Pilot:** features off → null bundles (no Gosaki loader mis-apply)
- **Convert:** `loadSiteSupabaseDataForBuild` replaces hardcoded `GOSAKI_SITE_KEY` gate
- **Not executed:** DB write · SQL mutation · FTP · deploy
- **Next:** discography `site_slug` filter when multi-site rows exist

## G-20u12 manual-upload README/CHECKLIST preflight integration — complete

- **Source:** `formatReadmeUpload` / `formatUploadChecklist` in `manual-upload-package.mjs`
- **Added:** `preflight:gosaki:*`, `preflight:pilot:staging`, generic `preflight -- --site`
- **Stale:** upload forbidden until rebuild at current HEAD + preflight PASS
- **Retained:** public-dist contents rule · no mirror/CLI FTP · G-20j production STOP
- **Regen:** next `build:gosaki:*` / `build:pilot:*` refreshes on-disk README/CHECKLIST
- **ENOTEMPTY fix:** `safe-output-cleanup.mjs` for partial `output/*-astro/node_modules`
- **Verified:** `build:pilot:staging` + `preflight:pilot:staging` PASS at `e6f2531`
- **Commit note:** commit後 package stale until rebuild + preflight PASS

## G-20u11 site-aware preflight scripts — complete

- **CLI:** `run-site-preflight.mjs` — verify-site-package → verify-package-upload-freshness
- **npm:** `preflight` generic · `preflight:gosaki:staging|production` · `preflight:pilot:staging`
- **Stale:** preflight fails at freshness step — rebuild at current HEAD before upload
- **Legacy:** build/verify/freshness convenience scripts unchanged
- **Production:** G-20j preflight still required; upload STOP
- **Not executed:** FTP · DB write · package upload
- **Next:** ~~update manual-upload README/CHECKLIST~~ — done in G-20u12

## G-20u10 site-aware package freshness CLI — complete

- **CLI:** `--site SITE_KEY --profile staging|production` resolves registry `manualUploadOut`
- **Compat:** `--package-dir` · legacy `--profile`-only Gosaki scripts unchanged
- **npm:** `verify:package-freshness` generic; pilot uses `--site pilot-sample-static`
- **Helper:** `package-freshness-target.mjs` → `resolvePackageFreshnessTarget`
- **Not executed:** FTP · DB write · package upload
- **Next:** optional preflight:pilot npm · explicit `--site gosaki-piano` on preflight scripts

## G-20u9 pilot full package build + verify — complete

- **Build:** `build:pilot:staging` → 9 files · MANIFEST siteKey pilot-sample-static
- **Verify:** `verify:pilot:staging` · `verify:package-freshness:pilot`
- **Fix:** static-public-site-expectations (no Gosaki schedule/discography gates for pilot)
- **Not executed:** FTP · DB write · production profile
- **Next:** G-20u10 real customer hook factory

## G-20u8 second-site noop hooks pilot dry-run — complete

- **Pilot:** `pilot-sample-static` · staging only · `includesAdmin: false`
- **Hooks:** DEFAULT noop — no Gosaki factory for pilot
- **Verified:** build/convert dry-run · local convert without gosaki artifacts
- **Not executed:** FTP · DB write · full pilot package build · production profile
- **Next:** G-20u9 optional full pilot package build

## G-20u7 convert pipeline siteKey propagation — complete

- **CLI:** convert `--site SITE_KEY`; build passes `--site` via `buildConvertCliArgs`
- **Resolver:** `resolveEffectiveConvertSiteKey` (explicit → fixtureDir → null)
- **Hooks:** `options.siteKey` preferred in `resolveSiteGeneratorHooks`
- **Compat:** fixture basename / matchFixture fallback · build-gosaki-* wrappers unchanged
- **Full regen:** staging verified at `528b06a` — 29 files · August 14 · MANIFEST siteKey · freshness PASS
- **Commit note:** commit後は on-disk package **stale** until regen + `verify:package-freshness:staging`
- **Next:** G-20u8 second-site pilot

## G-20u6 astro generator hook registry — complete

- **Registry:** `resolveSiteGeneratorHooks` + `DEFAULT_SITE_GENERATOR_HOOKS` + `gosaki-piano` factory
- **Generator:** `astro-generator.mjs` delegates footer, schedule data, discography, legacy stubs, post-generate
- **Compat:** existing Gosaki modules unchanged; hub/stub HTML generators remain in generator
- **Full regen:** staging verified at `3decd7f` — 29 files · August 14 · freshness PASS
- **Commit note:** commit後は on-disk package **stale** until regen + `verify:package-freshness:staging`
- **Not executed:** FTP · DB write · production upload

## G-20u5 site package npm convenience & freshness flow — complete

- **npm:** build:gosaki:staging|production (+ :dry-run) · verify:gosaki:* · preflight:gosaki:*
- **Flow:** build current HEAD → verify structure → verify freshness → CHECKLIST → manual FTP
- **Freshness:** commit after build → stale; upload needs freshness PASS at current HEAD
- **Production:** G-20j preflight still required; upload STOP
- **Not executed:** FTP · DB write · full regen

## G-20u4 verify site package generic CLI — complete

- **CLI:** `--site` `--profile` `--package-dir` optional
- **Checks:** registry MANIFEST fields · sitemap safety · 2026-08 · staging admin present/sitemap absent · production admin absent
- **Legacy:** verify-manual-upload-package.mjs → staging delegate; g20i3 → generic + doc asserts
- **Freshness:** separate from G-20t6; commit after regen → stale until regen
- **Not executed:** FTP · DB write · package regen

## G-20u3 build site package generic CLI — complete

- **CLI:** `--site gosaki-piano` `--profile staging|production` `--dry-run`
- **Core:** registry profile → convert → verify-static-public → createManualUploadPackage → verifier
- **Wrappers:** build-gosaki-staging-admin / build-gosaki-production delegate
- **Freshness:** regen → `sourceCommit` = HEAD at regen time; committing G-20u3+ advances HEAD → on-disk package **stale** until regen + `verify:package-freshness:staging|production` PASS
- **Not executed:** FTP · DB write · production upload

## G-20u2 site registry foundation — complete

- **Registry:** `siteKey`, `cmsSiteSlug`, `supabaseSiteSlug`, package profiles staging/production
- **MANIFEST:** optional `siteKey`, `cmsSiteSlug`, `supabaseSiteSlug`, `packageKey` via `--site-key`
- **Compat:** `build-gosaki-*` unchanged · `resolveGosakiPackageBuildProfile` same critical fields
- **Not executed:** FTP · DB write · package regen · wrapper removal

## G-20u1 hardcode generalization audit — complete

- **Inventory:** build-gosaki-* · gosaki-package-build-profile · package.json paths · astro-generator hooks
- **Touch count site #2:** ~12–18 files (excluding historical verifiers)
- **P0:** site-neutral profile loader · generic build CLI · verify-site-package · site registry
- **Safety:** freshness gate exists; slug inconsistency gosaki vs gosaki-piano flagged
- **Not executed:** large refactor · FTP · DB write

## G-20t6 package freshness gate — complete

- **Gate:** sourceCommit === git HEAD → PASS; mismatch → STOP
- **CLI:** npm run verify:package-freshness:staging | :production
- **Module:** validatePackageFreshness in package-upload-safety.mjs
- **Docs:** README/CHECKLIST include freshness preflight step
- **Not executed:** FTP · deploy · package regen (unless operator)

## G-20t5 staging profile current-head regen dry-run — complete

- **Command:** `node scripts/build-gosaki-staging-admin-package.mjs`
- **Output:** `output/manual-upload/gosaki-piano/`
- **MANIFEST:** targetEnvironment=staging · includesAdmin=true · sourceCommit=c9d35d7
- **August:** schedule/2026-08 · 14 cards · supabase
- **Not executed:** FTP · deploy · DB write

## G-20t4 production profile full regen dry-run — complete

- **Command:** `npm run build:gosaki-production-package` (local only)
- **Output:** `output/manual-upload/gosaki-piano-production/`
- **MANIFEST:** targetEnvironment=production · includesAdmin=false · sourceCommit=55d0364
- **August:** schedule/2026-08 · 14 event cards · supabase source
- **Upload:** blocked (`TBD_G-20i`)
- **Doc:** gosaki-production-profile-full-regen-dry-run.md
- **Not executed:** FTP · deploy · DB write

## G-20t3 package upload safety hardening — complete

- **MANIFEST:** targetEnvironment · packageProfileName · includesAdmin · intendedRemotePath · publicBaseUrl · sourceCommit
- **Production zip:** gosaki-piano-production-manual-upload.zip
- **Verifier:** verify-g20t3 + extended G-20i3 / verify:manual-upload
- **Doc:** gosaki-package-upload-safety-hardening.md
- **Not executed:** FTP · deploy · DB write

## G-20t2 schedule month discovery generalization — complete

- **Module:** schedule-month-discovery.mjs · resolveScheduleMonthsForBuild()
- **Change:** removed expectedMonths Supabase filter; months from published rows
- **Override:** optionalMonthOverride null — empty-month hub only
- **Verifier:** historical HEAD pins are NOTE-only (G-20t2 follow-up)
- **Doc:** gosaki-schedule-month-discovery-generalization.md

## G-20t1 sitemap admin exclusion hardening — complete

- **Module:** sitemap-exclusions.mjs (admin / staging-shell / API / legacy month)
- **Sitemap:** 12 URLs · no /admin/
- **Doc:** gosaki-sitemap-admin-exclusion-hardening.md

## G-20s2b Contact HubSpot E2E execution closure — complete

- **Submit:** operator manual ×1 · success message confirmed
- **Notification:** received · payload reflected
- **Notes:** spam classification possible · free form branding visible (non-P0)
- **P0-C1:** RESOLVED
- **Doc:** gosaki-contact-hubspot-e2e-execution-closure.md

## G-20s2 Contact HubSpot E2E verify — complete

- **URL:** /cms-kit-staging/gosaki-piano/contact/
- **Form:** HubSpot iframe · 姓/名/Eメール/お問い合わせ内容 · 送信
- **Test payload:** documented · operator manual submit only
- **Cursor submit:** no
- **Doc:** gosaki-contact-hubspot-e2e-verify.md
- **Next:** G-20s2b inbox confirmation

## G-20s1 mobile device QA — complete

- **Viewport:** 390×844 · Playwright Chromium
- **PASS:** MENU toggle · schedule hub/august 14 cards · discography · about · footer
- **P0 open:** Contact HubSpot submit E2E (iframe renders · submit not tested)
- **Doc:** gosaki-mobile-device-qa.md
- **Next:** G-20s2

## G-20r4e schedule August manual upload execution closure — complete

- **Upload:** operator manual · full public-dist 29 files · remote /cms-kit-staging/gosaki-piano/
- **HTTP verify:** PASS on all 6 URLs · 14 August cards · legacy stub noindex
- **Doc:** gosaki-schedule-manual-upload-execution-closure.md
- **FTP re-execution:** forbidden

## G-20r4d schedule August upload preflight — complete

- **Scope:** full public-dist 29 files (recommended)
- **Doc:** gosaki-schedule-upload-preflight.md

## G-20r4c schedule public output review — complete

- **Review:** local public-dist PASS · P0 none · P1/P2 documented
- **Doc:** gosaki-schedule-public-output-review.md
- **Next:** G-20r4d-upload-preflight (FTP still forbidden until preflight)

## G-20r4b schedule local regen dry-run — complete

- **Regen:** build-gosaki-staging-admin-package.mjs PASS
- **August:** JSON 14 · HTML 14 cards · legacy stub · sitemap canonical only
- **Exclusions:** 007/009/013 · hold 008/018 · test 014/001 — all absent
- **Doc:** gosaki-schedule-local-regen-dry-run-result.md
- **Next:** G-20r4c-public-output-review

## G-20r4a schedule August generation path enablement — complete

- **Code:** supabase-schedule-read.mjs expectedMonths + 2026-08 · astro-generator data-driven legacy stubs
- **Doc:** gosaki-schedule-august-generation-path-enablement.md
- **Next:** G-20r4b-local-regen-dry-run

## G-20r4 schedule August public reflection plan — complete

- **Doc:** gosaki-schedule-public-reflection-plan.md
- **Sequence:** G-20r4a code → G-20r4b regen → G-20r4c QA → G-20r4d upload preflight → G-20r4e manual upload
- **Blocker:** `supabase-schedule-read.mjs` expectedMonths needs `2026-08`
- **FTP:** operator manual only（戸山さん）· AI/Cursor 実行禁止 · 手動チェックリスト（承認文言不要）
- **Next:** G-20r4a-expected-months-code-gate

## G-20r3a schedule August DB INSERT execution closure — complete

- **approvalId:** G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice
- **Target:** kmjqppxjdnwwrtaeqjta only · operator SQL Editor · all checks PASS
- **Doc:** gosaki-schedule-august-db-insert-execution-closure.md
- **Do not re-run** G-20r3 batch INSERT without new approval
- **Next:** G-20r4-schedule-public-reflection-plan (regen / diff / sitemap 2026-08)

## G-20r3 schedule August DB INSERT preflight — complete (execution closed in G-20r3a)

- **SQL draft:** scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql

## G-20s whole-site product quality audit — complete

- **P0:** schedule aug data (G-20r3) · mobile QA · HubSpot E2E
- **P1:** `<>` parity · copy/OGP · legacy stub JP · empty-field UI QA
- **P2:** sitemap `/admin/` · cutover SEO
- **Defer:** News · hosted admin · FTP · DNS cutover
- **G-20r3:** proceed OK
- **Doc:** `gosaki-whole-site-product-quality-audit.md`

## G-20r2b schedule product quality policy — complete

- **Priority:** product quality > incomplete Wix parity
- **<>:** retain (not Kit bug) · empty labels forbidden in UI
- **hold:** #8 堤智恵子 Trio · #18 Set Sail Quartet
- **published=false:** #7, #9, #13 (8/10·8/15 Duo · 8/21)
- **readyForG20r3:** true (17 insert)
- **Doc:** `gosaki-schedule-product-quality-policy.md`

## G-20r2a client confirmation question list — complete

- **Mandatory:** 8/10 Duo · 8/15 Duo · 8/21 原田茅子Quartet
- **Partial gaps:** #1–2, #8, #11, #14, #18
- **`<>`:** source parity — client confirm for new site display
- **Message draft:** in question list doc (G-20r2b to finalize)
- **Internal recommend:** insert 16 published · 3 draft · `<>` keep
- **Next:** G-20r2b message final
- **Doc:** `gosaki-schedule-client-confirmation-question-list.md`

## G-20r2 schedule August seed planning — complete

- **Candidates:** 19 records · `schedule-2026-08-001` … `019`
- **Kit schema:** verified from gosaki-schedules.json (60 rows, 03–07)
- **insert:** 16 · **needs_client_confirmation:** 3 (#7, #9, #13)
- **sort_order:** proposed 1–19 (July bump TBD in G-20r3)
- **SQL:** not created
- **Next:** G-20r2b → G-20r3 → G-20r4

## G-20r1b limited public URL capture — complete

- **URL:** `https://www.gosaki-piano.com/2026-08` (GET only; trailing `/` → 301 redirect)
- **Events:** 19 detected from SSR HTML
- **Artifacts:** `output/gosaki-source-captures/2026-08/` (gitignored)
- **Safety:** no login/crawl/DB/Save/regen/FTP
- **Supersedes:** G-20r1a operator manual capture
- **Superseded for seed by:** G-20r2
- **Next:** G-20r2a → G-20r3 → G-20r4

## G-20r1 schedule source capture plan — complete

- **Goal:** Operator manual procedure (plan only)
- **Superseded for execution by:** G-20r1b
- **Doc:** `gosaki-schedule-source-capture-plan.md`

## G-20r schedule source freshness audit — complete

- **Kit:** schedule months 03–07 only; 0 JSON rows for 2026-08; no sitemap 08
- **Wix:** **19 events** on `/2026-08` (G-20r1b public GET — HIGH confidence)
- **Gap type:** source freshness — **not** package staleness vs G-22j
- **Next chain:** G-20r2 seed → G-20r3 preflight → G-20r4 reflection
- **Doc:** `gosaki-schedule-source-freshness-audit.md`

## G-20q internal preview readiness gap audit — complete

- **Verdict:** NOT_READY for client · READY_WITH_NOTES for internal staging review
- **P0:** Wix **2026-08** not in Kit (source freshness gap — **confirmed G-20r**) · mobile QA · HubSpot E2E
- **`<>` titles:** Wix source parity on live site — **not** Kit conversion defect · P1 / Content note
- **Not G-20p issue:** package staleness vs G-22j remains closed for 03–07 published content
- **Next:** G-20r3a operator batch INSERT execution
- **Doc:** `gosaki-internal-preview-readiness-gap-audit.md`

## G-20j production upload preflight refresh — complete

- **Goal:** Refresh G-20j preflight with G-20p findings
- **Package:** 26 files verified · `deployBase=/` · admin excluded · `/about/` not `/profile/`
- **Content:** GO · **Execution:** HOLD (DNS/SSL/MX/remote path/sign-off)
- **FTP:** Operator manual only — AI provides file list + procedure docs only
- **Next:** G-20j1 client sign-off outreach
- **Doc:** `gosaki-production-upload-preflight-refresh.md`

## G-20p production package staleness review — complete

- **Goal:** Verify whether G-20i3 production package is stale after G-22j Schedule P0
- **Finding:** Schedule published content **NOT stale** — `gosaki-schedules.json` MD5 identical to G-22i3 staging; July 14 cards; `008` present; no PoC text
- **HTML:** All `/schedule/*` + legacy stubs **MATCH** staging when deploy-profile-normalized
- **SEO:** Production package has correct `www.gosaki-piano.com` canonicals · indexable primary routes
- **Verdict:** Content **GO** · G-20j execution **HOLD** · regen **not required**
- **Minor:** Package `CHECKLIST.md` still has staging wording (P1 doc fix in preflight refresh)
- **Next:** G-20j upload preflight refresh (read-only)
- **Doc:** `gosaki-production-package-staleness-review.md`
- **Verifier:** `verify-gosaki-production-package-staleness-review.mjs`

## Gosaki production-cutover gap refresh — complete

- **Goal:** Refresh G-20a/G-20j cutover gaps to post-G-22j Schedule P0 state
- **G-20j STOP:** unchanged — DNS/SSL/MX/remote path + client sign-off pending
- **G-22j impact:** Schedule CMS P0 closed; G-20i3 package predates P0 — staleness flagged
- **Checklists:** route/canonical/SEO/robots/sitemap · Contact/HubSpot · mobile · client sign-off · deploy前後 · P0/P1/P2/保留 · high-risk separation
- **Next task:** G-20p production package staleness review (read-only — no regen)
- **Doc:** `gosaki-production-cutover-gap-refresh.md`
- **Verifier:** `verify-gosaki-production-cutover-gap-refresh.mjs`

## Gosaki completion audit — complete

- **Goal:** Inventory remaining Gosaki-piano work before production cutover
- **Completed areas:** static staging (G-7/8), Schedule CMS P0 (G-22), YouTube/About/Discography/Contact CMS slices, canonical+legacy routes (G-9c), prod package build (G-20h2), discography test cleanup (G-20e)
- **P0 gaps:** production cutover checklist, full package verify, client sign-off, DNS/SSL, robots/canonical flip, contact E2E, mobile spot-check, hosted admin plan
- **P1:** discography UX, reflection runbooks, admin copy, Supabase prod strategy
- **P2:** G-23 resume, News CMS, image upload, FTP auto, seiichijazz
- **保留:** G-23o crawl, FTP auto-apply, closed P0 Saves, `/admin` prod
- **Next task:** Gosaki production-cutover gap refresh (read-only/local)
- **Doc:** `gosaki-completion-audit.md`

## G-23 series — paused at d7a7250

- **Complete through:** G-23n (allowlist config)
- **Deferred:** G-23o live crawl · G-23p crawl review
- **Resume when:** Gosaki completion milestones met or operator directs

## G-23n live crawl allowlist config — complete

- **Goal:** Machine-verifiable allowlist before G-23o live crawl-dry-run
- **Config:** `onboarding.crawl-allowlist.example.json` — readyForLiveCrawl=false default
- **Validator:** static checks only — maxPages≤20 · concurrency≤2 · sameOriginOnly · deny flags
- **Inspect:** `inspect-onboarding-crawl-allowlist.mjs` — human + `--json`
- **Not executed:** live crawl · DNS · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23n-static-to-astro-live-crawl-allowlist-config.mjs`
- **Next:** G-23o first approved crawl (real URL + approvalId + operator approval)

## G-23m sample full dry-run report artifact review — complete

- **Goal:** Confirm G-23l report artifacts are operator-review-ready before live crawl
- **Verdict:** PASS_WITH_KNOWN_WARNING — 1 warning (news unmapped `/news/` page)
- **Reviewed:** summary (steps 0–9, seedCounts, planOnly) · seeds-preview (reviewOnly, not SQL) · human-review (checklist) · risk-summary (blocked ops)
- **Improvements:** reviewOnly/doNotExecuteAsSql · operator checklist · do-not-proceed · next-phase risk table
- **Not executed:** live crawl · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23m-static-to-astro-sample-full-dry-run-report-artifact-review.mjs`
- **Next:** G-23n allowlist · G-23o first approved crawl · G-23p crawl result review

## G-23l onboarding report output — complete

- **Goal:** Save orchestrator dry-run results as reviewable local report artifacts
- **CLI:** `--write-report` · `--report-out` on `run-onboarding-orchestrator.mjs`
- **Writer:** `onboarding-report-writer.mjs` — path-safe, onboarding-reports/ only
- **Strategy:** `{siteSlug}/latest/` overwrite (output/ gitignored)
- **Reports:** summary.json · seeds-preview.json (not SQL) · human-review.md · risk-summary.md
- **Not executed:** live crawl · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23l-static-to-astro-onboarding-report-output.mjs`
- **Next:** G-23m report artifact review · G-23n allowlist · G-23o first approved crawl

## G-23k crawl-dry-run safety planning — complete

- **Goal:** Safety design before live crawl-dry-run (post G-23j non-network full dry-run)
- **Gates:** `explicitCrawlApprovalId` · `requireHumanReview` · `sameOriginOnly` · `maxPages` ≤ 20 · `concurrency` ≤ 2 · timeout · robots · denylist · private IP block
- **URL:** https only recommended; localhost/private IP/example.com/fixture blocked; `sourceUrl` vs `publicDomain` documented
- **Schema:** `liveCrawl=true` · `fixtureOnly=false` · pages/assets/warnings/blocked/safetySummary
- **Orchestrator:** future `crawl-dry-run` mode — Step 2 fixture → crawl source; Steps 3–5 unchanged
- **Failure policy:** missing approval → FAIL; unsafe URL → FAIL; redirect off-origin → STOP; login → SKIP
- **Not executed:** live crawl · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23k-static-to-astro-crawl-dry-run-safety-planning.mjs`
- **Next:** G-23l report output · G-23m design closure · G-23n allowlist · G-23o first approved crawl (requires operator approval)

## G-23j first non-network sample full dry-run — complete

- **Goal:** Pseudo-full 30-min onboarding flow without network/DB/package/FTP
- **Mode:** `full-dry-run` — fixture-only · planOnly steps 6–8
- **Sample:** pages 6 · assets 5 · candidates 7 (schedule 2 · others 1)
- **Warnings:** news module unmapped (no /news/ page in fixture)
- **Not executed:** crawl · network · DB · SQL · package · Astro build · FTP · deploy
- **Verifier:** `verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs`
- **Next:** G-23k crawl planning · G-23l report output · G-23m report artifact · G-23n live crawl safety

## G-23i fixture mode orchestrator integration — complete

- **Goal:** Orchestrator = standard fixture entry; G-23d script = compatibility wrapper
- **Standard:** `run-onboarding-orchestrator.mjs --config --fixture --mode fixture-dry-run`
- **Compat:** `run-onboarding-fixture-dry-run.mjs <config> <fixture>` delegates + maps G-23d output
- **Seed counts:** both entries match (schedule 2 · others 1)
- **Not executed:** crawl · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23i-static-to-astro-fixture-mode-orchestrator-integration.mjs`
- **Next:** G-23j full dry-run · G-23k crawl planning · G-23l report output

## G-23h orchestrator skeleton — complete

- **Goal:** Wire G-23b–G-23g into single fixture/dry-run orchestrator CLI
- **Artifacts:** `run-onboarding-orchestrator.mjs` · result doc · verifier
- **Modes:** validate-only · fixture-dry-run; others NOT_IMPLEMENTED
- **Steps:** 0–9 with planOnly DB/package/FTP when gates false
- **Sample fixture:** schedule 2 · others 1 each — **PASS**
- **Not executed:** crawl · network · DB · SQL · package · FTP · deploy
- **Verifier:** `verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs`
- **Next:** G-23i fixture integration · G-23j full dry-run · G-23k crawl-dry-run planning

## G-23g seed extractor standardization — complete

- **Goal:** Reusable seed candidate extractor for orchestrator (read-only, no DB SQL)
- **Artifacts:** `lib/onboarding-seed-extractor.mjs` · `inspect-onboarding-seed-extraction.mjs` · result doc
- **Supported modules:** schedule · news · profile · discography · video · contact
- **Standard format:** moduleId · siteSlug · sourcePath · normalized · confidence · status
- **Sample fixture:** schedule 2 · others 1 each — **PASS**
- **Not executed:** DB · network · crawl · SQL · package · FTP · orchestrator impl
- **Verifier:** `verify-g23g-static-to-astro-seed-extractor-standardization.mjs`
- **Next:** G-23h orchestrator skeleton · G-23i fixture integration · G-23j full dry-run

## G-23f CMS preset registry — complete

- **Goal:** Code-level CMS preset registry for 30-min onboarding (read-only)
- **Artifacts:** `lib/cms-preset-registry.mjs` · `inspect-cms-preset-registry.mjs` · result doc
- **Presets:** musician-basic (schedule default on) · lesson-studio-basic · shop-basic
- **validateCmsPresetConfig:** unknown module FAIL · enabled module table/route/publishField must match registry
- **Gosaki:** `onboarding.gosaki-piano.example.json` → **PASS**
- **Not executed:** DB · network · crawl · package · FTP · orchestrator impl
- **Verifier:** `verify-g23f-static-to-astro-cms-preset-registry.mjs`
- **Next:** G-23g seed extractor · G-23h orchestrator skeleton · G-23i fixture integration

## G-23e onboarding orchestrator planning — complete

- **Goal:** Design unified orchestrator for 30-min onboarding pipeline (planning only)
- **Artifacts:** `static-to-astro-onboarding-orchestrator-planning.md`
- **Steps:** 0 validate → 1 intake → 2 crawl/fixture → 3 classify → 4 CMS plan → 5 seed plan → 6 DB plan → 7 package plan → 8 diff/QA → 9 handoff
- **CLI modes:** validate-only · fixture-dry-run · crawl-dry-run · seed-dry-run · package-dry-run · full-dry-run · apply-staging-db · prepare-upload-plan (all future)
- **Safety:** gate matrix + fail-fast policy documented
- **G-23d:** prototype for fixture mode — do not replace until G-23i
- **Not executed:** orchestrator impl · live crawl · DB · package · FTP · deploy
- **Verifier:** `verify-g23e-static-to-astro-onboarding-orchestrator-planning.mjs`
- **Next:** G-23f preset registry · G-23g seed extractor · G-23h skeleton

## G-23d onboarding sample site dry-run — complete

- **Goal:** Fixture-only 30-min onboarding dry-run report without live crawl / DB / package / FTP
- **Artifacts:** `run-onboarding-fixture-dry-run.mjs` · `onboarding.sample-musician-fixture.example.json` · `sample-musician-basic-crawl-result.json`
- **Flow:** G-23c validator → fixture load → classify → CMS seeds → supabase check (no DB) → output paths → report
- **Pages:** / · /profile/ · /schedule/ · /discography/ · /videos/ · /contact/
- **Seeds:** schedule×2 · news×1 · profile×1 · discography×1 · video×1 · contact×1
- **CLI:** `--json` supported
- **Not executed:** live crawl · network · DB write · package regen · FTP · deploy
- **Verifier:** `verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs`
- **Next:** G-23e orchestrator planning · G-23f CMS preset registry · G-23g seed extractor

## G-23c onboarding config validator — complete

- **Goal:** Validate G-23b onboarding config JSON locally before pipeline execution
- **Artifacts:** `validate-onboarding-config.mjs` · `static-to-astro-onboarding-config-validator-result.md`
- **Gosaki:** `onboarding.gosaki-piano.example.json` → **PASS** (schedule enabled)
- **Schema example:** JSON Schema draft — **not** an onboarding instance (validator FAIL expected)
- **Guards:** safety gates · ftp.disabled · forbidden prod ref · service_role keys · secrets/tokens · output paths under `tools/static-to-astro/output/`
- **CLI:** `--json` for machine-readable result
- **Not executed:** crawl · DB write · package regen · FTP · deploy · network
- **Verifier:** `verify-g23c-static-to-astro-onboarding-config-validator.mjs` (77 PASS)
- **Next:** G-23d fixture-only dry-run · G-23e orchestrator planning · G-23f CMS preset registry

## G-23b onboarding config schema planning — complete

- **Goal:** Design onboarding config schema for 30-minute build flow
- **Artifacts:** `static-to-astro-onboarding-config-schema-planning.md` · `onboarding.schema.example.json` · `onboarding.gosaki-piano.example.json`
- **Config sections:** identity · crawl · cms.modules · supabase · output · ftp (disabled) · safetyGates · approvals
- **musician-basic modules:** schedule (enabled) · news/profile/discography/video/contact (planned)
- **Safety defaults:** allowDbWrite=false · allowPackageBuild=false · allowFtpUpload=false · allowProductionDeploy=false
- **Gosaki:** siteSlug gosaki-piano · staging ref kmjqppxjdnwwrtaeqjta · FTP disabled
- **Not executed:** CLI · crawl · DB write · package regen · FTP · deploy · secrets in config
- **Verifier:** `verify-g23b-static-to-astro-onboarding-config-schema-planning.mjs`
- **Next:** G-23c config validator · G-23d sample site dry-run

## G-22h6a Schedule republish UPDATE implementation — complete

- **Goal:** Implement republish UPDATE save path; default disabled until G-22h6b
- **Target:** `schedule-2026-07-008` · id `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` only
- **Module:** `executeG22hScheduleRepublishUpdateSave` · operation `republish-update`
- **Payload:** `{ published: true }` only · optimistic lock · publicReflectionPending=true
- **UI:** 再公開を保存（現在は無効）default; 再公開を保存 when env arm + gates pass
- **Not executed:** Save · DB write · SQL · RLS · package · FTP · public reflection
- **Doc:** `gosaki-schedule-republish-update-implementation.md` · **Verifier:** `verify-g22h6a-...mjs`
- **Next:** G-22h6b operator Save once

## G-22h5 Schedule republish target preflight — complete

- **Commit:** `fabfd2f`
- **G-22h6 first candidate:** `schedule-2026-07-008`
- **Next:** Superseded by G-22h6a

## G-22h4b Schedule republish UI wording cleanup — complete

- **Goal:** Replace G-22h4 residual English operator copy with natural Japanese
- **Commit:** `92eaf55`
- **Behavior:** Save disabled / alert-only stub **unchanged**
- **Doc:** `gosaki-schedule-republish-ui-wording-cleanup.md` · **Verifier:** `verify-g22h4b-...mjs`
- **Next:** Superseded by G-22h5 preflight

## G-22h4 Schedule republish dry-run read-only QA — complete

- **Goal:** Operator manual login read-only QA of G-22h3 republish dry-run UI on live dev
- **Commit:** `4e45f90`
- **Target:** `schedule-2026-07-008` · id `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` · published=false
- **Flow:** 非公開のみ filter → keyword → 再公開案を作成 → 変更を確認
- **Preview PASS:** operation republish/republish-update · published false→true · actualWrite=false · publicReflectionPending=true
- **Save:** 再公開を保存（準備中）disabled — **not clicked**
- **Not executed:** Save · DB write · SQL · RLS · package · FTP · public reflection
- **Residual at QA time:** English Save gate copy — **fixed in G-22h4b**
- **Doc:** `gosaki-schedule-republish-dry-run-readonly-qa.md` · **Verifier:** `verify-g22h4-...mjs`
- **Next:** Superseded by G-22h4b

## G-22h3 Schedule republish dry-run UI implementation — complete

- **Goal:** Republish dry-run / preview UI; Save disabled until G-22h6
- **Commit:** `646f680`
- **Module:** `gosaki-schedule-republish-dry-run.ts` — `executeG22hScheduleRepublishDryRun`
- **UI:** `#gosaki-schedule-republish-btn` · `editDraftMode=republish` · procedure hint `republish`
- **Save:** alert-only stub — `再公開を保存（準備中）` always disabled
- **Output:** published false→true · actualWrite=false · publicReflectionPending=true · contentFieldsChanged=false
- **Not executed:** DB write · Save · SQL · RLS · package · FTP · public reflection
- **Doc:** `gosaki-schedule-republish-dry-run-implementation.md` · **Verifier:** `verify-g22h3-...mjs`
- **Next:** Superseded by G-22h4 read-only QA

## G-22h2 Schedule republish dry-run UI planning — complete

- **Goal:** Concrete dry-run module / UI / save target panel / approvalId design before G-22h3 implementation
- **Dry-run module:** `executeG22hScheduleRepublishDryRun` — input id/legacy_id/expectedBeforeUpdatedAt/published=false; output operation republish, actualWrite=false, publicReflectionPending=true
- **UI flow:** 非公開行選択 → 再公開案を作成 → 変更を確認 → target panel; 再公開を保存 disabled until G-22h6
- **Save target panel:** id, legacy_id, date, title, published false→true, expectedBeforeUpdatedAt, actualWrite=false, public reflection pending note
- **approvalId:** dry-run `G-22h-gosaki-schedule-republish-dry-run`; Save `G-22h-gosaki-schedule-republish-update-non-dry-run-slice`
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED` (G-22h6 only)
- **Candidates:** 008 (recommended first Save) · 014 · 001 — dry-run QA on any published=false row
- **Implementation files listed:** republish-dry-run.ts, config/guards/save stubs, operator-ui, astro template, admin.css (G-22h3 — not touched in G-22h2)
- **Not executed:** implementation · Save · DB write · SQL · RLS · package · FTP · public reflection
- **Doc:** `gosaki-schedule-republish-dry-run-ui-planning.md` · **Verifier:** `verify-g22h2-gosaki-schedule-republish-dry-run-ui-planning.mjs`
- **Next:** G-22h3 republish dry-run implementation

## G-22h1 Schedule republish planning — complete

- **Goal:** Plan safe republish (`published=false→true`) for Gosaki Schedule operator UI
- **Definition:** UPDATE `{ published: true }` only — not INSERT / physical DELETE; content fields unchanged
- **Reuse:** G-22f unpublish pattern — `updateScheduleWrite`, optimistic lock, config/guards/save module shape, operator UI flow
- **Dedicated:** republish guards (before published=false), new approvalId/arm, `editDraftMode=republish`, mutual exclusion
- **Candidates:** 008 (G-22f unpublish row — recommended first Save with operator approval) · 014 (duplicate test) · 001 (new event test)
- **High-risk gates:** G-22h6 actual UPDATE separate from public reflection / FTP
- **Future slices:** G-22h2 dry-run planning → h3 implementation → h4 QA → h5 preflight → h6 Save once → h7 closure
- **Not executed:** implementation · Save · DB write · SQL · RLS · package · FTP · public reflection
- **Doc:** `gosaki-schedule-republish-planning.md` · **Verifier:** `verify-g22h1-gosaki-schedule-republish-planning.mjs`
- **Next:** G-22h2 republish dry-run UI/module planning

## G-22g2b Schedule P0 UX summary / closure — complete

- **Goal:** Close G-22g1a–G-22g2a P0 UX chain; record achievements, residuals, high-risk deferrals
- **Achieved:** legacy_id visibility · dev/mock isolation · save preview/target · admin read closure · 008 visible after login · procedure hints · read-only QA runner
- **Residual:** transient load error alert (non-blocking) · live login re-smoke deferred · interactive preview auto-QA deferred
- **Deferred high-risk:** republish · public reflection · package/FTP · physical DELETE · production
- **Not executed:** Save · DB write · SQL · RLS · package · FTP
- **Doc:** `gosaki-schedule-p0-ux-summary.md` · **Verifier:** `verify-g22g2b-gosaki-schedule-p0-ux-summary.mjs`
- **Next:** republish planning · public reflection planning

## G-22g2a Schedule P0 UX read-only QA — complete

- **Goal:** G-22g1a〜G-22g2 UX improvements verified on live dry-run page without Save
- **Result:** HTTP 200 · Transform error none · 27/27 HTML marker checks PASS · preview module smoke PASS
- **G-22g2:** procedure hints / DB unchanged copy / save-once notes — **PASS**
- **G-22g1f:** SSR bootstrap 58 published-only; login後 behavior regression **PASS** (G-22g1f2c)
- **Residual:** transient load error alert on SSR (non-blocking)
- **Not executed:** Save · DB write · SQL · package · FTP · live browser login re-smoke
- **Doc:** `gosaki-schedule-p0-ux-readonly-qa.md` · **Verifier:** `verify-g22g2a-gosaki-schedule-p0-ux-readonly-qa.mjs` · **QA runner:** `run-g22g2a-schedule-p0-ux-readonly-qa.mjs` (re-runnable)
- **Next:** Schedule P0 UX まとめ

## G-22g2 Schedule operator procedure hints — complete

- **Goal:** operator が次に何を押すか / 保存前か / DB write かを迷わない UI ヒント
- **Added:** static 4-card panel · dynamic save-target procedure detail · admin-read unpublished hints · save button state copy
- **Safety copy:** DBは変わりません · 保存前プレビュー · 保存1回のみ（連打禁止） · 非公開化≠物理削除 · 削除（準備中）未使用
- **Not changed:** save modules · write adapter · approvalId registry · RLS
- **Not executed:** Save · DB write · SQL · package · FTP
- **Doc:** `gosaki-schedule-operator-procedure-hints.md` · **Verifier:** `verify-g22g2-gosaki-schedule-operator-procedure-hints.mjs`
- **Next:** Schedule P0 UX QA · summary · republish planning (deferred)

## G-22g1f3 Schedule authenticated admin read closure — complete

- **Chain:** G-22g1e investigation → G-22g1f plan → G-22g1f1 impl → G-22g1f2 QA → G-22g1f2c operator smoke → **closure**
- **Reached:** login後 admin read; published=false rows visible; 008 under 非公開+keyword; selected summary OK
- **Operator smoke:** 60件 / 非公開2件 · banner authenticated
- **Not touched:** RLS / grant / service_role / public site / package / FTP
- **Residual:** brief load error message — UX polish candidate; not blocking
- **Doc:** `gosaki-schedule-authenticated-admin-read-closure.md` · **Verifier:** `verify-g22g1f3-...mjs`
- **Next:** G-22g2 · Schedule P0 UX summary · republish planning (deferred)

## G-22g1f2c Schedule operator login smoke result — complete

- **Operator:** manual staging admin login (credentials **not recorded**)
- **Banner:** Supabase admin read（authenticated）— **60件** / **非公開2件**
- **008:** visible — filter「非公開のみ」+ keyword `schedule-2026-07-008` — **1件**
- **Fields confirmed:** legacy_id · id · date 2026-07-17 · title `<>` · published=false · updated_at 2026-07-06T13:58:41.425402+00:00
- **Selected summary:** legacy_id / id / 非公開 / updated_at — **PASS**
- **Transient error:** brief「読み込めませんでした」— resolved; **non-blocking**
- **No Save / DB write**
- **Dev server:** stopped · port 4321 **LISTEN none**
- **Doc:** `gosaki-schedule-authenticated-admin-read-operator-smoke-result.md` · **Verifier:** `verify-g22g1f2c-...mjs`
- **Next:** G-22g1f3 · G-22g2

## G-22g1f2 Schedule authenticated admin read QA — complete

- **SSR bootstrap:** 58 rows · all `published=true` · **008 not in SSR** (expected anon/RLS)
- **Live login QA:** **deferred** — `G9J5_STAGING_ADMIN_EMAIL` / `SUPABASE_ADMIN_EMAIL` UNSET in local env
- **Filter simulation:** 008 visible under「非公開のみ」+ keyword when in admin dataset — **PASS**
- **Selected summary:** field model matches G-22f5 expected values — simulation **PASS**
- **Fallback:** `revertToSsrBootstrapRows` + unsigned module `ssr-bootstrap` — **PASS**
- **No Save / DB write / RLS change**
- **Doc:** `gosaki-schedule-authenticated-admin-read-qa.md` · **Verifier:** `verify-g22g1f2-...mjs`
- **Next:** G-22g2 · optional operator login smoke

## G-22g1f1 Schedule authenticated admin read implementation — complete

- **Module:** `gosaki-schedule-authenticated-admin-read.ts` — SELECT only via session-bearing `getStagingSupabaseClient`
- **UI:** `runAuthenticatedAdminReadRefetch` + `onAuthStateChange`; `ssrBootstrapRows` fallback on error/logout
- **Banner:** `--live` bootstrap · `--admin` · `--loading` · `--warn` · `--mock`
- **Safety:** no RLS/grant/service_role; save modules untouched; no env arm
- **QA target:** `schedule-2026-07-008` under「非公開のみ」— **G-22g1f2**
- **No Save / DB write in this phase**
- **Doc:** `gosaki-schedule-authenticated-admin-read-implementation.md` · **Verifier:** `verify-g22g1f1-...mjs`
- **Next:** G-22g1f2

## G-22g1f Schedule authenticated admin read planning — complete

- **Policy:** keep SSR anon bootstrap; after login refetch with browser Supabase session (`getStagingSupabaseClient`)
- **Module (f1):** `gosaki-schedule-authenticated-admin-read.ts` — SELECT only, site_slug filter, audit split
- **UI:** banner modes bootstrap / admin-authenticated / loading / error-fallback; filters unchanged
- **Auth hook:** operator subscribes to same client `onAuthStateChange`; no gate core change required
- **Safety:** no RLS/grant/service_role; write modules untouched; fallback to SSR rows on error
- **QA target:** `schedule-2026-07-008` under「非公開のみ」after f1+f2
- **No implementation / Save / DB write**
- **Doc:** `gosaki-schedule-authenticated-admin-read-plan.md` · **Verifier:** `verify-g22g1f-gosaki-schedule-authenticated-admin-read-plan.mjs`
- **Next:** G-22g1f1 · G-22g1f2

## G-22g1e Schedule admin read / unpublished visibility — complete

- **Problem:** G-22g1d — `schedule-2026-07-008` not in operator SSR list after unpublish
- **Read path:** Astro SSR → `loadSchedulesForSiteSlugRead` → `getStagingSupabaseClient(anonKey)` — **no auth session**
- **RLS:** anon sees `published=true` only (`schedules_public_select`); write uses `authenticated`+`is_admin()` (`schedules_admin_all`)
- **Not G-22g1 regression** — UI filters cannot show rows never loaded
- **Recommended:** Option B — SSR published bootstrap + **client refetch** after login (no RLS/grant change first)
- **No implementation / RLS / Save / DB write**
- **Doc:** `gosaki-schedule-admin-read-unpublished-visibility.md` · **Verifier:** `verify-g22g1e-gosaki-schedule-admin-read-unpublished-visibility.mjs`
- **Next:** G-22g1f planning · G-22g1f1 implementation · G-22g1f2 QA

## G-22g1d Schedule P0 UX QA — complete

- **Scope:** G-22g1a list UX · G-22g1b dev/mock isolation · G-22g1c preview/target panel
- **Method:** dry-run dev HTTP 200 + HTML markers + duplicate/new/unpublish module smoke
- **PASS:** legacy_id column · operator guide · read-source supabase · dev-mock zone · selected summary shell · save-target panel · save result labels (source)
- **Known:** `schedule-2026-07-008` absent from anon SSR (RLS); default published filter hides unpublished when present
- **No Save** · dev server stopped · port 4321 LISTEN none
- **Doc:** `gosaki-schedule-p0-ux-qa.md` · **Verifier:** `verify-g22g1d-gosaki-schedule-p0-ux-qa.mjs`
- **Next:** G-22g2 · Schedule P0 summary

## G-22g1c Schedule save preview / target confirmation — complete

- **Problem:** G-22f5 — operator unclear which row / which button; `expectedBeforeUpdatedAt` looked like post-save `updated_at`
- **Pre-save panel:** operation · legacy_id · id · date · title · published before/after · safety flags · `actualWrite=false` badge
- **Save target panel:** `#gosaki-schedule-save-target-panel` near Save — identity visible before click
- **Workflow steps:** e.g. 非公開化案を作成 → 変更を確認 → 非公開化を保存
- **Save result labels:** 保存前 updated_at / 保存後 updated_at / optimistic lock 基準 — display only, logic unchanged
- **No DB write** — display only; save modules unchanged
- **Doc:** `gosaki-schedule-save-preview-target-confirmation.md` · **Verifier:** `verify-g22g1c-gosaki-schedule-save-preview-target-confirmation.mjs`
- **Next:** G-22g2 · Schedule P0 UX QA

## G-22g1b Schedule dev/mock section isolation — complete

- **Problem:** G-22f5 operator confused bottom dev-tools mock UI with top operator UI
- **Isolation:** amber `gosaki-schedule-dev-tools-panel` + `gosaki-schedule-dev-mock-zone`; details closed by default
- **Banners:** `mock-schedule-*` is not real data — on row picker, safe-fields dry-run, general edit
- **Operator guide:**「通常の Schedule 操作はこちら」+ 非公開 flow + dev section warning
- **Read source:** `#gosaki-schedule-operator-read-source-banner` — green Supabase / amber mock
- **No DB write** — display only; save modules unchanged
- **Doc:** `gosaki-schedule-dev-mock-section-isolation.md` · **Verifier:** `verify-g22g1b-gosaki-schedule-dev-mock-section-isolation.mjs`
- **Next:** G-22g1c · G-22g2

## G-22g1a Schedule list UX legacy_id — complete

- **List:** legacy_id column (desktop) · legacy_id + updated_at on mobile cards
- **Summary:** `#gosaki-schedule-operator-selected-summary` — legacy_id, id, updated_at, published, date, title
- **Search:** keyword includes legacy_id and id (`schedule-2026-07-008` findable when filter allows)
- **Form:** read-only `id` field added alongside legacy_id / updated_at
- **No DB write** — display / filter only; save modules unchanged
- **Doc:** `gosaki-schedule-list-ux-legacy-id.md` · **Verifier:** `verify-g22g1a-gosaki-schedule-list-ux-legacy-id.mjs`
- **Next:** G-22g1b · G-22g1c · G-22g2

## G-22g Schedule P0 CRUD next plan — complete

- **Inventory:** G-22d duplicate INSERT · G-22e new event INSERT · G-22f unpublish UPDATE — all closed single-slices
- **Test rows:** `schedule-2026-03-014` / `schedule-2026-09-001` protected · `schedule-2026-07-008` published=false
- **P0 gaps:** list UX (legacy_id) · dev/mock isolation · save-panel target emphasis · operator procedure hints
- **P2 deferred:** physical DELETE · G-23 public reflection / FTP
- **G-22f UX:** legacy_id not in list · dev-tools mock confusion · 非公開 flow · expectedBeforeUpdatedAt display
- **Recommended:** **G-22g1** list UX (low risk, no DB write) → **G-22g2** operator procedure
- **Doc:** `gosaki-schedule-p0-crud-next-plan.md` · **Verifier:** `verify-g22g-gosaki-schedule-p0-crud-next-plan.mjs`
- **Next:** G-22g1-schedule-list-ux-improvement

## G-22f7 unpublish UPDATE chain closure — complete

- **Chain:** G-22f → G-22f1 → G-22f2 → G-22f3 → G-22f4 → G-22f4b → G-22f5 → G-22f6 → **G-22f7 closed**
- **Target:** `schedule-2026-07-008` · `published=true→false` · row still exists (not physical DELETE)
- **G-22f5 Save:** once · closed · re-Save **forbidden**
- **afterVerification:** PASS (G-22f6)
- **write-armed dev server:** operator Ctrl+C stop; port 4321 LISTEN none confirmed
- **UX lessons:** legacy_id not in list · dev-tools mock UI confusion · use 非公開 not unpublish · button flow documented
- **Deferred:** physical DELETE · production reflection (careful judgment)
- **Doc:** `gosaki-schedule-unpublish-update-closure.md` · **Verifier:** `verify-g22f7-gosaki-schedule-unpublish-update-closure.mjs`
- **Next:** Schedule P0 · list UX · G-22 CRUD summary

## G-22f6 unpublish UPDATE execution result — complete

- **Target:** **fixed** — `schedule-2026-07-008` (G-22f4b)
- **approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`
- **SQL:** candidate list + beforeVerification / afterVerification SELECT-only; rollback UPDATE template (**rollback execution forbidden in G-22f4**)
- **Code preflight:** `buildG22fUnpublishUpdatePayload` → `{ published: false }` only; no `updated_at` in patch; `expectedBeforeUpdatedAt`; `wouldDelete=false` / `physicalDelete=false`
- **Protected:** `schedule-2026-03-014` / `schedule-2026-09-001` — non-touch
- **Not executed:** Save / DB write / SQL mutation / rollback / GRANT / package regen / FTP
- **Doc:** `gosaki-schedule-unpublish-update-final-preflight.md` · **Verifier:** `verify-g22f4-gosaki-schedule-unpublish-update-final-preflight.mjs`
- **Next:** G-22f4b target fixed — **done** → G-22f5 operator Save once

## G-22f3 unpublish UPDATE implementation — complete

- **Modules:** `gosaki-schedule-unpublish-update-config.ts`, `-guards.ts`, `-save.ts`
- **approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` registered in `SCHEDULE_WRITE_APPROVAL_IDS`
- **Save:** `executeG22fScheduleUnpublishUpdateSave` → `updateScheduleWrite` + `buildScheduleLockedWriteRequest`
- **UI:** unpublish Save gate wired; default「非公開化を保存（現在は無効）」; armed「非公開化を保存」
- **Payload:** `{ published: false }` only; no `updated_at` in patch
- **Protected:** `schedule-2026-03-014` / `schedule-2026-09-001` blocked in guards
- **Doc:** `gosaki-schedule-unpublish-update-implementation.md` · **Verifier:** `verify-g22f3-gosaki-schedule-unpublish-update-implementation.mjs`
- **Next:** G-22f4 final preflight — **done** → G-22f5 operator Save once

## G-22f2 unpublish UPDATE planning — complete

- **Slice:** `published=true` → `published=false` UPDATE only — not physical DELETE
- **approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED` + full write stack
- **save operation:** `unpublish-update`; patch `{ published: false }`; `changedFields: ["published"]`
- **Optimistic lock:** `expectedBeforeUpdatedAt` from beforeSnapshot; reuse `executeScheduleGeneralUpdateWrite`
- **Protected:** `schedule-2026-03-014` / `schedule-2026-09-001` must not touch
- **SQL:** beforeVerification / afterVerification SELECT-only templates + rollback UPDATE template (not executed)
- **Doc:** `gosaki-schedule-unpublish-update-planning.md` · **Verifier:** `verify-g22f2-gosaki-schedule-unpublish-update-planning.mjs`
- **Next:** G-22f3 implementation only → G-22f4 preflight → G-22f5 operator Save once

## G-22f1 unpublish dry-run local QA — complete

- **QA:** HTTP 200; unpublish btn/banner/markup PASS; module smoke `executeG22fScheduleUnpublishDryRun` PASS
- **Preview:** `operation=unpublish`, `dryRun=true`, `actualWrite=false`, `wouldUpdate=true`, `wouldDelete=false`, `saveAllowed=false`, `physicalDelete=false`, `before.published=true` → `after.published=false`
- **published=false:** `validateG22fUnpublishDryRunTarget` blocks `schedule-2026-03-014` / `schedule-2026-09-001`; not in operator `selectableRows` (POC audit → `auditRows`)
- **Save / DELETE:** not clicked; delete btn「削除（準備中）」disabled
- **Regression:** G-9k existing / G-22d duplicate / G-22e new event paths preserved
- **Doc:** `gosaki-schedule-unpublish-dry-run-local-qa.md` · **Verifier:** `verify-g22f1-gosaki-schedule-unpublish-dry-run-local-qa.mjs`
- **Next:** G-22f2 unpublish UPDATE planning

## G-22f unpublish dry-run UI — complete

- **UI:**「非公開化案を作成」button; unpublish draft banner; read-only form;「変更を確認」dry-run preview
- **Dry-run:** `executeG22fScheduleUnpublishDryRun` — `published true → false`; no DB write; no DELETE
- **Eligibility:** `published=true` only; `published=false` →「すでに非公開」disabled
- **Save:** disabled — alert「非公開化の保存はまだ無効です」
- **Physical DELETE:** not implemented — `#gosaki-schedule-delete-btn` disabled
- **Regression:** G-9k UPDATE / G-22d duplicate / G-22e new event paths preserved
- **Doc:** `gosaki-schedule-unpublish-dry-run-ui-implementation.md` · **Verifier:** `verify-g22f-gosaki-schedule-unpublish-dry-run-ui-implementation.mjs`
- **Next:** G-22f1 local QA → G-22f2 unpublish UPDATE planning

**Closed chains — do not re-UPDATE / re-Save / re-upload:**
- `schedule-2026-07-008` unpublish UPDATE (G-22f5 slice — **closed**)
- `schedule-2026-09-001` new event INSERT (G-22e5 slice — **closed**)
- `schedule-2026-03-014` duplicate INSERT (G-22d3 slice — **closed**)
- `discography-002` / track 7 `title` (G-20b cleanup chain — **closed**)
- `discography-004` / track 1 `title` (G-20b cleanup chain — **closed**)
- `discography-003` / `artist` (G-15e-f)
- `discography-004` / `label` (G-17e-f)
- `schedule-2026-04-005` / `price` (G-14b1f)

## G-22e4 new event INSERT final preflight — complete

- **Target:** test event `2026-09-12` / `【G-22eテスト】新規追加テストイベント` / `published=false`
- **approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`
- **Allocation:** `legacy_id` / `sort_order` **pending** until beforeVerification SQL; code preflight empty-month → `schedule-2026-09-001` / `sort_order=10`
- **SQL:** beforeVerification / afterVerification SELECT-only; rollback DELETE template (not executed)
- **Protected:** `schedule-2026-03-014` non-touch
- **Doc:** `gosaki-schedule-new-event-insert-final-preflight.md`
- **Next:** G-22e5 operator Save once

## G-22e3 new event INSERT implementation — complete

- **approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED` (default false)
- **Modules:** `gosaki-schedule-new-event-insert-config.ts`, `-guards.ts`, `-save.ts`; `insertNewEventScheduleWrite`
- **UI:** new draft Save gated via `evaluateG22eNewEventInsertUiGate`; default disabled
- **Protected:** `schedule-2026-03-014` non-touch
- **Doc:** `gosaki-schedule-new-event-insert-implementation.md`
- **Next:** G-22e4 final preflight

## G-22e2 new event INSERT planning — complete

- **approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`
- **Payload policy:** `site_slug=gosaki-piano`, `published=false`, `show_on_home=false`, `home_order=null`
- **legacy_id:** `schedule-YYYY-MM-NNN` from target month max suffix + 1
- **sort_order:** target month `max(sort_order)+10`
- **source:** `source_route=/schedule/YYYY-MM/`, `source_file=schedule-YYYY-MM.html`
- **SQL:** beforeVerification / afterVerification SELECT-only + rollback DELETE template (not executed)
- **Doc:** `gosaki-schedule-new-event-insert-planning.md`
- **Next:** G-22e3 implementation only

## G-22e1 new event dry-run local QA — complete

- **QA:** HTTP 200 + markup + module smoke PASS; no blocking issues
- **Empty form:** 3 warnings (date/title/venue), `wouldInsert=false`
- **Valid form:** `operation=new`, `wouldInsert=true`, `actualWrite=false`, `saveAllowed=false`, `published=false`, `site_slug=gosaki-piano`
- **Save / delete:** disabled; existing / duplicate modes intact
- **Doc:** `gosaki-schedule-new-event-dry-run-local-qa.md`
- **Superseded by:** G-22e2 planning

## G-22e new event dry-run UI — complete

- **Add button:** enabled — 「新規追加案を作成」
- **Save / INSERT:** **disabled**
- **Superseded by:** G-22e1 QA

## G-22d3d duplicate INSERT chain closure — complete

- **Commit:** `2ed6122`
- **Do not re-Save** G-22d duplicate slice

## G-22d3c duplicate INSERT execution result — complete

- **Commit:** `4e3d55a`
- **Doc:** `gosaki-schedule-duplicate-insert-execution-result.md`
- **Superseded by:** G-22d3d closure

## G-22d3b2–b4 INSERT grant + duplicate Save — complete

- **Commit:** `a3c8f7c`
- G-22d3b3 INSERT grant + G-22d3b4 Save once → success

## G-22d2b preflight drift fix — complete

- Commit: `974738c`
- Payload: `sort_order=70`, `source_file=schedule-2026-03.html`

## G-22d2 Gosaki Schedule duplicate INSERT final preflight — complete

- **Doc:** `gosaki-schedule-duplicate-insert-final-preflight.md`
- **Commit:** `07202b3`
- **Expected payload (post G-22d2b):** `sort_order=70`, `source_file=schedule-2026-03.html`
- **Next:** — (superseded by G-22d2b payload update)

## G-22d1 Gosaki Schedule duplicate INSERT implementation — complete

- **Doc:** `gosaki-schedule-duplicate-insert-implementation.md`
- **Commit:** `daa1da2`
- **Next:** — (superseded by G-22d2)

## G-22d Gosaki Schedule duplicate INSERT planning — complete

- **Doc:** `gosaki-schedule-duplicate-insert-planning.md`
- **Commit:** `8d0f541`
- **legacy_id:** Option B — `schedule-2026-03-014`
- **Next:** — (superseded by G-22d1)

## G-22c Gosaki Schedule duplicate dry-run local QA — complete

- **Doc:** `gosaki-schedule-duplicate-dry-run-local-qa.md`
- **Commit:** `d1fa0a8`
- **Operator spot-check:** PASS (duplicate preview flags confirmed)
- **Next:** — (superseded by G-22d)

## G-22b Gosaki Schedule duplicate dry-run UI — complete

- **Doc:** `gosaki-schedule-duplicate-dry-run-ui-implementation.md`
- **Commit:** `266491e`
- **Module:** `gosaki-schedule-duplicate-dry-run.ts`
- **UI:** 複製案を作成 → duplicate draft banner → 変更を確認 → dry-run preview
- **approvalId:** `G-22b-gosaki-schedule-duplicate-dry-run`
- **Save / INSERT:** disabled (G-22d deferred)
- **Next:** — (superseded by G-22c QA)

## G-22a Sariswing parity gap inventory — complete

- **Doc:** `gosaki-sariswing-parity-gap-inventory.md`
- **Base:** `f8580ec`
- **P0:** Schedule duplicate, add, delete; G-9k routine UPDATE
- **Next:** — (superseded by G-22b implementation)

## G-20ui3-QA Gosaki admin UI minor polish local QA — complete

- **Doc:** `gosaki-admin-ui-minor-polish-local-qa.md`
- **Base:** `d404ce3`
- **Next:** — (UI polish closed; G-22a functional work started)

## G-20ui3 Gosaki admin UI minor polish — complete

- **Doc:** `gosaki-admin-ui-minor-polish.md`
- **Base:** `75e2bc1`
- **Next:** — (superseded by G-20ui3-QA)

## G-20ui2-QA Gosaki admin UI polish local visual QA — complete

- **Doc:** `gosaki-admin-ui-polish-local-visual-qa.md`
- **Base:** `8b4cf83`
- **Next:** — (superseded by G-20ui3)

## G-20ui2 Gosaki admin UI polish implementation — complete

- **Doc:** `gosaki-admin-ui-polish-implementation.md`
- **Base:** `afcbdcf`
- **Next:** — (superseded by G-20ui2-QA)

## G-20ui1 Gosaki admin UI polish inventory — complete

- **Doc:** `gosaki-admin-ui-polish-inventory.md`
- **Base:** `6d02ce1`
- **Next:** — (superseded by G-20ui2)

## G-20i3 Gosaki production package admin exclusion — complete

- **Doc:** `gosaki-production-package-admin-exclusion-result.md`
- **Base:** `4a91061`
- **Package:** 26 files — `admin/` excluded
- **Verifier:** 63/63 PASS
- **G-20j:** STOP (remote path TBD)
- **Next:** — (superseded by G-20ui1 for UI work)

## G-20i2 Gosaki production upload finalization — complete

- **Doc:** `gosaki-production-upload-finalization-admin-and-remote-path.md`
- **Base:** `d34646d`
- **Next:** — (superseded by G-20i3)

## G-20i Gosaki production upload preflight — complete

- **Doc:** `gosaki-production-upload-preflight.md`
- **Base:** `69d538e`
- **Next:** — (superseded by G-20i2)

## G-20h2 Gosaki initial local production package build — complete

- **Doc:** `gosaki-production-package-build-result.md`
- **Base:** `adfe27d`
- **Next:** — (superseded by G-20i)

## G-20h1 Gosaki production config implementation — complete

- **Doc:** `gosaki-production-config-implementation.md`
- **Base:** `c1ca639`
- **Next:** — (superseded by G-20h2)

## G-20g Gosaki production config implementation planning — complete

- **Doc:** `gosaki-production-config-implementation-planning.md`
- **Base:** `f35e462`
- **Next:** — (superseded by G-20h1)

## G-20f Gosaki production release config / cutover preflight — complete

- **Doc:** `gosaki-production-release-config-and-cutover-preflight.md`
- **Base:** `f36e857`
- **Next:** — (superseded by G-20g)

## G-20e-closure Gosaki production test text cleanup chain closure — complete

- **Doc:** `gosaki-production-test-text-cleanup-closure.md`
- **Base:** `7ce6654`
- **Next:** — (superseded by G-20f)

## G-20d/G-20e Gosaki production test text cleanup upload + HTTP verify — complete

- **Doc:** `gosaki-production-test-text-cleanup-public-reflection-upload-result.md`
- **Base:** `32cb18e`
- **Next:** — (superseded by G-20e-closure)

## G-20c Gosaki production test text cleanup public reflection local regen + upload preflight — complete

- **Doc:** `gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md`
- **Base:** `0550da4`
- **Next:** — (superseded by G-20d/G-20e)

## G-20b-execution Gosaki production test text cleanup execution result — complete

- **Doc:** `gosaki-production-test-text-cleanup-execution-result.md`
- **Base:** `041f16c`
- **DB:** cleanup succeeded; test count 0; rollback not needed
- **Next:** — (superseded by G-20c)

## G-20b Gosaki production pre-release test text cleanup final preflight — complete

- **Doc:** `gosaki-production-test-text-cleanup-final-preflight.md`
- **Base:** `a6c1cf1`
- **Targets:** 002/7 `Like a Lover（テスト）`→`Like a Lover`; 004/1 `Mary Ann（テスト）`→`Mary Ann`
- **Method:** SQL Editor 2 UPDATEs; UI Save **not recommended**
- **Next:** — (execution done — see G-20b-execution)

## G-20a Gosaki production release readiness inventory — complete

- **Doc:** `gosaki-production-release-readiness-inventory.md`
- **Base:** `7eda613`
- **Must before public:** test title cleanup (2 discography tracks); production deployBase/canonical/robots; cutover preflight; client sign-off
- **Admin:** staging shell local-dev only — hosted admin deferred (G-20d)
- **FTP:** G-7f1 suspended — manual only with explicit approval
- **Next:** G-20b test cleanup **or** G-20c cutover preflight

## G-19e Discography G-19b1 tracklist Save / public reflection closure — complete

- **Doc:** `gosaki-discography-g19e-tracklist-save-public-reflection-closure.md`
- **Base:** `85021b0`
- **Chain closed:** G-19b1 Save → G-19c local regen → G-19d upload → HTTP verify
- **Live:** Mary Ann（テスト）; G-18g2 track 7 maintained; rollback not needed
- **Next:** G-19f preview UX **or** G-19g next slice **or** Discography CMS next domain planning

## G-19d Discography G-19b1 tracklist public reflection upload result — complete

- **Doc:** `gosaki-discography-g19d-tracklist-public-reflection-upload-result.md`
- **Base:** `de54653`
- **Upload:** operator manual — 1 file `discography/index.html`; Cursor did not FTP
- **HTTP:** 200; `Mary Ann（テスト）` live; Ja-Jaaaaan! 8 tracks; G-18g2 track 7 maintained
- **CSS:** `index.YcHrHZH4.css` HTTP 200 (no upload)
- **Next:** G-19e closure doc

## G-19c Discography G-19b1 tracklist public reflection local regen / upload preflight — complete

- **Doc:** `gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md`
- **Base:** `5b9ee8b`
- **Regen:** `build-gosaki-staging-admin-package.mjs` PASS
- **Local HTML:** `Mary Ann（テスト）` on Ja-Jaaaaan! track 1; G-18g2 track 7 maintained
- **Upload:** 1 file `discography/index.html`; CSS `YcHrHZH4` / JS `CTyGy8yS` unchanged
- **FTP/upload:** not executed
- **Next:** G-19d operator manual upload + HTTP verify

## G-19b1-execution Discography tracklist generic single-title Save execution result — complete

- **Doc:** `gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md`
- **Base:** `d311e65`
- **Save:** operator once — alert `保存しました。`; Cursor did not Save
- **after:** track 1 = `Mary Ann（テスト）`; album 8 tracks; test title count 1
- **G-18g2:** track 7 `Like a Lover（テスト）` unchanged
- **UI note:** preview card did not refresh immediately — DB verified OK
- **Rollback:** not needed
- **Next:** G-19c public reflection local regen / preflight — **no regen/FTP now**

## G-19b1-execution-readiness Discography tracklist generic single-title Save execution readiness — complete

- **Doc:** `gosaki-discography-g19b1-tracklist-single-title-save-execution-readiness.md`
- **Base:** `97d5378`
- **Operator:** 戸山さん — armed dev + Preview + Save **once**; Cursor must NOT Save
- **Env:** `PUBLIC_ADMIN_WRITE_DRY_RUN=false`, G-19b1 arm ON, G-18g2 arm OFF
- **afterVerification:** SQL in readiness doc §7
- **Next:** G-19b1-execution-result after operator Save

## G-19b1-preflight Discography tracklist generic single-title Save final preflight — complete

- **Doc:** `gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md`
- **Base:** `0112906`
- **beforeSnapshot:** staging read-only — row `04e987a9-...` / track 1 / `Mary Ann`; album 8 tracks; test title 0 rows
- **G-18g2:** track 7 `Like a Lover（テスト）` maintained — do not re-Save
- **Rollback SQL:** template only — **not executed**
- **Save:** operator (戸山さん) manual once in execution phase — **Cursor must NOT click Save**
- **Next:** G-19b1-execution — armed env + operator Save once

## G-19b1-result Discography tracklist generic single-title Save local dry-run QA — complete

- **Base:** `450a8a4`
- **Local UI:** PASS — discography-004 G-19b1 Preview; `saveReadiness: ready_but_not_armed`; Save disabled
- **Other albums:** G-19a Preview only; G-18g2 not re-invoked
- **Verifier:** implementation verifier HEAD/origin baseline `96e790f`
- **Save / DB write:** **not executed**
- **Next:** G-19b1 final preflight

## G-19b1 Discography tracklist generic single-title Save implementation — complete

- **Doc:** `gosaki-discography-g19b1-tracklist-single-title-save-implementation.md`
- **Base:** `96e790f`
- **Target:** `discography-004` / track 1 / `Mary Ann` → `Mary Ann（テスト）`
- **Row id:** `04e987a9-e251-4b0b-b860-21a61e711f8e`
- **Approval ID:** `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`
- **Env arm:** `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED`
- **Save:** disabled by default; `PUBLIC_ADMIN_WRITE_DRY_RUN=true` blocks write
- **G-18g2:** chain closed; separate approval/env; not re-invoked
- **Next:** G-19b1 final preflight — **no Save yet**

## G-19b Discography tracklist Save slice planning — complete

- **Doc:** `gosaki-discography-g19b-tracklist-save-slice-planning.md`
- **Base:** `889a891`
- **First slice:** G-19b1 — `discography-004` / track 1 / `Mary Ann` → `Mary Ann（テスト）`
- **Scope:** changed-only; 1× UPDATE; 1 album; no add/delete/reorder
- **Reflection / upload:** G-19c / G-19d — **separate** from Save
- **G-18g2:** chain closed; **do not** re-Save `discography-002` track 7
- **Next:** — (superseded by G-19b1 implementation)

## G-19a Discography tracklist generic textarea dry-run — complete

- **Doc:** `gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md`
- **Commit:** `8c85f53`
- **Local UI QA:** PASS (31/31)
- **Verifier baseline:** `8c85f53` (post-commit fix)
- **Scope:** all 4 albums — editable textarea + `executeG19aTracklistTextareaDryRun`
- **Save:** disabled (`actualWrite=false`, `saveAllowed=false`)
- **G-18g2:** adapter preserved; Preview/Save UI **not invoked** (chain closed)
- **SKYLARK track 7:** `Like a Lover（テスト）` — current value, not cleaned up

## G-18h-upload-result Discography tracklist reflection upload result — complete

- **Doc:** `gosaki-discography-g18h-upload-result.md`
- **Commit:** `8a64b12`
- **Upload:** operator manual — 1 file `discography/index.html`
- **Live:** `Like a Lover（テスト）` present; SKYLARK 8 tracks; CSS `index.YcHrHZH4.css` **200**
- **Cursor FTP/upload:** **not executed**
- **Chain closed:** G-18g2 Save → G-18h local reflection → G-18h-upload
- **Do not re-upload** `discography/index.html` / **do not re-Save** track 7

## G-18h-upload Discography tracklist reflection manual upload final preflight — complete

- **Doc:** `gosaki-discography-g18h-upload-final-preflight.md`
- **Commit:** `17926f5`

## G-18h Discography public tracks reflection preflight — complete

- **Doc:** `gosaki-discography-g18h-public-tracks-reflection-preflight.md`
- **Commit:** `7cad34c`
- **Hook:** `patchDiscographyItemTracks` — reads 34 `discography_tracks` rows; patches Track List `<p>` per album
- **Local:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html` — track 7 `Like a Lover（テスト）`
- **Staging live:** still `Like a Lover` — upload deferred to operator
- **Do not re-Save** `discography-002` track 7

## G-18g2-execution Discography tracklist single-title Save result — complete

- **Doc:** `gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md`
- **Commit:** `ab8dee3`
- **Public reflection:** G-18h local regen — **done**; upload deferred
- **Do not re-Save** `discography-002` track 7

## G-18g2-execution-wiring Discography tracklist Save UI wiring — complete

- **Commit:** `8fd2ff7`

## G-18g2-preflight Discography tracklist Save final preflight — complete

- **Commit:** `2c92bb3`
- **Preflight SQL:** `gosaki-discography-g18g2-tracklist-title-save-preflight-check.sql` (SELECT only)
- **Rollback SQL:** `gosaki-discography-g18g2-tracklist-title-save-rollback.sql` (template — separate approval; not executed)
- **Execution env:** `PUBLIC_ADMIN_WRITE_DRY_RUN=false` + `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true` + `ENABLE_ADMIN_STAGING_WRITE=true`
- **Gap:** `runSave()` for `discography-002` still alert-only — wire in G-18g2-execution
- **G-18h:** public reflection deferred
- **Next:** G-18g2-execution

## G-18g2-result Discography tracklist local UI dry-run preview — complete

- **Commit:** `9236faf`
- **Local URL:** `http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`
- **Preview:** `ok: true`, `dryRun: true`, `actualWrite: false`, `wouldWrite: true`
- **saveReadiness:** `ready_but_not_armed`; **envArmArmed:** `false`
- **whereGuard / rollbackHint:** displayed in Preview panel
- **DB:** track 7 `Like a Lover` unchanged (UI edit not persisted)
- **Next:** G-18g2-preflight → G-18g2-execution

## G-18g2 Discography tracklist single-title Save adapter dry-run — complete

- **Commit:** `1041646`
- **Target:** `discography-002` track 7 — `Like a Lover` → `Like a Lover（テスト）` via textarea
- **approvalId:** `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`
- **envArm:** `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED`
- **Save:** disabled by default; gated `executeG18g2TracklistTitleSave` implemented
- **Next:** G-18g2-preflight → G-18g2-execution (operator Save once)

## G-18g1-apply-result Discography tracks UPDATE grant apply result — complete

- **Commit:** `cf4d571`
- **Grant:** `grant update on table public.discography_tracks to authenticated;` — **executed once** by operator
- **Result:** Success. No rows returned
- **Post-check:** authenticated UPDATE present; anon write absent; authenticated INSERT/DELETE/TRUNCATE absent
- **Data:** `discography-002` 8 tracks; track 7 `Like a Lover` unchanged; `Like a Lover（テスト）` = 0 rows
- **Rollback:** not needed
- **Next:** G-18g2 Save adapter dry-run implementation + preflight

## G-18g1-apply Discography tracks UPDATE grant apply preflight — complete

- **Commit:** `88fab3c`
- **Doc:** `gosaki-discography-g18g1-apply-update-grant-preflight.md`

## G-18g1 Discography tracks GRANT / RLS read-only check — complete

- **Commit:** `418c2bd`

## G-18g Discography tracklist textarea Save adapter planning — complete

- **Commit:** `065539b`
- **First PoC:** A — `discography-002` track 7 / `Like a Lover` → `Like a Lover（テスト）` (textarea path)
- **Long-term:** Option 2 diff → UPDATE/INSERT/DELETE; Options 3–4 deferred
- **Guards:** count 8, ordered fingerprint, `changed.length === 1`, no add/delete/reorder
- **approvalId (G-18g2):** `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`
- **updated_at:** defer; composite row + album fingerprint
- **Public reflection:** G-18h after Save success
- **Next:** G-18g2-preflight → G-18g2-execution (GRANT unblocked by G-18g1-apply-result)

## G-18f-result Discography tracklist local UI dry-run preview — complete

- **Commit:** `8a23191`
- **Local URL:** `http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`
- **Preview:** `ok: true`, `dryRun: true`, `actualWrite: false`, `wouldWrite: true`
- **Changed:** track 7 `Like a Lover` → `Like a Lover（テスト）` (UI only)
- **saveReadiness:** `ready_but_save_disabled`; **saveAllowed:** `false`
- **DB:** unchanged (read-only verify); **rollback:** not needed
- **Next:** G-18g textarea Save adapter planning

## G-18f Discography tracklist textarea diff dry-run — complete

- **Commit:** `9bf554a`
- **Doc:** `gosaki-discography-g18f-tracklist-textarea-diff-dry-run.md`
- **Target:** `discography-002` / SKYLARK (8 tracks)
- **UI:** album-level textarea editable on target only; 1 line = 1 track
- **Preview:** unchanged / changed / added / deleted / reordered
- **Guards:** `dryRun: true`, `actualWrite: false`, Save disabled, no DB write path
- **approvalId:** `G-18f-gosaki-discography-tracklist-textarea-diff-dry-run`
- **Next:** G-18g textarea Save adapter planning

## G-18e Discography tracks title-edit Save slice planning — complete (+ refinement)

- **Doc:** `gosaki-discography-g18e-tracks-title-edit-save-slice-planning.md`
- **Natural title correction:** **none** (白玉Bluse etc. match Wix/seed — defer)
- **Recommended UI:** album-level multiline textarea (1 line = 1 track); parse → diff Preview
- **Not recommended:** 34 fixed inputs; per-track fixed form as primary UI
- **Single-row PoC:** `discography-002` track 7 / `Like a Lover` — **internal adapter reference only** (not primary UI)
- **Album-level Save options:** (1) single UPDATE weak UX; (2) diff + per-row plan **target**; (3) full replacement dry-run first
- **G-18f:** textarea read/parse/diff dry-run on `discography-002` / SKYLARK (8 tracks); **DB write disabled** — **done**
- **G-18g:** textarea Save adapter planning — guards: `legacy_id` + track count + ordered title fingerprint
- **Prerequisite (G-18g):** `discography_tracks` GRANT preflight (G-18f-grant)
- **Next:** G-18g textarea Save adapter planning

## G-18d-result Discography tracks SQL execution result — complete

- **Commit:** `d6d5039`
- **Final:** 34 rows; seed match; rollback not needed

## G-18d Discography tracks manual SQL execution readiness — complete

- **Commit:** `86df73c`
- **Doc:** `gosaki-discography-g18d-tracks-manual-sql-execution-readiness.md`

## G-18b Discography tracks / personnel / price design — complete

- **Commit:** `c2bbcd1`
- **Doc:** `gosaki-discography-g18b-tracks-personnel-price-design.md`
- **Result:** tracks SoT not ready; personnel in `description`; no `price` column

## G-18a Discography next scalar field selection — complete

- **Commit:** `7e73c2d`
- **Doc:** `gosaki-discography-g18a-next-scalar-field-selection.md`
- **Result:** **Option 2** — no safe scalar Save diff on 4 releases
- **Scalar Save MVP:** purchase_url, artist (×2), label — all aligned DB ↔ public

## G-17e-f Discography label Save / public reflection closure — complete

- **Doc:** `gosaki-discography-g17e-label-public-reflection-closure.md`
- **Chain:** G-17c registry → G-17d Save → G-17e public reflection — **closed**
- **First G-17b registry + generic scalar Save field chain:** **success**
- **G-17d note:** unexpected already-applied state documented; Preview did not write; re-Save prohibited
- **G-17e upload:** 2 files (HTML + `BaseLayout.YcHrHZH4.css`); legacy `index.YcHrHZH4.css` not deleted
- **Next:** G-18a — next scalar field selection (`title` / `year` / `release_date` / `catalog_number` if diff exists)

## G-17e-upload Discography label public reflection upload + HTTP verify — complete

- **Doc:** `gosaki-discography-g17e-label-public-reflection-upload-result.md`
- **Upload:** `discography/index.html` + `_astro/BaseLayout.YcHrHZH4.css` (2 files)
- **HTTP:** `/discography/` **200**; `BaseLayout.YcHrHZH4.css` **200**
- **Live:** Ja-Jaaaaan! + `Mardi Gras JAPAN Records`; G-15c/G-15e/G-16b maintained
- **Legacy CSS:** `index.YcHrHZH4.css` not deleted (OK)
- **Next:** G-17e-f closure

## G-17e Discography label public reflection local regen + upload preflight — complete

- **Doc:** `gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md`
- **Hook:** `label` in `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` + `patchDiscographyItemLabel`
- **Local:** Ja-Jaaaaan! + `Mardi Gras JAPAN Records`; G-15c/G-15e/G-16b maintained
- **Upload:** **blocked** for 1-file-only — CSS ref changed (`index.YcHrHZH4.css` → `BaseLayout.YcHrHZH4.css`) — **resolved** in G-17e-upload (2-file upload)
- **Next:** G-17e-upload — **done**; G-17e-f closure

## G-17d-execution Discography label Save result + unexpected state investigation — complete

- **Doc:** `gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md`
- **DB:** `label` = `Mardi Gras JAPAN Records`; `updated_at` = `2026-06-29T07:36:49.044397+00:00`
- **Post-bridge Preview:** `no_changes` / `actualWrite: false` — consistent with already-applied DB
- **Write timing:** Likely prior armed G-17d `更新する` (Preview path ruled out by code review)
- **Rollback:** not needed; **re-Save:** prohibited
- **Next:** G-17e label public reflection preflight

### Backlog (known issue)

Admin page header may show stale `Save: disabled` / `DB write: disabled` after successful Save. Display only — no data impact. UI status refresh follow-up deferred.

## G-17d Discography label Save readiness fix — complete

- **Doc:** `gosaki-discography-g17d-label-save-readiness-investigation.md`
- **Fix:** G-17c save-page-config DOM bridge

## G-17d Discography label Save path enablement — complete

- **Commit:** `0fadd54`
- **Doc:** `gosaki-discography-g17d-label-save-path-enablement.md`

## G-17c-d2 / G-17d-d3 Discography label dry-run result + Save final preflight — complete

- **Commit:** `d1eefb8`
- **Doc:** `gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md`
- **Operator dry-run:** PASS on `discography-004` / `label`

## G-17c Discography registry next field slice preflight — complete

- **Commit:** `9475286`
- **Doc:** `gosaki-discography-g17c-next-field-registry-slice-preflight.md`
- **Target:** `discography-004` / `label` — null → `Mardi Gras JAPAN Records`
- **Registry:** `g17c-label` (`closed: false`)

## G-17b Discography scalar field commonization — complete

- **Commit:** `397f245`
- **Doc:** `gosaki-discography-g17b-scalar-field-commonization.md`
- **Registry:** `discography-scalar-field-slice-registry.ts` (3 closed + 1 open G-17c)
- **Generic:** `discography-scalar-field-save-config.ts`, `discography-scalar-field-guards.ts`
- **Public patch:** `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` in `supabase-discography-read.mjs` (`purchase_url`, `artist` only — `label` deferred to reflection phase)

## G-17a Discography CMS commonization audit — complete

- **Commit:** `5161eaa`
- **Doc:** `gosaki-discography-g17a-commonization-audit.md`

## G-16b-f Discography G-16a artist public reflection closure — complete

- **Commit:** `de2a388`
- **Doc:** `gosaki-discography-g16b-artist-public-reflection-closure.md`
- **Do not:** Re-Save `discography-001`; re-upload discography HTML

## G-16b-upload Discography G-16a artist public reflection upload + HTTP verify — complete

- **Commit:** `418b577`
- **Doc:** `gosaki-discography-g16b-artist-public-reflection-upload-result.md`
- **Upload:** operator manual `discography/index.html` ×1
- **HTTP:** Continuous `ごさきりかこTrio feat.石川周之介` live; G-15c/G-15e maintained
- **Chain closed — see G-16b-f**
- **Do not:** Re-upload discography HTML; Re-Save `001`

## G-16b Discography G-16a artist public reflection local regen + upload preflight — complete

- **Commit:** `d16aeca`
- **Doc:** `gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md`

## G-16a-execution Discography artist Save result — complete

- **Commit:** `db59af7`
- **Doc:** `gosaki-discography-g16a-artist-save-result.md`

## G-16a-d2/d3 Discography artist local dry-run + Save final preflight — complete

- **Commit:** `40a2896`
- **Doc:** `gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md`

## G-16a Discography next-field Save preflight — complete

- **Commit:** `b19b9a2`
- **Doc:** `gosaki-discography-g16a-next-field-save-preflight.md`
- **Playbook:** `cms-kit-save-reflection-playbook.md`

## G-16 CMS Kit Save / Reflection playbook — complete

- **Commit:** `2d70001`
- **Doc:** `cms-kit-save-reflection-playbook.md`

## G-15e-f Discography artist public reflection closure — complete

- **Commit:** `f722cf4`
- **Doc:** `gosaki-discography-artist-public-reflection-closure.md`

## G-15e-upload Discography artist public reflection upload + HTTP verify — complete

- **Commit:** `6dc81c3`
- **Doc:** `gosaki-discography-artist-public-reflection-upload-result.md`

## G-15e Discography artist public reflection local regen + upload preflight — complete

- **Commit:** `566d714`
- **Doc:** `gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md`
- **Hook:** `patchGosakiDiscographySupabaseFields` — `artist` + `purchase_url`

## G-15d-execution Discography artist Save result — complete

- **Commit:** `db0ae06`
- **Doc:** `gosaki-discography-artist-save-result.md`
- **updated_at trigger:** live proof **success**

## G-15d-d2/d3 Discography artist local dry-run + Save final preflight — complete

- **Commit:** `da6e954`
- **Doc:** `gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md`

## G-15d Discography next-field Save preflight — complete

- **Commit:** `355a96c`
- **Doc:** `gosaki-discography-next-field-save-preflight.md`

## G-15c-f Discography public reflection closure — complete

- **Doc:** `gosaki-discography-public-reflection-closure.md`
- **Chain closed:** G-15a → G-15a2 → G-15b-retry → G-15b-f8 → G-15c → G-15c-upload
- **Live:** `/discography/` HTTP **200**; SKYLARK new URL; old URL absent; `discographyDataSource=supabase`
- **Next (recommended):** G-15d-execution — artist Save + `updated_at` proof; then reflection or next field
- **Do not:** re-Save `discography-002`; re-upload `discography/index.html`

## G-15c-upload Discography public reflection upload + HTTP verify — complete

- **Commit:** `4fea4f2`
- **Doc:** `gosaki-discography-public-reflection-upload-result.md`

## G-15b-f8-execution Discography updated_at trigger apply — complete

- **Commit:** `a32e95d`
- **Doc:** `gosaki-discography-updated-at-trigger-apply-result.md`

## G-15b-f8 final preflight — complete

- **Commit:** `1931aaf`
- **Doc:** `gosaki-discography-updated-at-trigger-final-preflight.md`

## G-15b-grant-apply — complete

- **Commit:** `cfc0297`
- **Doc:** `gosaki-discography-update-grant-apply-result.md`

## G-15b Discography Save slice — committed; Save failed safely

- **Commit:** `eda9047`
- **Doc:** `gosaki-discography-save-slice-final-preflight.md`
- **Dry-run:** passed; Save reached DB then permission denied
- **Do not:** re-Save until grant phase complete

## G-15a2 Discography dry-run Preview — complete

- **Doc:** `gosaki-discography-dry-run-preview-implementation-and-preflight.md`
- **Target:** `discography-002` / `purchase_url` only
- **Preview:** `actualWrite: false`; `wouldWrite: true`
- **Do not:** Reuse G-15a2 approval for Save

## G-15a Discography admin Supabase read binding — complete

- **Doc:** `gosaki-discography-admin-supabase-read-binding.md`
- **Route:** `/__admin-staging-shell/musician-basic/admin/discography/`
- **Read:** Supabase `discography` (4 rows) + `discography_tracks` (display only)
- **UI:** legacy_id / sort_order / published visible; form from Supabase; default select SKYLARK
- **Gates:** `supabaseReadEnabled`; `saveEnabled: false`; `dbWriteEnabled: false`
- **Next:** **G-15a2** — dry-run Preview preflight
- **Do not:** Save / DB write

## G-15 Discography CMS MVP inventory and plan — complete

- **Doc:** `gosaki-discography-cms-mvp-inventory-and-plan.md`
- **Releases:** 4 — Wix HTML (public SoT) / static JSON (admin read) / Supabase `discography` (4 rows, not wired to admin)
- **MVP:** existing-row Supabase UPDATE — mirror Schedule G-9k; **not** YouTube static JSON write
- **Defer:** images, INSERT/DELETE, tracks, public reflection
- **Artifacts:** `data/gosaki/discography.seed.json`, schema/seed SQL templates (do not run)
- **Next:** **G-15a** — wire admin to Supabase read
- **Do not:** DB write / migration / Save / FTP

## G-14b1f Schedule CMS routine edit reflection closure — complete

- **Doc:** `gosaki-schedule-routine-edit-reflection-closure.md`
- **Verifier:** `verify-g14b1f-gosaki-schedule-routine-edit-reflection-closure.mjs` — **53 PASS**
- **Chain:** G-14b1 planning → G-14b1a → G-14b1b → G-14b1b-result → G-14b1c → G-14b1d → G-14b1e → G-14b1e-upload — **closed**
- **Product path:** G-9k operator UI Save — **success** (price only on `schedule-2026-04-005`)
- **Public reflection:** `schedule/2026-04/index.html` ×1 upload; HTTP **200**
- **Gates:** `readyForG14b1RoutineEditReExecution: false`; `rollbackNeeded: false`
- **Next:** **G-14b2** — second routine edit planning (new target) **or** G-9l YouTube embed CMS
- **Do not:** re-Save same row; re-upload April HTML; leave non-dry-run arms on in routine dev

## G-14b1e-upload Schedule CMS routine edit public reflection upload + HTTP verify — complete

- **Doc:** `gosaki-schedule-routine-edit-public-reflection-result.md`
- **Upload:** `schedule/2026-04/index.html` ×1 (operator manual)
- **HTTP:** **200** — `料金：3,300円（税込）` on Trio card; old `tax in` absent
- **Next:** **G-14b1f** — reflection closure doc
- **Do not:** re-upload April HTML

## G-14b1e Schedule CMS routine edit public reflection local regen + upload preflight — complete

- **Doc:** `gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md`
- **Regen:** `build-gosaki-staging-admin-package.mjs` PASS — 27 files; CSS/JS hash **unchanged**
- **Local April HTML:** `料金：3,300円（税込）` on Trio card; old `tax in` absent
- **Minimal upload:** `schedule/2026-04/index.html` ×1
- **Live April:** still stale (`tax in`) — upload pending
- **Next:** **G-14b1e-upload** — operator manual FTP once
- **Do not:** FTP in preflight phase; output is gitignored

## G-14b1d Schedule CMS routine edit Save execution result — complete

- **Doc:** `gosaki-schedule-routine-edit-save-execution-result.md`
- **Target:** `14230329…` / `schedule-2026-04-005` / price `3,300円(tax in)` → `3,300円（税込）`
- **Path:** G-9k operator UI `変更を確認` → `更新する`
- **after `updated_at`:** `2026-06-27T17:18:54.986868+00:00`
- **rollbackNeeded:** false
- **Next:** **G-14b1e** — G-14c public reflection
- **Do not:** re-click G-14b1 Save

## G-14b1c Schedule CMS routine edit final preflight — complete

- **Doc:** `gosaki-schedule-routine-edit-final-preflight.md`
- **Target:** `14230329…` / `schedule-2026-04-005` / price `3,300円(tax in)` → `3,300円（税込）`
- **beforeSnapshot `updated_at`:** `2026-06-16T16:03:41.551792+00:00`
- **Save path:** G-9k `更新する` + `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` + practical arm
- **Not for Save:** G-9g3g dev-tools surface
- **Next:** **G-14b1d** — operator Save once + afterVerification
- **Do not:** Save until G-14b1d armed env

## G-14b1b-result Schedule CMS routine edit local dry-run Preview result — complete

- **Doc:** `gosaki-schedule-routine-edit-local-dry-run-preview-result.md`
- **Preview:** operator used G-9g1 dev-tools `Preview G-9 site_slug general edit dry-run` — **PASS** (`actualWrite: false`, `changedFields: price`)
- **DB after Preview:** price / `updated_at` **unchanged** (`2026-06-16T16:03:41.551792+00:00`)
- **Save path:** **G-9k** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` + `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` — **not G-9g3g**
- **G-14b1a:** no code change required
- **Next:** **G-14b1c** — final preflight + optional G-9k `変更を確認` before Save
- **Do not:** Save until G-14b1c

## G-14b1b Schedule CMS routine edit local dry-run Preview preflight — complete

- **Doc:** `gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md`
- **Target:** `14230329-dde5-40d6-b9b3-75aefe140daf` / `schedule-2026-04-005` / 2026-04-12
- **beforeSnapshot `updated_at`:** `2026-06-16T16:03:41.551792+00:00`
- **Price edit:** `3,300円(tax in)` → `3,300円（税込）` (operator input; no audit markers)
- **Save arms:** OFF; `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
- **Next:** **G-14b1b-result** — operator Preview once; **no Save**
- **Do not:** Cursor Preview / Save in G-14b1b

## G-14b1a Schedule CMS routine edit practical Save enablement — complete

- **Doc:** `gosaki-schedule-routine-edit-practical-save-enablement-implementation.md`
- **Module:** `gosaki-schedule-routine-edit-practical-save-enablement-config.ts`
- **Practical arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` (alias to G-9k path)
- **Save compile default:** still `G9K_SAVE_BUTTON_SAVE_ENABLED=false`
- **Mutual exclusion:** G-13c1 / G-13c2 / G-9j unchanged panels; practical-arm-off checks added
- **No hardcoded PoC row/values**
- **Next:** **G-14b1b** — local dry-run Preview preflight (Save off)
- **Do not:** Save / Preview / DB / FTP in G-14b1a

## G-14b1 Schedule CMS routine edit flow next PoC planning — complete

- **Doc:** `gosaki-schedule-routine-edit-flow-next-poc-planning.md`
- **Verifier:** `verify-g14b1-gosaki-schedule-routine-edit-flow-next-poc-planning.mjs`
- **Recommended PoC:** `schedule-2026-04-005` (2026-04-12 `<Trio>`) — `price` field only
- **Path:** G-9k operator UI → dry-run Preview → Save once → G-14c reflection
- **Excluded:** Event A / Event B cleanup rows; date/month/INSERT/DELETE
- **Next:** **G-14b1a** — practical Save enablement implementation (no Save in impl phase)
- **Also consider:** G-13f residual PoC scan (read-only)
- **Do not:** Save / Preview / DB / FTP / regen in G-14b1 planning

## G-13c2e Event B PoC cleanup public reflection closure — complete

- **Doc:** `gosaki-schedule-event-b-public-reflection-closure.md`
- **Chain:** G-13c2 DB (`15bf558`) → G-13c2e regen (`74ece00`) → upload + HTTP (`272eca4`) — **closed**
- **Live July:** `2026.07.19` — `<>` + `出演：`; G-9g PoC **absent**
- **rollbackNeeded:** **false**
- **Event A / March:** untouched — G-13e preserved
- **G-13b:** both scanned events resolved on staging DB + public HTML
- **Next (recommended):** **G-14b1** — Schedule CMS routine edit flow next PoC
- **Also consider:** G-13f residual PoC scan (read-only); G-14a gap inventory refresh
- **Do not:** re-click G-13c2 Save; re-upload July / March HTML

## G-13c2e Event B public reflection upload result + HTTP verify — complete

- **Doc:** `gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.md`
- **Operator:** 戸山 — manual FTP overwrite **1 file** (`schedule/2026-07/index.html`)
- **HTTP:** **200**; `scheduleDataSource=supabase`; Event B `2026.07.19` — `<>` + `出演：` only
- **PoC:** all G-9g markers **absent** on live July page
- **CSS:** `index.YcHrHZH4.css` — unchanged; `_astro/` **not** re-uploaded
- **March:** Event A still clean (G-13e) — **not** re-uploaded
- **Next:** **G-13c2e closure** (`gosaki-schedule-event-b-public-reflection-closure.md`)
- **Do not:** re-upload July HTML; re-click G-13c2 Save; March re-upload

## G-13c2e Event B public reflection local regen + upload preflight — complete

- **Doc:** `gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md`
- **Regen:** `build-gosaki-staging-admin-package.mjs` PASS — 27 files; `scheduleDataSource=supabase`
- **July HTML:** Event B `2026.07.19` — title `<>`; venue/time/price lines absent; description `出演：`; all G-9g PoC absent
- **CSS/JS:** `index.YcHrHZH4.css` / `CTyGy8yS.js` — **unchanged** vs live staging
- **Minimal upload:** local `…/schedule/2026-07/index.html` → remote `/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html`
- **Live gap:** July page still shows G-9g PoC (pre-upload HTTP documented)
- **Post-upload HTTP:** **not executed** in this phase
- **Next:** **G-13c2e upload execution** (operator approval) → HTTP verify → closure
- **Do not:** FTP in this phase; March re-upload; re-click G-13c2 Save

## G-13c2 Event B PoC cleanup execution result — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-execution-result.md`
- **Operator:** 戸山 — Preview (`ready_to_save`) + Save **1回**; `errorCode: (none)`
- **after:** title `<>`; venue/open/start/price **null**; description `出演：`
- **updated_at:** `2026-06-18T01:04:51.312817+00:00` → `2026-06-27T10:17:42.60691+00:00`
- **rollbackNeeded:** **false**
- **Event A / March:** untouched
- **Next:** **G-13c2e** public reflection (regen → upload `schedule/2026-07/index.html` → HTTP verify → closure)
- **Do not:** re-click G-13c2 Save; March re-upload

## G-13c2 Event B PoC cleanup final preflight — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-final-preflight.md`
- **beforeSnapshot:** live anon read confirmed (6 PoC fields + `updated_at` `2026-06-18T01:04:51.312817+00:00`)
- **expected after:** `<>` / null×4 / `出演：`
- **Save env stack:** documented (not started)
- **rollback SQL:** doc-only — **separate approval** if ever needed
- **Next:** **G-13c2 execution** → G-13c2e reflection (G-14c §12.3)
- **Do not:** Save / rollback / upload in this phase

## G-13c2d2-result Event B local dry-run Preview result — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md`
- **Operator:** 戸山 — G-13c2 Preview **1回**; Save **未実行**
- **Result:** `dryRun:true` / `actualWrite:false` / `saveReadiness:ready_but_save_disabled` / 6 changedFields
- **Payload:** title `<>`; venue/open/start/price **null**; description `出演：`
- **UI:** G-13c2 panel + Preview button visible (G-13c2d2b fix confirmed)
- **Event A / March:** untouched
- **Next:** **G-13c2 final preflight** → execution → G-13c2e reflection
- **Do not:** re-click Preview; Save until final preflight + approval

## G-13c2d2b Event B Preview UI visibility fix — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.md`
- **Cause:** G-13c2 inside 2-col workspace → hidden behind sticky edit panel; only Save peeked through
- **Fix:** `.gosaki-schedule-operator-poc-cleanup-panels` full-width below workspace (G-13c1 + G-13c2)
- **Save:** still `disabled`
- **Next:** operator retry G-13c2d2 Preview procedure
- **Do not:** Save / DB / upload in this phase

## G-13c2d2 Event B local dry-run Preview preflight — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md`
- **Purpose:** operator local dev **Preview only** (Save gate OFF)
- **Dev env:** `ENABLE_ADMIN_STAGING_SHELL/AUTH/DATA_READ/WRITE` + `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
- **Arms OFF:** G-13c2 + G-13c1 + G-9k + other schedule arms
- **Expected Preview:** `dryRun:true` / `actualWrite:false` / `saveReadiness:ready_but_save_disabled` / 6 fields / null payload for venue/open/start/price
- **Do not click:** Event B Save, G-13c1 Save, G-9k Save, package regen, FTP
- **Next:** operator Preview (section 8) → **G-13c2 final preflight** → execution → G-13c2e reflection

## G-13c2d1 Event B PoC cleanup slice implementation — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-slice-implementation.md`
- **Modules:** config / guards / dry-run / save / page-config / target-row-resolve / UI + Astro G-13c2 panel
- **Target:** `aa440e29…` / `schedule-2026-07-010` / `2026-07-19` / `gosaki-piano`
- **Expected:** `title=<>`; venue/open/start/price=**DB null**; `description=出演：`
- **Env:** `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED` + `PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED`
- **Approval:** `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run`
- **Single-arm:** G-13c1 ↔ G-13c2 mutually exclusive
- **Event A / March:** untouched
- **Next:** **G-13c2 final preflight** → operator Save once → G-13c2e reflection (`schedule/2026-07/index.html`)
- **Do not:** Save / DB write / regen / upload in this phase

## G-13c2 Event B PoC cleanup preflight — complete

- **Doc:** `gosaki-schedule-event-b-poc-cleanup-preflight.md`
- **DB:** 6 fields have G-9g PoC text; `updated_at` `2026-06-18T01:04:51.312817+00:00`
- **Expected (confirmed):** `title=<>`; venue/open/start/price=null; `description=出演：`
- **Sources:** seed SQL + restore template + Wix extractor (3 agree)
- **Live July:** PoC present; **March clean** (Event A untouched)
- **Reflection plan:** minimal `schedule/2026-07/index.html` (G-14c)
- **Next:** **G-13c2 final preflight** → execution → reflection
- **Do not:** Save / regen / upload in preflight phase

## G-14c Public reflection standardization — complete

- **Doc:** `gosaki-public-reflection-operation-standardization.md`
- **Flow:** afterVerification → regen preflight → `build-gosaki-staging-admin-package.mjs` → local verify → upload scope → manual upload → HTTP verify
- **Minimal:** `schedule/YYYY-MM/index.html` when CSS hash unchanged (G-13e pattern)
- **Full:** 27-file `public-dist/` when CSS/home/hub/multi-page changed (G-11c pattern)
- **Next:** **G-13c2** Event B cleanup (`schedule/2026-07/index.html`) → **G-14b1** Save enablement

## G-14b Schedule CMS practical editing flow — complete

- **Doc:** `gosaki-schedule-cms-practical-editing-flow-definition.md`
- **Product path:** G-9k row picker → 6 safe fields → dry-run Preview → multi-field Save → afterVerification → G-14c reflection
- **MVP fields:** title, venue, open_time, start_time, price, description
- **Deferred:** date/month, INSERT, DELETE
- **G-13c1:** cleanup-only template — not routine edit
- **Next:** **G-14c** public reflection standardization → **G-13c2** Event B cleanup → **G-14b1** Save enablement

## G-14a Gosaki CMS completion roadmap — complete

- **Doc:** `gosaki-cms-completion-roadmap-gap-inventory.md`
- **MVP estimate:** Schedule+YouTube practical ~65%; full chain proven (G-13e)
- **Gaps:** practical Schedule edit flow, reflection ops standardization, Event B PoC, kit separation
- **Next:** **G-14b** Schedule practical editing flow definition (low risk)
- **Then:** G-14c reflection playbook → G-13c2 Event B cleanup
- **Not dev tasks:** client preview share / Gosaki本人への共有・日程調整

## G-13e Event A PoC cleanup public reflection closure — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md`
- **Chain:** G-13d1→G-13e closed; March clean; Event B deferred

## G-13e Event A PoC cleanup public reflection closure — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md`
- **Chain:** G-13d1 DB Save + G-13e local regen + operator upload + HTTP verify — **all complete**
- **Live:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` — Event A clean
- **Do not:** re-click G-13c1 Save; re-upload March HTML
- **Event B:** deferred — `/schedule/2026-07/` still has G-9g PoC
- **Next (optional):** client preview share; **G-13c2** Event B cleanup (separate approval)

## G-13e Event A public reflection upload execution — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md`

## G-13e Event A public reflection upload preflight — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md`

## G-13e Event A public reflection local regen — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md`

## G-13e Event A public reflection preflight — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md`

## G-13d1 Event A PoC cleanup execution — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-execution-result.md`
- **Operator:** 戸山 — manual Save once; `errorCode: (none)`
- **Row:** `f687ebf3-407c-49d0-9ab8-58040c499b8e` — 6 fields → Wix seed values
- **Do not re-click G-13c1 Save**

## G-13d1g Event A project allowlist property fix — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix.md`
- **Fix:** `allowlistPassed` / `errorMessage` in `gosaki-schedule-event-a-poc-cleanup-config.ts`

## G-13d1f Event A project allowlist investigation — complete

- **Root cause:** G-13c1 read `.passed` / `.failureReason` instead of API fields
- **Read-only** — no code in phase

## G-13d1e Event A Save gate page config bridge — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge.md`
- **Module:** `gosaki-schedule-event-a-poc-cleanup-page-config.ts`

## G-13d1c Gosaki staging shell server gate injection — complete

- **Doc:** `gosaki-staging-shell-server-gate-injection.md`
- **Layout:** `AdminGosakiStagingShellLayout.astro` — `#staging-shell-server-gates`

## G-13d1b Event A target row resolve fix — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix.md`

## G-13d1 selectable row investigation — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md`
- **Root cause:** `data-selectable-rows` coupling (fixed in G-13d1b)

## G-13d1 Event A cleanup final preflight — complete (execution blocked)

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-final-preflight.md`
- **approval_id:** `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run`
- **Execution:** blocked until G-13d1b

## G-13d2 admin reflection local dev verify — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-admin-reflection-local-dev-verify-result.md`

## G-13d2 admin reflection preflight — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.md`

## G-13d1 Event A cleanup local implementation — complete

- **Doc:** `gosaki-schedule-event-a-poc-cleanup-local-implementation.md`
- **approval_id:** `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run`

## G-13c PoC cleanup implementation prep — complete

- **Doc:** `gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md`

## G-13b PoC cleanup preflight — complete

- **Doc:** `gosaki-schedule-poc-visible-text-cleanup-preflight.md`
- **Rows:** `f687ebf3…` (2026-03-15 G-9k6), `aa440e29…` (2026-07-19 G-9g)

## G-11c10a allowlist registration — complete

- **Commit:** `282e762`

## G-11c9 workflow dispatch preflight — complete

- **Commit:** `1182419`

## G-11c8 workflow JSON patch implementation — complete

- **Commit:** `3cbcb9e`

## G-11c7 workflow JSON patch planning — complete

- **Doc:** `gosaki-youtube-url-save-workflow-json-patch-planning.md`
- **Patch:** `gosaki-piano-youtube-embed.json` — `embedCode` only; `published` untouched

## G-11c6d save endpoint smoke — complete

- **Commit:** `747b638`

## G-11c4b-fix auth login button enable — complete

- **Commit:** `ecca35e`
- **Doc:** `gosaki-staging-admin-auth-configured-login-button-enable-fix.md`

## G-11c2 Edge Function deploy preflight — complete

- **Commit:** `df6e18e`
- **Doc:** `gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md`

## G-11c1 YouTube dry-run local prep — complete

- **Commit:** `8152d7c`
- **Doc:** `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`

## G-11b staging online admin post-upload — complete

- **Commit:** `d7b4674`
- **Admin live:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

## G-11b staging online admin package prep — complete

- **Commit:** `d941003`
- **Doc:** `gosaki-staging-online-admin-read-only-page-package-prep.md`

## G-11a staging online CMS architecture planning — complete

- **Commit:** `755ecbe`
- **Doc:** `gosaki-staging-online-cms-architecture-planning.md`

## G-10h5-2a staging manual upload post-QA — complete

- **Commit:** `ffd1496`
- **Staging:** About bands 5 images + Contact HubSpot — QA PASS

## G-10g4 Contact photo aspect-ratio fix package prep — complete

- **Commit:** `0bd3789`
- **Doc:** `gosaki-contact-photo-aspect-ratio-fix-package-prep.md`

## G-10g2 Contact HubSpot layout fix package prep — complete

- **Commit:** `04eadd9`
- **Doc:** `gosaki-contact-hubspot-layout-fix-package-prep.md`
- **Note:** Use **G-10g3-regenerated** package for upload

## G-10g1 Contact HubSpot embed package prep — complete

- **Commit:** `aa352ac`
- **Doc:** `gosaki-contact-hubspot-embed-package-prep.md`
- **Config:** `gosaki-piano-contact-hubspot.json` (Contact-only allowlist)
- **Hook:** replaces Wix `#comp-jqbwo704` with HubSpot embed on `/contact/`
- **Note:** Use **G-10g2-regenerated** package for upload

## G-10h5-2 About HTML staging manual upload preflight — complete

- **Commit:** `c1b2bc3`
- **Note:** Use **G-10g1-regenerated** package (includes Contact HubSpot + About markers)

## G-10h5-1 About HTML public reflection package prep — complete

- **Commit:** `f427f9c`
- **Doc:** `gosaki-about-html-content-public-reflection-package-prep.md`

## G-10h4d About bands HTML static JSON write execution — complete

- **Commit:** `c3b0d56`
- **Do not re-run G-10h4d run script / re-click bands Save**

## G-10h4d-1 About bands HTML static JSON write execution prep — complete

- **Commit:** `6951d63`
- **Verifier (pre):** `verify-g10h4d-...-execution-prep.mjs` (skips when marker present)
- **Verifier (post):** `verify-g10h4d-...-execution.mjs`

## G-10h4c About bands HTML dry-run write slice — complete

- **Doc:** `gosaki-about-bands-html-static-json-write-dry-run.md`
- **Commit:** `8cabd19`
- **Block:** `about-bands-html` only; `html` field
- **API:** dry-run POST; non-dry-run implemented in G-10h4d-1 prep
- **UI:** bands editable + dry-run panel; profile unchanged (G-10h4b marker preserved)
- **Cursor:** no bands Save execution / no FTP

## G-10h4b About profile HTML static JSON write execution — complete

- **Doc:** `gosaki-about-profile-html-static-json-write-execution.md`
- **Commit:** `e2d378a`
- **Change:** `<!-- G-10h4b profile save test -->` in profile html (once)
- **Do not re-click G-10h4b Save**

## G-10h4a About profile HTML dry-run write slice — complete

- **Doc:** `gosaki-about-profile-html-static-json-write-dry-run.md`
- **Commit:** `c126efe`
- **Block:** `about-profile-html` only; `html` field
- **API:** dry-run POST; non-dry-run implemented in G-10h4b
- **UI:** profile editable + dry-run panel; bands read-only
- **Cursor:** no duplicate G-10h4b Save

## G-10h3 About HTML CMS admin read-only preview — complete

- **Doc:** `gosaki-about-html-content-admin-readonly-preview.md`
- **Route:** `/__admin-staging-shell/musician-basic/admin/about/`
- **UI:** 2 blocks — readonly textarea + preview; Save disabled
- **Not done:** write API / JSON write / FTP
- **Cursor:** no Save / no FTP

## G-10h2 About HTML CMS seed JSON + convert hook — complete

- **Doc:** `gosaki-about-html-content-seed-json-and-convert-hook.md`
- **Config:** `gosaki-piano-about-content.json` — profile + bands blocks seeded
- **Hook:** `gosaki-about-content.mjs` — replaces profile grid + bands component
- **Verify:** convert/build/package PASS; `safeForStaticFtp: true`
- **Not done:** admin UI / Save / write API / FTP
- **Cursor:** no Save / no FTP

## G-10h1 About HTML CMS implementation preflight — complete

- **Doc:** `gosaki-about-html-content-cms-implementation-preflight.md`
- **Config:** `gosaki-piano-about-content.json` — schema fixed; **file not created**
- **Profile anchor:** grid container inner under `#comp-lol1i5l0` (heading + bio + portrait)
- **Bands:** HTML replaces `BandProfilesSection` when non-empty; else G-8a fallback
- **Hook:** `gosaki-about-content.mjs` after `applyGosakiAboutBandProfiles`
- **Write:** approval `G-10h-about-html-content-static-json-write-slice`; 1 block / Save
- **Images:** `public/images/bands/{band-id}.jpg`
- **Cursor:** no implementation / JSON / FTP

## G-10h About HTML content CMS planning — complete

- **Doc:** `gosaki-about-html-content-cms-planning.md`
- **Staging:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`
- **Structure:** Wix profile (`#comp-lol1i5l0`) + injected `BandProfilesSection`
- **PHOTO:** 5× `band-profile__placeholder` — no files in `public/images/bands/`
- **Recommended:** 2-block static JSON (`about-profile-html`, `about-bands-html`); textarea + preview; G-10c Save pattern
- **Not Sariswing:** no Supabase `site_pages` for Gosaki v1
- **Deferred:** G-10f Discography
- **Cursor:** no implementation / JSON / FTP

## G-10f Discography album images — planning complete (deferred)

- **Doc:** `gosaki-discography-album-images-planning.md`
- **Public:** `/discography/` = Wix HTML; 4 jackets via **wixstatic.com** (not self-hosted)
- **Admin JSON:** `coverImage` empty ×4 → admin placeholder
- **NO PHOTO:** home schedule only — **not** on discography page
- **Recommended:** E+B — local `public/images/discography/{id}.jpg` + JSON + convert hook
- **Cursor:** no image / JSON / FTP changes

## G-10e1 YouTube embed layout reupload QA — complete

- **Doc:** `gosaki-youtube-embed-section-layout-reupload-qa-finalization.md`
- **Staging:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` — layout improvement **PASS**
- **QA:** operator 6 checks **PASS**; larger centered iframe; `Ke4F8JAQz-I` visible
- **Upload:** operator manual overwrite only; no delete/mirror
- **Cursor:** no FTP / upload
- **YouTube arc closed:** G-10c → G-10e1
- **Do not re-click G-10c Save**

## G-10e YouTube embed section layout improvement — complete

- **Doc:** `gosaki-youtube-embed-section-layout-improvement.md`
- **Fix:** section `max-width: 720px`, 16:9 iframe, Wix schedule mesh breakout (G-10e CSS)
- **Commit:** `9dabcb4`
- **Staging:** layout improvement **live** (G-10e1 operator re-upload QA PASS)
- **Cursor:** no FTP / upload / Save click
- **Do not re-click G-10c Save**

## G-10d2a YouTube embed staging upload QA — complete

- **Doc:** `gosaki-youtube-embed-staging-upload-qa-finalization.md`
- **Staging:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` — YouTube **visible**, `Ke4F8JAQz-I`
- **QA:** operator 6 checks **PASS**
- **Known UI:** section too small → G-10e (non-blocking)
- **Cursor:** no FTP / upload
- **Do not re-click G-10c Save**

## G-10d2 YouTube embed staging manual upload — complete

- **Doc:** `gosaki-youtube-embed-staging-manual-upload-by-operator.md`
- **Local:** `output/manual-upload/gosaki-piano/public-dist/` (upload **contents** only)
- **Remote:** `/cms-kit-staging/gosaki-piano/` → `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- **Operator:** upload **done**; QA **PASS**
- **Known UI:** YouTube section too small → G-10e

## G-10d1 YouTube embed manual upload package prep — complete

- **Doc:** `gosaki-youtube-embed-manual-upload-package-prep.md`
- **Package:** `output/manual-upload/gosaki-piano/public-dist/` (20 files, `verify:manual-upload` PASS)
- **YouTube:** `gosaki-youtube-embed` + `Ke4F8JAQz-I` in package `index.html`
- **Upload target:** `/cms-kit-staging/gosaki-piano/` on `yskcreate.weblike.jp`
- **Staging:** not uploaded yet — G-10d2 operator manual upload
- **Do not:** FTP auto-deploy; re-click G-10c Save

## G-10d YouTube embed public reflection — complete

- **Doc:** `gosaki-youtube-embed-public-reflection-verification.md`
- **Local:** convert + build → `output/gosaki-piano-g10d-verify/dist/index.html`
- **HTML:** `gosaki-youtube-embed` + `youtube-nocookie.com/embed/Ke4F8JAQz-I`
- **Staging:** not updated — G-10d1 operator manual upload
- **Do not re-click G-10c Save**

## G-10c2 YouTube embed static JSON Save success — complete

- **Doc:** `gosaki-youtube-embed-static-json-write-save-success-finalization.md`
- **Save:** operator manual — `itemsAffected: 1`
- **JSON:** `published: true`, `embedCode: https://www.youtube.com/watch?v=Ke4F8JAQz-I`
- **videoId:** `Ke4F8JAQz-I`
- **Public:** not reflected yet — G-10d
- **Do not re-click G-10c Save**

## G-10c1 Save API response fix — complete

- **Incident 1:** dry-run OK; Save → HTML 404 JSON parse error
- **Incident 2:** curl GET → `FailedToLoadModuleSSR` (import path one `../` too many)
- **Fix:** dev `injectRoute` + `../../../../lib/admin/...` + safe JSON parse
- **curl GET verified:** 405 `application/json` `method_not_allowed`
- **Operator Save:** succeeded (G-10c2) — do not re-click

## G-10c YouTube embed static JSON write slice — complete

- **Doc:** `gosaki-youtube-embed-static-json-write-slice-implementation.md`
- **Target:** `gosaki-piano-youtube-embed.json` / `yt-placeholder-01` / `embedCode` + `published`
- **approvalId:** `G-10c-gosaki-youtube-embed-static-json-write-slice`
- **Dry-run:** UI「変更を確認」+ `executeG10cYoutubeEmbedStaticJsonWriteDryRun`
- **Save:** operator manual Save **succeeded** (G-10c2) — `itemsAffected: 1`
- **Public:** local build verified (G-10d); staging upload pending (G-10d1)
- **`readyForAnyDbWrite: false`**

## G-10b YouTube embed read/write planning — complete

- **Doc:** `gosaki-youtube-embed-read-and-write-planning.md`
- **Public:** `gosaki-piano-youtube-embed.json` → `applyGosakiHomeYouTubeEmbed` → home `YouTubeEmbedSection`
- **Admin:** static JSON binding; Save **disabled** (G-9j)
- **Current:** placeholder unpublished — no home embed section
- **G-10c recommended:** static JSON write slice (dry-run + approval; 1 item)
- **G-10e deferred:** `site_embeds` Supabase
- **No DB write / Save click**
- **`readyForAnyDbWrite: false`**

## G-10a Gosaki completion inventory — complete

- **Doc:** `gosaki-completion-inventory-and-next-module-selection.md`
- **Schedule:** G-9k6–G-9k7b verification/UI **closed**; remaining = public re-upload loop + client sign-off
- **Next non-Schedule module:** **YouTube embed CMS** (`G-10b`)
- **Parallel:** `G-9h1` client preview feedback collection
- **No DB write / Save click**
- **`readyForAnyDbWrite: false`**

## G-9k7b Save UI copy dedup + list edit button — complete

- **Doc:** `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` §3
- **Copy:** Save 無効 dry-run 後はパネル1箇所 `保存は無効です。確認のみ完了しました。`；ボタン下 note 非表示
- **List:** 操作列 sticky；横スクロール時も「編集する」見える
- **No DB write / Save click**
- **`readyForAnyDbWrite: false`**

## G-9k7 Save UI copy and editor scroll fix — complete

- **Doc:** `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md`
- **Copy:** Save 無効時「保存は無効です…」/ 有効時「保存が有効です…」— no `G9K_SAVE_BUTTON_SAVE_ENABLED=false` when Save ready
- **Scroll:** `gosaki-schedule-admin-list-panel` + `gosaki-schedule-admin-editor-panel` independent scroll @ ≥960px
- **No DB write / Save click**
- **Next:** generalization, next feature, Gosaki CMS Kit (`G-9h1`), rollback
- **`readyForAnyDbWrite: false`**

## G-9k6g field slice closure — complete

- **Doc:** `gosaki-schedule-existing-event-field-slice-closure.md`
- **Result:** G-9k6 arc **closed** — all 6 safe fields succeeded on row `f687ebf3-407c-49d0-9ab8-58040c499b8e`
- **Policy:** **1 Save = 1 field** maintained; every slice `rowsAffected: 1`; `changedFields` / `payload keys` = single field only; optimistic lock OK
- **Final baseline:** title `<Duo> [G-9k6 title UI保存テスト]`; venue `川崎 ぴあにしも [G-9k6 venue UI保存テスト]`; open_time `18:00`; start_time `19:00`; price `3,000円（G-9k6 price UI保存テスト）`; `updated_at` `2026-06-22T15:01:47.671778+00:00`
- **Do not re-click** any G-9k4b / G-9k6 slice Save
- **Next (operator choice):** UI copy fix; staging shell Save generalization; existing event next feature; Gosaki CMS Kit (`G-9h1`); rollback
- **`readyForAnyDbWrite: false`**

## G-9k6f title field slice Save success — complete (G-9k6 all slices done)

- **Doc:** `gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md`
- **Result:** operator manual G-9k6f UI Save **succeeded** — `title` only; `rowsAffected: 1`
- **Before → after:** `<Duo>` → `<Duo> [G-9k6 title UI保存テスト]`
- **post-save `updated_at`:** `2026-06-22T15:01:47.671778+00:00`
- **UI:** **保存成功** panel; diff タイトル only; `changedFields` / `payload keys` = `title` only; post-save description shown (display only)
- **G-9k6 all slices succeeded:** `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d), `venue` (G-9k6e), `title` (G-9k6f)
- **Do not re-click G-9k6f Save** (or any G-9k6 slice Save)
- **Next:** G-9k6g field-slice closure
- **`readyForAnyDbWrite: false`**

## G-9k6e venue field slice Save success — complete

- **Doc:** `gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md`
- **Result:** operator manual G-9k6e UI Save **succeeded** — `venue` only; `rowsAffected: 1`
- **Before → after:** `川崎 ぴあにしも` → `川崎 ぴあにしも [G-9k6 venue UI保存テスト]`
- **post-save `updated_at`:** `2026-06-22T13:02:19.63835+00:00`
- **UI:** **保存成功** panel; diff 会場 only; `changedFields` / `payload keys` = `venue` only; post-save description shown (display only)
- **Do not re-click G-9k6e Save**
- **Next:** G-9k6f `title` manual Save once (last — operator)
- **`readyForAnyDbWrite: false`**

## G-9k6d start_time field slice Save success — complete

- **Doc:** `gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md`
- **Result:** operator manual G-9k6d UI Save **succeeded** — `start_time` only; `rowsAffected: 1`
- **Before → after:** `15:30` → `19:00`
- **post-save `updated_at`:** `2026-06-22T12:42:32.483922+00:00`
- **UI:** **保存成功** panel; diff 開演 `15:30` → `19:00` only; `changedFields` / `payload keys` = `start_time` only
- **Do not re-click G-9k6d Save**
- **Next:** G-9k6e `venue` manual Save once (operator)
- **`readyForAnyDbWrite: false`**

## G-9k6c open_time field slice Save success — complete

- **Doc:** `gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md`
- **Result:** operator manual G-9k6c UI Save **succeeded** — `open_time` only; `rowsAffected: 1`
- **Before → after:** `15:00` → `18:00`
- **post-save `updated_at`:** `2026-06-22T07:30:35.391238+00:00`
- **UI:** **保存成功** panel; diff 開場 `15:00` → `18:00` only; `changedFields` / `payload keys` = `open_time` only
- **Do not re-click G-9k6c Save**
- **Next (at completion):** G-9k6d `start_time` — **done**
- **`readyForAnyDbWrite: false`**

## G-9k6b price field slice Save success — complete

- **Doc:** `gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md`
- **Result:** operator manual G-9k6b UI Save **succeeded** — `price` only; `rowsAffected: 1`
- **Before → after:** `3,000円` → `3,000円（G-9k6 price UI保存テスト）`
- **post-save `updated_at`:** `2026-06-22T06:53:39.857434+00:00`
- **UI:** post-save **保存成功** panel visible; `changedFields` / `payload keys` = `price` only
- **Do not re-click G-9k6b Save**
- **Next (at completion):** G-9k6c `open_time` — **done**
- **`readyForAnyDbWrite: false`**

## G-9k6a field slice verification planning — complete

- **Doc:** `gosaki-schedule-existing-event-field-slice-verification-planning.md`
- **Scope:** plan + checklist for remaining safe-field slices; **no Save / DB write in this phase**
- **Done:** `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d)
- **Pending (order):** `venue` → `title` (last)
- **Policy:** 1 Save = 1 field; `changedFields` / `payload keys` must be single target field
- **Safety:** same G-9k4b env stack; project `kmjqppxjdnwwrtaeqjta`; block sari-site; `rowsAffected === 1`
- **Out of scope:** date/month/published/schedule_months; new/delete/duplicate; deploy
- **Next:** G-9k6e `venue` manual Save once (operator)
- **`readyForAnyDbWrite: false`**

## G-9k5 save button arc finalization — complete

- **Doc:** `gosaki-schedule-existing-event-save-button-success-finalization.md`
- **Outcome:** G-9k arc **closed** — Gosaki staging admin Schedule で既存公演 UI Save 初回成功
- **First real Save:** `description` only; `rowsAffected: 1`; row `f687ebf3-407c-49d0-9ab8-58040c499b8e`
- **Project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only — **no** sari-site / production impact
- **`service_role`:** not used
- **Safety stack:** auth gate, password reset, project allowlist, approvalId, env arm, dry-run, optimistic lock, rowsAffected guard
- **Post-save UI:** G-9k4b fix applied (`applyPostSaveSuccessState`)
- **Out of G-9k scope:** new/delete/duplicate, `date`/`month`/`published`/`schedule_months` write, deploy/rebuild
- **Do not re-click G-9k4b Save** without new approval ID
- **Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`
- **Next (separate phases):** G-9k6+ field slices, generalization, rollback policy, public site reflect / publish design
- **`readyForAnyDbWrite: false`**

## G-9k4b UI manual Save success + post-save result fix — complete

- **Doc:** `gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md`
- **Result:** operator manual G-9k4b UI Save **succeeded** — row `f687ebf3-407c-49d0-9ab8-58040c499b8e`, `description` only, `rowsAffected: 1`
- **post-save `updated_at`:** `2026-06-22T02:20:07.217037+00:00` (operator SQL verify)
- **UI fix:** post-save result panel no longer cleared on success; shows 保存成功 / rowsAffected / updated_at / description
- **Do not re-click G-9k4b Save** without new approval ID
- **Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`
- **`readyForAnyDbWrite: false`**

## G-9k4a UI Save enable preflight — complete

- **Doc:** `gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.md`
- **Module:** `gosaki-schedule-existing-event-save-button-save.ts`
- **UI:** Save gate + `runEditSave` wired; before/after / updated_at display
- **Save:** **default disabled** (`G9K_SAVE_BUTTON_SAVE_ENABLED=false`); no Cursor Save / DB write this phase
- **Next:** G-9k4 operator manual Save once
- **`readyForAnyDbWrite: false`**

## G-9k3 manual dry-run verification — complete

- **Doc:** `gosaki-schedule-existing-event-save-button-manual-dry-run-verification.md`
- **Scope:** operator manual dry-run / auth-gate checklist 1–8 — **PASS** (human)
- **Save:** still disabled; no DB write / non-dry-run in this phase
- **Next:** G-9k4 operator manual Save once
- **`readyForAnyDbWrite: false`**

## G-9k2 save button UI wiring — complete

- **Doc:** `gosaki-schedule-existing-event-save-button-ui-wiring.md`
- **Module:** `gosaki-schedule-existing-event-save-button-dry-run.ts`
- **UI:** operator edit form → 「変更を確認」 dry-run → Save readiness display
- **Save:** still disabled (`G9K_SAVE_BUTTON_SAVE_ENABLED = false`); G-9k4 for one manual Save
- **Next:** G-9k3 dry-run verification
- **`readyForAnyDbWrite: false`**

## G-9k1 save button guard / config — complete

- **Doc:** `gosaki-schedule-existing-event-save-button-guard-config.md`
- **Modules:** `gosaki-schedule-existing-event-save-button-config.ts`, `gosaki-schedule-existing-event-save-button-guards.ts`
- **approvalId:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` (not G-9j5)
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`
- **Separated from:** `gosaki-schedule-existing-event-update-g9j5-config.ts` (fixed runner)
- **Save:** still disabled until G-9k2+ wiring and G-9k4 manual phase
- **Next:** G-9k2 UI wiring
- **`readyForAnyDbWrite: false`**

## G-9k save button enablement — planning complete

- **Doc:** `gosaki-schedule-existing-event-save-button-enablement-planning.md`
- **Scope:** operator 「更新する」 — existing row UPDATE; 6 safe fields; dry-run before Save
- **approvalId:** `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` (not G-9j5)
- **env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`
- **Save:** still disabled until G-9k2+ implementation and G-9k4 manual phase
- **Next:** G-9k1 guard / config / verifier
- **`readyForAnyDbWrite: false`**

## G-9j5c — success (prior)

- **Doc:** `gosaki-schedule-existing-event-update-success-finalization.md`
- **Project:** `static-to-astro-cms-staging` / ref `kmjqppxjdnwwrtaeqjta` only — `sari-site` not touched
- **Row:** `f687ebf3-407c-49d0-9ab8-58040c499b8e` (`gosaki-piano`, `<Duo>`, 2026-03-15)
- **Field:** `description` only — `changedFields: ["description"]`, `rowsAffected: 1`
- **Auth:** anon + `signInWithPassword` — no `service_role`
- **Safety:** project ref allowlist, explicit admin email guard, G-9j5a password reset, G-9j5b auth gate
- **UI:** post-save description confirmed on `/__admin-staging-shell/musician-basic/admin/schedule/`
- **Do not:** re-run G-9j5; operator Save still disabled
- **`readyForAnyDbWrite: false`** (routine dev)

## Gosaki staging admin (latest UI work)

- **Routes:** `/__admin-staging-shell/musician-basic/admin/`, `/admin/schedule/` (not production `/admin/`)
- **Operator schedule:** month / published / keyword filters; columns 日付・タイトル・会場・開場・開演・料金・確認する; detail card; save not exposed
- **Dev PoC:** bottom `<details>開発者向け詳細</details>` — row picker, read/edit, G-6 sections preserved
- **Schedule:** add/edit forms (save disabled); dev PoC in `<details>`

## Summary

**G-9g4a2 single-text-field operational commonization implementation — complete, committed, pushed:**

- **Doc:** `staging-shell-schedule-single-text-field-operational-commonization-implementation.md`
- **Planning commit:** `e267da3`
- **C1:** `1e643e7` — registry + types + parameterized guards + generic config
- **C2:** `9c3714c` — generic Save executor + open_time-only save delegate
- **C3:** `1c1fb32` — generic edit UI + open_time edit-ui delegate + Astro/binding wiring
- **C4:** `d66bae7` — implementation doc + final verifier + AI context
- **Target fields:** `open_time`, `start_time`, `price` (config-driven registry)
- **Excluded:** `description` (G-9g3g operational), `title` (SEO sensitivity), `venue` (G-9g4a1 separate), date/route/publication/image
- **open_time:** round-trip complete (`105c6b1`); delegates preserve existing exports and DOM ids
- **start_time / price:** registry/config/guard/save/UI wired; **no** manual non-dry-run round-trip
- **Verifiers:** C1 69 / C2 34 / C3 47 / G-9g4a2a 83 / planning 39 / implementation 43 passed

## Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip only when **new common logic** is introduced (max once, explicit approval)
- Config-only fields: static verifiers, guards, dry-run Preview, type checks
- Do **not** over-abstract — minimal commonization for gosaki schedule CMS practical use
- **Not** next: `start_time`-only manual execution slice

## Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
readyForG9g4a2FrameworkLocalStaticVerification: true
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## G-9j Gosaki schedule existing event save enablement — planning complete

- **Doc:** `gosaki-schedule-existing-event-save-enablement-planning.md`
- **Verifier:** 33 passed
- **Scope:** existing row UPDATE only (`title`, `venue`, `open_time`, `start_time`, `price`, `description`)
- **approvalId:** `G-9j-gosaki-schedule-existing-event-update-non-dry-run`
- **env:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED`
- **Reuse:** `buildScheduleLockedWriteRequest`, `updateScheduleWrite`, optimistic lock; **new** operator UI path (not G-9g3g PoC)
- **Next:** G-9j1 guards + dry-run implementation — **no DB write / Save yet**
- **`readyForAnyDbWrite: false`**

## G-9h Gosaki schedule CMS practicalization planning — complete

- **Doc:** `gosaki-schedule-cms-practicalization-planning.md`
- **Verifier:** 34 passed
- **Phase 1:** client feedback + public read UX + re-upload planning — no DB write
- **Phase 2:** schedule CMS write slices — explicit gates; no per-field `start_time`/`price` round-trips
- **YouTube:** separate track — `G-9i-gosaki-youtube-embed-planning`

## Next

1. **G-9k4** operator manual Save once
2. **G-9h1** client preview feedback closure
3. **Not** Cursor Save click in G-9k4a
4. **Not** G-9j5 runner re-execution
