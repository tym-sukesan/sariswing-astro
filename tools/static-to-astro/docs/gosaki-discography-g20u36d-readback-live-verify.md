# G-20u36d — Gosaki Discography Edge dry-run readBack live verify

**Phase:** `G-20u36d-readback-live-verify`  
**Status:** **complete** — live HTTP verify executed · **partial STOP** · matching dryRun blocked · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `8ec25a7`  
**Prior:** G-20u36d readBack edge deploy result · env secret added · readBack-capable code deployed

| Check | Status |
| --- | --- |
| Live HTTP verify executed | **yes** |
| Live verify summary | **PARTIAL STOP** |
| Target URL | staging only |
| Auth | Bearer + `apikey` `PUBLIC_SUPABASE_ANON_KEY` (values not logged) |
| Production project used | **no** — **STOP** |
| Edge re-deploy by Cursor | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackLiveVerified: false
phase: G-20u36d-readback-live-verify
liveVerifyExecuted: true
liveVerifySummary: PARTIAL_STOP
readBackEnabledObserved: true
readBackSourceObserved: supabase-select
readBackReleaseFoundObserved: true
readBackTrackCountObserved: 0
matchingDryRunPass: false
plusOneTrackDryRunPass: true
saveRejectPass: true
wrongSiteSlugRejectPass: true
authMethod: bearer_and_apikey_public_supabase_anon_key
authSecretValuesLogged: false
serviceRoleUsed: false
productionProjectUsed: false
edgeFunctionRedeployed: false
saveEnabled: false
adminUiChanged: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
proceedToAdminSanitizer: false
proceedToG20u36eSavePlanning: false
proceedToReadBackTrackSelectFix: true
```

**G-20u36d readBack live-verify scope:** direct endpoint HTTP verify only. No re-deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Target

| Item | Value |
| --- | --- |
| **URL** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| **Project** | `static-to-astro-cms-staging` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging only) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **not used** |
| **Function** | `gosaki-discography-save-dry-run` |
| **legacyId** | `discography-002` |
| **siteSlug** | `gosaki-piano` |

---

## Auth

| Item | Value |
| --- | --- |
| **Method** | `Authorization: Bearer <PUBLIC_SUPABASE_ANON_KEY>` + `apikey: <PUBLIC_SUPABASE_ANON_KEY>` |
| **Key source** | repo `.env` / `.env.local` — **presence only · values not logged** |
| **SUPABASE_SERVICE_ROLE_KEY** | **not used** · **not referenced** |

---

## readBack observations (live)

| Field | Observed |
| --- | --- |
| `readBack.enabled` | **true** |
| `readBack.source` | **`supabase-select`** |
| `readBack.releaseFound` | **true** |
| `readBack.trackCount` | **0** (expected **8** for `discography-002`) |
| `readBack.legacyId` | `discography-002` |
| `readBack.siteSlug` | `gosaki-piano` |
| Sanitized summary | **yes** — no UUID · no raw rows · no secrets |

**Root cause (STOP):** release anon SELECT field list omits internal `id` column. Handler cannot resolve `release_id` for tracks SELECT → `trackCount` stays **0** → matching payload has empty `tracksText` → **400** `empty track list blocked`.

---

## Executed cases (sanitized)

| Case | Status | ok | readBack | wouldWrite | tracksAdded | Write flags | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **matching dryRun** | **400** | false | enabled · source=supabase-select · releaseFound=true · **trackCount=0** | false | — | all false | **STOP** — empty track list blocked |
| **+1 track dryRun** | **200** | true | enabled · releaseFound=true · trackCount=0 | **true** | **1** | all false | **PASS** |
| **operation=save** | **400** | false | — | — | — | all false | **PASS** — save rejected |
| **wrong siteSlug** | **400** | false | — | — | — | all false | **PASS** — siteSlug rejected |

### Case 1 — matching dryRun (STOP)

| Expected | Observed |
| --- | --- |
| status 200 | **400** |
| `readBack.enabled` true | **true** |
| `readBack.source` supabase-select | **supabase-select** |
| `readBack.releaseFound` true | **true** |
| `readBack.trackCount` = DB count (8) | **0** |
| `wouldWrite` false | false (blocked before diff) |
| `tracksAdded` 0 | — |
| `errors` [] | **`empty track list blocked`** |

### Case 2 — +1 track dryRun (PASS)

| Expected | Observed |
| --- | --- |
| status 200 | **200** |
| `readBack.enabled` true | **true** |
| `wouldWrite` true | **true** |
| `tracksAdded` 1 | **1** |
| write flags false | **all false** |

### Case 3 — operation=save reject (PASS)

| Expected | Observed |
| --- | --- |
| status 400 | **400** |
| save not successful | **rejected** |
| write flags false | **all false** |

### Case 4 — wrong siteSlug reject (PASS)

| Expected | Observed |
| --- | --- |
| status 400 | **400** |
| production ref in URL | **no** |
| DB write | **no** |

---

## Write flags (all POST cases)

| Flag | Value |
| --- | --- |
| `didWrite` | **false** |
| `dbWrite` | **false** |
| `networkWrite` | **false** |
| `saveEnabled` | **false** |

---

## Response safety

| Check | Result |
| --- | --- |
| `service_role` in body | **absent** |
| `SUPABASE_SERVICE_ROLE_KEY` in body | **absent** |
| JWT / secret-like strings logged | **no** |
| readBack summary sanitized | **yes** |

---

## PASS / STOP judgment

| Area | Judgment |
| --- | --- |
| readBack env gate armed | **PASS** |
| readBack enabled + source | **PASS** |
| release row anon SELECT | **PASS** |
| tracks anon SELECT via release id | **STOP** — `trackCount=0` |
| matching DB snapshot dryRun | **STOP** |
| +1 track diff dryRun | **PASS** |
| save reject | **PASS** |
| wrong siteSlug reject | **PASS** |
| DB write | **PASS** (none) |
| Save enablement | **PASS** (still blocked) |

**Overall gate:** `gosakiDiscographyEdgeDryRunReadBackLiveVerified: **false**`

**Do not proceed** to G-20u36e controlled Save planning until readBack returns correct `trackCount` and matching dryRun passes.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge re-deploy / Supabase CLI deploy | **not executed** |
| `supabase/functions/**` edit | **not executed** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Save button enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP / production | **not executed** |

---

## Next phase (recommended)

| Priority | Phase | Scope |
| --- | --- | --- |
| 1 | **`G-20u36d-readback-release-id-select-fix-planning`** | Plan fix: include internal `id` in release SELECT for tracks lookup · keep `id` out of sanitized readBack |
| 2 | **`G-20u36d-readback-release-id-select-fix`** | Implement in root handler + operator redeploy |
| 3 | **`G-20u36d-readback-live-verify-retry`** | Re-run live verify after fix |
| 4 | **`G-20u36d-admin-sanitizer-readback-summary-update`** | Optional — if admin UI needs readBack display |
| 5 | **`G-20u36e-controlled-save-planning`** | After readBack live verify **PASS** |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-live-verify
npm run verify:g20u36d-readback-edge-deploy-result
npm run verify:g20u36d-readback-env-secret-setting-result
```
