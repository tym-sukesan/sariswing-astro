Last updated: 2026-07-11
Project: Static-to-Astro CMS / Musician CMS Kit
Repository focus: sariswing-astro / tools/static-to-astro
Primary product goal: Wix / Studio / Jimdo などから、軽量・低コスト・本人更新可能な Astro + Supabase CMS へ移行するための汎用CMSキットを作る。

**G-20u34 Gosaki Discography Save UI arm design (2026-07-11):** **complete** — Save UI arm gate design (`PUBLIC_GOSAKI_*` gate names · UI states · prerequisite checklist); **Save disabled** · **executableSaveAllowed always false** · **no fetch POST / Edge call / DB write / env change**; production upload **STOP** (G-20j). Doc: `gosaki-discography-save-ui-arm-design.md`. Verifier: `verify-g20u34-gosaki-discography-save-ui-arm-design.mjs` (historical).

**G-20u33 Gosaki Discography Save dry-run endpoint draft (2026-07-11):** **complete** — Edge Function dry-run endpoint design + non-deployable draft module (`simulateDiscographySaveDryRunEndpoint` · `wouldWrite` ok · `didWrite`/`dbWrite`/`networkWrite` always false); **Save disabled** · **no Edge deploy / DB write / SQL / fetch POST**; staging `site_slug=gosaki-piano`; `supabase/functions/**` untouched; production upload **STOP** (G-20j). Doc: `gosaki-discography-save-dry-run-endpoint-draft.md`. Verifier: `verify-g20u33-gosaki-discography-save-dry-run-endpoint-draft.mjs` (historical).

**G-20u32 Gosaki Discography Save API schema & approval registry (2026-07-11):** **complete** — request/response schema modules + approval ID registry + validation helpers (`validateDiscographySaveRequest` / `validateDiscographySaveResponse` / `validateApprovalIdShape`); **Save disabled** · **no DB write / Edge Function / SQL / fetch POST / approval persistence**; staging `site_slug=gosaki-piano` required; `didWrite` blocked in schema phase; production upload **STOP** (G-20j). Doc: `gosaki-discography-save-api-schema-approval-registry.md`. Verifier: `verify-g20u32-gosaki-discography-save-api-schema-approval-registry.mjs` (historical).

**G-20u31 Gosaki Discography Save design (2026-07-11):** **complete** — Save spec design only (release metadata + track textarea · diff · Edge Function proposal · approval gates · rollback · security); **Save disabled** · **no DB write / Edge Function / SQL / fetch POST**; staging `site_slug=gosaki-piano` required; production upload **STOP** (G-20j). Doc: `gosaki-discography-save-design.md`. Verifier: `verify-g20u31-gosaki-discography-save-design.mjs` (historical).

**G-20u30b Gosaki Discography dry-run staging reflection record (2026-07-11):** **complete** — STG package `00c8888` (30 files · `includesAdmin: true` · `safeForStaticFtp: true`); operator manual FTP from `public-dist/` → `/cms-kit-staging/gosaki-piano/`; `/admin/` G-20u30 dry-run validation **PASS** (editable textarea · per-album + all-albums dry-run · `wouldWrite: false` · Save disabled); sitemap **no** `/admin/` (0 admin matches); production upload **STOP** (G-20j); **Cursor FTP/deploy/DB write なし**. Doc: `gosaki-discography-dry-run-staging-reflection-record.md`. Verifier: `verify-g20u30b-gosaki-discography-dry-run-staging-reflection-record.mjs` (historical).

**G-20u30 Gosaki Discography dry-run validation (2026-07-11):** **complete** — editable track list textarea per album; browser-only `validateDiscographyTrackListDryRun` (added/removed/changedLines/reordered · `wouldWrite: false`); per-album + all-albums dry-run buttons; **no Save / DB write / network write / localStorage**; YouTube dry-run POST unchanged; production upload **STOP** (G-20j). Doc: `gosaki-discography-dry-run-validation.md`. Verifier: `verify-g20u30-gosaki-discography-dry-run-validation.mjs` (historical).

**G-20u29b Gosaki Discography editor staging reflection record (2026-07-11):** **complete** — STG package `2a5dc68` (30 files · `includesAdmin: true` · `safeForStaticFtp: true`); operator manual FTP from `public-dist/` → `/cms-kit-staging/gosaki-piano/`; `/admin/` G-20u29 Discography Editor Prototype **PASS** (4 albums · 4 track list textareas · 1 line = 1 track · Save disabled · dashboard 4/34); **not** 34 fixed track inputs; sitemap **no** `/admin/` (0 admin matches); production upload **STOP** (G-20j); **Cursor FTP/deploy/DB write なし**. Doc: `gosaki-discography-editor-staging-reflection-record.md`. Verifier: `verify-g20u29b-gosaki-discography-editor-staging-reflection-record.mjs` (historical).

**G-20u29 Gosaki Discography edit UI prototype (2026-07-11):** **complete** — staging read-only admin `#gra-discography-editor` section; album cards with readonly fields; **1 line = 1 track** multiline textarea per album (not 34 fixed inputs); build-time snapshot `gosaki-read-only-admin-discography-editor.json` (4/34 when Supabase bundled); dashboard anchor **Editor prototype**; Save **disabled**; **no DB write / Save / FTP / deploy / localStorage**. Doc: `gosaki-discography-edit-ui-prototype.md`. Verifier: `verify-g20u29-gosaki-discography-edit-ui-prototype.mjs` (historical).

**G-20u28b Gosaki admin UI staging reflection record (2026-07-11):** **complete** — STG package `f03122b` (30 files · `includesAdmin: true` · `safeForStaticFtp: true`); operator manual FTP from `public-dist/` → `/cms-kit-staging/gosaki-piano/`; `/admin/` G-20u28 dashboard UI **PASS** (READ-ONLY · STAGING ONLY · Save disabled · 7 section cards · Schedule 74/Aug 14 · Discography 4/34); sitemap **no** `/admin/` (0 admin matches); production upload **STOP** (G-20j); **Cursor FTP/deploy/DB write なし**. Doc: `gosaki-admin-ui-staging-reflection-record.md`. Verifier: `verify-g20u28b-gosaki-admin-ui-staging-reflection-record.mjs` (historical).

**G-20u28 Gosaki admin UI foundation polish (2026-07-10):** **complete** — staging read-only admin dashboard (Schedule / Discography / YouTube / About / Contact / Link / Upload safety cards); build-time stats from schedule+discography bundles; read-only / Save disabled / production STOP badges; **no DB write / Save / FTP / deploy**. Doc: `gosaki-admin-ui-foundation-polish.md`. Verifier: `verify-g20u28-gosaki-admin-ui-foundation-polish.mjs`.

**G-20u27 Gosaki staging post-upload final verification (2026-07-10):** **complete** — STG read-only HTTP **PASS** (6 primary routes 200 · August **14** cards · discography **4** albums · contact OK · sitemap **no** `/admin/` · `/admin/` page 200 on STG); deployed package `3287219`; regression **23/23** at `27e98da`; production readiness gap documented; production upload **STOP** (G-20j); **no FTP/deploy/DB write**. Doc: `gosaki-staging-post-upload-final-verification.md`. Verifier: `verify-g20u27-staging-post-upload-final-verification.mjs` (historical). **Next recommended:** Gosaki admin UI improvement (A).

**G-20u26b Gosaki staging FTP upload HTTP verification record (2026-07-10):** **complete** — operator manual FTP (FileZilla) from `public-dist/` contents → `/cms-kit-staging/gosaki-piano/`; package `sourceCommit=3287219` · preflight **PASS**; primary routes HTTP verified (home · about · schedule · August · discography · contact); **production not updated** · production upload **STOP** (G-20j); **Cursor FTP/CLI deploy/DB write なし**. Doc: `gosaki-staging-ftp-upload-http-verification-record.md`. Verifier: `verify-g20u26b-staging-ftp-upload-http-verification-record.mjs` (historical doc-only).

**G-20u26 Gosaki staging package regen after discography filtered read (2026-07-10):** **complete** — `build:gosaki:staging` + `preflight:gosaki:staging` **PASS** at `3287219` (regen at current HEAD); MANIFEST `sourceCommit=3287219` · `includesAdmin: true` · August **14** cards · discography **4** releases / **34** tracks (filtered `site_slug=gosaki-piano`); sitemap no `/admin/`; manual FTP upload recorded in G-20u26b. Doc: `gosaki-staging-package-regen-after-discography-filtered-read.md`. Verifier: `verify-g20u26-gosaki-staging-package-regen-after-discography-filtered-read.mjs` (historical HEAD-pinned).

**G-20u25 Discography filtered read enablement (2026-07-10):** **complete** — `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true`; Gosaki `site_slug='gosaki-piano'` filtered read (4 releases / 34 tracks / 4 album groups when Supabase live); pilot null/noop; non-Gosaki unfiltered read blocked; **no DB write / SQL execution / FTP / deploy**; package regen in G-20u26. Doc: `discography-filtered-read-enablement.md`. Verifier: `verify-g20u25-discography-filtered-read-enablement.mjs`. Regression suite: **23** verifiers.

**G-20u24d Discography site_slug migration execution record (2026-07-10):** **complete** — G-20u24a before PASS · G-20u24b migration PASS · G-20u24c after corrected PASS (SQL `count(*)` vs `sum(track_count)` bug fixed); staging `discography`/`discography_tracks` backfilled `gosaki-piano` (4/34); rollback not needed; loader flag enabled in G-20u25; **no new SQL execution / FTP / deploy**. Doc: `discography-site-slug-migration-execution-result.md`. Verifier: `verify-g20u24d-discography-site-slug-migration-execution-record.mjs`. Regression suite: **22** verifiers (pre-G-20u25).

**G-20u23 Discography site_slug migration planning (2026-07-10):** **complete** — before/migration/after/rollback SQL templates for `discography` + `discography_tracks`; nullable column + `gosaki-piano` backfill design; 4 releases / 34 tracks baseline; `DISCOGRAPHY_SITE_SLUG_COLUMN_READY` unchanged (false); **no SQL execution / DB write / FTP / deploy**. Doc: `discography-site-slug-migration-planning.md`. Verifier: `verify-g20u23-discography-site-slug-migration-planning.mjs`. Regression suite: **21** verifiers.

**G-20u22 Discography loader multi-site readiness (2026-07-10):** **complete** — `site-discography-loader.mjs` capability resolver; `loadDiscographyDataForBuild` generic entry; Gosaki wrapper retained (4 releases); pilot null/noop; non-Gosaki blocked until `site_slug` column migration; **no DB write / SQL migration / FTP / deploy**. Doc: `discography-loader-multisite-readiness.md`. Verifier: `verify-g20u22-discography-loader-multisite-readiness.mjs`. Regression suite: **20** verifiers.

**G-20u21 Generic read-only admin flag (2026-07-10):** **complete** — `includeReadOnlyAdmin` in registry/packageProfiles; `site-admin-features.mjs` resolution; `cmsFeatures.readOnlyAdmin` gates hook inject; legacy `includeGosakiReadOnlyAdmin` alias retained; Gosaki staging `includesAdmin: true` · production/pilot `false`; sitemap `/admin/` exclusion unchanged (G-20t1); **no FTP / deploy / DB write / package regen**. Doc: `generic-read-only-admin-flag.md`. Verifier: `verify-g20u21-generic-read-only-admin-flag.mjs`. Regression suite: **19** verifiers.

**G-20u20 Supabase CMS features generalization (2026-07-10):** **complete** — `cmsFeatures` + extended `supabaseFeatures` (`siteEmbeds`) in registry; `site-cms-features.mjs` resolvers; loaders feature-gated (read-only); Gosaki post-generate hooks gated by `isCmsFeatureEnabled`; `site_embeds` migration deferred (G-9f TODO); Gosaki 74/14/4 + pilot null verified; **no DB write / SQL migration / FTP / deploy**. Doc: `supabase-cms-features-generalization.md`. Verifier: `verify-g20u20-supabase-cms-features-generalization.mjs`. Regression suite: **18** verifiers.

**G-20u19 Generator option naming and fixture registry (2026-07-10):** **complete** — generic `scheduleBundle` / `discographyBundle` in convert / astro-generator / url-to-staging; `normalizeSiteDataBundles` + legacy alias compat; `matchRegistryFixtureDir` replaces `isGosakiPianoFixture` in hook `matchFixture`; gosaki-specific modules retain deprecated `isGosakiPianoFixture`; Gosaki 74 events / August 14 / discography 4 + pilot null bundles verified; **no FTP / deploy / DB write**. Doc: `generator-option-naming-and-fixture-registry.md`. Verifier: `verify-g20u19-generator-option-naming-and-fixture-registry.mjs`.

**G-20u18 package.json / CLI default decoupling (2026-07-10):** **complete** — generic `manual-upload:site-package` requires `--site-key`; Gosaki inline defaults moved to named wrappers (`manual-upload:package:gosaki:staging`); legacy aliases retained (`manual-upload:package`, `verify:package-freshness:staging`); freshness npm uses explicit `--site`; **no FTP / deploy / DB write**. Doc: `package-json-cli-default-decoupling.md`. Verifier: `verify-g20u18-package-json-cli-default-decoupling.mjs` (in `verify:current-active-regression`).

**G-20u16 Remaining site-specific coupling audit (2026-07-10):** **complete** — post G-20u15 inventory; A–E classification; next candidates G-20u17–u21; **read-only audit** · **no refactor / FTP / DB write**. Doc: `remaining-site-specific-coupling-audit.md`. Verifier: `verify-g20u16-remaining-site-specific-coupling-audit.mjs`.

**G-20u15 Current active regression suite (2026-07-10):** **complete** — `verify-current-active-regression-suite.mjs` runs G-20u2–u14 active verifiers (14 scripts); npm `verify:current-active-regression`; **14/14 PASS at `3ae56b1`**; child verifier HEAD pins normalized (G-20t2 NOTE); historical verifiers excluded; **no FTP / deploy / DB write / package regen**. Doc: `current-active-regression-suite.md`.

**G-20u14 URL-to-staging pipeline site-aware (2026-07-10):** **complete** — `--site SITE_KEY` on `url-to-staging-pipeline.mjs`; registry resolves fixtureDir / staging profile / deployBase; convert uses `loadSiteSupabaseDataForBuild` + `siteKey` (replaces `isGosakiPianoFixture`); step plan + `buildNextManualSteps` pass `--site`; legacy verifier 2 historical FAILs fixed (G-9c0b/G-9d source-location drift after G-20t1/G-20u6); **no FTP / deploy / DB write**. Doc: `url-to-staging-pipeline-site-aware.md`. Verifiers: `verify-g20u14-*` + `verify-url-to-staging-pipeline.mjs` **0 failed**.

**G-20u13 Site-aware Supabase loaders (2026-07-10):** **complete** — `site-aware-supabase-loaders.mjs` resolves `siteKey` → registry `supabaseSiteSlug` + `supabaseFeatures`; convert uses `loadSiteSupabaseDataForBuild`; Gosaki wrappers (`loadGosakiScheduleDataForBuild` / `loadGosakiDiscographyDataForBuild`) retained; pilot skips Supabase (null bundles); **read-only** · **no DB write / SQL mutation**. Doc: `site-aware-supabase-loaders.md`. Verifier: `verify-g20u13-site-aware-supabase-loaders.mjs`.

