# G-20u36f — Gosaki Discography marker title restore Edge deploy prep

**Phase:** `G-20u36f-discography-marker-title-restore-edge-deploy-prep`  
**Status:** **complete** — deploy prep only · **Edge deploy NOT executed**  
**Date:** 2026-07-15  
**Prior:** [handler-implementation](./gosaki-discography-g20u36f-marker-title-restore-handler-implementation.md) · [planning](./gosaki-discography-g20u36f-marker-title-restore-planning.md)

| Check | Status |
| --- | --- |
| Deploy prep only | **yes** |
| Edge deploy | **no** · 未実行 |
| `supabase functions deploy` | **not run** |
| operation=save | **not sent** · 未送信 |
| Restore Save | **not sent** · blocked until deploy result + pre-restore SELECT + permission open |
| SQL executed | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreEdgeDeployPrepared: true
phase: G-20u36f-discography-marker-title-restore-edge-deploy-prep
deployPrepOnly: true
edgeDeployExecuted: false
operationSaveSent: false
restoreSaveSent: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
targetFunction: gosaki-discography-save-dry-run
stagingProjectRef: kmjqppxjdnwwrtaeqjta
productionProjectRefStop: vsbvndwuajjhnzpohghh
allowlistHandler: true
g20u36eForwardSupported: true
g20u36fRestoreSupported: true
restoreSaveBlockedUntil: deploy-result + pre-restore-select + permission-open
recommendedNextPhase: G-20u36f-discography-marker-title-restore-edge-deploy-execution
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never deploy here**.

---

## 1. Deploy target

| Item | Value |
| --- | --- |
| Function | `gosaki-discography-save-dry-run` |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` |
| Production STOP | `vsbvndwuajjhnzpohghh` — **never deploy here** |
| Source files | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| Handler model | allowlist · G-20u36e forward + G-20u36f restore · user JWT + `is_admin()` · title-only UPDATE |
| service_role | **not used** |

---

## 2. Pre-deploy checklist

| Check | Expected before operator deploy |
| --- | --- |
| Handler implementation commit | **on main** |
| git status | **clean** |
| HEAD = origin/main | **yes** |
| `verify:g20u36f-marker-title-restore-handler-implementation` | **PASS** |
| `verify:current-active-regression` | **PASS** |
| service_role | **not used** |
| Auth model | `SUPABASE_ANON_KEY` + incoming Authorization user-JWT |
| Restore Save | **not executed** · blocked until later phases |
| DB permission for restore | **not open yet** (title UPDATE grant = 0) |

---

## 3. Deploy command (prepared · **未実行**)

```bash
cd ~/sariswing-astro
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Detail |
| --- | --- |
| Cursor / this phase | **do not run** |
| Operator | run **only after explicit approval** · staging ref only |
| Production | **never** use `vsbvndwuajjhnzpohghh` |

---

## 4. Post-deploy smoke commands (prepared · **未実行**)

**Endpoint (staging):** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`

JWT = placeholder only: `<OPERATOR_JWT>`  
Anon key = use Dashboard / local env at run time — **do not paste secrets into chat/docs**.

### 4.1 OPTIONS smoke

```bash
curl -i -X OPTIONS \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type,apikey'
```

**Expect:** HTTP 200/204 · CORS headers present.

### 4.2 dryRun smoke (read-only · no Save)

```bash
curl -sS -X POST \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <OPERATOR_JWT>' \
  -H 'apikey: <STAGING_ANON_KEY>' \
  -d '{
    "operation": "dryRun",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-002",
    "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
    "tracksText": "On a Clear Day [CMS Kit staging G-20u36e]\nTrack 2 placeholder\nTrack 3 placeholder\nTrack 4 placeholder\nTrack 5 placeholder\nTrack 6 placeholder\nLike a Lover\nTrack 8 placeholder",
    "release": {
      "title": "SKYLARK",
      "artist": "placeholder",
      "published": true
    },
    "trackPolicy": {
      "oneLineOneTrack": true,
      "blankLinesIgnored": true,
      "allowDuplicateTitles": true,
      "allowEmptyTrackList": false
    },
    "clientDryRun": {
      "wouldWrite": false
    }
  }'
```

**Notes:**

- `approvalId` = **dry-run** ID only — **not** G-20u36f restore Save approval.
- `"operation": "dryRun"` only — **no DB write**.
- Track 1 uses **current marker title** (matches DB after G-20u36e Save).
- Expect write flags false when aligned with live DB.

### 4.3 Explicitly **not** prepared (forbidden now)

```txt
# DO NOT RUN — operation=save is out of scope for deploy smoke
# DO NOT RUN — G-20u36f restore Save body even after deploy
#   (blocked until: deploy result + pre-restore SELECT PASS + permission open)
```

Example restore body — **for reference only · do not send in smoke or deploy phase:**

```json
{
  "operation": "save",
  "approvalId": "G-20u36f-gosaki-discography-marker-title-restore",
  "sliceId": "G-20u36f-discography-002-track-1-title-restore",
  "beforeTitle": "On a Clear Day [CMS Kit staging G-20u36e]",
  "afterTitle": "On a Clear Day"
}
```

---

## 5. Post-deploy sequence (execution phase — not this phase)

1. Operator deploy once (staging ref only)
2. Record deploy result
3. OPTIONS smoke
4. dryRun smoke
5. **Pre-restore SELECT-only** (separate phase)
6. Permission open SQL (separate phase · operator)
7. Only then: G-20u36f controlled restore Save (separate phase)

**Do not** send `operation=save` as the first post-deploy action.

---

## 6. STOP conditions

| # | Condition |
| --- | --- |
| 1 | Project ref ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Production ref `vsbvndwuajjhnzpohghh` is targeted |
| 3 | git status not clean |
| 4 | HEAD ≠ origin/main |
| 5 | Handler implementation not committed |
| 6 | Required verifiers not PASS |
| 7 | service_role required for deploy path |
| 8 | Target function name ≠ `gosaki-discography-save-dry-run` |
| 9 | `operation=save` or restore Save body sent in smoke/deploy phase |
| 10 | SQL / permission open / package / FTP planned before deploy smoke |

---

## 7. What was NOT done this phase

| Item | Status |
| --- | --- |
| Edge deploy | **no** |
| Save / operation=save | **no** |
| Restore Save | **no** |
| SQL | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production change | **no** |

---

## 8. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-edge-deploy-execution
```

Operator-manual deploy once (explicit approval). Smoke OPTIONS + dryRun only. **No Save.**
