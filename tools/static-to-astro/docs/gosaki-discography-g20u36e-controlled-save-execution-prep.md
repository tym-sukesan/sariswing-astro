# G-20u36e — Gosaki Discography controlled Save execution prep

**Phase:** `G-20u36e-controlled-save-execution-prep`  
**Status:** **complete** — execution prep only · curl prepared · **operation=save未送信** · **Save未実行**  
**Date:** 2026-07-14  
**Prior:** [pre-save-select-result](./gosaki-discography-g20u36e-controlled-save-pre-save-select-result.md)  
**Handler (read-only):** `supabase/functions/gosaki-discography-save-dry-run/handler.ts` · `index.ts`

| Check | Status |
| --- | --- |
| Execution prep only | **yes** |
| operation=save | **not sent** · 未送信 |
| Save executed | **no** · 未実行 |
| DB write executed | **no** · 未実行 |
| Rollback executed | **no** · 未実行 |
| Pre-save SELECT | **PASS** (recorded) |
| JWT / anon key in doc | placeholder only |

---

## Gates

```txt
gosakiDiscographyControlledSaveExecutionPrepared: true
phase: G-20u36e-controlled-save-execution-prep
executionPrepOnly: true
operationSaveSent: false
saveExecuted: false
dbWriteExecuted: false
rollbackExecuted: false
serviceRoleUsed: false
productionChanged: false
curlPreparedNotExecuted: true
jwtPlaceholderOnly: true
recommendedNextPhase: G-20u36e-controlled-save-execution
```

**Endpoint:** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`  
**Project ref:** `kmjqppxjdnwwrtaeqjta`  
**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Handler field survey (read-only)

Controlled Save path (`validateControlledSaveGates` + `executeControlledSave`):

| Field | Required? | Exact / notes |
| --- | --- | --- |
| `operation` | **yes** | `"save"` (`CONTROLLED_SAVE_OPERATION`) |
| `siteSlug` | **yes** | `"gosaki-piano"` |
| `legacyId` **or** `discographyLegacyId` | **yes** | `"discography-002"` |
| `approvalId` | **yes** | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| `sliceId` | **yes** | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| `targetRowId` **or** `trackTargetId` | **yes** | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `trackNumber` | recommended | `1` (defaults to 1) |
| `beforeTitle` | optional but recommended | `"On a Clear Day"` (if present must match) |
| `afterTitle` **or** `requestedTitle` | **yes** (or via `tracksText` line 1) | `"On a Clear Day [CMS Kit staging G-20u36e]"` |
| `tracksText` | optional | if set: exactly 8 lines · only track 1 title may change · track 7 stays `Like a Lover` |
| `release` / `trackPolicy` / `clientDryRun` | **not required** for `operation=save` | dryRun-only gate fields |
| `dryRun=false` | **do not use** | handler keys off `operation=save` |

`index.ts` forwards `Authorization` to the handler · user JWT + staging anon key · **no service_role**.

---

## 2. Target slice

| Item | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| row id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| track_number | `1` |
| old title | `On a Clear Day` |
| new title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | `8` |
| track_7_title | `Like a Lover` |
| approvalId | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| sliceId | `G-20u36e1-discography-002-track-1-title-staging-marker` |

---

## 3. Controlled Save curl (prepared · **未実行**)

```bash
export OPERATOR_JWT='…'       # operator JWT · do not paste into chat/docs
export STAGING_ANON_KEY='…'   # staging anon · do not paste into chat/docs

curl -sS -X POST \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $OPERATOR_JWT" \
  -H "apikey: $STAGING_ANON_KEY" \
  -d '{
    "operation": "save",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-002",
    "discographyLegacyId": "discography-002",
    "approvalId": "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
    "sliceId": "G-20u36e1-discography-002-track-1-title-staging-marker",
    "targetRowId": "e30c5ea9-2857-492b-8a78-58cbfcbe7929",
    "trackNumber": 1,
    "beforeTitle": "On a Clear Day",
    "afterTitle": "On a Clear Day [CMS Kit staging G-20u36e]"
  }'
```

**Notes:**  
- No `tracksText` / `release` / `trackPolicy` / `clientDryRun` (not required for this Save path).  
- No `dryRun` field.  
- Run **once** only in a future explicit execution phase · Cursor does **not** send this HTTP.

---

## 4. Expected success response (after future execution)

| Field | Expected |
| --- | --- |
| `ok` | `true` |
| `operation` | `save` |
| `controlledSave` | `true` |
| `updatedRows` | `1` |
| `beforeTitle` | `On a Clear Day` |
| `afterTitle` | `On a Clear Day [CMS Kit staging G-20u36e]` |
| readBack target title | new title |
| `readBack` track count | `8` |
| track_7 | `Like a Lover` |
| secrets in response | **none** (no JWT / user_id / email / service_role) |

---

## 5. STOP conditions (do not run Save if any apply)

| # | Condition |
| --- | --- |
| 1 | `OPERATOR_JWT` / `STAGING_ANON_KEY` unset |
| 2 | Endpoint host / project ref is not staging `kmjqppxjdnwwrtaeqjta` |
| 3 | Request body includes unexpected album / extra tracks / wrong legacyId |
| 4 | `approvalId` / `sliceId` mismatch |
| 5 | Mixing non-save operations or wrong `operation` |
| 6 | service_role required or present |
| 7 | Pre-save result is not PASS |
| 8 | Target title already = new title |
| 9 | Trying to run Save and Rollback in the same step |
| 10 | Real JWT / tokens pasted into docs or chat |

---

## 6. What was NOT done this phase

- `operation=save` HTTP
- controlled Save execution
- DB data write
- SQL / Rollback / REVOKE / DROP POLICY
- Edge redeploy
- production change
- service_role

---

## 7. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-execution
```

Operator may run the curl **once** after review · then record result · still separate from permission Rollback.