**G-20u12 Manual-upload README/CHECKLIST preflight integration (2026-07-10):** **complete** — `formatReadmeUpload` / `formatUploadChecklist` embed G-20u11 site-aware preflight; stale STOP + rebuild at HEAD; FTP safety + G-20j production STOP retained; **follow-up:** `safe-output-cleanup.mjs` fixes `build:pilot:staging` ENOTEMPTY; **pilot full build + preflight PASS at `e6f2531`**; **commit後は package stale** until regen; **no FTP / deploy**. Doc: `manual-upload-readme-checklist-preflight-integration.md`. Verifier: `verify-g20u12-*`.

**G-20u11 Site-aware preflight scripts (2026-07-10):** **complete** — `run-site-preflight.mjs` chains `verify-site-package` + `verify-package-upload-freshness` with explicit `--site`/`--profile`; `preflight:gosaki:*` / `preflight:pilot:staging` / generic `preflight` npm; legacy build/verify/freshness scripts retained; stale package → preflight STOP (expected); **no FTP / deploy**. Doc: `site-aware-preflight-scripts.md`. Verifier: `verify-g20u11-site-aware-preflight-scripts.mjs`.

**G-20u10 Site-aware package freshness CLI (2026-07-10):** **complete** — `verify-package-upload-freshness.mjs` accepts `--site` + `--profile` (registry `manualUploadOut`); `--package-dir` retained; legacy `--profile`-only Gosaki compat; generic `verify:package-freshness` npm; pilot script uses `--site pilot-sample-static`; **on-disk packages stale at HEAD** until regen; **no FTP / deploy**. Doc: `site-aware-package-freshness-cli.md`. Verifier: `verify-g20u10-site-aware-package-freshness-cli.mjs`.

**G-20u9 Pilot sample static full package build + verify (2026-07-10):** **complete** — full `build-site-package pilot-sample-static staging` PASS (9 files); `verify-site-package` PASS; freshness via `--package-dir`; per-site static-public expectations; no admin/gosaki/schedule artifacts; Gosaki dry-run regression PASS; **no FTP / deploy**. Doc: `pilot-sample-static-full-package-build-verify.md`. Verifier: `verify-g20u9-pilot-sample-static-full-package-build-verify.mjs`.

**G-20u8 Second-site noop hooks pilot dry-run (2026-07-10):** **complete** — registry `pilot-sample-static` on existing `fixtures/sample-static-site`; noop hooks via explicit `--site`; Gosaki hooks not mis-applied; generic build/convert dry-run PASS; verify schedule gates scoped to gosaki-piano; **no FTP / deploy / DB write**. Doc: `second-site-noop-hooks-pilot-dry-run.md`. Verifier: `verify-g20u8-second-site-noop-hooks-pilot-dry-run.mjs`.

**G-20u7 Convert pipeline siteKey propagation (2026-07-10):** **complete** — `build-site-package` → `convert-static-to-astro --site` → `generateAstroProject({ siteKey })` → `resolveSiteGeneratorHooks`; `buildConvertCliArgs`; fixture/`matchFixture` fallback retained; unknown `--site` → clear error; wrappers unchanged; **full staging regen verified at `528b06a`** (29 files · August 14 cards · MANIFEST siteKey · freshness PASS); **commit後は package stale** until regen; **no FTP / deploy**. Doc: `gosaki-convert-pipeline-sitekey-propagation.md`. Verifier: `verify-g20u7-convert-pipeline-sitekey-propagation.mjs`.

**G-20u6 Astro generator hook registry (2026-07-10):** **complete** — `site-generator-hooks.mjs` + `resolveSiteGeneratorHooks`; Gosaki factory delegates to existing `gosaki-*` modules; `astro-generator.mjs` no direct Gosaki imports; default/noop hooks for unregistered sites; **output compat preserved**; **full staging regen verified at `3decd7f`** (29 files · August 14 cards · freshness PASS); **commit後は package stale** until regen; **no FTP / deploy**. Doc: `gosaki-astro-generator-hook-registry.md`. Verifier: `verify-g20u6-astro-generator-hook-registry.mjs`.

**G-20u5 Site package npm convenience & freshness flow (2026-07-09):** **complete** — `build:gosaki:*` / `verify:gosaki:*` / `preflight:gosaki:*` npm scripts; operator flow build → verify → freshness; production upload **STOP**; **no FTP / deploy**. Doc: `gosaki-site-package-npm-convenience-and-freshness-flow.md`. Verifier: `verify-g20u5-site-package-npm-convenience-and-freshness-flow.mjs`.

**G-20u4 Verify site package generic CLI (2026-07-09):** **complete** — `verify-site-package.mjs --site --profile`; shared `verify-site-package-core.mjs`; Gosaki extensions; legacy verifiers delegate; **no FTP / deploy**. Freshness: structure verify separate from `verify:package-freshness:*` HEAD match. Doc: `gosaki-verify-site-package-generic-cli.md`. Verifier: `verify-g20u4-verify-site-package-generic-cli.mjs`.

**G-20u3 Build site package generic CLI (2026-07-09):** **complete** — `build-site-package.mjs --site --profile`; shared `build-site-package-core.mjs`; Gosaki wrappers delegate; **no FTP / deploy**. Freshness: regen stamps current HEAD; **any later commit makes package stale** until regen + `verify:package-freshness:*` PASS. Doc: `gosaki-build-site-package-generic-cli.md`. Verifier: `verify-g20u3-build-site-package-generic-cli.mjs`.

**G-20u2 Site registry & build profile foundation (2026-07-09):** **complete** — `config/sites/registry.json` + `site-registry.mjs`; Gosaki slug semantics documented; `gosaki-package-build-profile.mjs` delegates; MANIFEST optional registry fields; wrappers unchanged; **no FTP / deploy**. Doc: `gosaki-site-registry-build-profile-foundation.md`. Verifier: `verify-g20u2-site-registry-build-profile-foundation.mjs`.

**G-20u1 Gosaki hardcode generalization audit (2026-07-09):** **complete** — inventory + 4-tier classification + G-20u2–u10 roadmap; **no large refactor**. Doc: `gosaki-hardcode-generalization-audit.md`. Verifier: `verify-g20u1-gosaki-hardcode-generalization-audit.mjs`.

**G-20t6 Gosaki package freshness gate (2026-07-09):** **complete** — `sourceCommit` vs git HEAD upload preflight; staging + production; stale → STOP; **no FTP / deploy**. Doc: `gosaki-package-freshness-gate.md`. Verifier: `verify-g20t6-package-freshness-gate.mjs`. Preflight: `verify-package-upload-freshness.mjs`.

**G-20t5 Gosaki staging profile current-head regen dry-run (2026-07-09):** **complete** — local staging full regen at `c9d35d7`; 29 files; August 14 cards; `includesAdmin: true`; sitemap no admin; **no FTP / deploy**. Doc: `gosaki-staging-profile-current-head-regen-dry-run.md`. Verifier: `verify-g20t5-gosaki-staging-profile-current-head-regen-dry-run.mjs`.

**G-20t4 Gosaki production profile full regen dry-run (2026-07-09):** **complete** — local full production regen at `55d0364`; 28 files; August 14 cards; admin excluded; sitemap clean; `intendedRemotePath: TBD_G-20i` (upload blocked); **no FTP / deploy**. Doc: `gosaki-production-profile-full-regen-dry-run.md`. Verifier: `verify-g20t4-gosaki-production-profile-full-regen-dry-run.mjs`.

**G-20t3 Gosaki staging / production package upload safety hardening (2026-07-09):** **complete** — MANIFEST metadata (`targetEnvironment`, `includesAdmin`, `intendedRemotePath`, `sourceCommit`); environment-aware README/CHECKLIST; production admin/sitemap verifier hardening; **no FTP / deploy**. Doc: `gosaki-package-upload-safety-hardening.md`. Verifier: `verify-g20t3-staging-prod-package-upload-safety-hardening.mjs`.

**G-20t2 Gosaki schedule month discovery generalization (2026-07-09):** **complete** — auto-discover months from published Supabase rows; `optionalMonthOverride` for empty months only; G-20r4a `expectedMonths` gate removed; historical verifier HEAD pins → NOTE (non-blocking). Doc: `gosaki-schedule-month-discovery-generalization.md`.

**G-20t1 Gosaki sitemap admin exclusion hardening (2026-07-09):** **complete** — CMS Kit sitemap filter excludes `/admin/`, staging shell, API · `/schedule/2026-08/` retained · local package regen verified. Doc: `gosaki-sitemap-admin-exclusion-hardening.md`.

**G-20s2b Gosaki Contact HubSpot E2E execution closure (2026-07-09):** **complete**. Doc: `gosaki-contact-hubspot-e2e-execution-closure.md`.

**G-20s2 Gosaki Contact HubSpot E2E verify (2026-07-09):** **complete**. Doc: `gosaki-contact-hubspot-e2e-verify.md`.

**G-20s1 Gosaki mobile device QA (2026-07-09):** **complete**. Doc: `gosaki-mobile-device-qa.md`.

**G-20r4e Gosaki schedule August manual upload execution closure (2026-07-09):** **complete**. Doc: `gosaki-schedule-manual-upload-execution-closure.md`.

**G-20r4d Gosaki schedule August upload preflight (2026-07-09):** **complete**. Doc: `gosaki-schedule-upload-preflight.md`.

**G-20r4c Gosaki schedule public output review (2026-07-09):** **complete**. Doc: `gosaki-schedule-public-output-review.md`.

**G-20r4b Gosaki schedule local regen dry-run (2026-07-09):** **complete**. Doc: `gosaki-schedule-local-regen-dry-run-result.md`.

**G-20r4a Gosaki schedule August generation path enablement (2026-07-09):** **complete**. Doc: `gosaki-schedule-august-generation-path-enablement.md`.

**G-20r4 Gosaki schedule August public reflection plan (2026-07-09):** **complete** — DB→JSON→build→QA→manual upload sequence planned. Doc: `gosaki-schedule-public-reflection-plan.md`.

**G-20r3a Gosaki schedule August DB INSERT execution closure (2026-07-09):** **complete** — operator SQL **PASS** · DB total **79** · published **74** · August 17 (14/3) · staging DB reflects 2026-08; **local package stale**. Doc: `gosaki-schedule-august-db-insert-execution-closure.md`.

**G-20r3 Gosaki schedule August DB INSERT preflight (2026-07-09):** **complete** — preflight + SQL draft; execution closed in G-20r3a. Doc: `gosaki-schedule-august-db-insert-preflight.md`.

**G-20s Gosaki whole-site product quality audit (2026-07-09):** **complete** — G-20r3 proceed OK. Doc: `gosaki-whole-site-product-quality-audit.md`.

**G-20r2b Gosaki schedule product quality policy (2026-07-09):** **complete** — 14/3/2 classification; readyForG20r3 true. Doc: `gosaki-schedule-product-quality-policy.md`.

**G-20r2a Gosaki schedule client confirmation question list (2026-07-09):** **complete** — **superseded for blocking path by G-20r2b** (client message optional G-20r2c). Doc: `gosaki-schedule-client-confirmation-question-list.md`.

**G-20r2 Gosaki schedule August seed planning (2026-07-09):** **complete** — **superseded for client questions by G-20r2a**. Docs: `gosaki-schedule-august-seed-planning.md`, `gosaki-schedule-august-seed-candidates.json`.

**G-20r1b Gosaki limited public URL capture (2026-07-08):** **complete** — **superseded for seed input by G-20r2**. Doc: `gosaki-schedule-public-url-capture-result.md`.

**G-20r1 Gosaki schedule source capture plan (2026-07-08):** **complete** — manual procedure doc; **superseded for capture execution by G-20r1b**. Doc: `gosaki-schedule-source-capture-plan.md`.

**G-20r Gosaki schedule source freshness audit (2026-07-08):** **complete** — source freshness gap CONFIRMED; Kit 03–07 only. Doc: `gosaki-schedule-source-freshness-audit.md`. **Superseded for capture procedure by G-20r1.**

**G-20q Gosaki internal preview readiness gap audit (2026-07-08):** **complete** (reclassified) — `clientPreviewVerdict: NOT_READY`; `<>` = Wix source parity. Doc: `gosaki-internal-preview-readiness-gap-audit.md`. **Superseded for freshness detail by G-20r.**

**G-20j Gosaki production upload preflight refresh (2026-07-08):** **complete** — G-20p reflected; 26-file manifest verified; content **GO** · execution **HOLD** (DNS/SSL/MX/remote path/sign-off); FTP **operator manual only**. Doc: `gosaki-production-upload-preflight-refresh.md`. **Client sign-off outreach deferred** — internal QA priority (G-20q).

**G-20p Gosaki production package staleness review (2026-07-08):** **complete** — read-only compare G-20i3 production package vs G-22j; schedule content **NOT stale**; upload content **GO** · execution **HOLD** (DNS/SSL/MX); regen **not required**. Doc: `gosaki-production-package-staleness-review.md`. **Superseded for upload preflight by G-20j refresh.**

**Gosaki production-cutover gap refresh (2026-07-08):** **complete** — read-only refresh of G-20a/G-20j cutover state post G-22j Schedule P0; pre-launch checklists; P0/P1/P2/保留 reclassified; G-20j STOP (DNS/SSL/MX/remote path) unchanged. Doc: `gosaki-production-cutover-gap-refresh.md`. **Superseded for package staleness verdict by G-20p.**

**Gosaki completion audit (2026-07-08):** **complete** — read-only inventory of Gosaki-piano remaining work; P0/P1/P2/保留 classified; G-23 paused at `d7a7250`; Schedule CMS P0 closed (G-22j). Doc: `gosaki-completion-audit.md`. **Superseded for cutover checklists by gap refresh.**

**G-23 series paused at d7a7250 (2026-07-08):** G-23a–G-23n complete (onboarding orchestrator, report output, crawl allowlist). **G-23o live crawl ON HOLD.** Priority returned to Gosaki-piano completion. seiichijazz.com deferred.

**G-23n Static-to-Astro live crawl allowlist config (2026-07-08):** **complete** — crawl allowlist example + static validator + inspect CLI. Doc: `static-to-astro-live-crawl-allowlist-config-result.md`. **Superseded by Gosaki completion audit priority shift.**

**G-23m Static-to-Astro sample full dry-run report artifact review (2026-07-08):** **complete** — verdict PASS_WITH_KNOWN_WARNING. Doc: `static-to-astro-sample-full-dry-run-report-artifact-review-result.md`. **Superseded for allowlist config by G-23n.**

**G-23l Static-to-Astro onboarding report output (2026-07-08):** **complete** — local report artifacts under `output/onboarding-reports/{siteSlug}/latest/`. Doc: `static-to-astro-onboarding-report-output-result.md`. **Superseded for artifact review by G-23m.**

**G-23k Static-to-Astro crawl-dry-run safety planning (2026-07-08):** **complete** — safety design for live crawl-dry-run before G-23o. Doc: `static-to-astro-crawl-dry-run-safety-planning.md`. **Superseded for report output by G-23l.**

**G-23j Static-to-Astro first non-network sample full dry-run (2026-07-08):** **complete** — `full-dry-run` mode on sample musician fixture; steps 0–9 PASS; seed 7 candidates; warnings (news unmapped); DB/package/FTP planOnly. Doc: `static-to-astro-first-non-network-sample-full-dry-run-result.md`. Verifier: `verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs`. **No crawl / network / DB / SQL / package / FTP.** **Superseded for crawl safety design by G-23k.**

**G-23i Static-to-Astro fixture mode orchestrator integration (2026-07-08):** **complete** — orchestrator = standard entry; G-23d script = compatibility wrapper. Doc: `static-to-astro-fixture-mode-orchestrator-integration-result.md`. **Superseded for full dry-run by G-23j.**

