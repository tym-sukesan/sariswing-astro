# G-20u36d — Gosaki Discography Edge dry-run readBack live verify retry

**Phase:** `G-20u36d-readback-live-verify-retry`  
**Status:** **complete** — live HTTP verify retry executed · **PARTIAL STOP** · matching dryRun still blocked · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `9c5c074`  
**Prior:** G-20u36d readBack release-id select fix edge deploy result · release-id fix deployed on staging

| Check | Status |
| --- | --- |
| Live HTTP verify retry executed | **yes** |
| Live verify retry summary | **PARTIAL STOP** |
| Target URL | staging only |
| Auth | Bearer + `apikey` `PUBLIC_SUPABASE_ANON_KEY` (values not logged) |
| Production project used | **no** — **STOP** |
| Release-id fix deployed | **yes** (operator redeploy prior phase) |
| Edge re-deploy by Cursor | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetryPassed: false
phase: G-20u36d-readback-live-verify-retry
liveVerifyRetryExecuted: true
liveVerifyRetrySummary: PARTIAL_STOP
releaseIdSelectFixDeployed: true
readBackEnabledObserved: true
readBackSourceObserved: supabase-select
readBackReleaseFoundObserved: true
readBackTrackCountObserved: 0
readBackTrackCountExpected: 8
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
proceedToG20u36eSavePlanning: false
proceedToAdminSanitizer: false
proceedToTracksSelectFieldsFix: true
```

**G-20u36d readBack live-verify-retry scope:** direct endpoint HTTP verify only. No re-deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

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

## readBack observations (live retry)

| Field | Observed |
| --- | --- |
| `readBack.enabled` | **true** |
| `readBack.source` | **`supabase-select`** |
| `readBack.releaseFound` | **true** |
| `readBack.trackCount` | **0** (expected **8** for `discography-002`) |
| `readBack.legacyId` | `discography-002` |
| `readBack.siteSlug` | `gosaki-piano` |
| Sanitized summary | **yes** — no UUID · no raw rows · no secrets |

### Progress vs prior live verify (release-id fix)

| Item | Prior (`G-20u36d-readback-live-verify`) | This retry |
| --- | --- | --- |
| Release SELECT includes `id` | **no** (deployed code) | **yes** (release row returns internal `id`) |
| Tracks SELECT attempted | skipped (no `release_id`) | **yes** |
| Tracks SELECT outcome | N/A | **400** — PostgREST `42703` |
| Warning observed | — | `readBack: anon SELECT tracks failed (anon SELECT tracks failed (400))` |

**Root cause (STOP):** anon SELECT tracks path includes column **`duration`** in `TRACK_SELECT_FIELDS`, but staging table **`discography_tracks.duration` does not exist**. Tracks query fails → `trackCount=0` → matching payload has empty `tracksText` → **400** `empty track list blocked`.

**Note:** Release-id fix is **working** (release anon SELECT returns `id`). Remaining blocker is **tracks SELECT field list vs staging schema**.

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
| `readBack.trackCount` 8 | **0** |
| `wouldWrite` false | false (blocked before diff) |
| `tracksAdded` 0 | — |
| `errors` [] | **`empty track list blocked`** |
| Write flags all false | **true** |

**Warnings (sanitized):** `readBack: anon SELECT tracks failed (anon SELECT tracks failed (400))`

### Case 2 — +1 track dryRun (PASS)

| Expected | Observed |
| --- | --- |
| status 200 | **200** |
| `readBack.enabled` true | **true** |
| `readBack.releaseFound` true | **true** |
| `readBack.trackCount` 8 | **0** (readBack summary still 0 — tracks SELECT failed server-side) |
| `wouldWrite` true | **true** |
| `tracksAdded` 1 | **1** |
| Write flags all false | **true** |

### Case 3 — operation=save (PASS — reject)

| Expected | Observed |
| --- | --- |
| status 400 reject | **400** |
| `ok` false | **false** |
| Save succeeds | **no** |
| Write flags all false | **true** |

**Error (sanitized):** `operation "save" is rejected by dry-run endpoint — use dryRun only`

### Case 4 — wrong siteSlug (PASS — reject)

| Expected | Observed |
| --- | --- |
| status 400 reject | **400** |
| `ok` false | **false** |
| Write flags all false | **true** |

**Errors (sanitized):** siteSlug must be `gosaki-piano` · empty track list blocked

---

## DB write / Save / safety

| Item | Status |
| --- | --- |
| DB write observed | **no** |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **all false** on all cases |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Production ref in requests | **no** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function re-deploy | **not executed** |
| SQL / migration | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Root `supabase/functions/**` edit | **not executed** |

---

## Next phases

| Condition | Phase |
| --- | --- |
| **Current (STOP)** | **G-20u36d-readback-tracks-select-fields-fix-planning** (or equivalent) — remove `duration` from `TRACK_SELECT_FIELDS` or align staging schema · tools draft → root → redeploy |
| After live verify retry **PASS** | **G-20u36e-controlled-save-planning** |
| Admin display issue only | **G-20u36d-admin-sanitizer-readback-summary-update** |

**Do not proceed** to G-20u36e controlled Save planning until live verify retry **PASS** (`trackCount=8` · matching dryRun **200**).

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-live-verify-retry
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-result
npm run verify:g20u36d-readback-live-verify
```

Historical verifiers — not in active regression suite.
