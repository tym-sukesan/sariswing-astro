# G-20u36d — Gosaki Discography Edge dry-run readBack release id SELECT fix (tools draft)

**Phase:** `G-20u36d-readback-release-id-select-fix-tools-draft`  
**Status:** **complete** — tools draft fix only · **no root edit / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `2494ca1`  
**Prior:** G-20u36d readBack live verify PARTIAL STOP · release-id select fix plan

| Check | Status |
| --- | --- |
| Tools draft fix doc | **yes** (this file) |
| Tools draft handler updated | **yes** |
| Tools draft readBack lib updated | **yes** |
| Root `supabase/functions/**` edited | **no** |
| Edge Function redeployed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixToolsDraftImplemented: true
phase: G-20u36d-readback-release-id-select-fix-tools-draft
toolsDraftFixOnly: true
rootEditExecuted: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToRootPlacement: true
proceedToEdgeDeploy: false
proceedToLiveVerifyRetry: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack release-id-select-fix-tools-draft scope:** tools draft handler + readBack lib only. No root placement, no deploy, no SQL, no Save enablement.

---

## Problem (live verify STOP)

| Observation | Status |
| --- | --- |
| readBack.enabled / source / releaseFound | **PASS** |
| readBack.trackCount | **0** — STOP |
| matching dryRun | **400** — empty track list blocked |
| write flags | **all false** |

**Cause:** `RELEASE_SELECT_FIELDS` omitted internal `id` → tracks SELECT skipped.

---

## Fix applied (tools draft)

### A. `RELEASE_SELECT_FIELDS` — add internal `id`

| Item | Value |
| --- | --- |
| Change | Prepend **`id`** to PostgREST `select=` list |
| Purpose | Resolve `release_id` for tracks anon SELECT |
| Exposure | **internal only** — not in snapshot release · not in readBack summary |

### B. `resolveReadBackSnapshot()` — safe fallback

| Condition | Behavior |
| --- | --- |
| release row missing | empty snapshot · `releaseFound=false` |
| release row without `id` | warning · empty tracks · `trackCount=0` · **no id in response** |
| release row with `id` | fetch tracks via `release_id=eq.{id}` |

### C. Unchanged (sanitized output)

| Function | Rule |
| --- | --- |
| `mapReleaseRowToCurrentSnapshotRelease()` | **No `id`** in snapshot release |
| `buildSanitizedReadBackSummary()` | **6 fields only** — no UUID |
| HTTP `readBack` | sanitized summary only |
| Admin UI | **no change** |

---

## Files changed

| File | Change |
| --- | --- |
| `scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `id` in SELECT · warnings on missing id |
| `scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | comment only |
| `scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | `id` in SELECT · fixture `release_id` · warnings |

**Not changed:** root `supabase/functions/**` · admin UI · Save paths.

---

## Mock verification (fixture discography-002)

| Case | readBack.trackCount | wouldWrite | tracksAdded | Result |
| --- | --- | --- | --- | --- |
| **matching payload** | **8** | **false** | **0** | **PASS** |
| **+1 track** | **8** (baseline) | **true** | **1** | **PASS** |
| **schema-only baseline** | — | **true** (false positive) | **8** | expected |
| **operation=save** | — | — | — | **400 reject** |
| **write flags** | — | **false** | — | **PASS** |

| readBack summary | Rule |
| --- | --- |
| Fields | `enabled`, `source`, `releaseFound`, `trackCount`, `legacyId`, `siteSlug` |
| `id` / UUID | **absent** |
| raw DB rows | **absent** |

---

## Safety (unchanged)

| Check | Expected |
| --- | --- |
| anon SELECT | **yes** |
| service_role | **not used** |
| `operation=save` | **rejected** |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Staging ref | `kmjqppxjdnwwrtaeqjta` only |
| Production ref | `vsbvndwuajjhnzpohghh` — **STOP** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root placement | **not executed** |
| Edge redeploy | **not executed** |
| Live verify retry | **not executed** |
| SQL / DB write / Save / admin UI / FTP | **not executed** |

---

## Next phase

| Phase | Scope |
| --- | --- |
| **`G-20u36d-readback-release-id-select-fix-root-placement`** | Copy tools draft handler to root (scope exception) |
| **`G-20u36d-readback-release-id-select-fix-edge-deploy`** | Operator staging redeploy |
| **`G-20u36d-readback-live-verify-retry`** | Expect matching PASS · trackCount=8 |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-release-id-select-fix-tools-draft
npm run verify:g20u36d-readback-release-id-select-fix-plan
npm run verify:g20u36d-readback-implementation-in-tools-draft
```