**G-23h Static-to-Astro onboarding orchestrator skeleton (2026-07-08):** **complete** — `run-onboarding-orchestrator.mjs` wires G-23c validator · G-23f registry · G-23g seed extractor; modes `validate-only` · `fixture-dry-run`; steps 0–9; planOnly DB/package/FTP. Doc: `static-to-astro-onboarding-orchestrator-skeleton-result.md`. Verifier: `verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs`. **Superseded for fixture entry by G-23i.**

**G-23g Static-to-Astro seed extractor standardization (2026-07-08):** **complete** — standardized `onboarding-seed-extractor.mjs` for schedule/news/profile/discography/video/contact; fixture → reviewable seed candidates; inspect CLI. Doc: `static-to-astro-seed-extractor-standardization-result.md`. Verifier: `verify-g23g-static-to-astro-seed-extractor-standardization.mjs`. Sample musician fixture: schedule 2 · news/profile/discography/video/contact 1 each. **No DB / network / crawl / SQL / package / FTP.** **Superseded for orchestrator by G-23h.**

**G-23f Static-to-Astro CMS preset registry (2026-07-08):** **complete** — read-only preset registry for musician-basic · lesson-studio-basic · shop-basic; module metadata · validateCmsPresetConfig · inspect CLI. Registry: `scripts/lib/cms-preset-registry.mjs`. Inspect: `scripts/inspect-cms-preset-registry.mjs`. Doc: `static-to-astro-cms-preset-registry-result.md`. Verifier: `verify-g23f-static-to-astro-cms-preset-registry.mjs`. Gosaki config PASS. **No DB / network / crawl / package / FTP.** **Superseded for seed extraction by G-23g.**

**G-23e Static-to-Astro onboarding orchestrator planning (2026-07-08):** **complete** — orchestrator step 0–9 design; CLI modes; safety gate matrix; failure policy; output report; G-23a timeline mapping; G-23d prototype relationship. Doc: `static-to-astro-onboarding-orchestrator-planning.md`. Verifier: `verify-g23e-static-to-astro-onboarding-orchestrator-planning.mjs`. **Superseded for preset registry by G-23f.**

**G-23d Static-to-Astro onboarding sample site dry-run (2026-07-08):** **complete** — fixture-only 30-min onboarding dry-run; sample musician config + crawl fixture; page classification · CMS seed candidates · output paths (computed only). Script: `scripts/run-onboarding-fixture-dry-run.mjs`. Config: `config/onboarding.sample-musician-fixture.example.json`. Fixture: `fixtures/onboarding/sample-musician-basic-crawl-result.json`. Doc: `static-to-astro-onboarding-sample-site-dry-run-result.md`. Verifier: `verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs`. **Superseded for orchestrator design by G-23e (G-23d script retained as prototype).**

**G-23c Static-to-Astro onboarding config validator (2026-07-08):** **complete** — local onboarding config validator; Gosaki example PASS; bad-config FAIL cases; safety gates · production ref · service_role · secrets guards. Validator: `scripts/validate-onboarding-config.mjs`. Doc: `static-to-astro-onboarding-config-validator-result.md`. Verifier: `verify-g23c-static-to-astro-onboarding-config-validator.mjs` (77 PASS). **Superseded for fixture dry-run by G-23d.**

**G-23b Static-to-Astro onboarding config schema planning (2026-07-08):** **complete** — onboarding config schema designed; safety gates default safe; Gosaki example config; 30-min flow wiring documented. Doc: `static-to-astro-onboarding-config-schema-planning.md`. Schema: `config/onboarding.schema.example.json`. Sample: `config/onboarding.gosaki-piano.example.json`. Verifier: `verify-g23b-static-to-astro-onboarding-config-schema-planning.mjs`. **Superseded for validation by G-23c.**

**G-23a Static-to-Astro CMS 30-minute onboarding flow planning (2026-07-08):** **complete** — strategic 30-min flow design; CMS presets; Gosaki safety gates; Phase 1–4 roadmap; implementation candidates. Doc: `static-to-astro-30-minute-onboarding-flow-planning.md`. Verifier: `verify-g23a-static-to-astro-30-minute-onboarding-flow-planning.mjs`. **Superseded for config schema by G-23b.**

**G-22j2 Gosaki Schedule CMS P0 release note (2026-07-07):** **complete** — commit `5fa7fdb`. **Superseded for strategic planning by G-23a.**

**G-22j1 Gosaki Schedule P0 overall closure (2026-07-07):** **complete** — commit `904a248`. **Superseded for release communication by G-22j2.**

**G-22i5skip Gosaki Schedule republish public reflection closure (2026-07-07):** **complete** — commit `8551933`. **Superseded for overall closure by G-22j1.**

**G-22i4 Gosaki Schedule public output review (2026-07-07):** **complete** — commit `8df485d`. **Superseded for closure by G-22i5skip.**

**G-22i3 Gosaki Schedule package/diff dry-run (2026-07-07):** **complete** — commit `55fd5ef`. **Superseded for review by G-22i4.**

**G-22i2 Gosaki Schedule public reflection planning (2026-07-07):** **complete** — commit `442f8db`. **Superseded for package work by G-22i3.**

**G-22i1 Gosaki Schedule P0 release readiness review (2026-07-07):** **complete** — commit `f093e97`. **Superseded for reflection work by G-22i2.**

**G-22h7 Gosaki Schedule republish UPDATE result closure (2026-07-07):** **complete** — commit `4857f77`. **Superseded for readiness by G-22i1.**

**G-22h6b Gosaki Schedule republish operator Save once (2026-07-07):** **complete** — retry3 success; `actualWrite=true`; saved `updated_at=2026-07-07T02:30:32.260326+00:00`. **Superseded for closure by G-22h7.**

**G-22h6b retry2 blocker Gosaki Schedule republish Save still disabled (2026-07-07):** **complete** — commit `d28a3d7`. dry-run preservation fix. **Superseded by G-22h6b retry3 success.**

**G-22h6b blocker Gosaki Schedule republish Save disabled / session gate (2026-07-07):** **complete** — session sync fix. **Superseded by retry2/retry3.**

**G-22h6a Gosaki Schedule republish UPDATE implementation (2026-07-07):** **complete** — commit `9880091`. **Superseded for execution by G-22h6b (blocked).**

**G-22h5 Gosaki Schedule republish target selection / preflight (2026-07-07):** **complete** — commit `fabfd2f`. G-22h6 first candidate `schedule-2026-07-008`; expectedBeforeUpdatedAt recorded. **Superseded for implementation by G-22h6a.**

**G-22h4b Gosaki Schedule republish UI wording cleanup (2026-07-07):** **complete** — commit `92eaf55`. **Superseded for preflight by G-22h5.**

**G-22h4 Gosaki Schedule republish dry-run read-only QA (2026-07-07):** **complete** — commit `4e45f90`. Operator manual login QA on `schedule-2026-07-008`; residual English wording fixed in G-22h4b. **Superseded for wording by G-22h4b.**

**G-22h3 Gosaki Schedule republish dry-run UI implementation (2026-07-07):** **complete** — commit `646f680`. `executeG22hScheduleRepublishDryRun` + republish draft UI + save target panel; Save **disabled / alert-only** until G-22h6. **Superseded for QA by G-22h4.**

**G-22h2 Gosaki Schedule republish dry-run UI planning (2026-07-07):** **complete** — commit `541d0dd`. **Superseded for implementation by G-22h3.**

**G-22h1 Gosaki Schedule republish planning (2026-07-07):** **complete** — commit `f399add`. `published=false→true` UPDATE policy; candidate targets 008/014/001. **Superseded for dry-run design by G-22h2.**

**G-22g2b Gosaki Schedule P0 UX summary / closure (2026-07-07):** **complete** — commit `d3e76df`. G-22g1a→G-22g2a chain closed. **Superseded for republish work by G-22h1.**

**G-22g2a Gosaki Schedule P0 UX read-only QA (2026-07-07):** **complete** — commit `73b4d23`. **Closed by G-22g2b summary.**

**G-22g2 Gosaki Schedule operator procedure hints (2026-07-07):** **complete** — commit `8e83348`. **Superseded for P0 UX QA by G-22g2a.**

**G-22g1f3 Gosaki Schedule authenticated admin read closure (2026-07-07):** **complete** — commit `fd47f8b`. G-22g1e→G-22g1f2c chain closed; SSR bootstrap + login refetch; 008 visible; 60件/非公開2件 operator PASS. **Superseded for procedure hints by G-22g2.**

**G-22g1f2c Gosaki Schedule authenticated admin read operator login smoke result (2026-07-07):** **complete** — commit `60d442d`. **Superseded for chain closure by G-22g1f3.**

**G-22g1f2 Gosaki Schedule authenticated admin read read-only QA (2026-07-07):** **complete** — commit `7b726df`. **Closed by G-22g1f2c + G-22g1f3.**

**G-22g1f1 Gosaki Schedule authenticated admin read implementation (2026-07-07):** **complete** — commits `35007fc`, syntax fix `8729a9a`. **Chain closed in G-22g1f3.**

**G-22g1f Gosaki Schedule authenticated admin read planning (2026-07-07):** **complete** — commit `3de4b78`. **Superseded by G-22g1f1/f2 chain.**

**G-22g1d Gosaki Schedule P0 UX QA after G-22g1a/b/c (2026-07-07):** **complete** — commit `6018696`. **Superseded for read investigation by G-22g1e.**

**G-22g1c Gosaki Schedule save preview / target confirmation panel (2026-07-07):** **complete** — commit `b5ccb9f`. **Superseded for read investigation by G-22g1e.**

**G-22g1b Gosaki Schedule dev/mock section isolation (2026-07-07):** **complete** — commit `9c6d514`. **Superseded for P0 UX QA by G-22g1d.**

**G-22g1a Gosaki Schedule list UX legacy_id visibility (2026-07-06):** **complete** — commit `406cf16`. **Superseded for P0 UX QA by G-22g1d.**

**G-22g Gosaki Schedule P0 CRUD remaining tasks / next plan (2026-07-06):** **complete** — commit `814a77f`. **Superseded for list UX by G-22g1a.**

**G-22f7 Gosaki Schedule unpublish UPDATE chain closure (2026-07-06):** **complete** — commit `82668b4`. G-22f→G-22f6 chain closed; `schedule-2026-07-008` unpublish UPDATE single-slice success; re-Save forbidden; write-armed dev server stopped. **Superseded for P0 planning by G-22g.**

**G-22f6 Gosaki Schedule unpublish UPDATE execution result (2026-07-06):** **complete** — commit `691b020`. **Superseded for chain closure by G-22f7.**

**G-22f4b Gosaki Schedule unpublish UPDATE target fixed / beforeVerification (2026-07-06):** **complete** — commit `500aaf0`. **Superseded for execution result by G-22f6.**

**G-22f4 Gosaki Schedule unpublish UPDATE final preflight (2026-07-06):** **complete** — commit `8945905`. candidate list + SQL templates; target fixed in G-22f4b. **Superseded for execution by G-22f4b.**

**G-22f3 Gosaki Schedule unpublish UPDATE implementation (2026-07-06):** **complete (uncommitted)** — config/guards/save/UI gate for `published=true→false` UPDATE; approvalId `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`; optimistic lock via G-9k UPDATE path; default Save disabled. **No Save / DB write / GRANT / FTP.** Doc: `gosaki-schedule-unpublish-update-implementation.md`. Verifier: `verify-g22f3-gosaki-schedule-unpublish-update-implementation.mjs`. **Superseded for execution preflight by G-22f4.**

**G-22f2 Gosaki Schedule unpublish UPDATE planning (2026-07-06):** **complete** — commit `56316a6`. **Superseded for implementation by G-22f3.**

**G-22f Gosaki Schedule unpublish dry-run UI implementation (2026-07-05):** **complete** — commit `9f495b4`. unpublish draft mode +「非公開化案を作成」+ dry-run preview. Doc: `gosaki-schedule-unpublish-dry-run-ui-implementation.md`. **Superseded for QA by G-22f1.**

**G-22e7 Gosaki Schedule new event INSERT chain closure (2026-07-05):** **complete** — commit `215f638`. **Superseded for unpublish work by G-22f.**

**G-22e6 Gosaki Schedule new event INSERT execution result (2026-07-05):** **complete** — commit `c080a1d`. `insertedId=18b48259-9a9a-4b00-b136-6c0c4ff3b2f3`; afterVerification PASS. **Superseded for chain closure by G-22e7.**

**G-22e5-blocker New event draft「変更を確認」button missing investigation (2026-07-04):** **complete** — scroll fix `scrollNewEventDraftIntoView()`. **Superseded by G-22e5 execution.**

**G-22e3 Gosaki Schedule new event INSERT implementation (2026-07-02):** **complete** — commit `e566855`. **Superseded for execution preflight by G-22e4.**

**G-22e1 Gosaki Schedule new event dry-run local QA (2026-07-02):** **complete** — commit `4d39598`. local dev HTTP 200 + markup + module smoke PASS; Save/delete disabled; existing/duplicate intact. **Superseded for INSERT planning by G-22e2.**

**G-22e Gosaki Schedule new event dry-run UI implementation (2026-07-02):** **complete** — commit `c716891`. add button wired; new draft mode + dry-run preview; Save disabled. Doc: `gosaki-schedule-new-event-dry-run-ui-implementation.md`. **Superseded for QA by G-22e1.**

**G-22d3d Gosaki Schedule duplicate INSERT chain closure (2026-07-02):** **complete** — commit `2ed6122`. **Superseded for new event work by G-22e.**

**G-22d3c Gosaki Schedule duplicate INSERT execution result (2026-07-02):** **complete** — commit `4e3d55a`. `insertedId=434e4051-86c3-473e-9ad0-39d2e5042fb8`; `legacy_id=schedule-2026-03-014`; afterVerification PASS. Doc: `gosaki-schedule-duplicate-insert-execution-result.md`. **Superseded for closure by G-22d3d.**

**G-22d3b2–G-22d3b4 Gosaki schedules INSERT grant + duplicate Save (2026-07-02):** **complete** — commit `a3c8f7c`. INSERT grant applied; duplicate INSERT succeeded. **Superseded by G-22d3c result record.**

**G-22d2b Gosaki Schedule duplicate INSERT preflight drift fix (2026-07-02):** **complete** — commit `974738c`. Payload `sort_order=70`, `source_file=schedule-2026-03.html`.

**G-22d3a Gosaki Schedule duplicate INSERT beforeVerification (2026-07-02):** **complete** — commit `428ed61`. Doc: `gosaki-schedule-duplicate-insert-beforeverification.md`. Live SELECT found drift (max sort_order 60, source_file). **Superseded for payload by G-22d2b.**

**G-22d2 Gosaki Schedule duplicate INSERT final preflight (2026-07-02):** **complete** — commit `07202b3`. Doc: `gosaki-schedule-duplicate-insert-final-preflight.md`. **Payload updated by G-22d2b.**

**G-22d1 Gosaki Schedule duplicate INSERT implementation (2026-07-02):** **complete** — commit `daa1da2`. Doc: `gosaki-schedule-duplicate-insert-implementation.md`. **Superseded for execution by G-22d2.**

**G-22d Gosaki Schedule duplicate INSERT planning / final preflight (2026-07-02):** **complete** — commit `8d0f541`. Doc: `gosaki-schedule-duplicate-insert-planning.md`. **Superseded for implementation by G-22d1.**

