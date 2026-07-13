# G-20u36d — Gosaki Discography Edge dry-run readBack live verify retry-3

**Phase:** `G-20u36d-readback-live-verify-retry-3`  
**Status:** **complete** — live HTTP verify retry-3 executed · **PASS** · **no re-deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `8edeec6`  
**Prior:** G-20u36d readBack tracks relation filter fix edge deploy result · relation filter fix deployed on staging

| Check | Status |
| --- | --- |
| Live HTTP verify retry-3 executed | **yes** |
| Live verify retry-3 summary | **PASS** |
| Target URL | staging only |
| Auth | Bearer + `apikey` `PUBLIC_SUPABASE_ANON_KEY` (values not logged) |
| Production project used | **no** — **STOP** |
| Tracks relation filter fix deployed | **yes** (`discography_legacy_id=eq.{legacyId}`) |
| Tracks SELECT fields fix deployed | **yes** (`TRACK_SELECT_FIELDS` without `duration`) |
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
gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: true
phase: G-20u36d-readback-live-verify-retry-3
liveVerifyRetry3Executed: true
liveVerifyRetry3Summary: PASS
tracksRelationFilterFixDeployed: true
tracksSelectFieldsFixDeployed: true
releaseIdSelectFixDeployed: true
readBackEnabledObserved: true
readBackSourceObserved: supabase-select
readBackReleaseFoundObserved: true
readBackTrackCountObserved: 8
readBackTrackCountExpected: 8
matchingDryRunPass: true
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
proceedToG20u36eSavePlanning: true
```

**G-20u36d readBack live-verify-retry-3 scope:** direct endpoint HTTP verify only. No re-deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

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

## readBack observations (live retry-3)

| Field | Observed |
| --- | --- |
| `readBack.enabled` | **true** |
| `readBack.source` | **`supabase-select`** |
| `readBack.releaseFound` | **true** |
| `readBack.trackCount` | **8** (expected **8** for `discography-002`) |
| `readBack.legacyId` | `discography-002` |
| `readBack.siteSlug` | `gosaki-piano` |
| Sanitized summary | **yes** — no UUID · no raw rows · no secrets |

### Progress vs prior live verify retry-2 (relation filter fix)

| Item | Prior retry-2 | This retry-3 |
| --- | --- | --- |
| Tracks filter | **`release_id=eq.{uuid}`** (column absent) | **`discography_legacy_id=eq.{legacyId}`** |
| Tracks SELECT error | **`42703`** · `discography_tracks.release_id does not exist` | **none** |
| Prefetch anon SELECT trackCount | **0** (Edge) / **8** (direct PostgREST with fix) | **8** (Edge + prefetch) |
| Matching dryRun status | **400** | **200** |
| Matching `readBack.trackCount` | **0** | **8** |
| Warning | `anon SELECT tracks failed (400)` | **none** |

**Relation filter fix verified:** deployed Edge Function now reads tracks via **`discography_legacy_id`** · **`release_id` filter removed** · `releaseRow.id` not used for tracks relation.

---

## Executed cases (sanitized)

| Case | Status | ok | readBack | wouldWrite | tracksAdded | Write flags | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **matching dryRun** | **200** | true | enabled · source=supabase-select · releaseFound=true · **trackCount=8** | false | **0** | all false | **PASS** |
| **+1 track dryRun** | **200** | true | enabled · releaseFound=true · trackCount=8 | **true** | **1** | all false | **PASS** |
| **operation=save** | **400** | false | — | false | — | all false | **PASS** — save rejected |
| **wrong siteSlug** | **400** | false | enabled · releaseFound=true · trackCount=8 | false | — | all false | **PASS** — siteSlug rejected |

### Case details

**matching dryRun**
- `errors`: **[]**
- `warnings`: **[]**

**+1 track dryRun**
- payload adds one bonus track line · client dryRun diff shows `tracksAdded=1`
- `errors`: **[]**

**operation=save**
- `errors`: `operation "save" is rejected by dry-run endpoint — use dryRun only`

**wrong siteSlug**
- `errors`: `Save is staging-only; siteSlug must be "gosaki-piano"`

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
| **PASS (this run)** | **G-20u36e-controlled-save-planning** |

**G-20u36e-controlled-save-planning:** unblocked after live verify retry-3 **PASS** (`trackCount=8` · matching **200**).

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-live-verify-retry-3
npm run verify:g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result
npm run verify:g20u36d-readback-live-verify-retry-2
```

Historical verifiers — not in active regression suite.
