# G-23b — Static-to-Astro onboarding config schema planning

**Phase:** `G-23b-static-to-astro-onboarding-config-schema-planning`  
**Status:** **complete** — schema design / draft JSON only; **no CLI implementation / crawl / DB write / package regen / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `a97e80a` (G-23a 30-minute onboarding flow planning committed)  
**Prior:** [static-to-astro-30-minute-onboarding-flow-planning.md](./static-to-astro-30-minute-onboarding-flow-planning.md) (G-23a)

| Artifact | Path |
| --- | --- |
| Schema draft | `config/onboarding.schema.example.json` |
| Gosaki sample | `config/onboarding.gosaki-piano.example.json` |

| Check | Status |
| --- | --- |
| Config schema designed | **yes** |
| Safety gates default safe | **yes** |
| Gosaki example config | **yes** |
| Implementation / crawl / deploy | **not executed** |

---

## Gates

```txt
staticToAstroOnboardingConfigSchemaPlanningComplete: true
phase: G-23b-static-to-astro-onboarding-config-schema-planning
readyForG23cOnboardingConfigValidator: false
readyForG23dSampleSiteDryRun: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
crawlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
productionDeployExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase staging:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-23b = planning + schema draft only.** No CLI, no crawl, no DB write, no package regen, no FTP.

---

## 1. Purpose — onboarding config

The **onboarding config** is the single source of truth for a 30-minute site build run.

| Goal | How config helps |
| --- | --- |
| **Standardize intake** | URL · site_slug · preset · outputs in one file |
| **Approach URL-only input** | CLI/UI generates config from minimal input; human reviews |
| **Explicit safety** | `safetyGates` block — all destructive ops default **off** |
| **Human-readable** | JSON with `$comment` fields for operator review |
| **Pipeline wiring** | Each 30-min step reads a defined section |

**Relationship to existing configs:**

| Existing | Onboarding config |
| --- | --- |
| `config/sites/gosaki-piano.url-to-staging.json` (G-7b) | Subsumed into `crawl` + `output` sections |
| `config/sites/gosaki.site-config.example.json` | Subsumed into `cms` + `supabase` sections |
| Env files (`.env.local`) | **Not** in config — secrets stay external |

---

## 2. Required config fields

### 2.1 Top-level identity

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `schemaVersion` | string | **yes** | e.g. `"1.0"` |
| `phase` | string | **yes** | e.g. `"G-23b-onboarding-config"` |
| `projectName` | string | **yes** | Human label |
| `siteSlug` | string | **yes** | URL-safe slug · DB `site_slug` |
| `sourceUrl` | string (URL) | **yes** | Crawl start URL |
| `sourcePlatform` | enum | **yes** | `wix` · `studio` · `jimdo` · `wordpress` · `static` · `unknown` |
| `siteType` | enum | **yes** | `musician-basic` · `lesson-studio-basic` · `shop-basic` · `custom` |
| `cmsPreset` | enum | **yes** | Same as `siteType` or override |
| `locale` | string | no | e.g. `"ja-JP"` |
| `timezone` | string | no | e.g. `"Asia/Tokyo"` |
| `ownerLabel` | string | no | Operator / client name |
| `publicDomain` | string | no | Future production domain (placeholder OK) |
| `stagingDomain` | string | **yes** | Staging base URL |

### 2.2 `crawl` — 3–8 min step

| Field | Description |
| --- | --- |
| `maxPages` | Page limit |
| `sameOriginOnly` | Cross-origin asset policy |
| `respectRobots` | robots.txt |
| `concurrency` | Parallel fetch limit |
| `pageInclude` | Glob / path prefixes to include |
| `pageExclude` | Glob / path prefixes to exclude |
| `assetRules` | Image/CSS download policy |

### 2.3 `cms.modules[]` — 12–17 min step

Per module:

| Field | Description |
| --- | --- |
| `id` | e.g. `schedule` · `news` · `discography` |
| `enabled` | boolean |
| `extractionStrategy` | `wix-html` · `supabase-existing` · `static-json` · `manual` |
| `table` | Supabase table name (if applicable) |
| `seedPolicy` | `extract-and-review` · `skip` · `import-existing` |
| `publishField` | e.g. `published` |
| `adminUiEnabled` | Show in operator shell |
| `publicRoute` | e.g. `/schedule/` |

### 2.4 `supabase` — 17–22 min step

| Field | Description |
| --- | --- |
| `environment` | `"staging"` only in onboarding |
| `projectLabel` | e.g. `static-to-astro-cms-staging` |
| `projectRef` | e.g. `kmjqppxjdnwwrtaeqjta` |
| `forbiddenProjectRefs` | `["vsbvndwuajjhnzpohghh"]` |
| `siteSlugColumn` | `"site_slug"` |

**Secrets:** `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` — **not in config file**.

### 2.5 `output` — 22–26 min step

| Path key | Default pattern |
| --- | --- |
| `workspaceRoot` | `tools/static-to-astro` |
| `fixtureOut` | `fixtures/{siteSlug}` |
| `astroOut` | `output/{siteSlug}-astro` |
| `staticPublicOut` | `output/static-public/{siteSlug}` |
| `manualUploadOut` | `output/manual-upload/{siteSlug}` |
| `reportsOut` | `output/onboarding-reports/{siteSlug}` |
| `docsOut` | `docs/onboarding/{siteSlug}` |
| `deployBase` | e.g. `/cms-kit-staging/{siteSlug}/` |

### 2.6 `ftp` — placeholder (disabled by default)

| Field | Default |
| --- | --- |
| `enabled` | `false` |
| `remoteBase` | placeholder path |
| `method` | `"manual-filezilla"` |
| `autoApply` | `false` |

### 2.7 `safetyGates` — all pipeline steps

See §4.

### 2.8 `approvals` — operator sign-off tracking

| Field | Description |
| --- | --- |
| `dbWriteApprovalId` | Required before seed INSERT |
| `packageBuildApprovalId` | Required before regen |
| `ftpUploadApprovalId` | Required before upload |

---

## 3. CMS preset — `musician-basic` module map

| Module | enabled (Gosaki) | table | publicRoute | P0 status |
| --- | --- | --- | --- | --- |
| **schedule** | **true** | `public.schedules` | `/schedule/` | **P0 complete** |
| **news** | false (planned) | TBD | `/news/` | planned |
| **profile** | false (planned) | static JSON | `/about/` | partial |
| **discography** | false (planned) | `public.discography` | `/discography/` | read proven |
| **video** | false (planned) | `site_embeds` / JSON | `/` (home) | proven |
| **contact** | false (planned) | static / HubSpot | `/contact/` | static only |

---

## 4. Safety gates — default values (safe side)

```json
{
  "stagingOnly": true,
  "requireHumanReview": true,
  "allowDbWrite": false,
  "allowPackageBuild": false,
  "allowFtpUpload": false,
  "allowProductionDeploy": false,
  "forbidMirrorDelete": true,
  "forbidServiceRole": true,
  "requireOutputDiffReview": true,
  "requireUploadFileList": true,
  "requireRollbackPlanForDbWrite": true,
  "manualCommitPush": true
}
```

| Gate | Meaning |
| --- | --- |
| `stagingOnly` | No production Supabase / FTP / domain |
| `requireHumanReview` | Operator must approve before destructive steps |
| `allowDbWrite` | **false** until explicit approval phase |
| `allowPackageBuild` | **false** until package dry-run phase |
| `allowFtpUpload` | **false** until FTP planning phase |
| `allowProductionDeploy` | **false** always in onboarding |
| `forbidMirrorDelete` | No `mirror --delete` (G-7f) |
| `forbidServiceRole` | anon + authenticated only |
| `requireOutputDiffReview` | G-22i3/i4 pattern mandatory |
| `requireUploadFileList` | Minimal file list before upload |
| `requireRollbackPlanForDbWrite` | Rollback SQL documented before seed |
| `manualCommitPush` | No auto git push |

---

## 5. Output path design

All paths relative to `tools/static-to-astro/` unless absolute.

```txt
fixtures/{siteSlug}/              ← crawl output
output/{siteSlug}-astro/          ← Astro project
output/static-public/{siteSlug}/  ← verified artifact
output/manual-upload/{siteSlug}/  ← operator upload package
output/onboarding-reports/{siteSlug}/  ← diff/QA reports
docs/onboarding/{siteSlug}/       ← per-site handoff docs
```

**Gitignore:** `output/` · `fixtures/{live-crawl}/` — not committed.

---

## 6. Gosaki example config

File: `config/onboarding.gosaki-piano.example.json`

| Field | Value |
| --- | --- |
| `projectName` | `gosaki-piano` |
| `siteSlug` | `gosaki-piano` |
| `sourceUrl` | `https://www.gosaki-piano.com/` |
| `sourcePlatform` | `wix` |
| `siteType` / `cmsPreset` | `musician-basic` |
| `stagingDomain` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |
| `publicDomain` | `https://www.gosaki-piano.com` (future cutover) |
| `supabase.projectRef` | `kmjqppxjdnwwrtaeqjta` |
| `schedule.enabled` | **true** |
| `safetyGates.allowDbWrite` | **false** |
| `ftp.enabled` | **false** |