**G-22c Gosaki Schedule duplicate dry-run local QA (2026-07-02):** **complete** — commit `d1fa0a8`. Operator spot-check PASS. Doc: `gosaki-schedule-duplicate-dry-run-local-qa.md`. **Superseded for INSERT work by G-22d.**

**G-22b Gosaki Schedule duplicate dry-run UI implementation (2026-07-02):** **complete** — commit `266491e`. Operator duplicate draft + dry-run preview; Save/INSERT disabled. Doc: `gosaki-schedule-duplicate-dry-run-ui-implementation.md`. Verifier: `verify-g22b-gosaki-schedule-duplicate-dry-run-ui-implementation.mjs`. **Superseded for QA by G-22c.**

**G-22a Sariswing parity gap inventory for Gosaki CMS (2026-07-02):** **complete** — commit `f8580ec`. Doc: `gosaki-sariswing-parity-gap-inventory.md`. **Superseded for implementation by G-22b.**

**G-20ui3-QA Gosaki admin UI minor polish local QA (2026-07-02):** **complete** — commit `d404ce3`. UI polish chain closed. **Next: G-22b Schedule duplicate (functional parity).**

**G-20ui2 Gosaki admin UI polish implementation (2026-07-01):** **complete** — commit `afcbdcf`. UI copy/layout/dev panel collapse; Save logic unchanged.

**G-20ui1 Gosaki admin UI polish inventory (2026-07-01):** **complete** — commit `6d02ce1`. Superseded by G-20ui2 implementation.

**G-20i3 Gosaki production package admin exclusion (2026-07-01):** **complete** — commit `4a91061`. 26-file package, admin excluded. **Superseded for UI work by G-20ui1.**

**G-20i2 Gosaki production upload finalization (2026-07-01):** **complete** — commit `d34646d`. Option B admin exclude. **Superseded by G-20i3 rebuild.**

**G-20i Gosaki production upload preflight (2026-07-01):** **complete** — commit `69d538e`. **Superseded by G-20i2/G-20i3.**

**G-20h2 Gosaki initial local production package build (2026-07-01):** **complete** — commit `adfe27d`. Package `gosaki-piano-production/` (27 files). **Superseded by G-20i preflight.**

**G-20h1 Gosaki production config implementation (2026-07-01):** **complete** — commit `c1ca639`. Deploy profiles + production build script. **Superseded by G-20h2 build execution.**

**G-20g Gosaki production config implementation planning (2026-07-01):** **complete** — commit `f35e462`. Doc: `gosaki-production-config-implementation-planning.md`. **Implementation done — see G-20h1.**

**G-20f Gosaki production release config / cutover preflight (2026-07-01):** **complete** — commit `f36e857`. Doc: `gosaki-production-release-config-and-cutover-preflight.md`. **Superseded by G-20g for implementation detail.**

**G-20e-closure Gosaki production test text cleanup chain closure (2026-07-01):** **complete** — commit `7ce6654`. G-20b→G-20e closed. Doc: `gosaki-production-test-text-cleanup-closure.md`. **M1 blocker resolved.**

**G-20d/G-20e Gosaki production test text cleanup public reflection upload + HTTP verify (2026-07-01):** **complete** — commit `32cb18e`. Doc: `gosaki-production-test-text-cleanup-public-reflection-upload-result.md`. **Chain closed — see G-20e-closure.**

**G-20c Gosaki production test text cleanup public reflection local regen + upload preflight (2026-07-01):** **complete** — commit `0550da4`. Doc: `gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md`. **Upload done — see G-20d/G-20e.**

**G-20b-execution Gosaki production test text cleanup execution result (2026-07-01):** **complete** — commit `041f16c`. Operator SQL cleanup succeeded. Doc: `gosaki-production-test-text-cleanup-execution-result.md`. **Reflection done — see G-20c.**

**G-20b Gosaki production pre-release test text cleanup final preflight (2026-07-01):** **complete** — commit `a6c1cf1`. Doc: `gosaki-production-test-text-cleanup-final-preflight.md`. **Execution done — see G-20b-execution.**

**G-20a Gosaki production release readiness inventory (2026-07-01):** **complete** — commit `7eda613`. Doc: `gosaki-production-release-readiness-inventory.md`. Next: G-20b — **done**.

**G-19e Gosaki Discography G-19b1 tracklist Save / public reflection closure (2026-07-01):** **complete** — commit `85021b0`. G-19b1→G-19c→G-19d chain closed. Doc: `gosaki-discography-g19e-tracklist-save-public-reflection-closure.md`. **Do not re-Save / re-upload `discography-004` track 1.**

**G-19d Gosaki Discography G-19b1 tracklist public reflection upload result (2026-07-01):** **complete** — commit `de54653`. Operator manual upload 1 file; HTTP verify PASS. Doc: `gosaki-discography-g19d-tracklist-public-reflection-upload-result.md`. **Chain closed — see G-19e.**

**G-19c Gosaki Discography G-19b1 tracklist public reflection local regen / upload preflight (2026-07-01):** **complete** — commit `5b9ee8b`. Local regen PASS; 1-file upload plan. Doc: `gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md`. Upload done — see G-19d.

**G-19b1-execution Gosaki Discography tracklist generic single-title Save execution result (2026-07-01):** **complete** — commit `d311e65`. Operator Save once succeeded; track 1 `Mary Ann` → `Mary Ann（テスト）`; afterVerification PASS. Doc: `gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md`. **Do not re-Save `discography-004` track 1.**

**G-19b1-execution-readiness Gosaki Discography tracklist generic single-title Save execution readiness (2026-07-01):** **complete** — commit `97d5378`. Doc: `gosaki-discography-g19b1-tracklist-single-title-save-execution-readiness.md`. **Cursor did not Save / DB write.**

**G-19b1-preflight Gosaki Discography tracklist generic single-title Save final preflight (2026-07-01):** **complete** — commit `0112906`; beforeSnapshot read-only verified; rollback SQL template only. Doc: `gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md`. **No Save / DB write / rollback SQL.**

**G-19b1-result Gosaki Discography tracklist generic single-title Save local dry-run QA (2026-07-01):** **complete** — commit `450a8a4`; local UI Preview **PASS** (`ready_but_not_armed`). **No Save / DB write.**

**G-19b1 Gosaki Discography tracklist generic single-title Save implementation (2026-06-29):** **complete** — commit `96e790f`; `discography-004` track 1 Save adapter. Doc: `gosaki-discography-g19b1-tracklist-single-title-save-implementation.md`. **No Save / DB write.**

**G-19b Gosaki Discography tracklist Save slice planning (2026-06-29):** **complete** — commit `889a891`; first generic Save slice **G-19b1** = `discography-004` track 1 title only; G-18g2 chain closed. Doc: `gosaki-discography-g19b-tracklist-save-slice-planning.md`. **No Save / DB write.**

**G-19a Gosaki Discography tracklist generic textarea dry-run expansion (2026-06-29):** **complete** — commit `8c85f53` (+ verifier baseline `e798a94`); all 4 albums editable; G-19a generic diff Preview; Save disabled. Local UI QA **PASS** (31/31). Doc: `gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md`. **No DB write / Save / upload.**

**G-18h-upload-result Gosaki Discography public tracklist reflection upload result (2026-06-29):** **complete** — commit `8a64b12`. Operator upload 1 file; live `Like a Lover（テスト）` verified. Doc: `gosaki-discography-g18h-upload-result.md`. **Do not re-upload / re-Save track 7.**

**G-18h-upload Gosaki Discography public tracklist reflection manual upload final preflight (2026-06-29):** **complete** — commit `17926f5`. Doc: `gosaki-discography-g18h-upload-final-preflight.md`.

**G-18h Gosaki Discography public tracks reflection preflight (2026-06-29):** **complete** — commit `7cad34c`. `patchDiscographyItemTracks` + local package regen; local HTML has `Like a Lover（テスト）`. Doc: `gosaki-discography-g18h-public-tracks-reflection-preflight.md`. **Do not re-Save `discography-002` track 7.**

**G-18g2-execution Gosaki Discography tracklist single-title Save execution result (2026-06-29):** **complete** — commit `ab8dee3`. Operator Save once succeeded; track 7 `Like a Lover` → `Like a Lover（テスト）`; rollback not needed. Doc: `gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md`. **Do not re-Save `discography-002` track 7.**

**G-18g2-execution-wiring Gosaki Discography tracklist single-title Save UI wiring (2026-06-29):** **complete** — committed `8fd2ff7`. Doc: `gosaki-discography-g18g2-tracklist-single-title-save-ui-wiring.md`.

**G-18g2-preflight Gosaki Discography tracklist single-title Save final preflight (2026-06-29):** **complete** — committed `2c92bb3`. Doc: `gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md`.

**G-18g2-result Gosaki Discography tracklist single-title Save adapter local UI dry-run (2026-06-29):** **complete** — committed `9236faf`. Doc: `gosaki-discography-g18g2-tracklist-single-title-save-dry-run-local-ui-result.md`.

**G-18g2 Gosaki Discography tracklist single-title Save adapter dry-run (2026-06-29):** **complete** — committed `1041646`. Doc: `gosaki-discography-g18g2-tracklist-single-title-save-dry-run.md`.

**G-18g1-apply-result Gosaki Discography tracks UPDATE grant apply result (2026-06-29):** **complete** — committed `cf4d571`. Doc: `gosaki-discography-g18g1-apply-update-grant-result.md`.

**G-18g1 Gosaki Discography tracks GRANT / RLS read-only check (2026-06-29):** **complete** — committed `418c2bd`. Doc: `gosaki-discography-g18g1-tracks-grant-rls-readonly-check.md`.

**G-18g Gosaki Discography tracklist textarea Save adapter planning (2026-06-29):** **complete** — committed `065539b`. Doc: `gosaki-discography-g18g-tracklist-textarea-save-adapter-planning.md`.

**G-18f-result Gosaki Discography tracklist textarea diff dry-run local UI preview (2026-06-29):** **complete** — committed `8a23191`. Doc: `gosaki-discography-g18f-tracklist-textarea-diff-dry-run-local-ui-result.md`.

**G-18f Gosaki Discography tracklist textarea diff dry-run (2026-06-29):** **complete** — committed `9bf554a`. Doc: `gosaki-discography-g18f-tracklist-textarea-diff-dry-run.md`.

**G-18e Gosaki Discography tracks title-edit Save slice planning (2026-06-29):** **complete** — committed `52b22c0`. Album-level textarea UI direction. Doc: `gosaki-discography-g18e-tracks-title-edit-save-slice-planning.md`.

**G-18d-result Gosaki Discography tracks SQL execution result (2026-06-29):** **complete** — committed `d6d5039`. 16→34 rows; tracks SoT ready. Doc: `gosaki-discography-g18d-tracks-sql-execution-result.md`.

**G-17e-f Gosaki Discography G-17c label Save / public reflection closure (2026-06-29):** **complete** — committed `8fecb44`. Doc: `gosaki-discography-g17e-label-public-reflection-closure.md`.

**G-17d-execution Gosaki Discography G-17c label Save result + unexpected state investigation (2026-06-29):** **complete** — committed `7219c6c`. Doc: `gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md`. **Do not re-Save `discography-004` / `label`.**

**G-17d Gosaki Discography label Save readiness fix (2026-06-29):** **complete** — save-page-config DOM bridge for `G17C_DISCOGRAPHY_SAVE_ENABLED`. Doc: `gosaki-discography-g17d-label-save-readiness-investigation.md`.

**G-17d Gosaki Discography label Save path enablement (2026-06-29):** **complete** — committed `0fadd54`. Doc: `gosaki-discography-g17d-label-save-path-enablement.md`.

**G-17c-d2 / G-17d-d3 Gosaki Discography label local dry-run + Save final preflight (2026-06-29):** **complete** — committed `d1eefb8`. Doc: `gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md`.

**G-17c Gosaki Discography registry-based next field slice preflight (2026-06-29):** **complete** — committed `9475286`. Doc: `gosaki-discography-g17c-next-field-registry-slice-preflight.md`.

**G-17b Gosaki Discography scalar field commonization (2026-06-29):** **complete** — committed `397f245`. Doc: `gosaki-discography-g17b-scalar-field-commonization.md`.

**G-17a Gosaki Discography CMS commonization audit (2026-06-29):** **complete** — committed `5161eaa`. Doc: `gosaki-discography-g17a-commonization-audit.md`.

**G-16b-f Gosaki Discography G-16a artist public reflection closure (2026-06-29):** **complete** — committed `de2a388`; G-16a / G-16b `discography-001` / `artist` chain **closed**. Doc: `gosaki-discography-g16b-artist-public-reflection-closure.md`. **Do not re-Save `discography-001`; do not re-upload discography HTML.**

**G-16b-upload Gosaki Discography G-16a artist public reflection upload + HTTP verify (2026-06-29):** **complete** — committed `418b577`; operator upload `discography/index.html` ×1; HTTP **PASS**; Continuous `feat.` live. Doc: `gosaki-discography-g16b-artist-public-reflection-upload-result.md`. **Chain closed — see G-16b-f.**

**G-16b Gosaki Discography G-16a artist public reflection local regen + upload preflight (2026-06-29):** **complete** — committed `d16aeca`. Doc: `gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md`. **Upload done — see G-16b-upload.**

**G-16a-execution Gosaki Discography artist Save result (2026-06-29):** **complete** — committed `db59af7`. Doc: `gosaki-discography-g16a-artist-save-result.md`. **Do not re-Save `discography-001`.**

**G-16a-d2/d3 Gosaki Discography artist local dry-run + Save final preflight (2026-06-29):** **complete** — committed `40a2896`. Doc: `gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md`. **Next: G-16a-execution — done.**

**G-16a Gosaki Discography next-field Save preflight (2026-06-29):** **complete** — committed `b19b9a2`. Doc: `gosaki-discography-g16a-next-field-save-preflight.md`.

**G-16 CMS Kit Save / Reflection playbook consolidation (2026-06-29):** **complete** — committed `2d70001`. Doc: `cms-kit-save-reflection-playbook.md`.

**G-15e-f Gosaki Discography artist public reflection closure (2026-06-29):** **complete** — committed `f722cf4`; G-15d / G-15e `artist` chain closed. Doc: `gosaki-discography-artist-public-reflection-closure.md`. **Do not re-Save `discography-003`; do not re-upload discography HTML.**

**G-15e-upload Gosaki Discography artist public reflection upload + HTTP verify (2026-06-29):** **complete** — committed `6dc81c3`; operator upload `discography/index.html` ×1; About Us `ごさきりかこTrio` live. Doc: `gosaki-discography-artist-public-reflection-upload-result.md`. **Chain closed — see G-15e-f.**

**G-15e Gosaki Discography artist public reflection local regen + upload preflight (2026-06-29):** **complete** — committed `566d714`; hook extended for `artist`; minimal 1-file upload plan. Doc: `gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md`. **Upload done — see G-15e-upload.**

**G-15d-execution Gosaki Discography artist Save result (2026-06-29):** **complete** — committed `db0ae06`; operator Save once; `updated_at` trigger live proof success. Doc: `gosaki-discography-artist-save-result.md`. **Do not re-Save `discography-003`.**

**G-15d-d2/d3 Gosaki Discography artist local dry-run + Save final preflight (2026-06-28):** **complete** — committed `da6e954`. Doc: `gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md`.

**G-15d Gosaki Discography next-field Save preflight (2026-06-28):** **complete** — committed `355a96c`. Doc: `gosaki-discography-next-field-save-preflight.md`.

