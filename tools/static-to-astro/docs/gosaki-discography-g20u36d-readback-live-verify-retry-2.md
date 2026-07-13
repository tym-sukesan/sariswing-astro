# G-20u36d — Gosaki Discography Edge dry-run readBack live verify retry-2

**Phase:** `G-20u36d-readback-live-verify-retry-2`  
**Status:** **complete** — live HTTP verify retry-2 executed · **PARTIAL STOP** · matching dryRun still blocked · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `eaba751`  
**Prior:** G-20u36d readBack tracks SELECT fields fix edge deploy result · tracks SELECT fields fix deployed on staging

| Check | Status |
| --- | --- |
| Live HTTP verify retry-2 executed | **yes** |
| Live verify retry-2 summary | **PARTIAL STOP** |
| Target URL | staging only |
| Auth | Bearer + `apikey` `PUBLIC_SUPABASE_ANON_KEY` (values not logged) |
| Production project used | **no** — **STOP** |
| Tracks SELECT fields fix deployed | **yes** (operator redeploy prior phase) |
| Release-id fix deployed | **yes** (retained) |
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
gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry2Passed: false
phase: G-20u36d-readback-live-verify-retry-2
liveVerifyRetry2Executed: true
liveVerifyRetry2Summary: PARTIAL_STOP
tracksSelectFieldsFixDeployed: true
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
proceedToReleaseIdColumnFix: true
```

**G-20u36d readBack live-verify-retry-2 scope:** direct endpoint HTTP verify only. No re-deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

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

## readBack observations (live retry-2)

| Field | Observed |
| --- | --- |
| `readBack.enabled` | **true** |
| `readBack.source` | **`supabase-select`** |
| `readBack.releaseFound` | **true** |
| `readBack.trackCount` | **0** (expected **8** for `discography-002`) |
| `readBack.legacyId` | `discography-002` |
| `readBack.siteSlug` | `gosaki-piano` |
| Sanitized summary | **yes** — no UUID · no raw rows · no secrets |

### Progress vs prior live verify retry (duration fix)

| Item | Prior retry (`G-20u36d-readback-live-verify-retry`) | This retry-2 |
| --- | --- | --- |
| `TRACK_SELECT_FIELDS` includes `duration` | **yes** (deployed code) | **no** — `track_number,title,sort_order,site_slug` only |
| Tracks SELECT error | **`42703`** · `discography_tracks.duration does not exist` | **`42703`** · **`discography_tracks.release_id does not exist`** |
| Release internal `id` | **yes** | **yes** |
| Tracks SELECT attempted | **yes** | **yes** |
| Warning observed | `anon SELECT tracks failed (400)` | `anon SELECT tracks failed (400)` |

**Root cause (STOP):** tracks anon SELECT filter uses **`release_id=eq.{uuid}`**, but staging table **`discography_tracks.release_id` does not exist**. Duration column issue is **resolved**; new blocker is **tracks FK column name / schema mismatch**.

---

## Executed cases (sanitized)

| Case | Status | ok | readBack | wouldWrite | tracksAdded | Write flags | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **matching dryRun** | **400** | false | enabled · source=supabase-select · releaseFound=true · **trackCount=0** | false | — | all false | **STOP** — empty track list blocked |
| **+1 track dryRun** | **200** | true | enabled · releaseFound=true · trackCount=0 | **true** | **1** | all false | **PASS** |
| **operation=save** | **400** | false | — | — | — | all false | **PASS** — save rejected |
| **wrong siteSlug** | **400** | false | enabled · releaseFound=true · trackCount=0 | — | — | all false | **PASS** — siteSlug rejected |

### Case details

**matching dryRun**
- `errors`: `empty track list blocked (trackPolicy.allowEmptyTrackList must be true to override)`
- `warnings`: `readBack: anon SELECT tracks failed (anon SELECT tracks failed (400))`

**+1 track dryRun**
- payload adds one bonus track line · client dryRun diff shows `tracksAdded=1`
- `errors`: **[]**

**operation=save**
- `errors`: `operation "save" is rejected by dry-run endpoint — use dryRun only`

**wrong siteSlug**
- `errors`: `Save is staging-only; siteSlug must be "gosaki-piano"` · empty track list blocked

---

## Write flags (all cases)

| Flag | Value |
| --- | --- |
| `didWrite` | **false** |
| `dbWrite` | **false** |
| `networkWrite` | **false** |
| `saveEnabled` | **false** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function re-deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Root `supabase/functions/**` edit | **not executed** |
| Env/secret value read or display | **not executed** |

---

## Next phases

| Outcome | Phase |
| --- | --- |
| **STOP (this run)** | Investigate staging `discography_tracks` schema · `release_id` column fix planning |
| **After trackCount=8 PASS** | **G-20u36e-controlled-save-planning** |

**G-20u36e-controlled-save-planning:** blocked until live verify retry-2 **PASS** (`trackCount=8` · matching **200**).

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-live-verify-retry-2
npm run verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-result
npm run verify:g20u36d-readback-live-verify-retry
```

Historical verifiers — not in active regression suite.
