# G-20u36d — Gosaki Discography Edge dry-run readBack tracks SELECT fields fix (tools draft)

**Phase:** `G-20u36d-readback-tracks-select-fields-fix-tools-draft`  
**Status:** **complete** — tools draft fix only · **no root edit / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `7f8572d`  
**Prior:** G-20u36d readBack live verify retry · PARTIAL STOP · tracks SELECT 400

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
gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixToolsDraftImplemented: true
phase: G-20u36d-readback-tracks-select-fields-fix-tools-draft
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
proceedToLiveVerifyRetry2: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-select-fields-fix-tools-draft scope:** tools draft handler + readBack lib only. No root placement, no deploy, no SQL, no Save enablement.

---

## Problem (live verify retry STOP)

| Observation | Status |
| --- | --- |
| readBack.enabled / source / releaseFound | **PASS** |
| Release internal `id` | **PASS** |
| Tracks SELECT reached | **yes** |
| Tracks SELECT | **400** — PostgREST **`42703`** |
| Error | `column discography_tracks.duration does not exist` |
| readBack.trackCount | **0** — STOP |
| matching dryRun | **400** |
| write flags | **all false** |

**Cause:** `TRACK_SELECT_FIELDS` included **`duration`** but staging `public.discography_tracks` has no `duration` column.

---

## Fix applied (tools draft)

### A. `TRACK_SELECT_FIELDS` — remove `duration`

| Before | After |
| --- | --- |
| `track_number, title, duration, sort_order, site_slug` | **`track_number, title, sort_order, site_slug`** |

### B. `duration` — optional / absent

| Item | Rule |
| --- | --- |
| PostgREST SELECT | **no `duration`** |
| Mock fixture | may keep `duration: null` on in-memory rows — **not** in SELECT |
| `mapTrackRowsToTracksText()` | uses **`title` only** — unchanged |
| `sortTrackRows()` | uses **`track_number`** + **`sort_order`** — unchanged |

### C. Unchanged (sanitized output + safety)

| Policy | Rule |
| --- | --- |
| readBack summary | 6 fields only · no UUID · no raw rows |
| `operation=save` | **reject** |
| Write flags | **all false** — `didWrite: false` · `dbWrite: false` · `networkWrite: false` · `saveEnabled: false` |
| Auth | **anon SELECT** only |
| `service_role` | **not used** |

---

## Files changed

| File | Change |
| --- | --- |
| `scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `TRACK_SELECT_FIELDS` without `duration` |
| `scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | comment only |
| `scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | `TRACK_SELECT_FIELDS` without `duration` · fixture comment |

**Not changed:** root `supabase/functions/**` · admin UI · Save paths.

---

## Mock verification (fixture discography-002)

| Case | readBack.trackCount | wouldWrite | tracksAdded | Result |
| --- | --- | --- | --- | --- |
| **matching payload** | **8** | **false** | **0** | **PASS** |
| **+1 track** | 8 (baseline) | **true** | **1** | **PASS** |
| **schema-only baseline** | — | **true** (false positive) | — | unchanged |
| **operation=save** | — | — | — | **400 reject** |
| **write flags** | — | — | — | **all false** (`didWrite` / `dbWrite` / `networkWrite` / `saveEnabled`) |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root placement | **not executed** |
| Edge Function deploy | **not executed** |
| SQL / migration | **not executed** |
| DB write | **not executed** |
| Live HTTP verify | **not executed** |

---

## Next phase

**G-20u36d-readback-tracks-select-fields-fix-root-placement** — copy tools draft fix to root `supabase/functions/gosaki-discography-save-dry-run/` (scope exception 2 files).

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-select-fields-fix-tools-draft
npm run verify:g20u36d-readback-tracks-select-fields-fix-plan
npm run verify:g20u36d-readback-live-verify-retry
```