**G-15c-f Gosaki Discography public reflection closure (2026-06-28):** **complete** — G-15 `purchase_url` chain **closed** (G-15a→G-15c-upload); live `/discography/` HTTP PASS; rollback **not needed**; other albums untouched. Doc: `gosaki-discography-public-reflection-closure.md`. **Do not re-Save `discography-002`; do not re-upload discography HTML.**

**G-15c-upload Gosaki Discography public reflection upload + HTTP verify (2026-06-28):** **complete** — committed `4fea4f2`; operator upload `discography/index.html` ×1; HTTP **200**; SKYLARK `gosakirikako.base.shop` live. Doc: `gosaki-discography-public-reflection-upload-result.md`.

**G-15c Gosaki Discography public reflection local regen + upload preflight (2026-06-28):** **complete** — committed `14e3696`; Supabase `purchase_url` hook at convert; minimal 1-file upload plan. Doc: `gosaki-discography-public-reflection-local-regen-and-upload-preflight.md`.

**G-15b-f8-execution Gosaki Discography updated_at trigger apply (2026-06-28):** **complete** — committed `a32e95d`; operator applied `discography_set_updated_at` on staging. Doc: `gosaki-discography-updated-at-trigger-apply-result.md`.

**G-15b-f8 Gosaki Discography updated_at trigger final preflight (2026-06-28):** **complete** — committed `1931aaf`. Doc: `gosaki-discography-updated-at-trigger-final-preflight.md`.

**G-15b-retry Gosaki Discography Save retry (2026-06-28):** **complete** — committed `c06162b`; `purchase_url` fix succeeded; `updated_at` unchanged (no trigger). Doc: `gosaki-discography-save-retry-result-and-updated-at-investigation.md`.

**G-15b-grant-apply Gosaki Discography UPDATE grant (2026-06-28):** **complete** — committed `cfc0297`; `GRANT UPDATE` on `public.discography` to `authenticated`. Doc: `gosaki-discography-update-grant-apply-result.md`.

**G-15b Gosaki Discography Save slice (2026-06-28):** **complete** — committed `eda9047`; G-15b Save path implemented; operator Save attempted — failed at DB permission (see G-15b-fail).

**G-15a2 Gosaki Discography dry-run Preview implementation and preflight (2026-06-28):** **complete** — `discography-002` / `purchase_url` slice; dry-run Preview wired; `actualWrite: false`. Doc: `gosaki-discography-dry-run-preview-implementation-and-preflight.md`.

**G-15a Gosaki Discography admin Supabase read binding (2026-06-28):** **complete** — admin `/discography/` reads staging Supabase (4 albums); static JSON replaced; Save/DB write **disabled**. Doc: `gosaki-discography-admin-supabase-read-binding.md`.

**G-15 Gosaki Discography CMS MVP inventory and plan (2026-06-28):** **complete** — 4 releases mapped (Wix HTML public / JSON admin / Supabase DB); MVP = existing-row Supabase UPDATE (Schedule pattern); images/INSERT/tracks defer. Doc: `gosaki-discography-cms-mvp-inventory-and-plan.md`.

**G-14b1f Gosaki Schedule CMS routine edit reflection closure (2026-06-28):** **complete** — G-14b1 chain **closed** (planning → G-14b1e-upload); G-9k product Save + public reflection success; `schedule-2026-04-005` price only; rollback **not needed**; Event A / Event B / March / July untouched. Doc: `gosaki-schedule-routine-edit-reflection-closure.md`. Verifier: 53 PASS. **Do not re-Save same row; do not re-upload April HTML.**

**G-14b1e-upload Gosaki Schedule CMS routine edit public reflection upload + HTTP verify (2026-06-28):** **complete** — operator upload `schedule/2026-04/index.html` ×1; HTTP **200**; Trio price `3,300円（税込）` live. Doc: `gosaki-schedule-routine-edit-public-reflection-result.md`. Committed `bb342c3`. **Do not re-upload April HTML.**

**G-14b1e Gosaki Schedule CMS routine edit public reflection local regen + upload preflight (2026-06-28):** **complete** — committed `a549870`.

**G-14b1d Gosaki Schedule CMS routine edit Save execution result (2026-06-28):** **complete** — committed `83cc049`.

**G-14b1c Gosaki Schedule CMS routine edit final preflight (2026-06-28):** **complete** — committed `1cd8427`.

**G-14b1b-result Gosaki Schedule CMS routine edit local dry-run Preview result (2026-06-28):** **complete** — committed `53b28e9`.

**G-14b1b Gosaki Schedule CMS routine edit local dry-run Preview preflight (2026-06-28):** **complete** — committed `e16a55f`.

**G-14b1a Gosaki Schedule CMS routine edit practical Save enablement (2026-06-28):** **complete** — committed `b161235`.

**G-14b1 Gosaki Schedule CMS routine edit flow next PoC planning (2026-06-28):** **complete** — routine edit PoC planned; recommended target `schedule-2026-04-005` / `price` only; G-9k path + G-14c reflection chain decomposed. Doc: `gosaki-schedule-routine-edit-flow-next-poc-planning.md`. **G-14b1a implementation done.**

**G-13c2e Gosaki Event B PoC cleanup public reflection closure (2026-06-28):** **complete** — G-13c2→G-13c2e Event B chain **closed**; DB + live July clean; rollback **not needed**; Event A / March untouched. Doc: `gosaki-schedule-event-b-public-reflection-closure.md`. **G-13b scan (2 events) fully resolved.**

**G-13c2e Gosaki Event B public reflection upload result + HTTP verify (2026-06-28):** **complete** — operator manual upload `schedule/2026-07/index.html` ×1; HTTP **200**; Event B clean. Doc: `gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.md`. **Do not re-upload July HTML.**

**G-13c2e Gosaki Event B public reflection local regen + upload preflight (2026-06-28):** **complete** — `build-gosaki-staging-admin-package.mjs` PASS; minimal upload = **1 file** `schedule/2026-07/index.html`. Doc: `gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md`. Upload + HTTP verify **done** — do not re-upload July HTML.

**G-13c2 Gosaki Event B PoC cleanup execution result (2026-06-27):** **complete** — operator manual G-13c2 Save **succeeded** on Event B (`aa440e29…`); 6 fields cleaned; nullable fields **DB null**; `updated_at` `2026-06-27T10:17:42.60691+00:00`. Doc: `gosaki-schedule-event-b-poc-cleanup-execution-result.md`. **Do not re-click G-13c2 Save.**

**G-13c2 Gosaki Event B PoC cleanup final preflight (2026-06-19):** **complete** — beforeSnapshot / rollback SQL doc-only / Save env stack. Doc: `gosaki-schedule-event-b-poc-cleanup-final-preflight.md`.

**G-13c2d2-result Gosaki Event B PoC cleanup local dry-run Preview result (2026-06-19):** **complete** — operator Preview **PASS**; Save not clicked. Doc: `gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md`.

**G-13c2d2b Gosaki Event B PoC cleanup Preview UI visibility fix (2026-06-19):** **complete** — G-13c1/G-13c2 panels moved outside sticky workspace grid. Doc: `gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.md`.

**G-13c2d1 Gosaki Event B PoC cleanup slice implementation (2026-06-19):** **complete** — G-13c2 approval/guards/config/dry-run/Save/UI/page-config/target-resolve for `aa440e29…` only; null-field payload guards; Save gated off routine dev; Event A / March untouched. Doc: `gosaki-schedule-event-b-poc-cleanup-slice-implementation.md`. **Next: operator local dry-run Preview (G-13c2d2).** **Do not Save yet.**

**G-13c2 Gosaki Event B PoC cleanup preflight (2026-06-27):** **complete** — expected values **confirmed** (Wix seed); DB + live July PoC present; Event A untouched. Doc: `gosaki-schedule-event-b-poc-cleanup-preflight.md`. **Do not Save yet.**

**G-14c Gosaki public reflection operation standardization (2026-06-27):** **complete** — DB→regen→upload→verify playbook. Doc: `gosaki-public-reflection-operation-standardization.md`.

**G-14b Gosaki Schedule CMS practical editing flow definition (2026-06-27):** **complete** — operator journey, routine/failure flows, MVP field scope. Doc: `gosaki-schedule-cms-practical-editing-flow-definition.md`.

**G-14a Gosaki CMS completion roadmap gap inventory (2026-06-27):** **complete** — read-only survey; gap classification; next phases G-14b→G-14f evaluated. Client preview **excluded from dev tasks**. Doc: `gosaki-cms-completion-roadmap-gap-inventory.md`.

**G-13e Gosaki Event A PoC cleanup public reflection closure (2026-06-27):** **complete** — G-13d1→G-13e Event A chain closed. Doc: `gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md`. **Do not re-click G-13c1 Save; do not re-upload March HTML.**

**G-13e Gosaki Event A public reflection upload execution (2026-06-27):** **complete** — operator manual upload `schedule/2026-03/index.html`; HTTP PASS. Doc: `gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md`.

**G-13e Gosaki Event A public reflection upload preflight (2026-06-27):** **complete** — minimal 1-file upload plan. Doc: `gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md`.

**G-13e Gosaki Event A public reflection local regen (2026-06-27):** **complete** — package 27 files; March Event A clean. Doc: `gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md`.

**G-13e Gosaki Event A public reflection preflight (2026-06-27):** **complete** — DB cleaned (G-13d1); planning doc: `gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md`.

**G-13d1 Gosaki Event A PoC cleanup execution result (2026-06-27):** **complete** — operator manual G-13c1 Save **succeeded** on Event A (`f687ebf3…`); 6 fields cleaned; `updated_at` `2026-06-27T05:10:58.008982+00:00`. Doc: `gosaki-schedule-event-a-poc-cleanup-execution-result.md`. **Do not re-click G-13c1 Save.**

**G-13d1g Gosaki Event A project allowlist property fix (2026-06-26):** **complete** — G-13c1 Save gate uses `allowlistPassed` / `errorMessage` (G-9k aligned). Doc: `gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix.md`.

**G-13d1f Gosaki Event A project allowlist investigation (2026-06-26):** **complete** — root cause = wrong property names on `evaluateStagingProjectAllowlist()` result in G-13c1 config. Read-only; no code in phase.

**G-13d1e Gosaki Event A Save gate page config bridge (2026-06-26):** **complete** — G-9k-style SSR→DOM bridge for G-13c1 Save gate; Preview shows failure reason. Doc: `gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge.md`.

**G-13d1c Gosaki staging shell server gate injection (2026-06-26):** **complete** — `#staging-shell-server-gates` in layout. Doc: `gosaki-staging-shell-server-gate-injection.md`.

**G-13d1b Gosaki Event A target row resolve fix (2026-06-26):** **complete** — direct `loadScheduleRowForSiteSlugRead`. Doc: `gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix.md`.

**G-13d1 Gosaki Event A selectable row investigation (2026-06-26):** **complete** — root cause = `data-selectable-rows` coupling. Doc: `gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md`.

**G-13d1 Gosaki Event A PoC cleanup final preflight (2026-06-26):** **complete** — beforeSnapshot / rollback SQL (doc only) / Save env stack. Doc: `gosaki-schedule-event-a-poc-cleanup-final-preflight.md`. Execution **blocked** pending G-13d1b fix.

**G-13d2 Gosaki Event A admin reflection local dev verify (2026-06-26):** **complete** — operator G-13c1 dry-run Preview PASS (6 fields). Doc: `gosaki-schedule-event-a-poc-cleanup-admin-reflection-local-dev-verify-result.md`.

**G-13d1 Gosaki Event A PoC cleanup local implementation (2026-06-26):** **complete** — G-13c1 approval/guards/config/dry-run/Save/UI for `f687ebf3…` only; Save gated off routine dev. Doc: `gosaki-schedule-event-a-poc-cleanup-local-implementation.md`.

**G-13c Gosaki schedule PoC visible text cleanup implementation prep (2026-06-26):** **complete** — save path matrix; approval IDs documented. Doc: `gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md`.

**G-13a Gosaki schedule operational dry-run preview verification (2026-06-26):** **complete** — commit `099ee5d` docs chain.

**G-12d Gosaki Schedule CMS Phase 1/2 boundary planning (2026-06-26):** **complete** — commit `993356b` docs chain.

**G-12c Gosaki client preview feedback closure planning (2026-06-26):** **complete** — commit `892f86f` docs chain. Feedback **not collected**.

**G-12b Gosaki public schedule read verification (2026-06-26):** **complete** — commit `372b558` docs chain.

**G-11c15 Gosaki YouTube URL save staging public verification (2026-06-26):** **complete** — commit `d031e03` docs chain. G-11c8→c15 **complete**.

**G-11c14 Gosaki YouTube URL save staging manual upload execution (2026-06-26):** **complete** — commit `213c834`.

**G-11c13 Gosaki YouTube URL save staging upload preflight (2026-06-26):** **complete** — commit `1d29158`.

**G-11c12 Gosaki YouTube URL save static-public and manual-upload package regeneration (2026-06-26):** **complete** — commit `de2850e`.

**G-11c11 Gosaki YouTube URL save public reflection planning and local verification (2026-06-26):** **complete** — commit `f285786`.

**G-11c10c Gosaki YouTube URL save workflow dispatch execution retry (2026-06-26):** **success** — commit `d2dd35c` docs / `9f58889` JSON.

**G-11c10c-fix Gosaki YouTube URL save workflow YAML permissions syntax (2026-06-25):** **complete** — commit `0173d4c`.

**G-11c10b Gosaki YouTube URL save workflow dispatch final preflight (2026-06-25):** **complete** — commit `e7db19c`.

**G-11c10a Gosaki YouTube URL save workflow dispatch allowlist registration (2026-06-25):** **complete** — commit `282e762`.

**G-11c9 Gosaki YouTube URL save workflow dispatch preflight (2026-06-25):** **complete** — commit `1182419`.

**G-11c8 Gosaki YouTube URL save workflow JSON patch implementation (2026-06-25):** **complete** — commit `3cbcb9e`.

**G-11c7 Gosaki YouTube URL save workflow JSON patch planning (2026-06-25):** **complete** — patch `gosaki-piano-youtube-embed.json` (`embedCode` only / Option C); validation, conflict, commit strategy, G-11c8–c11 gates. Doc: `gosaki-youtube-url-save-workflow-json-patch-planning.md`.

**G-11c6d Gosaki YouTube URL save endpoint smoke and admin wiring (2026-06-25):** **complete** — commit `747b638`.

**G-11c6c Gosaki YouTube URL save Edge Function deploy execution (2026-06-25):** **complete** — commit `5b80ef5`.

**G-11c6b Gosaki YouTube URL save Edge Function deploy preflight (2026-06-25):** **complete** — commit `3cdf4f5`.

**G-11c6a Gosaki YouTube URL web-save non-dry-run slice implementation local-only (2026-06-25):** **complete** — commit `e99f58f`.

**G-11c5 Gosaki YouTube URL web-save non-dry-run slice planning (2026-06-25):** **complete** — commit `2f0f88d`.

**G-11c4d Gosaki staging admin `ADMIN_EMAILS` secret + YouTube dry-run E2E (2026-06-25):** **complete** — commit `a0e8be3`.

**G-11c4c Gosaki staging admin authorization preflight (2026-06-25):** **complete** — commit `1fe0d56`. Browser E2E: login OK, JWT OK, dry-run **403** (`isAdminUser` NG). Doc: `gosaki-staging-admin-authorization-preflight.md`. Superseded by G-11c4d E2E PASS.

