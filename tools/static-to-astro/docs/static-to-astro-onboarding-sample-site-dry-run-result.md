# G-23d — Static-to-Astro onboarding sample site dry-run result

**Phase:** `G-23d-static-to-astro-onboarding-sample-site-dry-run`  
**Status:** **complete** — fixture-only dry-run; **no live crawl / DB / package / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `dac762c`  
**Prior:** [static-to-astro-onboarding-config-validator-result.md](./static-to-astro-onboarding-config-validator-result.md) (G-23c)

| Artifact | Path |
| --- | --- |
| Sample config | `config/onboarding.sample-musician-fixture.example.json` |
| Fixture crawl result | `fixtures/onboarding/sample-musician-basic-crawl-result.json` |
| Dry-run script | `scripts/run-onboarding-fixture-dry-run.mjs` |
| Verifier | `scripts/verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs` |

| Check | Status |
| --- | --- |
| Fixture-only dry-run | **yes** |
| Config validation PASS | **yes** |
| Fixture load PASS | **yes** |
| 30-min flow steps mapped | **yes** |
| Live crawl / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroOnboardingSampleSiteDryRunComplete: true
phase: G-23d-static-to-astro-onboarding-sample-site-dry-run
fixtureOnly: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
readyForG23eOnboardingOrchestratorPlanning: true
readyForG23fCmsPresetRegistryImplementation: true
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** staging `kmjqppxjdnwwrtaeqjta` checked only — **no DB connection**. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-23b/G-23c の onboarding config と validator を使い、**fixture のみ**で 30分オンボーディングの dry-run report を生成する。

| Goal | G-23d outcome |
| --- | --- |
| パイプライン設計の実証 | config → fixture → classify → CMS候補 → paths |
| 安全ゲート確認 | allowDbWrite/PackageBuild/FtpUpload = false |
| 次フェーズの入力 | orchestrator / preset registry / seed extractor へ |

---

## 2. Fixture-only

| Item | Value |
| --- | --- |
| `sourceUrl` | `https://example.com/sample-musician/` — **not fetched** |
| `fixture.fixtureOnly` | `true` |
| `fixture.source.liveCrawl` | `false` |
| Network | **none** |

---

## 3. Operations NOT executed

| Item | Status |
| --- | --- |
| Live URL crawl | **no** |
| Network access | **no** |
| DB connection / write | **no** |
| SQL mutation | **no** |
| Package regen | **no** |
| FTP / upload / deploy | **no** |
| `workflow_dispatch` | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| Output directory creation | **no** (paths computed only) |

---

## 4. Run commands

```bash
# Config validation (G-23c)
node tools/static-to-astro/scripts/validate-onboarding-config.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json

# Fixture dry-run (G-23d)
node tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json

# JSON output
node tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --json

# Verifier
node tools/static-to-astro/scripts/verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs
```

---

## 5. Config validation result

**PASS** — `onboarding.sample-musician-fixture.example.json`

| Field | Value |
| --- | --- |
| `siteSlug` | `sample-musician-fixture` |
| `sourcePlatform` | `static` |
| `cmsPreset` | `musician-basic` |
| `sourceUrl` | `https://example.com/sample-musician/` (fixture — not accessed) |
| `safetyGates.allowDbWrite` | `false` |
| `safetyGates.allowPackageBuild` | `false` |
| `safetyGates.allowFtpUpload` | `false` |
| `ftp.enabled` | `false` |
| `supabase.projectRef` | `kmjqppxjdnwwrtaeqjta` |
| `forbiddenProjectRefs` | includes `vsbvndwuajjhnzpohghh` |

---

## 6. Fixture load result

**PASS** — `sample-musician-basic-crawl-result.json`

| Item | Value |
| --- | --- |
| Pages | 6 |
| CSS assets | 2 |
| Image assets | 3 |
| `metadata.detectedPlatform` | `fixture/static` |
| `stats.pagesFetched` | 6 |

---

## 7. Page classification result

| Path | Detected type | CMS module |
| --- | --- | --- |
| `/` | home | — |
| `/profile/` | profile | profile |
| `/schedule/` | schedule | schedule |
| `/discography/` | discography | discography |
| `/videos/` | video | video |
| `/contact/` | contact | contact |

**Note:** `news` module enabled but no `/news/` page in fixture — reported as unmapped module (acceptable for fixture sample).

---

## 8. CMS module / seed candidates

| Module | Enabled | Seed count | Table |
| --- | --- | --- | --- |
| schedule | yes | 2 | `public.schedules` |
| news | yes | 1 | — |
| profile | yes | 1 | — |
| discography | yes | 1 | `public.discography` |
| video | yes | 1 | — |
| contact | yes | 1 | — |

**Seed samples (fixture):**

- Schedule: `schedule-2026-08-001`, `schedule-2026-09-001`
- News: `news-2026-07-001`
- Discography: `discography-001`
- Video: `video-001` (YouTube nocookie embed URL placeholder)

---

## 9. Output path candidates (computed only)

| Key | Resolved path |
| --- | --- |
| `fixtureOut` | `tools/static-to-astro/fixtures/onboarding/sample-musician-fixture` |
| `astroOut` | `tools/static-to-astro/output/sample-musician-fixture-astro` |
| `staticPublicOut` | `tools/static-to-astro/output/static-public/sample-musician-fixture` |
| `manualUploadOut` | `tools/static-to-astro/output/manual-upload/sample-musician-fixture` |
| `reportsOut` | `tools/static-to-astro/output/onboarding-reports/sample-musician-fixture` |
| `docsOut` | `tools/static-to-astro/docs/onboarding/sample-musician-fixture` |

**Files created:** 0

---

## 10. 30-minute flow step results

| Window | Step | Status | Summary |
| --- | --- | --- | --- |
| 0–3 min | INTAKE | **PASS** | config validation OK |
| 3–8 min | CRAWL | **PASS** | fixture load · liveCrawl=false |
| 8–12 min | CLASSIFY | **PASS** | 6 pages classified |
| 12–17 min | CMS EXTRACT | **PASS** | seed counts reported |
| 17–22 min | STAGING SETUP | **PASS** | staging ref only · no DB |
| 22–26 min | PACKAGE | **PASS** | paths computed · allowPackageBuild=false |
| 26–30 min | REPORT | **PASS** | dry-run summary |

**Overall dry-run status: PASS**

---

## 11. Safety gates confirmation

| Gate | Required | Actual |
| --- | --- | --- |
| `allowDbWrite` | `false` | `false` |
| `allowPackageBuild` | `false` | `false` |
| `allowFtpUpload` | `false` | `false` |
| `allowProductionDeploy` | `false` | `false` |
| `forbidServiceRole` | `true` | `true` |
| `ftp.enabled` | `false` | `false` |

---

## 12. Recommended next phases

| Phase | Scope |
| --- | --- |
| **G-23e** | Onboarding orchestrator planning |
| **G-23f** | CMS preset registry implementation |
| **G-23g** | Seed extractor standardization |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs
```

Expected: all checks PASS · port 4321 LISTEN none.
