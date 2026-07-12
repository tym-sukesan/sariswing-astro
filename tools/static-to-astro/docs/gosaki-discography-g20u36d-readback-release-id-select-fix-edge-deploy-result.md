# G-20u36d — Gosaki Discography Edge dry-run readBack release id SELECT fix edge deploy result

**Phase:** `G-20u36d-readback-release-id-select-fix-edge-deploy-result-record`  
**Status:** **complete** — operator Edge redeploy result recorded · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `df4a8be`  
**Prior:** G-20u36d readBack release-id select fix edge deploy preflight · root placement · env secret setting result

| Check | Status |
| --- | --- |
| Deploy result doc | **yes** (this file) |
| Edge Function redeployed (staging) | **yes** — human operator |
| Cursor Edge deploy | **no** |
| Production project used | **no** — **STOP** |
| Live verify retry | **not executed** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |
| Root `supabase/functions/**` edited (this phase) | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixEdgeDeployed: true
phase: G-20u36d-readback-release-id-select-fix-edge-deploy-result-record
deployManualExecuted: true
deployExecutor: human_operator
cursorEdgeDeployExecuted: false
edgeFunctionRedeployedToStaging: true
releaseIdSelectFixDeployed: true
readBackCapableCodeDeployed: true
readBackOptInSecretAdded: true
productionProjectUsed: false
liveVerifyRetryExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
rootSupabaseFunctionsChanged: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
cliLatestChanged: false
cliLatestRestoreRequired: false
finalGitStatusClean: true
proceedToLiveVerifyRetry: true
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack release-id-select-fix edge-deploy-result-record scope:** record operator deploy outcome only. No re-deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Pre-deploy context (recorded)

| Item | Status |
| --- | --- |
| Deploy preflight | **complete** — `G-20u36d-readback-release-id-select-fix-edge-deploy-preflight` |
| Root release-id fix | **placed** — `RELEASE_SELECT_FIELDS` + internal `id` · tracks `release_id` lookup |
| Env secret `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | **added** — operator Dashboard (prior phase) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | **exist** (names only — values not recorded) |
| Root source committed | **yes** — `index.ts` + `handler.ts` |

---

## Deploy execution (human operator)

| Item | Value |
| --- | --- |
| **Executor** | Human operator — **not Cursor** |
| **Command** | `supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta` |
| **Working directory** | `~/sariswing-astro` |
| **Target project** | `static-to-astro-cms-staging` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging only) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **not used** |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Outcome** | **SUCCESS** |

### CLI output (recorded)

```txt
Deployed Functions on project kmjqppxjdnwwrtaeqjta: gosaki-discography-save-dry-run
```

### Uploaded assets

| File |
| --- |
| `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |

**Deployed Edge Function code is now release-id fix + readBack-capable** (`RELEASE_SELECT_FIELDS` includes internal `id` for tracks `release_id` lookup · sanitized readBack summary · anon SELECT only). Live readBack trackCount behavior is **not yet verified** — see next phase.

---

## Non-blocking warnings / notices

| Item | Status |
| --- | --- |
| `WARNING: Docker is not running` | **non-blocking** — deploy succeeded |
| Supabase CLI update notice | **non-blocking** — no action required in this phase |

---

## Local temp file / git status (post-deploy)

| Item | Status |
| --- | --- |
| `supabase/.temp/cli-latest` | **unchanged** — restore **not required** |
| Final git status (operator) | `## main...origin/main` — **clean** |

---

## Post-deploy state (not yet verified live)

| Item | Status |
| --- | --- |
| Staging Edge endpoint | readBack + release-id fix code **deployed** |
| Prior live verify PARTIAL STOP | `trackCount=0` · matching dryRun **400** (pre-fix deployed code) |
| Expected after live verify retry | `readBack.trackCount=8` · matching dryRun **200** · `wouldWrite=false` |
| `operation=save` | **still rejected** |
| Write flags | **still false** |
| Save / First controlled write | **still blocked** |

**Live verify retry:** **G-20u36d-readback-live-verify-retry** — direct HTTP to Edge endpoint. **Not executed in this phase.**

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function re-deploy | **not executed** |
| Cursor Edge deploy | **not executed** |
| Live verify retry | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Root `supabase/functions/**` edit | **not executed** |
| Env/secret value read or display | **not executed** |
| `SUPABASE_SERVICE_ROLE_KEY` for readBack | **not used** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-live-verify-retry** | Direct endpoint · expect trackCount=8 · matching PASS |
| **G-20u36e-controlled-save-planning** | First controlled Save — **after live verify retry PASS** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-result
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-preflight
npm run verify:g20u36d-readback-release-id-select-fix-root-placement
```

Historical verifiers — not in active regression suite.