**G-11c4b-fix Gosaki staging admin auth login button enable (2026-06-25):** **complete** — commit `ecca35e`.

**G-11c3b Gosaki YouTube URL dry-run Edge Function deploy execution result (2026-06-25):** **complete** — commit `5844d6f`. Staging deploy once; unauth **401**. Doc: `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`.

**G-11c3a Gosaki YouTube URL dry-run Edge Function deploy readiness config prep (2026-06-25):** **complete** — commit `537e5e6`. `supabase/config.toml` `[functions.gosaki-youtube-url-dry-run] verify_jwt = true`. Doc: `gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.md`.

**G-11c2 Gosaki YouTube URL dry-run Edge Function deploy preflight (2026-06-25):** **complete** — commit `df6e18e`.

**G-11c1 Gosaki YouTube URL web-save dry-run PoC local prep (2026-06-25):** **complete** — commit `8152d7c`.

**G-11b Gosaki staging online admin read-only page post-upload finalization (2026-06-25):** **complete** — commit `d7b4674`.

**G-11b Gosaki staging online admin read-only page package prep (2026-06-25):** **complete** — commit `d941003`. Doc: `gosaki-staging-online-admin-read-only-page-package-prep.md`.

**G-11a Gosaki staging online CMS architecture planning (2026-06-25):** **complete** — commit `755ecbe`. Doc: `gosaki-staging-online-cms-architecture-planning.md`.

**G-10h5-2a Gosaki staging manual upload post-QA finalization (2026-06-25):** **complete** — commit `ffd1496`. Operator upload + QA PASS.

**G-10i1 Gosaki About bands/projects images package prep (2026-06-25):** **complete** — commit `e5beedc`. 5 band images in `about-bands-html`. Superseded for upload by G-10h5-2a operator upload.

**G-10g4 Gosaki Contact photo aspect-ratio fix package prep (2026-06-24):** **complete** — commit `0bd3789`.

**G-10g3 Gosaki Contact HubSpot visual layout refinement package prep (2026-06-24):** **complete** — title/intro centered; 2-column block. Superseded for upload by G-10g4 package regen.

**G-10g2 Gosaki Contact HubSpot layout fix package prep (2026-06-24):** **complete** — commit `04eadd9`. PC 2-column grid (photo left, HubSpot form right). Superseded for upload by G-10g3 package regen.

**G-10g1 Gosaki Contact HubSpot embed package prep (2026-06-24):** **complete** — commit `aa352ac`. Contact-only config + convert hook; Wix form replaced. Doc: `gosaki-contact-hubspot-embed-package-prep.md`. Superseded for upload by G-10g2 package regen.

**G-10h5-2 Gosaki About HTML staging manual upload preflight (2026-06-24):** **complete** — commit `c1b2bc3`. Package superseded by G-10g1 regen.

**G-10h5-1 Gosaki About HTML content public reflection package prep (2026-06-24):** **complete** — commit `f427f9c`. Doc: `gosaki-about-html-content-public-reflection-package-prep.md`.

**G-10h4d Gosaki About bands HTML static JSON write execution (2026-06-23):** **complete** — commit `c3b0d56`. **Do not re-run G-10h4d run script.**

**G-10h4d-1 Gosaki About bands HTML static JSON write execution prep (2026-06-23):** **complete** — commit `6951d63`. Superseded by G-10h4d execution.

**G-10h4c Gosaki About bands HTML static JSON write dry-run (2026-06-23):** **complete** — commit `8cabd19`. `about-bands-html` dry-run API + UI. Doc: `gosaki-about-bands-html-static-json-write-dry-run.md`. Superseded for Save by G-10h4d-1 prep.

**G-10h4b Gosaki About profile HTML static JSON write execution (2026-06-23):** **complete** — commit `e2d378a`. Doc: `gosaki-about-profile-html-static-json-write-execution.md`. **Do not re-click G-10h4b Save.**

**G-10h4a Gosaki About profile HTML static JSON write dry-run (2026-06-23):** **complete** — commit `c126efe`. profile `about-profile-html` dry-run API + UI. Doc: `gosaki-about-profile-html-static-json-write-dry-run.md`. Superseded for Save by G-10h4b.

**G-10h3 Gosaki About HTML content admin read-only preview (2026-06-23):** **complete** — commit `e9137bb`. Doc: `gosaki-about-html-content-admin-readonly-preview.md`.

**G-10h2 Gosaki About HTML content seed JSON + convert hook (2026-06-23):** **complete** — commit `02f75a2`. Doc: `gosaki-about-html-content-seed-json-and-convert-hook.md`.

**G-10h1 Gosaki About HTML content CMS implementation preflight (2026-06-23):** **complete** — commit `a02eb87`. Doc: `gosaki-about-html-content-cms-implementation-preflight.md`.

**G-10f Gosaki discography album images planning (2026-06-23):** **complete** — commit `ed50a9b`; **deferred** (operator priority → About). Doc: `gosaki-discography-album-images-planning.md`.

**G-10e1 Gosaki YouTube embed section layout reupload QA finalization (2026-06-23):** **complete** — commit `d83ae32`. YouTube arc **closed**. **Do not re-click G-10c Save.**

**G-10e Gosaki YouTube embed section layout improvement (2026-06-23):** **complete** — commit `9dabcb4`. Doc: `gosaki-youtube-embed-section-layout-improvement.md`.

**G-10e Gosaki YouTube embed section layout improvement (2026-06-23):** **complete** — commit `9dabcb4`; local CSS/layout fix; operator re-upload QA PASS (G-10e1). Doc: `gosaki-youtube-embed-section-layout-improvement.md`. **Do not re-click G-10c Save.**

**G-10d2a Gosaki YouTube embed staging upload QA finalization (2026-06-23):** **complete** — operator manual upload + staging QA **PASS**; YouTube `Ke4F8JAQz-I` live on staging. Doc: `gosaki-youtube-embed-staging-upload-qa-finalization.md`. Layout issue fixed in G-10e/G-10e1. **Do not re-click G-10c Save.**

**G-10d2 Gosaki YouTube embed staging manual upload (2026-06-23):** **complete** — commit `5598777` preflight; operator upload succeeded (G-10d2a).

**G-10d1 Gosaki YouTube embed manual upload package prep (2026-06-23):** **complete** — commit `17fd5ec`. Doc: `gosaki-youtube-embed-manual-upload-package-prep.md`.

**G-10d Gosaki YouTube embed public reflection verification (2026-06-23):** **complete** — commit `c489315`. Doc: `gosaki-youtube-embed-public-reflection-verification.md`.

**G-10c2 Gosaki YouTube embed static JSON write Save success (2026-06-23):** **complete** — commit `5d5b1f1`; operator Save succeeded. Doc: `gosaki-youtube-embed-static-json-write-save-success-finalization.md`. **Do not re-click G-10c Save.**

**G-10c1 Gosaki YouTube embed Save API response fix (2026-06-23):** **complete** — injectRoute + import path fix; curl GET → JSON 405. Operator Save succeeded (G-10c2). Doc: `gosaki-youtube-embed-static-json-save-api-response-fix.md`.

**G-10c Gosaki YouTube embed static JSON write slice implementation (2026-06-22):** **complete** — dry-run UI + gated Save + server JSON executor wired.

**G-10b Gosaki YouTube embed read and write planning (2026-06-22):** **complete** — commit `88cc484`. Doc: `gosaki-youtube-embed-read-and-write-planning.md`.

**G-10a Gosaki completion inventory and next module selection (2026-06-22):** **complete** — Schedule以外棚卸し；次モジュール YouTube embed CMS → G-10b. Doc: `gosaki-completion-inventory-and-next-module-selection.md`. Commit: `b5fd950`. Parallel: `G-9h1` client feedback. **No DB write.** `readyForAnyDbWrite: false`.

**G-9k7b Gosaki schedule Save UI copy and list usability fix (2026-06-22):** **complete** — commit `ff0c33f`. Doc: `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` §3.

**G-9k7 Gosaki schedule Save UI copy and editor scroll fix (2026-06-22):** **complete** — operator Save messages match enabled/disabled state; PC list/editor independent scroll. Doc: `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md`. Commit: `44f4d62`. **No DB write.** `readyForAnyDbWrite: false`.

**G-9k6g Gosaki schedule existing event field slice closure (2026-06-22):** **complete** — G-9k6 arc **closed**; commit `99ffc6c`. Doc: `gosaki-schedule-existing-event-field-slice-closure.md`. **Do not re-click any G-9k6 slice Save.**

**G-9k6f Gosaki schedule existing event title field slice Save success (2026-06-22):** **complete** — operator manual G-9k6f UI Save **succeeded**; `title` only. Doc: `gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md`. Commit: `421ffac`. **Do not re-click G-9k6f Save.**

**G-9k6e Gosaki schedule existing event venue field slice Save success (2026-06-22):** **complete** — operator manual G-9k6e UI Save **succeeded**; `venue` only. Doc: `gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md`. **Do not re-click G-9k6e Save.**

**G-9k6d Gosaki schedule existing event start_time field slice Save success (2026-06-22):** **complete** — operator manual G-9k6d UI Save **succeeded**; `start_time` only; `rowsAffected: 1`; before `15:30` → after `19:00`; post-save `updated_at` `2026-06-22T12:42:32.483922+00:00`. Doc: `gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md`. **Do not re-click G-9k6d Save.**

**G-9k6c Gosaki schedule existing event open_time field slice Save success (2026-06-22):** **complete** — operator manual G-9k6c UI Save **succeeded**; `open_time` only. Doc: `gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md`. **Do not re-click G-9k6c Save.**

**G-9k6b Gosaki schedule existing event price field slice Save success (2026-06-22):** **complete** — operator manual G-9k6b UI Save **succeeded**; `price` only. Doc: `gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md`. **Do not re-click G-9k6b Save.**

**G-9k6a Gosaki schedule existing event field slice verification planning (2026-06-22):** **planning complete** — field slice matrix + operator checklist. Doc: `gosaki-schedule-existing-event-field-slice-verification-planning.md`. **1 Save = 1 field.** No DB write in planning phase.

**G-9k5 Gosaki schedule existing event save button success finalization (2026-06-22):** **complete** — G-9k arc **closed**. Operator UI Save succeeded (G-9k4b); `description` only. Doc: `gosaki-schedule-existing-event-save-button-success-finalization.md`. Commit: `60820c4`. **Do not re-click G-9k4b Save.**