Aligns with existing `gosaki-piano.url-to-staging.json` paths.

---

## 7. Connection to G-23a 30-minute flow

| Window | Config section read |
| --- | --- |
| **0–3 min** INTAKE | Create / validate full config |
| **3–8 min** CRAWL | `sourceUrl` · `crawl.*` · `output.fixtureOut` |
| **8–12 min** LAYOUT | `siteType` · `cmsPreset` · `output.astroOut` |
| **12–17 min** CMS EXTRACT | `cms.modules[]` |
| **17–22 min** STAGING SETUP | `supabase.*` · `safetyGates.allowDbWrite` |
| **22–26 min** PACKAGE | `output.*` · `safetyGates.allowPackageBuild` |
| **26–30 min** REPORT | `safetyGates.requireOutputDiffReview` · `ftp` · `approvals` |

---

## 8. Not in scope (G-23b)

| Item | Status |
| --- | --- |
| CLI implementation | deferred — G-23c+ |
| Config JSON Schema validator | deferred — G-23c |
| Live crawl | **not executed** |
| DB seed INSERT | **not executed** |
| Package regen | **not executed** |
| FTP / production deploy | **not executed** |
| Secrets in config file | **forbidden** |

---

## 9. Recommended next phases

| Phase | Scope |
| --- | --- |
| **G-23c** | Config validator + merge with `url-to-staging-pipeline.mjs` |
| **G-23d** | Sample site dry-run (fixture-only, no live crawl) |
| **G-23e** | Onboarding CLI `create-config-from-url.mjs` |

---

## 10. Safety (G-23b phase)

| Item | Status |
| --- | --- |
| CLI / crawl / DB / package / FTP | **no** |
| Save / SQL mutation | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| dev server | **not started** |
| commit / push (G-23b) | per operator instruction |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23b-static-to-astro-onboarding-config-schema-planning.mjs
```