**G-9k4b Gosaki schedule existing event UI manual Save success + post-save result fix (2026-06-22):** **complete** — operator manual G-9k4b UI Save **succeeded** on `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`). Row `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only; `rowsAffected: 1`; post-save `updated_at` `2026-06-22T02:20:07.217037+00:00`. DB confirmed via operator SQL; post-save result UI fix applied. Doc: `gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md`. Commit: `2c28578`. **Do not re-click G-9k4b Save.**

**G-9k4a-fix Gosaki schedule existing event UI Save gate bridge (2026-06-21):** **complete** — server-to-client DOM bridge for `G9K_SAVE_BUTTON_SAVE_ENABLED` + write gate flags. Doc: (G-9k4a-fix in commit). Next was G-9k4b manual Save once.

**G-9k4a Gosaki schedule existing event UI Save enable preflight (2026-06-21):** **complete** — Save executor + UI wiring implemented; **Save default disabled** (`G9K_SAVE_BUTTON_SAVE_ENABLED=false`). Doc: `gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.md`. **No DB write in this phase.** Next: `G-9k4-manual-save-once`. `readyForAnyDbWrite: false`.

**G-9k3 Gosaki schedule existing event save button manual dry-run verification (2026-06-21):** **complete** — operator manual dry-run / auth-gate verification recorded. Doc: `gosaki-schedule-existing-event-save-button-manual-dry-run-verification.md`; verifier G-9k3. Checklist 1–8 **PASS** (human). **Save still disabled.** Next: `G-9k4a`. `readyForAnyDbWrite: false`.

**G-9k2 Gosaki schedule existing event save button UI wiring (2026-06-21):** **complete** — dry-run gate only. Doc: `gosaki-schedule-existing-event-save-button-ui-wiring.md`; module `gosaki-schedule-existing-event-save-button-dry-run.ts`; operator UI wired to G-9k dry-run. Save readiness shown; **Save still disabled** (`G9K_SAVE_BUTTON_SAVE_ENABLED = false`). Next: `G-9k3-dry-run-verification`. `readyForAnyDbWrite: false`.

**G-9k1 Gosaki schedule existing event save button guard / config (2026-06-21):** **complete** — guard/config/verifier only. Doc: `gosaki-schedule-existing-event-save-button-guard-config.md`; modules `gosaki-schedule-existing-event-save-button-config.ts`, `gosaki-schedule-existing-event-save-button-guards.ts`; approval `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`; arm `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`. 6 safe fields; separate from G-9j5 fixed runner. **Save still disabled.** Next: `G-9k2-ui-wiring`. `readyForAnyDbWrite: false`.

**G-9k Gosaki schedule existing event save button enablement planning (2026-06-21):** **complete** — planning only. Doc: `gosaki-schedule-existing-event-save-button-enablement-planning.md`; approval `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`; arm `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`. Operator UI 「更新する」 for 6 safe fields; dry-run before Save. **Do not reuse G-9j5 approval/arm.** Save still disabled. Next: `G-9k1-guard-config-implementation`. `readyForAnyDbWrite: false`.

**G-9j5c Gosaki schedule existing event update success finalization (2026-06-21):** **complete** — operator manual G-9j5 one-row non-dry-run UPDATE **succeeded** on `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`). Doc: `gosaki-schedule-existing-event-update-success-finalization.md`; verifier G-9j5c. Row `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only; `rowsAffected: 1`; post-save `updated_at` `2026-06-21T13:20:16.626423+00:00`; UI confirmed on staging schedule admin. Prerequisites: G-9j5a password reset, G-9j5b auth gate, explicit admin email guard, project ref allowlist. **Do not re-run G-9j5.** `readyForG9j5OneRowNonDryRunReExecution: false`. Routine dev: `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; operator Save still disabled.

**G-9j Gosaki schedule existing event save enablement planning (2026-06-19):** **complete** — planning only. Doc: `gosaki-schedule-existing-event-save-enablement-planning.md`; verifier 33 passed. Scope: existing row UPDATE (`title`, `venue`, `open_time`, `start_time`, `price`, `description`); dry-run before Save; approval `G-9j-gosaki-schedule-existing-event-update-non-dry-run`. G-9j planning complete. 最新commitは git HEAD を確認すること。 Next: `G-9j1-guards-and-dry-run-implementation`. `readyForAnyDbWrite: false`.

**Gosaki Schedule admin add/edit UI (2026-06-19):** Operator add/edit forms on staging schedule page; save disabled. Commit: `Add Gosaki schedule add and edit admin UI` (check git HEAD). No DB write / Save.

**Gosaki YouTube/Discography admin UI fix (2026-06-19):** Fixed `previewDiscographyUrl` ReferenceError; simplified YouTube admin to embed-code-only (Instagram-style); added admin-form/list CSS to staging shell. Commit: `Fix and simplify Gosaki YouTube and Discography admin UI` (check git HEAD). No DB write / Save.

**Gosaki staging admin schedule UI refinement (2026-06-19):** Operator-facing `/__admin-staging-shell/musician-basic/admin/` + `/admin/schedule/` routes; Sariswing `/admin/` structure mirrored read-only. PoC UI in `<details>開発者向け詳細</details>`. No DB write / Save / production `/admin` changes. Commit message: `Refine Gosaki staging admin schedule UI`.

1. Project overview
このプロジェクトは、Sariswing.com で実装した Astro + Supabase + GitHub Actions + Lolipop FTP 構成を一般化し、ミュージシャン・音楽教室・小規模事業者向けの CMS Kit として商品化することを目的とする。
現在の中心テーマは、tools/static-to-astro における Musician CMS Kit の一般化である。

主な対象機能は以下。
Schedule CMS
News CMS
Profile / About CMS
Media / Instagram / YouTube CMS
Discography CMS
Sitemap / robots / SEO metadata
静的HTMLサイトからAstroプロジェクトへの変換
Supabase連携
Staging Shell
将来的な管理画面一般化
将来的な顧客オンボーディング・課金・デプロイ自動化

2. Current phase
現在フェーズ: **G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization** — **complete**（operator upload + staging QA PASS. 最新commitは git HEAD を確認すること。）

G-10d2a: YouTube embed live on `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`. Next: **G-10e** layout improvement (non-blocking). `readyForAnyDbWrite: false`.

G-9k5 finalization: **complete** (commit `60820c4`). G-9k arc closed.

G-9j5c Gosaki schedule existing event update success: **complete**.

G-9h Gosaki schedule CMS practicalization planning: **complete**. 最新commitは git HEAD を確認すること。Doc: `gosaki-schedule-cms-practicalization-planning.md`; verifier 34 passed. Phase 1 = client feedback + public read UX + re-upload planning（no DB write）. Phase 2 = schedule CMS write slices（explicit gates）. Next recommended: `G-9h1-gosaki-client-preview-feedback-closure`. **Not** next: `start_time-only manual non-dry-run execution`. `readyForAnyDbWrite: false`.

G-9g4a2 framework implementation: **complete, committed, pushed**（C1 `1e643e7` + C2 `9c3714c` + C3 `1c1fb32` + C4 `d66bae7` + AI sync `9a1d15d`）

G-9g4a2 framework implementation: **complete, committed, pushed**（C1 `1e643e7` + C2 `9c3714c` + C3 `1c1fb32` + C4 `d66bae7`）。registry + generic config/guards + generic Save + generic edit UI + open_time delegates + start_time/price Astro/binding wiring + implementation doc + final verifier. Doc: `staging-shell-schedule-single-text-field-operational-commonization-implementation.md`. **Do not repeat** per-field manual round-trips for `start_time` / `price`.

G-9g4a2 framework planning: **complete**（commit `e267da3`）。Doc: `staging-shell-schedule-single-text-field-operational-commonization-planning.md`; planning verifier 39 passed.

G-9g4a2a: Schedule open_time-only operational **restore and closure complete**（commit `105c6b1` — committed and pushed）。smoke round-trip complete; final `open_time` `11:30`; marker removed. Operator restore Save once; Cursor did not click Preview/Save.

G-9g4a2a2: Schedule open_time-only operational expansion **manual execution complete**（commit `54623a1`）。

G-9g4a2a1: Schedule open_time-only operational expansion **preflight complete**（commit `8d57b1b`）。

G-9g4a2a implementation: **complete**（commit `8ae0d1e`）。

G-9g4a2: text fields operational expansion **planning complete**（commit `0d80d7d`）。single-field-first; first slice `open_time` only.

G-9g4a1e: venue-only operational round-trip **finalization complete**（commit `3b807c8`）。marker removed; no restore required.

G-9g4a1d: venue-only operational restore **manual execution complete**（commit `82e1aaa`）。

G-9g4a1c: venue-only operational restore **preflight complete**（commit `3b3e4e0`）。

G-9g4a1b1: venue-only manual execution **complete**（commit `11368be`）。

G-9g4a1 Save gate sync fix: **complete**（commit `78888f5`）。

G-9g4a1: Schedule venue-only operational expansion **implementation complete**（commit `49986c1`）。**G-9g4a1 venue-only operational round-trip complete.**

G-9g4a: Schedule text fields operational expansion planning **complete**（commit `9a38c11` — superseded for next slice by G-9g4a2）.

Git: branch `main`; HEAD = origin/main — 最新commitは git HEAD を確認すること。G-9g4a2a restore-and-closure: commit `105c6b1`（historical）。

G-9g3h1: Save success re-click prevention **implemented**（commit `8780f84`）。

G-9g3g5b: operational restore preflight **complete**（commit `95ff18c`）。

G-9g3g5: post-execution hardening **complete**（commit `d202797`）。

G-9g3g4: operational Save **success**（commit `a58f5f9`）。**Do not re-click G-9g3g4 operational Save.**

G-9g3g1: operational Save path **implementation completed**（commit `025156f`）。**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

G-9g3g: operational general edit **planning completed**（commit `b10b09a`）。

G-9g3f3c: hardening **committed `f0fd3af`**.

G-9g3f3b: binding smoke **passed**（commit `8d277d8`）。

G-9g3f3: binding planning 完了（commit `bf27151`）。

G-9g3f2: row picker read-only smoke 完了（commit `94d4e61`）。

G-9g3 safe-field PoC slices: **all complete** on pilot row (G-9g2 title, G-9g3b venue+description, G-9g3c time+price). **Do not re-run slice Saves.**

G-9g3c execution 成功（commit `d53d167`）。`updated_at` → `2026-06-17T15:45:35.433566+00:00`。

G-9g3b execution 成功（commit `125d5d5`）。G-9g2 execution 成功（commit `d57dd5f`）。

G-9g3b implementation + preflight（commit `c2a6b0c`）。

G-9g3a smoke test 成功。host gate + multi-field dry-run 確認済み。

G-9g3a implementation（commit `54380a0`）。

G-9g3 planning（commit `51051c2`）。

G-9g2 execution（commit `d57dd5f`）。title PoC 成功。restore 不要（痕跡保持）。

G-9f: site_slug read-only binding（commit `8be88e7`）。

G-9e: site_slug schedule read 汎用化（commit `15cf29b`）。

G-9c2c: operator が staging で既存60行 UPDATE migration を手動実行完了（commit `2bd5b90`）。site_slug backfill、source_route 正規化、schedule-2026-07-010 PoC 復元、show_on_home/home_order 3件補正。rollback 未実行。Cursor/AI は SQL 未実行。

G-9c2b: 既存60行 UPDATE checklist（commit `479347a`）。

G-9c2a: 既存60行採用再計画（commit `d24376e`）。

G-9c0c: seed SQL template canonical route 対応（commit `d19149c`）

G-9c0b: legacy stub（commit `36e8c54`）

G-9c0a: canonical route（commit `c385a7f`）

G-9b3: Avenir Next 置換後の PC 見出し折り返し修正。DB・FTP なし。

G-9b2: HTML inline style / Header 内 Wix font 名除去。DB・FTP なし。

G-9b1: Wix proprietary font 監査 + `wix-font-safety.mjs` sanitizer。`@font-face` / futura / avenir Wix face を static export から除外・置換。DB・FTP なし。

G-9b: Gosaki Wix repeater schedule seed 設計 + dry-run extractor（60 events, site_slug=gosaki-piano）。DB・SQL・FTP なし。

G-9a: Gosaki CMS MVP スコープ整理（Schedule / Top YouTube embed / Bands 優先度）。実装・DB・FTP なし。

直近完了フェーズ:
G-9a-gosaki-cms-scope-and-schedule-youtube-planning (planning)
G-8g2〜G-8g8 gosaki staging preview fixes (commit `77b57b8`)
G-8g1 (commit `a78a8d8`)

Gosaki staging:
- staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- client preview ready (`readyForGosakiClientPreview: true`)
- deploy: manual upload only; FTP auto deploy disabled
- Doc: `tools/static-to-astro/docs/gosaki-font-and-wix-asset-license-safety-audit.md`
- Font sanitizer: `wix-font-safety.mjs` — verify:gosaki-font-safety 21 passed
- Schedule extractor: `gosaki-wix-schedule-extractor.mjs` — 60 events dry-run verified
- Route docs:
  - `tools/static-to-astro/docs/gosaki-schedule-route-canonical-planning.md`
  - `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`
  - `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`
- G-9g3c planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md`
- G-9g3c implementation doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md`
- G-9g3c preflight doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md`
- G-9g3c execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md`
- G-9g3b execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md`
- G-9g3b impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`
- G-9g3a smoke test doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md`
- G-9g3a impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md`
- G-9g3 planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md`
- G-9g2 execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md`
- G-9g2 preflight doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md`
- G-9g2 impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md`
- G-9g2 planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md`
- G-9g1 doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-dry-run-preview.md`
- G-9g doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-planning.md`
- G-9f doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-read-binding.md`
- Staging shell route: `/__admin-staging-shell/musician-basic/#schedule`
- staging URL live: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`（G-9d2 operator upload 反映済み）
- Result doc: `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-result.md`
- Staging DB: 60 rows `site_slug=gosaki-piano`, canonical `source_route`, PoC row restored
- Schedule read: anon key only; env なし時は static-fallback（fixture extractor）

3. Important completed milestones

3.1 Sariswing CMS implementation
Sariswing.com では以下が実装済み。
Astro化
Supabase連携
管理画面 /admin
NEWS CRUD
SCHEDULE CRUD
Instagram管理
Sitemap生成
Basic認証
Supabase Auth
admin role
GitHub Actions workflow_dispatch
Lolipop FTP deploy
管理画面から「公開サイトを更新」
本人がスマホで更新できる状態

Sariswing本番は完成済みで、現在の開発では触らない。

3.2 Static-to-Astro conversion
tools/static-to-astro では、静的HTMLサイトを Astro プロジェクトへ変換する仕組みの実装が進んでいる。
実案件検証として gosaki-static-site / gosaki-piano.com 相当の音楽教室サイトを使用。
完了済みの内容:
既存HTML解析
Astroページ生成
BaseLayout化
SEO / OGP移植
CSS / assets整理
sitemap / robots生成
scheduleページ再設計
visual diff
意図的差分の記録
customer demo package before writes

3.3 Profile write PoC
G-6-d 系フェーズで Profile write PoC は成功済み。
重要な実績:
public.profile への non-dry-run update 成功
Supabase Auth + RLS + admin_users の流れで動作確認済み
service_role は使っていない
この設計思想を Schedule PoC にも合わせる方針

Profile PoC での成功は、Schedule PoC の認証設計の基準とする。

3.4 RLS / GRANT cleanup
Supabase staging project にて以下を確認・整理済み。
RLS enabled
admin_users / is_admin() の存在確認
anon/authenticated の不要な broad grants を削除
authenticated UPDATE on public.schedules は手動で grant 済み
INSERT / DELETE / TRUNCATE / TRIGGER / REFERENCES 等は許可していない

重要:
public.schedules:
- anon: SELECT
- authenticated: SELECT, UPDATE

4. Supabase project
現在の staging project:
static-to-astro-cms-staging
本番 project は触らない。
開発中に Supabase SQL Editor を使う場合、必ず static-to-astro-cms-staging であることを確認する。

5. Schedule CMS current state

5.1 Tables
主な対象テーブル:
public.schedules
public.schedule_months
設計上の扱い:
public.schedules:
- authoring table
- write対象
public.schedule_months:
- read-only / derived model
- 初回Schedule write PoCでは絶対に書き換えない

5.2 Schedule target row for first non-dry-run PoC
初回 Schedule non-dry-run PoC の対象行:
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
year: 2026
month: 2026-07
title: <>
venue:
open_time: null
start_time: null
price: null
description: 出演： [G-6-e5 non-dry-run PoC]
image_url: null
home_image_url: null
source_file: schedule-2026-07.html
source_route: /schedule-2026-07/
show_on_home: false
home_order: null
published: true
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00
updated_at: 2026-06-05 17:39:44.140168+00
PoC 成功後の状態（after-verification 確認済み）:
description_match: true
changedFields: description のみ
選定理由:
title が <>
venue が空
description が 出演： のみ
実ライブ情報がほぼ空
show_on_home が false
description-only change なら低リスク

5.3 Planned payload
初回 Schedule write PoC の payload:
{
  "description": "出演： [G-6-e5 non-dry-run PoC]"
}
変更対象は description のみ。
変更禁止:
date, year, month, title, venue, open_time, start_time, price, image_url, home_image_url, source_file, source_route, show_on_home, home_order, published, sort_order, created_at, updated_at, schedule_months

5.4 Rollback SQL
必要時のみ、stagingで実行する rollback SQL:
update public.schedules
set description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
現時点では rollback は不要。PoC 成功後も rollback SQL は staging 復元用に保持（未実行）。

6. Schedule write PoC history

6.1 Target selection
完了済み: G-6-e5-schedule-non-dry-run-poc-target-selection

6.2 Execution prep
完了済み: G-6-e5-schedule-non-dry-run-poc-execution-prep
方針: Node script ではなく hidden staging browser trigger を採用（Supabase Auth sessionをそのまま使えるため。service_role不使用）

6.3 Execution path implementation
完了済み: G-6-e5-schedule-non-dry-run-poc-execution-path-implementation
対象 route: /__admin-staging-shell/musician-basic/

6.4 Execution path verification & 6.5 Final preflight
完了済み。DBは未変更。

6.6 First execution attempt
実行試行結果: ユーザーが手動で Run button を1回クリックしたが、SQL確認では DB未変更。

6.7 Diagnosis
最有力原因: Schedule PoC 側の mock allowlist admin role hard gate（auth.session.role !== "admin" で止まっていた可能性）

6.8 Fix implementation
完了済み（c5324aa）。mock gateの緩和、エラー表示改善など。

6.9 Fix verification
完了済み（a42a904）。readyForExplicitRetry: true（明示的 retry を行える状態）。

6.10 Explicit retry
完了済み。フェーズ: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
ユーザー手動 Run 1 回で description 更新成功。result doc: schedule-non-dry-run-poc-explicit-retry-result.md

6.11 Schedule CMS generalization planning
完了済み。フェーズ: G-6-f-schedule-cms-generalization-planning
planning doc: schedule-cms-generalization-planning.md

6.12 Schedule PoC isolation
完了済み。フェーズ: G-6-f1-schedule-poc-isolation-dry-run-default
- explicit rerun gate: PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true 必須
- completed notice UI 追加
- doc: schedule-poc-isolation-dry-run-default.md
- DB write / Run click: なし

6.13 Schedule read UI binding audit
完了済み。フェーズ: G-6-f2-schedule-read-ui-binding-audit
- `resolveScheduleAdminUiBinding()` — SSR SELECT via `loadSchedulesForDryRunUi`
- `ScheduleAdminUi` — readSource / description column / SELECT-only banner
- staging shell prototype で env gate 時に live schedules 表示
- doc: schedule-read-ui-binding-audit.md
- DB write / Run click / PoC re-arm: なし
- `schedule_months`: 未読

6.14 Schedule description dry-run prototype
完了済み。フェーズ: G-6-f3-schedule-description-edit-dry-run-prototype
- Plan A: description-only（G-6-f4 で UI 拡張）

6.15 Schedule safe-fields dry-run prototype
完了済み。フェーズ: G-6-f4-schedule-safe-fields-dry-run-prototype
- 対象: title, venue, open_time, start_time, price, description
- `AdminStagingScheduleSafeFieldsDryRunSection`
- operation: dry-run-update-preview
- doc: schedule-safe-fields-dry-run-prototype.md
- DB write / non-dry-run / PoC re-arm: なし

6.16 Schedule safe-fields non-dry-run preflight
完了済み。フェーズ: G-6-f5-schedule-safe-fields-non-dry-run-preflight
- doc: schedule-safe-fields-non-dry-run-preflight.md
- 推奨: G-6-e5 行再利用、初回 non-dry-run は venue + description（Option A 限定）
- approval ID 案: G-6-f6-schedule-safe-fields-non-dry-run-poc
- DB write / execution: なし

6.17 Schedule safe-fields non-dry-run PoC implementation
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation
- `AdminStagingScheduleSafeFieldsNonDryRunPocSection` — G-6-e5 から分離した G-6-f6 専用 section
- arm gate: `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true`（G-6-e5 EXPLICIT_RERUN は不使用）
- approval ID: G-6-f6-schedule-safe-fields-non-dry-run-poc
- payload: venue + description 固定（assertG6F6SafeFieldsPayloadOnly）
- doc: schedule-safe-fields-non-dry-run-poc-implementation.md
- DB write / Run click / non-dry-run execution: なし

6.18 Schedule safe-fields non-dry-run final preflight
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-final-preflight
- doc: schedule-safe-fields-non-dry-run-final-preflight.md
- beforeSnapshot SQL / dev command / UI checklist / afterVerification / rollback 再提示
- DB write / Run click / non-dry-run execution: なし

6.19 Schedule safe-fields non-dry-run execution
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-execution
- doc: schedule-safe-fields-non-dry-run-execution-result.md
- venue + description UPDATE 成功
- rollbackNeeded: false

6.20 Schedule write hardening and updated_at planning
完了済み。フェーズ: G-6-f7-schedule-write-hardening-and-updated-at-planning
- doc: schedule-write-hardening-and-updated-at-planning.md
- updated_at 推奨: staging 先行 DB trigger (Option A)

6.21 Schedule updated_at staging migration preflight
完了済み。フェーズ: G-6-f8-schedule-updated-at-staging-migration-preflight
- doc: schedule-updated-at-staging-migration-preflight.md

6.22 Schedule updated_at staging migration execution
完了済み。フェーズ: G-6-f8-schedule-updated-at-staging-migration-execution
- doc: schedule-updated-at-staging-migration-execution-result.md
- script: scripts/supabase/schedules-updated-at-trigger.sql
- trigger active on staging schedules
- updated_at 検証: 2026-06-05 → 2026-06-14（no-op UPDATE）
- operator 手動 SQL; Cursor SQL 実行なし
- rollbackNeeded: false

6.23 Schedule optimistic lock enablement planning
完了済み。フェーズ: G-6-f9-schedule-optimistic-lock-enablement-planning
- doc: schedule-optimistic-lock-enablement-planning.md

6.24 Schedule optimistic lock enablement implementation
完了済み。フェーズ: G-6-f10-schedule-optimistic-lock-enablement-implementation
- doc: schedule-optimistic-lock-enablement-implementation.md
- optimisticLockWiredInProductPath: true
- nonDryRunSaveUiExposed: false

6.25 Schedule general edit UI planning
完了済み。フェーズ: G-6-g-schedule-general-edit-ui-planning
- doc: schedule-general-edit-ui-planning.md
- 新 section 案: AdminStagingScheduleGeneralEditSection（#schedule、ScheduleAdminUi 直下）
- G-6-g1 第一 slice: title / approval G-6-g1-schedule-title-non-dry-run-slice
- dry-run preview 必須 → Save; stale 時 non-dry-run 無効
- PoC (G-6-e5/f6): 凍結維持
- readyForScheduleGeneralEditUiImplementation: true
- DB write / Save / Run click: なし

6.26 Schedule title non-dry-run slice preflight
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-preflight
- doc: schedule-title-non-dry-run-slice-preflight.md
- target row: aa440e29-5be8-402e-9190-0d81c48434c0（title: <>、G-6-f6 venue/description 保持）
- payload: title のみ `[CMS Kit staging] G-6-g1 title PoC`
- approval ID: G-6-g1-schedule-title-non-dry-run-slice（実装時に types/guards へ登録）
- env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
- guard 方針: assertG6G1TitlePayloadOnly（新規、G-6-f6 パターン踏襲）
- rollback SQL: title を `<>` に戻す（staging only、未実行）
- readyForG6G1ScheduleTitleNonDryRunSliceImplementation: true
- DB write / Save / Run click: なし

6.27 Schedule title non-dry-run slice implementation
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-implementation
- doc: schedule-title-non-dry-run-slice-implementation.md
- section: AdminStagingScheduleGeneralEditSection（#schedule、ScheduleAdminUi 直下）
- approval ID: G-6-g1-schedule-title-non-dry-run-slice（SCHEDULE_WRITE_APPROVAL_IDS 登録済み）
- guard: assertG6G1TitlePayloadOnly
- env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED
- save path: executeG6G1TitleNonDryRunSave → executeScheduleGeneralUpdateWrite
- nonDryRunSaveUiExposed: true（gated off by default）
- readyForG6G1ScheduleTitleNonDryRunSliceFinalPreflight: true
- DB write / Save click: なし

6.28 Schedule title non-dry-run slice final preflight
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-final-preflight
- doc: schedule-title-non-dry-run-slice-final-preflight.md
- beforeSnapshot / afterVerification / rollback SQL 提示
- dev 起動コマンド（G-6-g1 arm stack）
- UI 手順（Preview → Save gates; Save は execution のみ）
- readyForG6G1ScheduleTitleNonDryRunSliceExecution: true
- DB write / Save click: なし

6.29 Schedule title non-dry-run slice execution
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-execution
- doc: schedule-title-non-dry-run-slice-execution-result.md
- commit: cce3f97
- ユーザー手動 Save 1回; Cursor Save/Run/SQL なし
- title: <> → [CMS Kit staging] G-6-g1 title PoC
- changedFields: title のみ; rowsAffected: 1
- optimistic lock: expectedBeforeUpdatedAt matched; updated_at 進行
- client fix cf24c09 で readSource supabase 確認後に実行
- rollbackNeeded: false
- scheduleTitleNonDryRunSliceExecutionSucceeded: true
- nonDryRunSaveExecuted: true
- G-6-g1 approval / env arm: 凍結（再利用禁止）

6.30 Schedule general edit next slice planning
完了済み。フェーズ: G-6-g2-schedule-general-edit-next-slice-planning
- doc: schedule-general-edit-next-slice-planning.md
- commit: b3cd295
- 推奨次 slice: G-6-g2-schedule-time-fields-non-dry-run-slice（open_time + start_time）
- DB write / Save / Run click: なし

6.31 Schedule time fields non-dry-run slice preflight
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-preflight
- doc: schedule-time-fields-non-dry-run-slice-preflight.md
- commit: e5fa9ba
- DB write / Save / Run click: なし

6.32 Schedule time fields non-dry-run slice implementation
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-implementation
- doc: schedule-time-fields-non-dry-run-slice-implementation.md
- commit: e461155
- DB write / Save / Preview click: なし

6.33 Schedule time fields non-dry-run slice final preflight
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight
- doc: schedule-time-fields-non-dry-run-slice-final-preflight.md
- commit: 499aa37
- DB write / Preview / Save click: なし

6.34 Schedule time fields non-dry-run slice execution
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-execution
- doc: schedule-time-fields-non-dry-run-slice-execution-result.md
- commit: 1be0a27
- G-6-g3 price slice: deferred（G-7 優先）

6.35 URL → staging automation sprint planning
完了済み。フェーズ: G-7-url-to-staging-automation-sprint-planning
- doc: url-to-staging-automation-sprint-planning.md
- commit: cb5d517

6.36 Crawl static site implementation
完了済み。フェーズ: G-7a-crawl-static-site-implementation
- doc: crawl-static-site-implementation.md
- CLI: crawl-static-site.mjs; verify: verify-crawl-static-site.mjs (30 passed)
- cheerio added to tools/static-to-astro/package.json
- external crawl / gosaki-piano.com crawl: なし
- crawlStaticSiteImplementationComplete: true
- readyForG7bUrlToStagingOrchestratorImplementation: true

7. Current gates
scheduleWriteHardeningPlanningComplete: true
scheduleUpdatedAtStagingMigrationPreflightComplete: true
scheduleUpdatedAtStagingMigrationSucceeded: true
scheduleUpdatedAtTriggerActiveOnStaging: true
scheduleOptimisticLockPlanningComplete: true
scheduleOptimisticLockImplementationComplete: true
scheduleGeneralEditUiPlanningComplete: true
scheduleTitleNonDryRunSlicePreflightComplete: true
scheduleTitleNonDryRunSliceImplementationComplete: true
scheduleTitleNonDryRunSliceFinalPreflightComplete: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
scheduleGeneralEditNextSlicePlanningComplete: true
scheduleTimeFieldsNonDryRunSlicePreflightComplete: true
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
scheduleTimeFieldsNonDryRunSliceFinalPreflightComplete: true
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
urlToStagingAutomationSprintPlanningComplete: true
crawlStaticSiteImplementationComplete: true
readyForG7aCrawlStaticSiteImplementation: false
readyForG7bUrlToStagingOrchestratorImplementation: true
g6g3PriceSliceDeferred: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceImplementation: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceFinalPreflight: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
readyForScheduleGeneralEditUiImplementation: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: true
scheduleSafeFieldsNonDryRunExecutionSucceeded: true
hiddenPocTriggerDisarmedByDefault: true
dryRunDefaultDocumented: true
readyForScheduleUpdatedAtStagingMigrationExecution: false
rollbackNeeded: false

8. Absolute safety invariants
- production / Sariswing本番には触らない
- Supabase production projectには触らない
- service_role keyを使わない
- .env / .env.local をcommitしない
- output/ をcommitしない
- src/pages/admin/ は触らない
- Playwright / Chromium による自動クリック禁止

9. Environment expectations
明示的 retry / G-9g3b execution で dev server を起動する場合は inline env のみ使用する（`.env` / `.env.local` へ書き込まない）。

Routine dev safety（default）:
```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

**Note:** `tools/static-to-astro/.env.local` に `SUPABASE_SERVICE_ROLE_KEY` が local only（gitignored）で存在する場合がある。G-9g3b execution では使用禁止・参照禁止。anon key + authenticated session のみ。

10. Recommended next phase
次フェーズ推奨: **G-9h1-gosaki-client-preview-feedback-closure**（staging URL client/operator review; residual list; no DB write / Preview / Save）

G-9h Gosaki schedule CMS practicalization planning: **complete**. 最新commitは git HEAD を確認すること。Doc: `gosaki-schedule-cms-practicalization-planning.md`. Sequence: G-9h1 → G-9h2 → G-9h3 → G-9i → optional dry-run Preview. `readyForAnyDbWrite: false`.

G-9g4a2 framework implementation: **complete, committed, pushed**（C1 `1e643e7`, C2 `9c3714c`, C3 `1c1fb32`, C4 `d66bae7`）。Doc: `staging-shell-schedule-single-text-field-operational-commonization-implementation.md`. Verifiers: C1 69 / C2 34 / C3 47 / G-9g4a2a 83 / planning 39 / implementation 43 passed. **Do not repeat** per-field manual round-trips for `start_time` / `price`. Manual non-dry-run round-trip reserved for **new common logic** only. **Not** `start_time`-only manual execution as next slice.

G-9g4a2 framework planning: **complete**（commit `e267da3`）。

G-9g4a2a Schedule open_time-only operational **restore and closure complete**（commit `105c6b1` — committed and pushed）。round-trip complete; final `open_time` `11:30`; `markerRemainsInStagingDb: false`; `activeRestoreExceptionsCount: 0`; **no further Save / restore needed**.

G-9g4a2a2 manual execution: **complete**（commit `54623a1`）。

G-9g4a2 Schedule text fields operational expansion planning: **complete**（commit `0d80d7d`）。single-field-first; `open_time` only first slice.

G-9g4a1e Schedule venue-only operational round-trip **finalization complete**（commit `3b807c8`）。G-9g4a1 staging operational PoC closed.

G-9g4a1d Schedule venue-only operational restore manual execution: **complete**（commit `82e1aaa`）。

G-9g4a1b1 Schedule venue-only manual execution: **complete**（commit `11368be`）。

Phase sequence:
```txt
G-9g4a2a-open-time-only-operational-restore-and-closure ← complete (105c6b1 — committed and pushed)
G-9g4a2-framework-single-text-field-operational-commonization-planning ← complete (e267da3 — committed and pushed)
G-9g4a2-framework-single-text-field-operational-commonization-implementation ← complete (C1 1e643e7, C2 9c3714c, C3 1c1fb32, C4 d66bae7 — committed and pushed)
```

G-9g4a2 framework implementation gates:
```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
readyForG9g4a2FrameworkLocalStaticVerification: true
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
perFieldManualRoundTripPolicy: do not repeat for start_time/price
manualRoundTripReservedFor: new common logic only
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

G-9g4a2 framework planning gates:
```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationPlanningComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true
perFieldManualRoundTripPolicy: do not repeat for start_time/price config-only slices
manualRoundTripReservedFor: new common logic only
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

G-9g4a2a restore-and-closure gates:
```txt
stagingShellScheduleOpenTimeOnlyOperationalRoundTripComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationPlanning: true
finalOpenTime: 11:30
finalUpdatedAt: 2026-06-19T07:27:53.256604+00:00
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
perFieldManualRoundTripPolicy: do not repeat for start_time/price config-only slices
```

G-9g4a2a2 gates (historical — smoke write):
```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionManualExecutionComplete: true
targetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
smokeWriteComplete: true
restoreComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

G-9g4a2a1 gates:
```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a2a2OpenTimeOnlyOperationalExpansionManualExecution: true
targetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
beforeOpenTime: 11:30
smokeCandidateOpenTime: 11:30 [G-9g4a2a open_time smoke]
restoreTargetOpenTime: 11:30
expectedBeforeUpdatedAt: 2026-06-19T05:54:34.767498+00:00
markerRemainsInStagingDb: false
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

G-9g4a2a gates:
```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a2a1OpenTimeOnlyOperationalExpansionPreflight: true
g9g4a1VenueOnlyRoundTripComplete: true
singleFieldFirstPolicy: true
firstRecommendedSlice: open_time only (G-9g4a2a)
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

G-9g4a2 gates:
```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a2aOpenTimeOnlyOperationalExpansionImplementation: true
g9g4a1VenueOnlyRoundTripComplete: true
singleFieldFirstPolicy: true
firstRecommendedSlice: open_time only (G-9g4a2a)
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

Routine dev: dry-run on / all non-dry-run arms off. G-9g4a2a open_time-only round-trip complete — **no further Save / restore needed**. G-9g4a2 framework implementation complete — next: local/static verification or gosaki schedule CMS practicalization (**not** start_time-only manual execution).

11. AI workflow transition
チャット履歴への依存を減らすため、リポジトリ側に AI開発文脈管理ファイルを作成。
今後は、Cursorが作業後にこれらを更新し、Git管理された文脈ファイルを source of truth とする。

AI workflow foundation setup completed:
- `.cursor/rules` added
- `tools/static-to-astro/docs/ai/00-current-state.md` added
- `tools/static-to-astro/docs/ai/03-next-actions.md` added
- `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md` added
- commit `2b51bd5` — Add AI development workflow context files

AI workflow foundation refinement completed:
- `AGENTS.md` added at repository root
- `handoff-to-chatgpt.md` populated with current values
- root `README.md` updated with AI workflow files section
- latest commit: f3bf4dc — Refine AI development workflow handoff
